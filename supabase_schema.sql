-- ========================================================
-- HT사업본부 AI Vitamin Program - Supabase Production Schema (Integrated 2026-10-28)
-- ========================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  team TEXT NOT NULL,
  avatar TEXT,
  role TEXT DEFAULT 'user',
  employee_number TEXT,
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

-- 4. Praise Messages Table (with likes & liked_by support)
CREATE TABLE IF NOT EXISTS public.praise_messages (
  id TEXT PRIMARY KEY,
  sender_user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  recipient_team TEXT,
  content TEXT NOT NULL,
  refined_content TEXT,
  likes INTEGER DEFAULT 0,
  liked_by TEXT[] DEFAULT '{}'::TEXT[],
  is_mate_praise BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. App State Table (for legacy Reveal Day toggle & system settings)
CREATE TABLE IF NOT EXISTS public.app_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- 6. Reveal Events Table (2026-10-28 Reveal Day Events)
CREATE TABLE IF NOT EXISTS public.reveal_events (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL CHECK (mode IN ('live', 'rehearsal')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'rehearsal', 'ready', 'live', 'ended')),
  title TEXT NOT NULL,
  concept TEXT NOT NULL DEFAULT 'Connecting People, Growing Together',
  scheduled_at TIMESTAMPTZ NOT NULL,
  cutoff_at TIMESTAMPTZ NOT NULL,
  current_segment TEXT NOT NULL DEFAULT 'opening' CHECK (current_segment IN (
    'opening', 'journey', 'mate_reveal', 'time_capsule', 'lucky_draw', 'song', 'closing', 'pizza_party', 'ended'
  )),
  current_reveal_index INT NOT NULL DEFAULT 0,
  current_batch_index INT NOT NULL DEFAULT 0,
  version INT NOT NULL DEFAULT 1,
  controller_id TEXT,
  controller_name TEXT,
  controller_lease_until TIMESTAMPTZ,
  is_blackout BOOLEAN NOT NULL DEFAULT FALSE,
  is_holding BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Reveal Public State Table (Realtime Synced Safe State)
CREATE TABLE IF NOT EXISTS public.reveal_public_state (
  event_id TEXT PRIMARY KEY REFERENCES public.reveal_events(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  status TEXT NOT NULL,
  current_segment TEXT NOT NULL,
  current_reveal_index INT NOT NULL DEFAULT 0,
  current_batch_index INT NOT NULL DEFAULT 0,
  revealed_pairs_count INT NOT NULL DEFAULT 0,
  data_version INT NOT NULL DEFAULT 1,
  sequence INT NOT NULL DEFAULT 1,
  is_blackout BOOLEAN NOT NULL DEFAULT FALSE,
  is_holding BOOLEAN NOT NULL DEFAULT FALSE,
  reaction_counts JSONB NOT NULL DEFAULT '{"heart": 0, "clap": 0, "party": 0, "sparkle": 0, "fire": 0}'::jsonb,
  checkin_count INT NOT NULL DEFAULT 0,
  last_data_sync_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Reveal Snapshots Table (Official Cutoff 2026-10-27 23:59:59 KST)
CREATE TABLE IF NOT EXISTS public.reveal_snapshots (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES public.reveal_events(id) ON DELETE CASCADE,
  version INT NOT NULL,
  cutoff_at TIMESTAMPTZ NOT NULL,
  data_hash TEXT NOT NULL,
  source_users_count INT NOT NULL,
  source_praises_count INT NOT NULL,
  source_notes_count INT NOT NULL,
  source_max_timestamp TIMESTAMPTZ,
  stats_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, version)
);

-- 9. Reveal Curated Items Table (Approved Safe Quotes & Keywords)
CREATE TABLE IF NOT EXISTS public.reveal_curated_items (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES public.reveal_events(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('praise_quote', 'keyword', 'episode')),
  content TEXT NOT NULL,
  anonymous_label TEXT,
  safe_to_present BOOLEAN NOT NULL DEFAULT TRUE,
  approval_status TEXT NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('draft', 'approved', 'rejected')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Reveal Time Capsules Table
CREATE TABLE IF NOT EXISTS public.reveal_time_capsules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  recipient_team TEXT,
  keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  analysis TEXT NOT NULL,
  letter TEXT NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'draft' CHECK (approval_status IN ('draft', 'approved', 'rejected')),
  source_hash TEXT NOT NULL,
  is_spotlight BOOLEAN NOT NULL DEFAULT FALSE,
  generation_method TEXT NOT NULL DEFAULT 'openai' CHECK (generation_method IN ('openai', 'fallback', 'manual')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

-- 11. Reveal Interactions Table
CREATE TABLE IF NOT EXISTS public.reveal_interactions (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES public.reveal_events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('checkin', 'reaction', 'guess', 'vote')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Reveal Lucky Draws Table
CREATE TABLE IF NOT EXISTS public.reveal_draws (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES public.reveal_events(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  prize_name TEXT NOT NULL,
  winner_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  winner_name TEXT NOT NULL,
  winner_team TEXT NOT NULL,
  pool_hash TEXT NOT NULL,
  pool_size INT NOT NULL,
  selected_index INT NOT NULL,
  executed_by TEXT NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,
  is_voided BOOLEAN NOT NULL DEFAULT FALSE,
  void_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Reveal Audit Logs Table
CREATE TABLE IF NOT EXISTS public.reveal_audit_logs (
  id TEXT PRIMARY KEY,
  event_id TEXT,
  action TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_name TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Private Note History Table
CREATE TABLE IF NOT EXISTS public.private_note_history (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  revision INT NOT NULL DEFAULT 1,
  change_type TEXT NOT NULL DEFAULT 'update' CHECK (change_type IN ('baseline', 'insert', 'update', 'delete')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Reveal Event Assets Table
CREATE TABLE IF NOT EXISTS public.reveal_event_assets (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES public.reveal_events(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('song', 'qr', 'image')),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  fallback_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- Indexes
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_users_code ON public.users(code);
CREATE INDEX IF NOT EXISTS idx_mate_assignments_user_id ON public.mate_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_mate_assignments_target_user_id ON public.mate_assignments(target_user_id);
CREATE INDEX IF NOT EXISTS idx_private_notes_user_id ON public.private_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_praise_messages_recipient ON public.praise_messages(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_praise_messages_created ON public.praise_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reveal_events_mode ON public.reveal_events(mode);
CREATE INDEX IF NOT EXISTS idx_reveal_events_status ON public.reveal_events(status);
CREATE INDEX IF NOT EXISTS idx_reveal_public_state_seq ON public.reveal_public_state(sequence);
CREATE INDEX IF NOT EXISTS idx_reveal_interactions_event_type ON public.reveal_interactions(event_id, type);
CREATE INDEX IF NOT EXISTS idx_reveal_draws_event ON public.reveal_draws(event_id);
CREATE INDEX IF NOT EXISTS idx_reveal_time_capsules_user ON public.reveal_time_capsules(user_id);
CREATE INDEX IF NOT EXISTS idx_private_note_history_note ON public.private_note_history(note_id);

-- ========================================================
-- Row Level Security (RLS) Configuration
-- ========================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mate_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.praise_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reveal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reveal_public_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reveal_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reveal_curated_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reveal_time_capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reveal_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reveal_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reveal_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_note_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reveal_event_assets ENABLE ROW LEVEL SECURITY;

-- Read policies for public screens
CREATE POLICY "Public can view safe users info" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public can view reveal_public_state" ON public.reveal_public_state FOR SELECT USING (true);
CREATE POLICY "Public can view reveal_events" ON public.reveal_events FOR SELECT USING (true);
CREATE POLICY "Public can view safe curated items" ON public.reveal_curated_items FOR SELECT USING (safe_to_present = true AND approval_status = 'approved');
CREATE POLICY "Public can view valid reveal_draws" ON public.reveal_draws FOR SELECT USING (is_voided = false);
CREATE POLICY "Public can view reveal_event_assets" ON public.reveal_event_assets FOR SELECT USING (true);
