-- Lending / Borrowing tracker with interest and reminders
CREATE TABLE IF NOT EXISTS lending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('given', 'taken')),
  person_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  reason TEXT,
  has_interest BOOLEAN DEFAULT FALSE,
  interest_rate NUMERIC DEFAULT 0,
  interest_type TEXT DEFAULT 'monthly' CHECK (interest_type IN ('monthly', 'yearly')),
  due_date DATE,
  reminder_enabled BOOLEAN DEFAULT TRUE,
  reminder_frequency TEXT DEFAULT 'weekly' CHECK (reminder_frequency IN ('daily', 'weekly', 'monthly')),
  last_reminded_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'settled', 'cancelled')),
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_lending_user ON lending(user_phone);
CREATE INDEX IF NOT EXISTS idx_lending_status ON lending(user_phone, status);

-- RLS
ALTER TABLE lending ENABLE ROW LEVEL SECURITY;
CREATE POLICY lending_user_policy ON lending
  FOR ALL USING (user_phone = current_setting('app.user_phone', true))
  WITH CHECK (user_phone = current_setting('app.user_phone', true));
