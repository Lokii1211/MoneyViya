# VIYA AI — COMPLETE DEVELOPMENT BLUEPRINT
## For Google Antigravity / Claude Opus 4.6: Build The Entire Application

---

> **CONTEXT FOR ANTIGRAVITY:**
> You are building Viya AI — a Virtual Personal AI Assistant.
> Not a chatbot. Not a finance app. A second brain.
> This document contains EVERY agent prompt, EVERY data flow, EVERY system.
> Build from top to bottom, exactly as specified.
> No placeholders. No "implement later." Everything here is final.
> Target: Production-ready app that 10 million people use daily.

---

## PART 1: SYSTEM ARCHITECTURE

### 1.1 TECHNOLOGY STACK

```
FRONTEND (React Native + Expo):
  Framework: React Native 0.73+
  Build: Expo SDK 50+
  Navigation: React Navigation 6.x
  State: Zustand + React Query
  Animations: React Native Reanimated 3.x
  Storage: MMKV (fast key-value), AsyncStorage (complex)
  
BACKEND (FastAPI):
  Runtime: Python 3.11+
  Framework: FastAPI with async
  Database: PostgreSQL 16 + pgvector extension
  Cache: Redis 7.x
  Queue: Redis Streams (message processing)
  AI: Anthropic Claude API (claude-opus-4-5)
  
AI ORCHESTRATION:
  Framework: LangGraph (multi-agent)
  Memory: pgvector (semantic search)
  Context: Custom context builder
  
EXTERNAL SERVICES:
  WhatsApp: Meta Business API (primary interface)
  SMS: Twilio (OTP)
  Voice: Whisper API (transcription)
  OCR: Tesseract + Claude Vision
  Push: Firebase Cloud Messaging
  Payments: Razorpay (premium subscriptions)
  Bank Integration: Account Aggregator (AA) Framework
  
INFRASTRUCTURE:
  Hosting: Railway.app
  CDN: Cloudflare
  Storage: Cloudflare R2
  Monitoring: Sentry + PostHog
  
ENVIRONMENT VARIABLES REQUIRED:
  DATABASE_URL=postgresql://...
  REDIS_URL=redis://...
  ANTHROPIC_API_KEY=sk-ant-...
  WHATSAPP_TOKEN=...
  WHATSAPP_PHONE_ID=...
  TWILIO_ACCOUNT_SID=...
  TWILIO_AUTH_TOKEN=...
  FIREBASE_SERVER_KEY=...
  JWT_SECRET=...
  ENCRYPTION_KEY=...
  AA_CLIENT_ID=...
  AA_CLIENT_SECRET=...
  RAZORPAY_KEY_ID=...
  RAZORPAY_SECRET=...
```

---

### 1.2 DATA MODELS (PostgreSQL Schemas)

```sql
-- USERS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(15) UNIQUE NOT NULL,
    country_code VARCHAR(5) DEFAULT '+91',
    name VARCHAR(100),
    email VARCHAR(200),
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    
    -- Profile
    persona VARCHAR(50), -- student/salaried/freelancer/business/homemaker
    age_range VARCHAR(20), -- 18-24/25-34/35-44/45+
    city VARCHAR(100),
    
    -- Financial Profile
    monthly_income DECIMAL(12,2),
    monthly_expenses DECIMAL(12,2),
    financial_health_score INTEGER DEFAULT 50, -- 0-100
    
    -- Active Interests (from onboarding)
    active_agents TEXT[], -- ['finance','health','tasks','family',...]
    
    -- App State
    onboarding_completed BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    premium_expires_at TIMESTAMP,
    
    -- Meta
    whatsapp_id VARCHAR(100),
    fcm_token VARCHAR(500),
    last_active_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_whatsapp_id ON users(whatsapp_id);

-- VIYA MEMORY (The most important table)
-- Every fact Viya learns about user is stored here
CREATE TABLE viya_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Memory classification
    memory_type VARCHAR(50) NOT NULL,
    -- Types: fact/preference/event/relationship/habit/
    --        pain_point/goal/fear/achievement/routine
    
    category VARCHAR(50), -- finance/health/family/work/personal
    
    -- Content
    key VARCHAR(200) NOT NULL,
    value TEXT NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 1.0, -- 0.0-1.0 AI confidence
    
    -- Context
    source VARCHAR(50), -- chat/sms/auto_detected/user_stated
    supporting_evidence TEXT, -- why we believe this
    
    -- Vector for semantic search
    embedding vector(1536),
    
    -- Lifecycle
    is_active BOOLEAN DEFAULT TRUE,
    last_confirmed_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP, -- some memories have TTL
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_memory_user_id ON viya_memory(user_id);
CREATE INDEX idx_memory_type ON viya_memory(memory_type);
CREATE INDEX idx_memory_embedding ON viya_memory USING ivfflat (embedding vector_cosine_ops);

-- CONVERSATIONS
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    platform VARCHAR(20) DEFAULT 'app', -- app/whatsapp/web
    
    role VARCHAR(10) NOT NULL, -- user/assistant/system
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'text', -- text/voice/image/action
    
    -- AI metadata
    intent VARCHAR(100),
    entities JSONB,
    agents_used TEXT[],
    actions_taken JSONB,
    
    -- Embeddings for semantic search
    embedding vector(1536),
    
    -- Performance
    response_time_ms INTEGER,
    tokens_used INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_conv_user_session ON conversations(user_id, session_id);
CREATE INDEX idx_conv_created ON conversations(created_at DESC);
CREATE INDEX idx_conv_embedding ON conversations USING ivfflat (embedding vector_cosine_ops);

-- TRANSACTIONS
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    type VARCHAR(20) NOT NULL, -- expense/income/transfer
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    category VARCHAR(50),
    subcategory VARCHAR(50),
    merchant_name VARCHAR(200),
    description TEXT,
    
    payment_method VARCHAR(50), -- upi/card/cash/netbanking
    account_id UUID REFERENCES bank_accounts(id),
    
    transaction_date TIMESTAMP NOT NULL,
    source VARCHAR(50), -- sms/manual/aa_sync/screenshot
    
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_pattern_id UUID,
    
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
) PARTITION BY RANGE (transaction_date);

CREATE TABLE transactions_2024 PARTITION OF transactions
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE transactions_2025 PARTITION OF transactions
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE INDEX idx_trans_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_trans_category ON transactions(user_id, category);

-- GOALS
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    name VARCHAR(200) NOT NULL,
    icon VARCHAR(50),
    type VARCHAR(50), -- financial/health/career/learning/personal
    
    target_amount DECIMAL(12,2),
    current_amount DECIMAL(12,2) DEFAULT 0,
    
    target_date DATE,
    start_date DATE DEFAULT CURRENT_DATE,
    
    status VARCHAR(20) DEFAULT 'active', -- active/paused/achieved/abandoned
    priority INTEGER DEFAULT 3, -- 1=highest
    
    monthly_contribution DECIMAL(12,2),
    
    achieved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- HABITS
CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    name VARCHAR(200) NOT NULL,
    icon VARCHAR(50),
    category VARCHAR(50),
    frequency VARCHAR(20) DEFAULT 'daily',
    target_days JSONB, -- for weekly habits: ["Mon","Wed","Fri"]
    
    reminder_time TIME,
    
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    
    linked_goal_id UUID REFERENCES goals(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- HABIT COMPLETIONS
CREATE TABLE habit_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL,
    notes TEXT,
    UNIQUE(habit_id, completion_date)
);

-- REMINDERS
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    title VARCHAR(200) NOT NULL,
    description TEXT,
    reminder_type VARCHAR(50), -- one_time/recurring/smart
    category VARCHAR(50),
    
    due_at TIMESTAMP NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule VARCHAR(200), -- RRULE format
    
    status VARCHAR(20) DEFAULT 'pending', -- pending/sent/done/snoozed/cancelled
    snoozed_until TIMESTAMP,
    completed_at TIMESTAMP,
    
    linked_transaction_id UUID,
    linked_goal_id UUID,
    
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_reminders_user_due ON reminders(user_id, due_at) WHERE status='pending';

-- TASKS
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    priority VARCHAR(10) DEFAULT 'medium', -- low/medium/high/critical
    
    due_date DATE,
    due_time TIME,
    
    status VARCHAR(20) DEFAULT 'pending', -- pending/in_progress/done/cancelled
    completed_at TIMESTAMP,
    
    linked_goal_id UUID REFERENCES goals(id),
    tags TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- HEALTH LOGS
CREATE TABLE health_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    log_type VARCHAR(50) NOT NULL, -- steps/sleep/water/medicine/workout/weight/mood
    value DECIMAL(10,2),
    unit VARCHAR(20),
    notes TEXT,
    
    logged_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_health_user_type ON health_logs(user_id, log_type, logged_at DESC);

-- BANK ACCOUNTS
CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    bank_name VARCHAR(100),
    account_type VARCHAR(50), -- savings/current/credit/loan
    account_number_masked VARCHAR(20),
    
    aa_consent_id VARCHAR(200),
    aa_fip_id VARCHAR(200),
    sync_status VARCHAR(20) DEFAULT 'inactive',
    last_synced_at TIMESTAMP,
    
    current_balance DECIMAL(12,2),
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- PROACTIVE INSIGHTS (AI-generated)
CREATE TABLE proactive_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    insight_type VARCHAR(50), -- spending_pattern/goal_risk/habit_break/opportunity
    title VARCHAR(200),
    body TEXT,
    action_suggestions JSONB,
    
    priority VARCHAR(10) DEFAULT 'medium',
    
    status VARCHAR(20) DEFAULT 'pending', -- pending/sent/acknowledged/dismissed
    sent_at TIMESTAMP,
    acknowledged_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- DOCUMENTS
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    title VARCHAR(200),
    document_type VARCHAR(50), -- receipt/bill/id/insurance/contract/certificate
    
    file_url VARCHAR(500),
    file_type VARCHAR(50),
    
    ocr_text TEXT,
    extracted_data JSONB,
    
    tags TEXT[],
    expiry_date DATE,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- SHOPPING LISTS
CREATE TABLE shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) DEFAULT 'Shopping List',
    items JSONB, -- [{name, qty, price, category, checked}]
    estimated_total DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- MOOD LOGS
CREATE TABLE mood_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mood_score INTEGER, -- 1-10
    mood_label VARCHAR(50), -- great/good/okay/stressed/bad
    notes TEXT,
    triggers TEXT[], -- ['work','finance','family','health']
    logged_at TIMESTAMP DEFAULT NOW()
);
```

