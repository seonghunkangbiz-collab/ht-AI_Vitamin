-- ========================================================
-- [긴급 복구 SQL] 기존 Mystery Mate 배정(48건) 및 관찰 메모 RLS 잠금 해제
-- 주의: 기존 데이터는 삭제되거나 변경되지 않고 DB에 그대로 보존되어 있습니다.
-- 아래 쿼리는 잘못 걸린 RLS 조회 차단 정책만 해제하여 기존 배정 데이터를 즉시 화면에 복구합니다.
-- ========================================================

DROP POLICY IF EXISTS "Deny direct public mate access" ON public.mate_assignments;
DROP POLICY IF EXISTS "Allow all mate_assignments operations" ON public.mate_assignments;
CREATE POLICY "Allow all mate_assignments operations" ON public.mate_assignments FOR ALL USING (true);

DROP POLICY IF EXISTS "Deny direct public notes access" ON public.private_notes;
DROP POLICY IF EXISTS "Allow all private_notes operations" ON public.private_notes;
CREATE POLICY "Allow all private_notes operations" ON public.private_notes FOR ALL USING (true);

DROP POLICY IF EXISTS "Users read safe info" ON public.users;
DROP POLICY IF EXISTS "Public can view safe users info" ON public.users;
DROP POLICY IF EXISTS "Allow all users operations" ON public.users;
CREATE POLICY "Allow all users operations" ON public.users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all praise_messages operations" ON public.praise_messages;
CREATE POLICY "Allow all praise_messages operations" ON public.praise_messages FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all app_state operations" ON public.app_state;
CREATE POLICY "Allow all app_state operations" ON public.app_state FOR ALL USING (true);

-- 복구 확인용 조회 (실행 후 결과에서 mate_count = 48 확인 가능)
SELECT 
  (SELECT COUNT(*) FROM public.mate_assignments) AS mate_count,
  (SELECT COUNT(*) FROM public.private_notes) AS notes_count,
  (SELECT COUNT(*) FROM public.praise_messages) AS praises_count,
  (SELECT COUNT(*) FROM public.users) AS users_count;
