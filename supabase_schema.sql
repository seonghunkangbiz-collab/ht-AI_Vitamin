-- Supabase Database Schema for HT business unit AI Vitamin Program

-- 1. Users table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  team TEXT NOT NULL,
  avatar TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Mate Assignments table
CREATE TABLE IF NOT EXISTS public.mate_assignments (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  target_user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Private Notes table
CREATE TABLE IF NOT EXISTS public.private_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  target_user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Praise Messages table
CREATE TABLE IF NOT EXISTS public.praise_messages (
  id TEXT PRIMARY KEY,
  sender_user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  recipient_team TEXT,
  content TEXT NOT NULL,
  refined_content TEXT,
  likes INT DEFAULT 0,
  liked_by TEXT[] DEFAULT '{}',
  is_mate_praise BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. App State table (for Reveal Day toggle & settings)
CREATE TABLE IF NOT EXISTS public.app_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- RLS Configuration & Permissive Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mate_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.praise_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for API operations (or service role)
DROP POLICY IF EXISTS "Allow anon all users" ON public.users;
CREATE POLICY "Allow anon all users" ON public.users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow anon all mate_assignments" ON public.mate_assignments;
CREATE POLICY "Allow anon all mate_assignments" ON public.mate_assignments FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow anon all private_notes" ON public.private_notes;
CREATE POLICY "Allow anon all private_notes" ON public.private_notes FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow anon all praise_messages" ON public.praise_messages;
CREATE POLICY "Allow anon all praise_messages" ON public.praise_messages FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow anon all app_state" ON public.app_state;
CREATE POLICY "Allow anon all app_state" ON public.app_state FOR ALL USING (true);