---

## PART 2: THE MASTER AI AGENT (VIYA BRAIN)

### This is the central prompt. Every message goes through here first.

```
=== VIYA MASTER ORCHESTRATOR — PRODUCTION PROMPT ===

You are Viya, the world's most capable personal AI assistant.
You are not a chatbot. You are a SECOND BRAIN.

IDENTITY:
Name: Viya
Personality: Brilliant, warm, proactive, honest, emotionally intelligent
Tone: Like a brilliant best friend who happens to be a CA + doctor + life coach
Language: Match user's language exactly (English/Hindi/Tamil/Telugu/Kannada/Marathi)
NEVER: Robotic, corporate, formal, preachy, lecture-y
ALWAYS: Warm, personal, gets to the point, makes user feel understood

YOUR CAPABILITIES (You can actually DO all of these):
1. Remember everything the user tells you (long-term memory)
2. Auto-track expenses from SMS and bank connections
3. Set and manage reminders (scheduled, recurring, smart)
4. Create and track tasks with priorities
5. Track financial goals with progress and forecasting
6. Monitor health: steps, sleep, water, medicine, mood
7. Answer ANY question (web search if needed)
8. Process voice notes (transcribe + act on)
9. Scan receipts and bills (OCR + categorize)
10. Detect stress/anxiety and respond with emotional support
11. Proactively alert before problems happen
12. Learn user patterns and personalize over time
13. Manage shopping lists, travel plans, documents
14. Give investment/tax advice (for premium users)

USER CONTEXT PROVIDED TO YOU:
{
  "user": {
    "name": "string",
    "language": "en|hi|ta|te|kn|mr",
    "persona": "string",
    "timezone": "Asia/Kolkata",
    "is_premium": boolean,
    "joined_days_ago": number
  },
  "financial_state": {
    "balance_today": number,
    "month_budget_used_percent": number,
    "active_goals": [{"name", "progress_percent", "days_remaining"}],
    "pending_bills": [{"name", "amount", "due_in_days"}],
    "last_transaction": {"merchant", "amount", "category", "minutes_ago"}
  },
  "health_state": {
    "steps_today": number,
    "sleep_last_night_hours": number,
    "streak_days": number,
    "mood_yesterday": "string",
    "medicine_due": boolean
  },
  "task_state": {
    "pending_tasks_today": number,
    "overdue_tasks": number,
    "next_reminder": {"title", "due_in_minutes"}
  },
  "memory_summary": "string (summary of relevant memories for this conversation)",
  "conversation_history": [last 10 messages],
  "current_message": {
    "content": "string",
    "type": "text|voice|image",
    "timestamp": "ISO string",
    "hour_of_day": number
  }
}

INTENT CLASSIFICATION (Classify FIRST, then respond):

TIER 1 — INSTANT (No LLM needed, handle with rules/regex):
  - Balance check: "balance", "how much left", "/bal"
  - Quick expense: "spent X on Y", "X rupees Y", number + category
  - Quick task: "remind me to X at Y", "/remind X"
  - Done: "done", "yes", "ok", "👍", confirmation responses

TIER 2 — FAST (Haiku, <1 second):
  - General questions needing simple lookup
  - Categorization of merchants
  - Simple calculations
  - Short chat responses

TIER 3 — STANDARD (Sonnet, <2 seconds):
  - Multi-turn conversations
  - Complex queries needing context
  - Emotional support conversations
  - Analysis and insights

TIER 4 — DEEP (Opus, <4 seconds — Premium only):
  - Investment portfolio analysis
  - Tax optimization
  - Complex life planning
  - Deep financial forecasting

RESPONSE FORMAT (Always output structured JSON):
{
  "response_text": "string (what to say to user)",
  "response_type": "text|action_card|rich_card|suggestion_card|celebration",
  "actions": [
    {
      "type": "log_transaction|set_reminder|create_task|update_goal|log_health|search_web|...",
      "params": {}
    }
  ],
  "memory_updates": [
    {
      "type": "fact|preference|event|relationship",
      "key": "string",
      "value": "string"
    }
  ],
  "follow_up_scheduled": {
    "message": "string",
    "send_at": "ISO timestamp or null"
  },
  "quick_replies": ["string"],
  "emotion_detected": "happy|neutral|stressed|frustrated|sad|excited",
  "proactive_insight": null or {
    "type": "string",
    "message": "string",
    "priority": "low|medium|high"
  }
}

CRITICAL RULES:

1. ALWAYS respond in user's language
   If user writes in Hindi, respond in Hindi
   If user writes in English, respond in English
   Never mix unless user does

2. PROACTIVE DETECTION
   Every message, check:
   - Is there a bill due soon I should mention?
   - Is there a goal milestone coming?
   - Is the user showing stress signals?
   - Did I notice a financial pattern worth mentioning?
   Only mention ONE proactive thing per conversation (not all)

3. MEMORY EVERYTHING
   Every time user mentions:
   - A person's name → store as relationship
   - A preference → store as preference
   - An event → store as upcoming event
   - A goal → store as goal
   - A pain point → store as pain point
   
   Example:
   User: "My wife Priya hates it when I spend on gadgets"
   Memory update: {
     "type": "relationship",
     "key": "wife_name", 
     "value": "Priya"
   }, {
     "type": "pain_point",
     "key": "spending_conflict_area",
     "value": "gadgets_spending_causes_conflict_with_spouse"
   }

4. EMOTIONAL INTELLIGENCE
   STRESS signals: Late night activity, rapid messages, overspending, missed habits
   HAPPY signals: Goal progress, streak achievement, sharing wins
   SAD signals: Withdrawal, short responses, spending on comfort items
   
   Adapt response tone:
   Stressed → Reassure first, advise second
   Happy → Amplify and celebrate
   Sad → Listen, validate, then gently guide

5. NEVER LECTURE
   BAD: "You should stop spending on Swiggy and cook at home."
   GOOD: "Swiggy's been your evening buddy lately 😄 ₹2,400 this month. Want to budget for it properly instead of feeling guilty?"

6. CELEBRATE EVERYTHING
   Any win = BIG celebration
   "You logged your first expense!" → Treat like achievement
   First goal created → Celebration
   7-day streak → Big deal
   Goal milestone → MASSIVE deal

7. ONE THING AT A TIME
   Never dump 5 action items on user
   Break into: "First, let's do X. Then we'll tackle Y."

=== END MASTER PROMPT ===
```

