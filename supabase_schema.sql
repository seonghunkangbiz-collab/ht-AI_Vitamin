-- ========================================================
-- HT사업본부 AI Vitamin Program - Supabase Production Schema
-- ========================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  team TEXT NOT NULL,
  avatar TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Mystery Mate Assignments Table
CREATE TABLE IF NOT EXISTS public.mate_assignments (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  target_user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Private Notes Table
CREATE TABLE IF NOT EXISTS public.private_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  target_user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Praise Messages Table
CREATE TABLE IF NOT EXISTS public.praise_messages (
  id TEXT PRIMARY KEY,
  sender_user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  recipient_team TEXT,
  content TEXT NOT NULL,
  refined_content TEXT,
  is_mate_praise BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. App State Table (for Reveal Day toggle & system settings)
CREATE TABLE IF NOT EXISTS public.app_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- ========================================================
-- Indexes for High Performance
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_users_code ON public.users(code);
CREATE INDEX IF NOT EXISTS idx_mate_assignments_user_id ON public.mate_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_private_notes_user_id ON public.private_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_praise_messages_recipient ON public.praise_messages(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_praise_messages_created ON public.praise_messages(created_at DESC);

-- ========================================================
-- Initial System State Setup
-- ========================================================
INSERT INTO public.app_state (key, value)
VALUES ('reveal_active', '{"active": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ========================================================
-- Row Level Security (RLS) Configuration
-- ========================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mate_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.praise_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for API Route operations
DROP POLICY IF EXISTS "Allow all users operations" ON public.users;
CREATE POLICY "Allow all users operations" ON public.users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all mate_assignments operations" ON public.mate_assignments;
CREATE POLICY "Allow all mate_assignments operations" ON public.mate_assignments FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all private_notes operations" ON public.private_notes;
CREATE POLICY "Allow all private_notes operations" ON public.private_notes FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all praise_messages operations" ON public.praise_messages;
CREATE POLICY "Allow all praise_messages operations" ON public.praise_messages FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all app_state operations" ON public.app_state;
CREATE POLICY "Allow all app_state operations" ON public.app_state FOR ALL USING (true);
