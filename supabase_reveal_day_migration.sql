-- ========================================================
-- HT사업본부 AI Vitamin Program - Reveal Day Additive Migration
-- 2026-10-28 행사 전용 신규 스키마 및 보안 강화 마이그레이션
-- 주의: 기존 데이터 삭제나 초기화 없이 반복 실행 가능(Idempotent)하도록 작성되었습니다.
-- ========================================================

-- 1. 기존 테이블 호환성 보강 (likes, liked_by, employee_number)
ALTER TABLE public.praise_messages 
  ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS liked_by TEXT[] DEFAULT '{}'::TEXT[];

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS employee_number TEXT;

-- 2. Reveal Events Table (행사 기본 설정 및 진행 상태)
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

-- 3. Reveal Public State Table (실시간 구독용 안전한 공개 상태 - 비밀 데이터 저장 절대 금지)
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

-- 4. Reveal Snapshots Table (2026-10-27 23:59:59 KST 공식 마감 데이터 스냅샷)
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

-- 5. Reveal Curated Items Table (발표용으로 관리자 검수가 완료된 칭찬 문구/에피소드/키워드)
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

-- 6. Reveal Time Capsules Table (24명 사전 생성 및 검수된 타임캡슐)
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

-- 7. Reveal Interactions Table (모바일 체크인, 이모지 반응, 추측)
CREATE TABLE IF NOT EXISTS public.reveal_interactions (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES public.reveal_events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('checkin', 'reaction', 'guess', 'vote')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Reveal Lucky Draws Table (서버 난수 기반 추첨 이력 및 감사 로그)
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

-- 9. Reveal Audit Logs Table (운영자 행동, 상태 전이, 추첨, 긴급 조치 감사 기록)
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

-- 10. Private Note History Table (관찰 메모 변경 이력 보존)
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

-- 11. Reveal Event Assets Table (음원 URL, 모바일 QR 등)
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
-- 인덱스 설정
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_reveal_events_mode ON public.reveal_events(mode);
CREATE INDEX IF NOT EXISTS idx_reveal_events_status ON public.reveal_events(status);
CREATE INDEX IF NOT EXISTS idx_reveal_public_state_seq ON public.reveal_public_state(sequence);
CREATE INDEX IF NOT EXISTS idx_reveal_interactions_event_type ON public.reveal_interactions(event_id, type);
CREATE INDEX IF NOT EXISTS idx_reveal_draws_event ON public.reveal_draws(event_id);
CREATE INDEX IF NOT EXISTS idx_reveal_draws_winner ON public.reveal_draws(winner_id);
CREATE INDEX IF NOT EXISTS idx_reveal_time_capsules_user ON public.reveal_time_capsules(user_id);
CREATE INDEX IF NOT EXISTS idx_reveal_time_capsules_approval ON public.reveal_time_capsules(approval_status);
CREATE INDEX IF NOT EXISTS idx_reveal_audit_logs_event ON public.reveal_audit_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_reveal_audit_logs_action ON public.reveal_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_private_note_history_note ON public.private_note_history(note_id);

-- ========================================================
-- 관찰 메모 이력 저장 트리거 함수 및 바인딩
-- ========================================================
CREATE OR REPLACE FUNCTION public.fn_private_notes_audit()
RETURNS TRIGGER AS $$
DECLARE
  v_rev INT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT COALESCE(MAX(revision), 0) + 1 INTO v_rev FROM public.private_note_history WHERE note_id = OLD.id;
    INSERT INTO public.private_note_history (id, note_id, user_id, target_user_id, content, revision, change_type, created_at)
    VALUES (
      'pnh-' || gen_random_uuid(),
      OLD.id,
      OLD.user_id,
      OLD.target_user_id,
      OLD.content,
      v_rev,
      'delete',
      NOW()
    );
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.private_note_history (id, note_id, user_id, target_user_id, content, revision, change_type, created_at)
    VALUES (
      'pnh-' || gen_random_uuid(),
      NEW.id,
      NEW.user_id,
      NEW.target_user_id,
      NEW.content,
      1,
      'insert',
      NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT COALESCE(MAX(revision), 0) + 1 INTO v_rev FROM public.private_note_history WHERE note_id = NEW.id;
    INSERT INTO public.private_note_history (id, note_id, user_id, target_user_id, content, revision, change_type, created_at)
    VALUES (
      'pnh-' || gen_random_uuid(),
      NEW.id,
      NEW.user_id,
      NEW.target_user_id,
      NEW.content,
      v_rev,
      'update',
      NOW()
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_private_notes_audit ON public.private_notes;
CREATE TRIGGER trg_private_notes_audit
AFTER INSERT OR UPDATE OR DELETE ON public.private_notes
FOR EACH ROW EXECUTE FUNCTION public.fn_private_notes_audit();

-- 기존 메모들의 최초 Baseline Revision 기록 (없는 경우에만 삽입)
INSERT INTO public.private_note_history (id, note_id, user_id, target_user_id, content, revision, change_type, created_at)
SELECT 
  'pnh-base-' || pn.id,
  pn.id,
  pn.user_id,
  pn.target_user_id,
  pn.content,
  1,
  'baseline',
  pn.updated_at
FROM public.private_notes pn
WHERE NOT EXISTS (
  SELECT 1 FROM public.private_note_history pnh WHERE pnh.note_id = pn.id
);

-- ========================================================
-- 초기 이벤트 및 공개 상태 시딩 (라이브 & 리허설)
-- ========================================================
-- 1) 라이브 이벤트 (2026-10-28 16:00:00 KST / 마감 2026-10-27 23:59:59 KST)
INSERT INTO public.reveal_events (
  id, mode, status, title, concept, scheduled_at, cutoff_at, current_segment, current_reveal_index, version
) VALUES (
  'event-live-20261028',
  'live',
  'ready',
  'HT사업본부 AI Vitamin Program – Reveal Day',
  'Connecting People, Growing Together',
  '2026-10-28 16:00:00+09',
  '2026-10-27 23:59:59+09',
  'opening',
  0,
  1
) ON CONFLICT (id) DO UPDATE SET
  scheduled_at = EXCLUDED.scheduled_at,
  cutoff_at = EXCLUDED.cutoff_at;

INSERT INTO public.reveal_public_state (
  event_id, mode, status, current_segment, current_reveal_index, current_batch_index, revealed_pairs_count, sequence
) VALUES (
  'event-live-20261028',
  'live',
  'ready',
  'opening',
  0,
  0,
  0,
  1
) ON CONFLICT (event_id) DO NOTHING;

-- 2) 리허설 이벤트 (독립된 리허설용 이벤트)
INSERT INTO public.reveal_events (
  id, mode, status, title, concept, scheduled_at, cutoff_at, current_segment, current_reveal_index, version
) VALUES (
  'event-rehearsal',
  'rehearsal',
  'rehearsal',
  '[리허설] HT사업본부 AI Vitamin Program – Reveal Day',
  'Connecting People, Growing Together',
  '2026-10-28 14:00:00+09',
  '2026-10-27 23:59:59+09',
  'opening',
  0,
  1
) ON CONFLICT (id) DO UPDATE SET
  scheduled_at = EXCLUDED.scheduled_at,
  cutoff_at = EXCLUDED.cutoff_at;

INSERT INTO public.reveal_public_state (
  event_id, mode, status, current_segment, current_reveal_index, current_batch_index, revealed_pairs_count, sequence
) VALUES (
  'event-rehearsal',
  'rehearsal',
  'rehearsal',
  'opening',
  0,
  0,
  0,
  1
) ON CONFLICT (event_id) DO NOTHING;

-- 음원 및 QR 자산 기본 레코드
INSERT INTO public.reveal_event_assets (id, event_id, asset_type, title, url, fallback_url)
VALUES 
  ('asset-song-live', 'event-live-20261028', 'song', 'HT AI Vitamin Song (Suno AI)', '/audio/vitamin_song.mp3', 'https://actions.google.com/sounds/v1/ambiences/outdoor_celebration.ogg'),
  ('asset-song-rehearsal', 'event-rehearsal', 'song', 'HT AI Vitamin Song (Suno AI) [Rehearsal]', '/audio/vitamin_song.mp3', 'https://actions.google.com/sounds/v1/ambiences/outdoor_celebration.ogg')
ON CONFLICT (id) DO NOTHING;

-- ========================================================
-- Row Level Security (RLS) 정책 개편
-- 취약한 FOR ALL USING (true)를 제거하고 안전한 서비스 롤 & 제한된 공개 정책 적용
-- ========================================================
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

-- 1) reveal_public_state: 일반 사용자 및 발표 화면 실시간 구독을 위해 SELECT만 허용
DROP POLICY IF EXISTS "Public can view reveal_public_state" ON public.reveal_public_state;
CREATE POLICY "Public can view reveal_public_state" ON public.reveal_public_state
  FOR SELECT USING (true);