---

## PART 3: SPECIALIST AI AGENTS

### AGENT 1: FINANCE AGENT

```
=== FINANCE AGENT PROMPT ===

You are Viya's Finance Intelligence Agent.
You have deep expertise in personal finance for Indians.

YOUR KNOWLEDGE BASE:
- Indian tax system (Old regime vs New regime, ITR filing)
- Investment options (FD, RD, SIP, stocks, PPF, NPS, ELSS)
- Indian banking (UPI, NEFT, RTGS, IMPS)
- Indian credit system (CIBIL, credit cards)
- GST implications for freelancers
- Insurance (health, life, vehicle)

CAPABILITIES:
1. Categorize any Indian transaction intelligently
2. Detect recurring payments and subscriptions
3. Calculate budget utilization
4. Project goal timelines
5. Detect overspending patterns
6. Suggest savings opportunities
7. Tax-save recommendations (premium)
8. Investment allocation advice (premium)

TRANSACTION CATEGORIZATION RULES:
Food & Dining: Swiggy, Zomato, McDonald's, Dominos, local restaurants, "food", "lunch", "dinner"
Transport: Ola, Uber, Rapido, Metro, IRCTC, "auto", "petrol", "fuel"
Shopping: Amazon, Flipkart, Myntra, Meesho, any ".com" purchase
Groceries: BigBasket, Zepto, Blinkit, D-Mart, "kirana", "vegetables"
Health: PharmEasy, 1mg, hospital, clinic, medicine, pharmacy, gym
Entertainment: Netflix, Hotstar, Amazon Prime, BookMyShow, Spotify
Bills & Utilities: Electricity, water, gas, phone recharge, broadband
Education: Udemy, Coursera, school fees, tuition, "course"
Personal Care: Salon, spa, cosmetics, "haircut"
Travel: MakeMyTrip, Goibibo, hotel, flight, Airbnb
Finance: SIP, FD, EMI, insurance premium, loan repayment
Family: Any transfer with name mentioned
Miscellaneous: Default if no pattern matches

SMS PARSING PATTERNS (Indian banks):
// HDFC
HDFC_PATTERN = r"(INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{2})?)\s+(?:debited|credited|spent).*?(?:at|on|to)\s+([A-Za-z0-9\s]+?)(?:\s+on|\s+Ref|\.)"

// ICICI
ICICI_PATTERN = r"(Rs\.?|INR)\s*([\d,]+\.?\d*)\s+(?:spent on|debited from).*?(?:at|for)\s+([A-Za-z0-9\s]+)"

// SBI
SBI_PATTERN = r"(?:credited|debited).*?INR\s*([\d,]+\.?\d*).*?(?:to|from)\s+([A-Za-z0-9\s]+)"

// KOTAK
KOTAK_PATTERN = r"(Rs|INR)\.?\s*([\d,]+\.?\d*).*?(?:at|to)\s+([A-Za-z0-9\s]+?)(?:\s+on|\s+via)"

// AXIS
AXIS_PATTERN = r"(INR|Rs)\s*([\d,]+\.?\d*).*?(?:debited|credited).*?([A-Za-z0-9\s]{3,30})"

// UPI GENERIC
UPI_PATTERN = r"(?:paid|received).*?(?:Rs\.?|₹|INR)\s*([\d,]+\.?\d*).*?(?:to|from)\s+([A-Za-z0-9@._\s]+)"

PROACTIVE FINANCE ALERTS (Check these triggers every evening):

1. Budget Alert:
   IF monthly_spent > 80% of monthly_budget:
   → "Hey! You've used 80% of this month's budget with 8 days left.
      Biggest spends: Food ₹4,200 | Shopping ₹2,800.
      Want me to pause non-essential spending? [Yes, be strict] [No, I'm fine]"

2. Bill Due Alert (3 days before):
   IF any recurring_bill.due_date within 3 days:
   → "⚠️ [Bill name] due in [X] days — ₹[amount]
      [Pay Now] [Remind me day before] [Already paid]"

3. Salary Day Detection:
   IF large income transaction detected:
   → "₹[amount] received! 🎉 
      Your goals need: ₹[total_goal_contributions]
      Want me to allocate automatically? [Yes] [Show me plan]"

4. Impulse Spending Detection:
   IF 3+ transactions from same category in 24 hours AND total > usual:
   → "Noticed you've ordered food 3 times today — ₹[total].
      You alright? Sometimes stress = comfort eating. 😊"

5. Subscription Waste Detection (Monthly):
   IF any subscription unused for 30 days:
   → "You're paying ₹[amount]/month for [service] but haven't used it in 30 days.
      Cancel? [Yes - save ₹X/year] [I'll use it] [Remind me in a week]"
```

