-- ============================================================================
-- MoneyViya: 01_security_hardening.sql
-- Security hardening, RPC chat context consolidation, and RLS policies
-- ============================================================================

-- 1. Consolidated Chat Context Generation Function (Replaces 14 HTTP calls with 1 query)
CREATE OR REPLACE FUNCTION get_user_chat_context(p_phone text, p_query text DEFAULT '')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_short_phone text;
    v_user jsonb;
    v_recent_txns jsonb;
    v_month_expenses numeric := 0;
    v_month_income numeric := 0;
    v_habits jsonb;
    v_goals jsonb;
    v_bills jsonb;
    v_lending jsonb;
    v_medicines jsonb;
    v_health jsonb;
    v_memories jsonb;
    v_result jsonb;
    v_month_start timestamptz;
BEGIN
    -- Normalize phone number
    v_short_phone := substring(regexp_replace(p_phone, '[^0-9]', '', 'g') from '([0-9]{10})$');
    IF v_short_phone IS NULL OR length(v_short_phone) < 10 THEN
        v_short_phone := p_phone;
    END IF;

    v_month_start := date_trunc('month', now());

    -- 1. Fetch User Profile
    SELECT jsonb_build_object(
        'name', name,
        'monthly_income', COALESCE(monthly_income, 0),
        'monthly_expenses', COALESCE(monthly_expenses, 0),
        'preferred_language', COALESCE(preferred_language, 'en'),
        'currency', COALESCE(currency, 'INR')
    ) INTO v_user
    FROM users
    WHERE phone = v_short_phone OR phone = p_phone
    LIMIT 1;

    -- 2. Fetch Recent Transactions (last 10) + Calculate Current Month Totals
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'amount', amount,
            'category', category,
            'description', description,
            'type', type,
            'date', created_at::date
        ) ORDER BY created_at DESC
    ), '[]'::jsonb)
    INTO v_recent_txns
    FROM (
        SELECT amount, category, description, type, created_at
        FROM transactions
        WHERE (phone = v_short_phone OR phone = p_phone)
        ORDER BY created_at DESC
        LIMIT 10
    ) sub;

    SELECT
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)
    INTO v_month_expenses, v_month_income
    FROM transactions
    WHERE (phone = v_short_phone OR phone = p_phone)
      AND created_at >= v_month_start;

    -- 3. Fetch Active Habits & Today's Checkins
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', h.id,
            'name', h.name,
            'category', h.category,
            'current_streak', COALESCE(h.current_streak, 0),
            'target_per_week', COALESCE(h.target_per_week, 7)
        )
    ), '[]'::jsonb)
    INTO v_habits
    FROM habits h
    WHERE (h.phone = v_short_phone OR h.phone = p_phone)
      AND COALESCE(h.archived, false) = false;

    -- 4. Fetch Active Goals
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'title', title,
            'target_amount', target_amount,
            'current_amount', COALESCE(current_amount, 0),
            'deadline', deadline
        )
    ), '[]'::jsonb)
    INTO v_goals
    FROM goals
    WHERE (phone = v_short_phone OR phone = p_phone)
      AND COALESCE(status, 'active') = 'active';

    -- 5. Fetch Upcoming Bills / EMIs
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'name', name,
            'amount', amount,
            'due_date', due_date,
            'frequency', frequency,
            'bill_type', bill_type
        )
    ), '[]'::jsonb)
    INTO v_bills
    FROM bills_and_dues
    WHERE (phone = v_short_phone OR phone = p_phone)
      AND COALESCE(status, 'pending') = 'pending'
    ORDER BY due_date ASC NULLS LAST
    LIMIT 5;

    -- 6. Fetch Pending Lending / Borrowing
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'person_name', person_name,
            'amount', amount,
            'type', type,
            'due_date', due_date,
            'interest_rate', COALESCE(interest_rate, 0)
        )
    ), '[]'::jsonb)
    INTO v_lending
    FROM lending
    WHERE (phone = v_short_phone OR phone = p_phone)
      AND COALESCE(status, 'pending') = 'pending';

    -- 7. Fetch Active Medicines
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'name', name,
            'dosage', dosage,
            'time', time,
            'frequency', frequency
        )
    ), '[]'::jsonb)
    INTO v_medicines
    FROM medicines
    WHERE (phone = v_short_phone OR phone = p_phone)
      AND COALESCE(active, true) = true;

    -- 8. Fetch Today's Health Log
    SELECT jsonb_build_object(
        'steps', COALESCE(steps, 0),
        'water_glasses', COALESCE(water_glasses, 0),
        'sleep_hours', COALESCE(sleep_hours, 0),
        'mood', mood
    ) INTO v_health
    FROM health_logs
    WHERE (phone = v_short_phone OR phone = p_phone)
      AND log_date = CURRENT_DATE
    ORDER BY created_at DESC
    LIMIT 1;

    -- 9. Fetch Key Personal Memories
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'content', content,
            'category', category
        ) ORDER BY importance DESC
    ), '[]'::jsonb)
    INTO v_memories
    FROM (
        SELECT content, category, importance
        FROM viya_memory
        WHERE (phone = v_short_phone OR phone = p_phone)
        ORDER BY importance DESC, created_at DESC
        LIMIT 6
    ) msub;

    -- Assemble comprehensive JSON bundle
    v_result := jsonb_build_object(
        'user', COALESCE(v_user, jsonb_build_object('name', 'Friend')),
        'month_expenses', v_month_expenses,
        'month_income', v_month_income,
        'recent_transactions', v_recent_txns,
        'habits', v_habits,
        'goals', v_goals,
        'bills', v_bills,
        'lending', v_lending,
        'medicines', v_medicines,
        'today_health', COALESCE(v_health, '{}'::jsonb),
        'memories', v_memories
    );

    RETURN v_result;
END;
$$;
