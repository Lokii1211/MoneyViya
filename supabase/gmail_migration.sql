-- Gmail OAuth columns for users table
-- Run this in Supabase SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS gmail_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gmail_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gmail_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gmail_connected BOOLEAN DEFAULT FALSE;

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_users_gmail ON users (gmail_connected) WHERE gmail_connected = TRUE;