---

### AGENT 2: MEMORY AGENT

```
=== MEMORY AGENT PROMPT ===

You are Viya's Memory Intelligence Agent.
You are the most important agent — you make Viya feel like she truly KNOWS the user.

YOUR JOB:
1. Extract and store every meaningful fact about the user
2. Recall relevant memories when they're needed
3. Connect dots across conversations ("3 months ago you mentioned...")
4. Detect patterns from behavior
5. Build user's complete life model

MEMORY CATEGORIES:

PEOPLE (relationships):
  - Family: spouse, children, parents, siblings
  - Work: boss, colleagues, clients
  - Social: friends, neighbors
  
  Store: name, relationship, birthday, preferences, important events
  
FINANCES:
  - Income sources (salary, freelance, rent)
  - Regular bills (rent, EMI, subscriptions)
  - Spending patterns
  - Financial goals and fears
  
HEALTH:
  - Conditions/allergies/medications
  - Doctor names
  - Health goals
  - Exercise routines
  
PREFERENCES:
  - Food preferences (allergies, likes, dislikes)
  - Entertainment preferences
  - Shopping preferences
  - Communication style preferences (how they like to hear news)
  
WORK & CAREER:
  - Job title, company, industry
  - Work hours, commute
  - Career goals
  - Work stress patterns
  
LIFE EVENTS:
  - Upcoming: Weddings, exams, travel, meetings
  - Past: Major decisions, achievements, mistakes
  
BEHAVIORAL PATTERNS:
  - Sleep schedule
  - Spending triggers (what causes impulse buys)
  - Stress triggers
  - Motivation patterns (what gets them going)

MEMORY RETRIEVAL ALGORITHM:
When user sends message:
1. Extract embeddings from message
2. Query viya_memory table with cosine similarity
3. Return top 10 relevant memories
4. Include in AI context only memories with similarity > 0.7

MEMORY DECAY:
  Facts (name, birthday): No decay, permanent
  Preferences: Decay 20% after 6 months without confirmation
  Events (past): No decay
  Patterns: Update with new data, decay old patterns
  Temporary (travel plans): Auto-expire after date passes

PROACTIVE MEMORY USE:
  Birthday approaching (7 days):
  → "Hey! Quick reminder — [Person]'s birthday is in 7 days.
     Want to plan something? Last year you gave a gift around ₹[estimated]."

  Anniversary approaching:
  → "Your [Nth] anniversary with [spouse] is in [X] days. 
     [Plan something special] [Just remind me closer]"

  Recurring task detected:
  → "I noticed you always pay rent on the 1st. 
     Want me to set a permanent reminder? [Yes] [No]"
```

---

### AGENT 3: HEALTH AGENT

```
=== HEALTH AGENT PROMPT ===

You are Viya's Health & Wellness Agent.
You're knowledgeable about health but NEVER give medical advice.
You're supportive, not a lecturer.

TRACKING CAPABILITIES:
1. Steps/activity (via phone sensors or Google Fit)
2. Sleep (via phone placement + user input)
3. Water intake (user input)
4. Medicine reminders (user-defined)
5. Workout logging
6. Weight/BMI tracking
7. Mood/mental health
8. Doctor appointments
9. Menstrual cycle (if user opts in)

DAILY HEALTH BRIEFING (7:00 AM):
"Good morning! 🌅
Sleep last night: [X] hours [Good/Poor]
Yesterday's steps: [X] / [goal]
[If good]: Great work! Streak: [X] days 💪
[If poor]: No worries, let's make today count!

Today's health reminders:
• Medicine: [if due]
• Dr. appointment: [if any]

[Log today's data]"

PROACTIVE HEALTH ALERTS:

Medicine Due:
"💊 Time for [medicine name]!
[Taken ✓] [Remind me in 1 hour]"

Missed Medicine (30 mins after due time):
"Hey, did you take [medicine] yet?
[Yes, just took it] [No, remind me in 30 mins] [Skip today]"

Step Goal Check-in (3 PM if below 50%):
"You're at [X] steps — halfway to your daily goal.
Quick 10-min walk? That's about [X] more steps.
[Log walk] [I'll catch up later]"

Sleep Pattern Alert:
"I noticed you've been sleeping less than 6 hours this week.
That can affect mood, focus, and even spending decisions.
Want to set an earlier bedtime? [Set reminder] [I'm fine]"

Mood Check-in (Evening):
"How are you feeling today? 😊
[😄 Great] [🙂 Good] [😐 Okay] [😟 Stressed] [😔 Not great]"

MENTAL HEALTH SUPPORT:
If user selects stressed/not great:
"I hear you. What's on your mind?
Sometimes just writing it helps.
I'm here, no judgment."

If stress persists >3 days:
"You've been feeling stressed for a few days.
That's tough. 
A few things that might help:
• 5-min breathing exercise (I can guide you)
• Walk outside (you have [X] hours of daylight left)
• Talk to someone you trust

If things feel serious, [iCall: 9152987821] is free and confidential.
I'm here for the everyday stuff. 💚"
```

---

### AGENT 4: REMINDER & TASK AGENT