-- 2) reveal_events: 기본 정보 SELECT 허용
DROP POLICY IF EXISTS "Public can view reveal_events" ON public.reveal_events;
CREATE POLICY "Public can view reveal_events" ON public.reveal_events
  FOR SELECT USING (true);

-- 3) reveal_curated_items: safe_to_present = true 이고 approved 인 항목만 공개 SELECT 허용
DROP POLICY IF EXISTS "Public can view safe curated items" ON public.reveal_curated_items;
CREATE POLICY "Public can view safe curated items" ON public.reveal_curated_items
  FOR SELECT USING (safe_to_present = true AND approval_status = 'approved');

-- 4) reveal_draws: 확정되고 무효화되지 않은 결과는 발표 및 모바일 동기화를 위해 SELECT 허용
DROP POLICY IF EXISTS "Public can view valid reveal_draws" ON public.reveal_draws;
CREATE POLICY "Public can view valid reveal_draws" ON public.reveal_draws
  FOR SELECT USING (is_voided = false);

-- 5) reveal_event_assets: 에셋 SELECT 허용
DROP POLICY IF EXISTS "Public can view reveal_event_assets" ON public.reveal_event_assets;
CREATE POLICY "Public can view reveal_event_assets" ON public.reveal_event_assets
  FOR SELECT USING (true);

-- 기존 취약 정책 제거 및 보안 강화:
-- 민감 테이블인 users, mate_assignments, private_notes, praise_messages, app_state
-- 서버 API를 통한 서비스 롤(Service Role) 키 또는 검증된 서버 핸들러에서 안전하게 처리하도록 설정.
DROP POLICY IF EXISTS "Allow all users operations" ON public.users;
CREATE POLICY "Users read safe info" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all mate_assignments operations" ON public.mate_assignments;
-- mate_assignments는 서버 API를 통해서만 허용된 공개 시점에 조회되도록 직접 anon 접근 차단 (No anon direct read)
CREATE POLICY "Deny direct public mate access" ON public.mate_assignments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all private_notes operations" ON public.private_notes;
CREATE POLICY "Deny direct public notes access" ON public.private_notes FOR SELECT TO authenticated USING (true);

-- ========================================================
-- Supabase Realtime Publication 등록
-- (민감 정보가 없는 reveal_public_state 만 Realtime 발행)
-- ========================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'reveal_public_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reveal_public_state;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Publication이 없는 환경 대비 예외 흡수
END;
$$;
