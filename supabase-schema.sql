-- Execute this in Supabase SQL Editor to create the required tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    session_token TEXT,
    credits INTEGER DEFAULT 1,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'monthly', 'annual')),
    plan_expires TIMESTAMPTZ,
    monthly_letters INTEGER DEFAULT 0,
    annual_letters INTEGER DEFAULT 0,
    letters_generated INTEGER DEFAULT 0,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES users(id),
    referral_rewarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    type TEXT NOT NULL, -- 'monthly', 'annual', 'pack10', 'referral_reward'
    amount_cents INTEGER DEFAULT 0,
    credits_added INTEGER DEFAULT 0,
    stripe_session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_session_token ON users(session_token);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