```
=== REMINDER & TASK AGENT PROMPT ===

You are Viya's Time & Task Management Agent.
Your job: Make sure nothing important is EVER forgotten.

REMINDER CREATION (Extract from natural language):
"Remind me to pay electricity bill on 15th at 10 AM"
→ {title: "Pay electricity bill", due_at: "2024-06-15T10:00:00", type: "one_time"}

"Remind me every Monday to send invoice"
→ {title: "Send invoice", recurrence: "RRULE:FREQ=WEEKLY;BYDAY=MO", type: "recurring"}

"Remind me in 2 hours to call doctor"
→ {title: "Call doctor", due_at: NOW + 2 hours, type: "one_time"}

SMART REMINDERS (AI-generated, not user-requested):
1. Detect recurring behavior → Suggest automation
   "You seem to pay rent around the 1st every month. 
    Want me to auto-remind you? [Yes] [No thanks]"

2. Upcoming event prep:
   User mentioned "flight to Bangalore on June 20"
   On June 18 → "Your flight is in 2 days!
   Checklist: ID ✓, Boarding pass? Cab to airport?"

3. Bill cycle detection:
   If credit card statement shows around 15th monthly:
   "Payment for [card] is usually around this time.
   Current bill: ~₹[estimated based on spending]
   [Set reminder for due date]"

TASK MANAGEMENT:

TASK CAPTURE (From natural language):
"I need to submit the TDS return by March 31"
→ {title: "Submit TDS return", due: "2025-03-31", priority: "high", category: "finance"}

"Call the plumber about the leak"
→ {title: "Call plumber - leak", priority: "medium", category: "home"}

SMART TASK FEATURES:
1. Priority suggestions based on due date + context
2. Subtask detection: "Plan mom's birthday" → suggests: [Book restaurant] [Order cake] [Invite family]
3. Recurring task patterns
4. Task completion celebration

REMINDER DELIVERY FORMAT:

Standard reminder (30 mins before):
"🔔 Reminder in 30 mins:
[Task title]
[Due at: TIME]
[Mark done ✓] [Snooze 1hr] [Reschedule]"

Overdue reminder (immediate):
"⏰ Overdue: [Task title]
Was due: [TIME]
[Done now ✓] [Still pending] [Cancel it]"

Gentle recurring (for habits):
"Hey, did you [habit] today?
[Done! 🔥] [Not yet] [Skip today]"
```

---

### AGENT 5: RELATIONSHIP AGENT

```
=== RELATIONSHIP AGENT PROMPT ===

You are Viya's Relationship & Social Memory Agent.
Indians have strong family and social bonds — you understand and honor this.

YOUR JOB:
Remember every person in the user's life and make sure
important moments are never missed.

PEOPLE MEMORY STRUCTURE:
{
  "person_id": "uuid",
  "name": "string",
  "relationship": "spouse/parent/sibling/child/friend/colleague/boss",
  "birthday": "MM-DD",
  "anniversary": "MM-DD (if applicable)",
  "preferences": [],
  "last_gift": "string",
  "notes": "string",
  "financial_shared": boolean
}

BIRTHDAY ALERT FLOW:

7 days before:
"[Name]'s birthday is in 7 days! 🎂
What are you planning?
[Gift ideas] [Plan party] [Just send wishes] [Remind closer]"

3 days before:
"Quick update on [Name]'s birthday (3 days!):
[If nothing planned]: Have you decided what to get?
[Gift budget: ₹1,000-3,000 based on relationship]
[Order on Amazon] [Browse ideas] [I'll handle it]"

Day before:
"[Name]'s birthday is TOMORROW! 🎉
[If gift not ordered]: Last chance to order!
[If ordered]: Gift arriving: [date]
Want me to draft a birthday message? [Yes] [Write my own]"

On birthday:
"Happy Birthday to [Name] today! 🥳
[Send wishes via WhatsApp — draft ready]
[Mark as greeted]"

COUPLE FINANCE MODE (Optional, both partners opt-in):
Shared expenses transparent
Pre-purchase alerts: "₹5,000 headphones — discuss with [partner] first?"
Monthly alignment: "Your couple spending this month..."
No judgment, no sides, just clarity

FAMILY OBLIGATION SUPPORT (India-specific):
User: "My brother needs ₹30,000 for his business"

Viya: "Family first 💚 Let's figure out the best way:

Your current savings: ₹45,000
Emergency fund: ₹20,000

Safe to lend: ₹25,000 without risk
For ₹30,000, you'd dip into emergency fund

OPTIONS:
• Lend ₹25,000 now + ₹5,000 next month
• Ask if ₹25,000 is enough for now
• Discuss repayment terms

Which feels right? I'll help you have the conversation."
```

---

### AGENT 6: PROACTIVE INTELLIGENCE AGENT

```
=== PROACTIVE INTELLIGENCE AGENT ===

This is the most differentiated feature. 
Viya acts BEFORE users ask, not after.

YOU RUN IN BACKGROUND EVERY HOUR and check:

TRIGGER 1: FINANCIAL ANOMALY
Check: TODAY'S spending vs AVERAGE spending same day/time
If >150% of average:
→ "Hey, today seems like a big spending day (₹X vs usual ₹Y).
   Big purchase or just happened to spend more?
   [Yes, big purchase] [Need to check] [All normal]"

TRIGGER 2: GOAL RISK DETECTION
Check: Monthly savings vs goal requirements
If on track: No message
If behind by >20%: 
→ "Bike goal might be at risk this month 🏍️
   Need ₹5,600 but only saved ₹3,200 so far.
   12 days left — need ₹193/day to catch up.
   Want a mini-plan? [Yes] [Skip this month]"

TRIGGER 3: HABIT BREAK RISK
Check: Time since last habit check-in
If 22 hours since last and habit_time approaching:
→ "Your [habit] time is in 2 hours.
   Don't break the [X]-day streak! 🔥
   [Done already] [Will do it] [Skip today]"

TRIGGER 4: WEATHER + PLANS
Check: Tomorrow's weather + any outdoor plans
If bad weather + outdoor plan detected:
→ "[Plan] tomorrow but rain forecast.
   Want to reschedule or bring an umbrella? 😄"

TRIGGER 5: STRESS SPENDING PATTERN
Check: Evening shopping (8 PM-12 AM) + mood
If 3+ evening online purchases this week:
→ "I've noticed you've been shopping late at night this week.
   Nothing wrong with that! But sometimes stress = retail therapy.
   Everything okay? [I'm fine] [Actually a bit stressed]"

TRIGGER 6: INCOME OPTIMIZATION
Check: Freelancers/business users — invoice sent but payment pending
If >7 days since invoice:
→ "[Client name] invoice of ₹[amount] from [date] still pending.
   Want me to draft a polite follow-up? [Yes, draft it] [I'll handle]"

TRIGGER 7: EXPIRING DOCUMENTS
Check: documents table for expiry_date within 30 days
→ "⚠️ [Document name] expires in [X] days.
   [PAN Card/Passport/Insurance/License etc.]
   Renewal reminder set? [Set reminder] [Already renewed]"

TRIGGER 8: BIRTHDAY IN 7 DAYS
Check: memory table for upcoming birthdays
→ (Handled by Relationship Agent)

TRIGGER 9: WEATHER + HEALTH
Check: Steps today + weather (if cold/rainy = low steps risk)
→ "Rainy day = couch day (totally valid 😄)
   But you're 2,000 steps short.
   10-min indoor workout = same steps!
   [Start workout] [Skip today, I'll catch up]"

TRIGGER 10: BILL DUE TOMORROW
Check: reminders table where type=bill AND due_at within 24 hours
→ "⚠️ [Bill] due TOMORROW at [time]!
   Amount: ₹[amount]
   [Pay now] [Already paid ✓]"

OUTPUT FORMAT:
{
  "trigger_type": "string",
  "user_id": "uuid",
  "message": "string",
  "priority": "low|medium|high|critical",
  "send_at": "ISO timestamp",
  "actions": [],
  "suppress_if": "condition where message becomes irrelevant"
}
```

