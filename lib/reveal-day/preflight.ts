import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import type { PreflightItem, PreflightReport } from './types';
import { OFFICIAL_CUTOFF_KST } from './snapshot';

export async function runPreflightChecks(eventId: string, adminId: string): Promise<PreflightReport> {
  const items: PreflightItem[] = [];
  const now = new Date();

  // 1. Supabase Connection Check
  let supabaseOk = false;
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase.from('users').select('id').limit(1);
      if (!error && data) {
        supabaseOk = true;
        items.push({
          key: 'supabase_connection',
          title: 'Supabase DB 연결',
          status: 'pass',
          message: 'Supabase 데이터베이스와 정상적으로 통신 중입니다.'
        });
      } else {
        items.push({
          key: 'supabase_connection',
          title: 'Supabase DB 연결',
          status: 'fail',
          message: `쿼리 실패: ${error?.message || '연결 오류'}`
        });
      }
    } else {
      items.push({
        key: 'supabase_connection',
        title: 'Supabase DB 연결',
        status: 'fail',
        message: 'Supabase 환경변수가 설정되지 않았습니다.'
      });
    }
  } catch (e: any) {
    items.push({
      key: 'supabase_connection',
      title: 'Supabase DB 연결',
      status: 'fail',
      message: `연결 예외 발생: ${e.message}`
    });
  }

  // 2. Admin Session Check
  if (adminId) {
    items.push({
      key: 'admin_session',
      title: '관리자 세션 유효성',
      status: 'pass',
      message: `인증된 관리자 세션 활성화 (${adminId})`
    });
  } else {
    items.push({
      key: 'admin_session',
      title: '관리자 세션 유효성',
      status: 'fail',
      message: '관리자 세션이 유효하지 않습니다.'
    });
  }

  if (!supabaseOk) {
    return {
      passed: false,
      hasErrors: true,
      hasWarnings: false,
      evaluatedAt: now.toISOString(),
      items
    };
  }

  const supabase = getSupabaseServerClient();

  // 3. 2026-10-28 Event Schedule Check
  try {
    const { data: event } = await supabase
      .from('reveal_events')
      .select('scheduled_at, cutoff_at')
      .eq('id', eventId)
      .maybeSingle();

    if (event && event.scheduled_at.startsWith('2026-10-28')) {
      items.push({
        key: 'schedule_check',
        title: '2026-10-28 행사 일정',
        status: 'pass',
        message: `행사 일시: ${event.scheduled_at} (KST), 마감: ${event.cutoff_at}`
      });
    } else {
      items.push({
        key: 'schedule_check',
        title: '2026-10-28 행사 일정',
        status: 'warn',
        message: `행사 일시 설정 확인 필요 (${event?.scheduled_at || '미설정'})`
      });
    }
  } catch (e: any) {
    items.push({
      key: 'schedule_check',
      title: '2026-10-28 행사 일정',
      status: 'warn',
      message: e.message
    });
  }

  // 4. Official Snapshot Check
  try {
    const { data: snapshots } = await supabase
      .from('reveal_snapshots')
      .select('id, version, data_hash, created_at')
      .eq('event_id', eventId)
      .order('version', { ascending: false });

    if (snapshots && snapshots.length > 0) {
      const latest = snapshots[0];
      items.push({
        key: 'snapshot_check',
        title: '공식 데이터 스냅샷',
        status: 'pass',
        message: `스냅샷 v${latest.version} 확정됨 (해시: ${latest.data_hash.substring(0, 10)}...)`
      });
    } else {
      items.push({
        key: 'snapshot_check',
        title: '공식 데이터 스냅샷',
        status: 'warn',
        message: '공식 스냅샷이 아직 생성되지 않았습니다. 행사 전 [스냅샷 확정]을 실행하세요.'
      });
    }
  } catch (e: any) {
    items.push({
      key: 'snapshot_check',
      title: '공식 데이터 스냅샷',
      status: 'warn',
      message: e.message
    });
  }

  // 5. User Count (Expected ~24)
  let activeUsersCount = 0;
  try {
    const { data: users } = await supabase.from('users').select('id, role');
    const active = (users || []).filter(u => u.role !== 'admin');
    activeUsersCount = active.length;

    if (activeUsersCount === 24) {
      items.push({
        key: 'user_count',
        title: '참석 대상자 인원수',
        status: 'pass',
        message: `관리자 제외 24명 전원 등록 확인 완료 (${activeUsersCount}명)`
      });
    } else {
      items.push({
        key: 'user_count',
        title: '참석 대상자 인원수',
        status: 'warn',
        message: `참석자 수가 24명이 아닙니다 (현재 ${activeUsersCount}명)`
      });
    }
  } catch (e: any) {
    items.push({
      key: 'user_count',
      title: '참석 대상자 인원수',
      status: 'fail',
      message: e.message
    });
  }

  // 6. Mate Relationship Integrity (Inbound & Outbound check)
  try {
    const { data: mates } = await supabase.from('mate_assignments').select('user_id, target_user_id');
    const { data: users } = await supabase.from('users').select('id, role');
    const nonAdminIds = new Set((users || []).filter(u => u.role !== 'admin').map(u => u.id));

    // Calculate inbound counts (who observed me?)
    const inboundCounts = new Map<string, number>();
    nonAdminIds.forEach(id => inboundCounts.set(id, 0));

    (mates || []).forEach(m => {
      if (inboundCounts.has(m.target_user_id)) {
        inboundCounts.set(m.target_user_id, (inboundCounts.get(m.target_user_id) || 0) + 1);
      }
    });

    const zeroInboundUsers = Array.from(inboundCounts.entries()).filter(([_, count]) => count === 0);

    if (zeroInboundUsers.length === 0 && (mates || []).length > 0) {
      items.push({
        key: 'mate_integrity',
        title: 'Mystery Mate 배정 무결성',
        status: 'pass',
        message: `총 ${(mates || []).length}건 배정 완료. 전원 최소 1명 이상의 관찰자(Inbound) 배정됨.`
      });
    } else {
      items.push({
        key: 'mate_integrity',
        title: 'Mystery Mate 배정 무결성',
        status: 'warn',
        message: `Inbound 메이트가 0명인 사용자가 ${zeroInboundUsers.length}명 있습니다.`
      });
    }
  } catch (e: any) {
    items.push({
      key: 'mate_integrity',
      title: 'Mystery Mate 배정 무결성',
      status: 'warn',
      message: e.message
    });
  }

  // 7. Time Capsule Approval Status
  try {
    const { data: capsules } = await supabase
      .from('reveal_time_capsules')
      .select('id, approval_status');

    const approvedCount = (capsules || []).filter(c => c.approval_status === 'approved').length;
    const totalCapsules = (capsules || []).length;

    if (approvedCount >= activeUsersCount && activeUsersCount > 0) {
      items.push({
        key: 'capsule_approvals',
        title: 'AI Time Capsule 사전 검수 및 승인',
        status: 'pass',
        message: `총 ${totalCapsules}개 중 ${approvedCount}개 승인 완료 (전원 승인)`
      });
    } else if (approvedCount > 0) {
      items.push({
        key: 'capsule_approvals',
        title: 'AI Time Capsule 사전 검수 및 승인',
        status: 'warn',
        message: `승인된 캡슐: ${approvedCount} / ${activeUsersCount}명. 미승인 캡슐 존재.`
      });
    } else {
      items.push({
        key: 'capsule_approvals',
        title: 'AI Time Capsule 사전 검수 및 승인',
        status: 'warn',
        message: '사전 생성 및 승인된 타임캡슐이 없습니다. [캡슐 일괄 생성]을 권장합니다.'
      });
    }
  } catch (e: any) {
    items.push({
      key: 'capsule_approvals',
      title: 'AI Time Capsule 사전 검수 및 승인',
      status: 'warn',
      message: e.message
    });
  }

  // 8. Audio Asset Check
  try {
    const { data: asset } = await supabase
      .from('reveal_event_assets')
      .select('url, fallback_url')
      .eq('event_id', eventId)
      .eq('asset_type', 'song')
      .maybeSingle();

    if (asset?.url) {
      items.push({
        key: 'audio_check',
        title: 'Suno Vitamin Song 음원 자산',
        status: 'pass',
        message: `음원 등록 완료 (${asset.url})`
      });
    } else {
      items.push({
        key: 'audio_check',
        title: 'Suno Vitamin Song 음원 자산',
        status: 'warn',
        message: '기본 음원 URL 사용 중 (/audio/vitamin_song.mp3)'
      });
    }
  } catch (e: any) {
    items.push({
      key: 'audio_check',
      title: 'Suno Vitamin Song 음원 자산',
      status: 'warn',
      message: e.message
    });
  }

  // 9. Mobile App URL & QR Check
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  items.push({
    key: 'mobile_qr_check',
    title: '모바일 접속 URL 및 QR',
    status: 'pass',
    message: `참석자 접속 URL: ${appUrl}/live`
  });

  // 10. Lucky Draw Candidates Count
  items.push({
    key: 'lucky_draw_pool',
    title: 'AI Lucky Draw 후보 풀',
    status: activeUsersCount >= 2 ? 'pass' : 'warn',
    message: `추첨 대상 후보: ${activeUsersCount}명`
  });

  const hasErrors = items.some(i => i.status === 'fail');
  const hasWarnings = items.some(i => i.status === 'warn');

  return {
    passed: !hasErrors,
    hasErrors,
    hasWarnings,
    evaluatedAt: now.toISOString(),
    items
  };
}