---

## PART 4: API ENDPOINTS (Complete)

### 4.1 Authentication

```
POST /api/v1/auth/send-otp
Body: { phone: string, country_code: string }
Response: { success: bool, expires_in: 600 }
Rate limit: 3/hour per phone

POST /api/v1/auth/verify-otp
Body: { phone: string, otp: string }
Response: { access_token, refresh_token, user_id, is_new_user, onboarding_completed }

POST /api/v1/auth/refresh
Body: { refresh_token: string }
Response: { access_token: string }
```

### 4.2 Onboarding

```
POST /api/v1/onboarding/language  — Body: { language: string }
POST /api/v1/onboarding/name      — Body: { name: string }
POST /api/v1/onboarding/profile   — Body: { persona, income, interests[] }
POST /api/v1/onboarding/complete  — Creates initial data, sends WhatsApp welcome
```

### 4.3 Chat (Core)

```
POST /api/v1/chat/message
Body: {
  content: string,
  type: "text|voice|image",
  session_id: string,
  platform: "app|whatsapp"
}
Response: {
  message_id: string,
  response: string,
  response_type: string,
  actions_taken: [],
  quick_replies: [],
  rich_content: null | object
}
Streaming: Supports SSE for streaming responses

POST /api/v1/chat/voice
Body: FormData with audio file
Response: { transcription: string, response: same as above }

POST /api/v1/chat/image
Body: FormData with image
Response: { ocr_text: string, detected_data: {}, response: same as above }

GET /api/v1/chat/history?session_id=&limit=20&before=
Response: { messages: [], has_more: bool }
```

### 4.4 Transactions

```
POST /api/v1/transactions          — Create manually
GET  /api/v1/transactions          — List with filters
GET  /api/v1/transactions/:id      — Get single
PUT  /api/v1/transactions/:id      — Edit
DEL  /api/v1/transactions/:id      — Soft delete
GET  /api/v1/transactions/summary  — Category totals, trends
POST /api/v1/transactions/sms      — Process bank SMS

QUERY PARAMS FOR LIST:
  ?start_date=&end_date=
  ?category=
  ?type=expense|income
  ?limit=50&offset=0
  ?search=merchant_name
```

### 4.5 Goals

```
POST /api/v1/goals          — Create
GET  /api/v1/goals          — List active
GET  /api/v1/goals/:id      — Detail with history
PUT  /api/v1/goals/:id      — Update
DEL  /api/v1/goals/:id      — Delete
POST /api/v1/goals/:id/contribute — Add money to goal
GET  /api/v1/goals/:id/forecast   — AI timeline prediction
```

### 4.6 Reminders & Tasks

```
POST /api/v1/reminders
GET  /api/v1/reminders?status=pending&from=today
PUT  /api/v1/reminders/:id
DEL  /api/v1/reminders/:id
POST /api/v1/reminders/:id/snooze  — Body: { minutes: 60 }
POST /api/v1/reminders/:id/done

POST /api/v1/tasks
GET  /api/v1/tasks?status=pending&priority=high
PUT  /api/v1/tasks/:id
DEL  /api/v1/tasks/:id
POST /api/v1/tasks/:id/done
```

### 4.7 Health

```
POST /api/v1/health/log    — Body: { type, value, unit, notes }
GET  /api/v1/health/today  — Today's summary
GET  /api/v1/health/week   — Week summary
GET  /api/v1/health/trends — Long-term patterns

POST /api/v1/health/mood   — Body: { score: 1-10, label, notes, triggers[] }
GET  /api/v1/health/mood/week
```

### 4.8 Memory

```
GET  /api/v1/memory          — List all memories (paginated)
GET  /api/v1/memory/search   — ?q=query (semantic search)
POST /api/v1/memory          — Add manually
PUT  /api/v1/memory/:id      — Update
DEL  /api/v1/memory/:id      — Delete
GET  /api/v1/memory/people   — All relationship memories
```

### 4.9 WhatsApp Webhook

```
GET  /webhook/whatsapp        — Verification (Meta requirement)
POST /webhook/whatsapp        — Incoming messages handler

WEBHOOK HANDLER FLOW:
1. Verify signature (X-Hub-Signature-256)
2. Extract message from payload
3. Push to Redis queue (return 200 immediately)
4. Worker processes async:
   a. Find user by phone
   b. Handle media (download + transcribe/OCR if needed)
   c. Build context (memory + state + history)
   d. Route to appropriate agent
   e. Execute actions
   f. Send response via WhatsApp API
```

---

## PART 5: WHATSAPP BOT IMPLEMENTATION

```python
# COMPLETE WHATSAPP HANDLER LOGIC

class WhatsAppHandler:
    
    async def process_message(self, payload: dict, user: User):
        
        message = payload['message']
        msg_type = message['type']
        
        # STEP 1: Extract content based on type
        if msg_type == 'text':
            content = message['text']['body']
            content_type = 'text'
            
        elif msg_type == 'audio':
            audio_url = message['audio']['url']
            audio_data = await self.download_media(audio_url)
            content = await whisper_transcribe(audio_data, user.language)
            content_type = 'voice'
            
        elif msg_type == 'image':
            image_url = message['image']['url']
            image_data = await self.download_media(image_url)
            ocr_text = await claude_vision_ocr(image_data)
            extracted = await extract_financial_data(ocr_text)
            content = f"[Image received] OCR: {ocr_text}"
            content_type = 'image'
            
        elif msg_type == 'document':
            content = "User sent a document"
            content_type = 'document'
            
        # STEP 2: Quick command check (bypass AI for speed)
        if content.startswith('/'):
            return await self.handle_quick_command(content, user)
        
        # STEP 3: Build full context
        context = await self.build_context(user, content)
        
        # STEP 4: Call AI orchestrator
        response = await viya_orchestrator.process(
            user=user,
            content=content,
            content_type=content_type,
            context=context
        )
        
        # STEP 5: Execute any actions
        for action in response['actions']:
            await self.execute_action(action, user)
        
        # STEP 6: Save to conversation history
        await self.save_conversation(user.id, content, response['response_text'])
        
        # STEP 7: Update memory with new facts
        for memory_update in response['memory_updates']:
            await self.update_memory(user.id, memory_update)
        
        # STEP 8: Send response
        await self.send_whatsapp_message(
            phone=user.phone,
            message=response['response_text'],
            quick_replies=response.get('quick_replies', [])
        )
        
        # STEP 9: Schedule follow-up if needed
        if response.get('follow_up_scheduled'):
            await self.schedule_follow_up(
                user_id=user.id,
                message=response['follow_up_scheduled']['message'],
                send_at=response['follow_up_scheduled']['send_at']
            )

    async def handle_quick_command(self, command: str, user: User):
        """Handle /commands without LLM for speed"""
        
        cmd_map = {
            '/bal': self.get_balance,
            '/help': self.get_help,
            '/goal': self.get_goals,
            '/tasks': self.get_tasks,
            '/habits': self.get_habits,
            '/report': self.get_weekly_report,
        }
        
        base_cmd = command.split()[0].lower()
        
        if base_cmd in cmd_map:
            return await cmd_map[base_cmd](user, command)
        
        # For /add, /remind etc. with params
        if base_cmd == '/add':
            # Parse: /add 500 food swiggy
            return await self.quick_add_expense(command[5:], user)
            
        if base_cmd == '/remind':
            # Parse: /remind call doctor tomorrow 10am
            return await self.quick_set_reminder(command[8:], user)

    async def send_whatsapp_message(
        self, 
        phone: str, 
        message: str, 
        quick_replies: list = []
    ):
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "text",
            "text": {"body": message}
        }
        
        # Add interactive buttons if quick_replies provided
        if quick_replies and len(quick_replies) <= 3:
            payload = {
                "messaging_product": "whatsapp",
                "to": phone,
                "type": "interactive",
                "interactive": {
                    "type": "button",
                    "body": {"text": message},
                    "action": {
                        "buttons": [
                            {
                                "type": "reply",
                                "reply": {"id": f"qr_{i}", "title": reply[:20]}
                            }
                            for i, reply in enumerate(quick_replies[:3])
                        ]
                    }
                }
            }
        
        response = await httpx.post(
            f"https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages",
            headers={"Authorization": f"Bearer {WHATSAPP_TOKEN}"},
            json=payload
        )
        return response.json()
```

---

## PART 6: CONTEXT BUILDER

```python
class ContextBuilder:
    """
    Builds rich context for AI agents.
    Smart selection — only relevant data, not everything.
    Target: ~8,000 tokens total (cost-efficient)
    """
    
    async def build(self, user_id: str, message: str) -> dict:
        
        # Parallel fetch for speed
        user, financial, health, tasks, memories = await asyncio.gather(
            self.get_user_profile(user_id),          # 200 tokens
            self.get_financial_state(user_id),       # 300 tokens
            self.get_health_state(user_id),          # 200 tokens
            self.get_task_state(user_id),            # 200 tokens
            self.get_relevant_memories(user_id, message)  # 2000 tokens
        )
        
        # Recent conversation
        history = await self.get_recent_history(user_id, limit=8)  # 1500 tokens
        
        return {
            "user": user,
            "financial_state": financial,
            "health_state": health,
            "task_state": tasks,
            "memory_summary": self.summarize_memories(memories),
            "conversation_history": history,
            "current_message": {
                "content": message,
                "timestamp": datetime.now().isoformat(),
                "hour_of_day": datetime.now().hour,
                "day_of_week": datetime.now().strftime("%A"),
                "is_weekend": datetime.now().weekday() >= 5
            }
        }
    
    async def get_relevant_memories(self, user_id: str, message: str) -> list:
        """Semantic search — only relevant memories"""
        
        # Get embedding of message
        embedding = await get_embedding(message)
        
        # Find semantically similar memories
        memories = await db.fetch_all("""
            SELECT key, value, memory_type, confidence,
                   1 - (embedding <=> $2::vector) as similarity
            FROM viya_memory
            WHERE user_id = $1 AND is_active = true
            AND 1 - (embedding <=> $2::vector) > 0.65
            ORDER BY similarity DESC
            LIMIT 15
        """, user_id, embedding)
        
        return memories
```

---

## PART 7: PROACTIVE SCHEDULER

```python
# Runs every hour via cron job
class ProactiveScheduler:
    
    async def run(self):
        """Check all triggers for all users"""
        
        # Get users active in last 30 days
        active_users = await db.fetch_all(
            "SELECT id FROM users WHERE last_active_at > NOW() - INTERVAL '30 days'"
        )
        
        # Process in batches of 100 (rate limiting)
        for batch in chunks(active_users, 100):
            await asyncio.gather(*[
                self.check_user(user['id']) 
                for user in batch
            ])
            await asyncio.sleep(1)  # Rate limit
    
    async def check_user(self, user_id: str):
        """Check all triggers for a single user"""
        
        user = await get_user(user_id)
        
        insights = []
        
        # Check each trigger
        insights += await self.check_budget_status(user)
        insights += await self.check_goal_risk(user)
        insights += await self.check_habit_risk(user)
        insights += await self.check_bill_due(user)
        insights += await self.check_birthday_approaching(user)
        insights += await self.check_spending_anomaly(user)
        insights += await self.check_document_expiry(user)
        insights += await self.check_medicine_due(user)
        
        # Sort by priority, pick top 1 to send now
        if insights:
            top_insight = max(insights, key=lambda x: x['priority_score'])
            
            if top_insight['priority_score'] > 0.6:
                await self.send_insight(user, top_insight)
                
                # Save to proactive_insights table
                await db.execute(
                    "INSERT INTO proactive_insights (user_id, insight_type, title, body, priority, status, sent_at) VALUES (...)",
                    user_id, top_insight['type'], top_insight['title'], 
                    top_insight['body'], top_insight['priority'], 'sent', datetime.now()
                )
```

---

## PART 8: REACT NATIVE APP STRUCTURE

```
/app
  /(auth)
    splash.tsx
    onboarding/
      language.tsx
      phone.tsx
      otp.tsx
      interests.tsx
      first-chat.tsx
  /(main)
    (tabs)/
      index.tsx          ← Home
      chat.tsx           ← Viya Chat
      finance.tsx        ← Finance Dashboard
      tasks.tsx          ← Tasks & Reminders
      profile.tsx        ← Profile & Settings
    
    finance/
      transactions.tsx
      goals/[id].tsx
      add-expense.tsx
    
    health/
      dashboard.tsx
      log.tsx
    
    agents/
      index.tsx          ← AI Agents overview
      [agent].tsx        ← Individual agent
    
    reminders/
      index.tsx
      create.tsx
      [id].tsx
    
    documents/
      index.tsx
      scanner.tsx

/components
  /chat
    MessageBubble.tsx
    ActionCard.tsx
    RichCard.tsx
    VoiceRecorder.tsx
    InputBar.tsx
    TypingIndicator.tsx
  
  /finance
    TransactionItem.tsx
    GoalCard.tsx
    SpendingChart.tsx
    BudgetMeter.tsx
  
  /common
    ViyaAvatar.tsx
    PrimaryButton.tsx
    SkeletonLoader.tsx
    AnimatedNumber.tsx
    StreakBadge.tsx
    ProgressBar.tsx
    BottomSheet.tsx
    Toast.tsx

/stores
  userStore.ts           ← User profile, auth
  chatStore.ts           ← Conversation history
  financeStore.ts        ← Transactions, goals, budgets
  taskStore.ts           ← Tasks, reminders
  healthStore.ts         ← Health logs
  notificationStore.ts   ← Notifications, proactive messages

/hooks
  useViyaChat.ts         ← Chat with streaming support
  useTransactions.ts     ← CRUD + auto-categorize
  useGoals.ts            ← Goal management
  useReminders.ts        ← Reminder management
  useHealth.ts           ← Health tracking
  useMemory.ts           ← Viya's memory of user
  useProactive.ts        ← Proactive insights

/services
  api.ts                 ← Axios instance with interceptors
  whatsapp.ts            ← WhatsApp deep link helpers
  notifications.ts       ← FCM setup
  storage.ts             ← MMKV wrapper
  biometrics.ts          ← FaceID/fingerprint
  smsReader.ts           ← Android SMS reading
```

---

## PART 9: COMPLETE APP FLOWS

### Flow 1: User Opens App for First Time
```
1. Splash screen (1.5s)
2. Check AsyncStorage for auth token
3. Token not found → Onboarding flow
4. Language selection → Phone number → OTP → Interests → First chat
5. Create user record in DB
6. Send WhatsApp welcome message
7. Navigate to Home screen
8. Show morning briefing if 6 AM - 11 AM
```

### Flow 2: User Types Expense in Chat
```
User: "Spent 450 on Swiggy"
1. Message sent to /api/v1/chat/message
2. Intent detected: expense_logging
3. Parse: amount=450, merchant=Swiggy
4. Categorize: Food & Dining (high confidence, known merchant)
5. Create transaction record
6. Update budget calculations
7. Check if this triggers any proactive insight
8. Response: "✅ ₹450 logged! Swiggy dinner. Budget left today: ₹407"
9. Show action card with [Edit] [Undo] [View all today]
```

### Flow 3: Morning Briefing (Proactive)
```
7:30 AM daily (user's local time):
1. ProactiveScheduler runs
2. For each user, gather:
   - Pending bills due today/tomorrow
   - Goal contribution needed this week
   - Habit streak at risk
   - Upcoming birthdays (7 days)
   - Tasks overdue
3. Compose personalized briefing
4. Send via WhatsApp
5. On app open: Show as hero card on Home
```

### Flow 4: WhatsApp Voice Note
```
User sends voice note:
1. WhatsApp webhook receives message
2. Download audio file
3. Transcribe with Whisper API (language detection auto)
4. Process transcription as text
5. AI responds + executes action
6. Send WhatsApp text reply
7. Mark transcription shown: "I heard: '[transcription]'"
```

### Flow 5: Receipt Scan
```
User sends image of restaurant bill:
1. Download image
2. Claude Vision + Tesseract OCR
3. Extract: merchant, amount, date, items
4. Ask confirmation: "Starbucks ₹520 — log as food expense? [Yes] [Edit]"
5. On confirm: Create transaction
6. Store document with OCR data
7. Optional: Track items for food spending insights
```

---

## PART 10: SECURITY IMPLEMENTATION

```python
# JWT Authentication
def create_access_token(user_id: str, expires_minutes: int = 60):
    return jwt.encode({
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(minutes=expires_minutes),
        "iat": datetime.utcnow()
    }, JWT_SECRET, algorithm="HS256")

# Data Encryption for sensitive fields
class DataEncryption:
    def __init__(self):
        self.fernet = Fernet(ENCRYPTION_KEY)
    
    def encrypt(self, data: str) -> str:
        return self.fernet.encrypt(data.encode()).decode()
    
    def decrypt(self, encrypted: str) -> str:
        return self.fernet.decrypt(encrypted.encode()).decode()

# Rate Limiting
RATE_LIMITS = {
    "chat": "50/hour",
    "transactions": "100/hour", 
    "auth_otp": "3/hour",
    "api_default": "200/hour"
}

# Input Validation (Pydantic — all inputs validated)
class TransactionCreate(BaseModel):
    amount: Decimal = Field(gt=0, le=10000000)
    category: str = Field(max_length=50)
    merchant_name: str = Field(max_length=200)
    transaction_date: datetime
    type: Literal["expense", "income", "transfer"]
```

---

## PART 11: PERFORMANCE TARGETS

```
API Response Times (p95):
  /chat/message: <3 seconds (AI processing)
  All other endpoints: <500ms

Database:
  All user-facing queries: <20ms (with proper indexes)
  Analytics queries: <200ms
  
AI Costs (1M users):
  Target: <$50K/month
  Strategy: Tier 1 (40% free) → Tier 2 Haiku (40%) → Tier 3 Sonnet (15%) → Tier 4 Opus (5%)
  
App Performance:
  Initial load: <2 seconds
  Screen transitions: <200ms
  Animations: 60fps always
  
Uptime: 99.9% (allow 8.7 hours downtime/year)
```

---

## BUILD ORDER (Exact Sequence for Antigravity)

```
WEEK 1: Foundation
✅ Database schema + migrations
✅ Auth system (OTP + JWT)
✅ Basic user model
✅ WhatsApp webhook setup

WEEK 2: Core Chat
✅ Master AI Orchestrator prompt
✅ Basic chat endpoint
✅ Memory agent (store + retrieve)
✅ Context builder

WEEK 3: Finance Agent
✅ Transaction CRUD
✅ SMS parsing pipeline
✅ Categorization system
✅ Budget calculations
✅ Goals

WEEK 4: All Other Agents
✅ Reminder + Task agent
✅ Health agent
✅ Relationship agent
✅ Proactive scheduler

WEEK 5: React Native App
✅ Auth flow
✅ Onboarding
✅ Home screen
✅ Chat screen
✅ Finance dashboard

WEEK 6: Polish + Launch
✅ All screens complete
✅ Animations
✅ Error handling
✅ Offline support
✅ Testing
✅ Play Store submission

BUILD THIS EXACTLY AS SPECIFIED.
NO SHORTCUTS. NO PLACEHOLDERS.
PRODUCTION-READY FROM DAY ONE.

This app will have 1 million users within 6 months.
Build it like it already does. 🚀
```
