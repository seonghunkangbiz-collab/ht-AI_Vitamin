import crypto from 'crypto';
import { getSupabaseServerClient } from '@/lib/supabase';
import type { RevealSnapshot } from './types';

export const OFFICIAL_CUTOFF_KST = '2026-10-27T23:59:59+09:00';

export function isBeforeCutoff(dateStr: string, cutoffStr: string = OFFICIAL_CUTOFF_KST): boolean {
  return new Date(dateStr).getTime() <= new Date(cutoffStr).getTime();
}

export function computeSnapshotHash(payload: any): string {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export interface SnapshotGenerationOptions {
  eventId: string;
  adminId: string;
  reason?: string;
  forceNewVersion?: boolean;
}

export async function generateOfficialSnapshot(options: SnapshotGenerationOptions): Promise<{ snapshot: RevealSnapshot; isNew: boolean }> {
  const supabase = getSupabaseServerClient();
  const cutoffDate = new Date(OFFICIAL_CUTOFF_KST);

  // 1. Fetch Users
  const { data: users, error: userErr } = await supabase
    .from('users')
    .select('id, name, team, avatar, role');
  if (userErr) throw new Error(`Snapshot failed to fetch users: ${userErr.message}`);

  // Exclude admin and recent additions (이현서, 최지훈) who did not participate in the 2-month program
  const activeUsers = (users || []).filter(
    u => u.role !== 'admin' && !['user-25', 'user-26'].includes(u.id) && !['이현서', '최지훈'].includes(u.name)
  );

  // 2. Fetch Praises up to Cutoff
  const { data: allPraises, error: praiseErr } = await supabase
    .from('praise_messages')
    .select('id, sender_user_id, recipient_user_id, recipient_name, recipient_team, content, refined_content, created_at')
    .lte('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: true });
  if (praiseErr) throw new Error(`Snapshot failed to fetch praises: ${praiseErr.message}`);

  const praises = allPraises || [];

  // 3. Fetch Notes up to Cutoff (integrating private_notes and private_note_history)
  const { data: allNotes } = await supabase
    .from('private_notes')
    .select('id, user_id, target_user_id, content, updated_at')
    .lte('updated_at', cutoffDate.toISOString());

  const { data: historyRows } = await supabase
    .from('private_note_history')
    .select('note_id, user_id, target_user_id, content, change_type, created_at')
    .lte('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: true });

  const activeNotesMap = new Map<string, { id: string; user_id: string; target_user_id: string; content: string; updated_at: string }>();

  if (historyRows) {
    for (const h of historyRows) {
      if (h.change_type === 'delete') {
        activeNotesMap.delete(h.note_id);
      } else {
        activeNotesMap.set(h.note_id, {
          id: h.note_id,
          user_id: h.user_id,
          target_user_id: h.target_user_id,
          content: h.content,
          updated_at: h.created_at
        });
      }
    }
  }

  if (allNotes) {
    for (const n of allNotes) {
      if (!activeNotesMap.has(n.id)) {
        activeNotesMap.set(n.id, n);
      }
    }
  }

  const notes = Array.from(activeNotesMap.values());

  // 4. Fetch Wall View Count from app_state
  const { data: wallState } = await supabase
    .from('app_state')
    .select('value')
    .eq('key', 'wall_view_count')
    .maybeSingle();
  const wallViews = wallState?.value?.count || 0;

  // 5. Calculate Timestamps & Hashes
  let maxTimestamp: string | null = null;
  praises.forEach(p => {
    if (!maxTimestamp || new Date(p.created_at) > new Date(maxTimestamp)) {
      maxTimestamp = p.created_at;
    }
  });
  notes.forEach(n => {
    if (!maxTimestamp || new Date(n.updated_at) > new Date(maxTimestamp)) {
      maxTimestamp = n.updated_at;
    }
  });

  // Calculate stats
  const sevenDaysBeforeCutoff = new Date(cutoffDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weeklyPraises = praises.filter(p => new Date(p.created_at) >= sevenDaysBeforeCutoff).length;

  const PRIMARY_TEAMS = ['반도체전략사업개발팀', '반도체AX사업개발팀', '반도체Global사업개발팀'];
  const teamStats: Record<string, { praiseGiven: number; praiseReceived: number; userCount: number }> = {};
  PRIMARY_TEAMS.forEach(team => {
    teamStats[team] = { praiseGiven: 0, praiseReceived: 0, userCount: 0 };
  });

  const userTeamMap = new Map(activeUsers.map(u => [u.id, u.team]));
  let hqLeadershipCount = 0;
  let hqPraisesGiven = 0;
  let hqPraisesReceived = 0;

  activeUsers.forEach(u => {
    if (teamStats[u.team]) {
      teamStats[u.team].userCount += 1;
    } else {
      hqLeadershipCount += 1;
    }
  });

  praises.forEach(p => {
    const senderTeam = userTeamMap.get(p.sender_user_id);
    if (senderTeam && teamStats[senderTeam]) {
      teamStats[senderTeam].praiseGiven += 1;
    } else {
      hqPraisesGiven += 1;
    }
    if (p.recipient_team && teamStats[p.recipient_team]) {
      teamStats[p.recipient_team].praiseReceived += 1;
    } else {
      hqPraisesReceived += 1;
    }
  });

  // Seamlessly integrate HQ leadership (e.g. 본부장님 1명) into primary teams
  // to avoid exposing any single individual's personal activity on the stage
  if (hqLeadershipCount > 0 && teamStats['반도체전략사업개발팀']) {
    teamStats['반도체전략사업개발팀'].userCount += hqLeadershipCount;
  }
  if (hqPraisesGiven > 0) {
    teamStats['반도체전략사업개발팀'].praiseGiven += Math.ceil(hqPraisesGiven / 3);
    teamStats['반도체AX사업개발팀'].praiseGiven += Math.floor(hqPraisesGiven / 3);
    teamStats['반도체Global사업개발팀'].praiseGiven += (hqPraisesGiven - Math.ceil(hqPraisesGiven / 3) - Math.floor(hqPraisesGiven / 3));
  }
  if (hqPraisesReceived > 0) {
    teamStats['반도체전략사업개발팀'].praiseReceived += Math.ceil(hqPraisesReceived / 3);
    teamStats['반도체AX사업개발팀'].praiseReceived += Math.floor(hqPraisesReceived / 3);
    teamStats['반도체Global사업개발팀'].praiseReceived += (hqPraisesReceived - Math.ceil(hqPraisesReceived / 3) - Math.floor(hqPraisesReceived / 3));
  }

  const defaultKeywords = ['열정', '협업', '배려', '책임감', '긍정에너지', '신뢰', '전문성', '소통', '도전', '성장'];

  // Safe anonymous praise quotes for stage:
  // Filter out short messages, lottery/draw test noises, and ensure high-quality inspirational messages
  const curatedPraises = praises.filter(p => {
    const text = (p.refined_content || p.content || '').trim();
    if (text.length < 15) return false;
    if (/선물 당첨|내용물 궁금|테스트|test/i.test(text)) return false;
    return true;
  });

  const highQualityFallbacks = [
    {
      id: 'quote-1',
      content: '우리 조직에 필요한 어플을 만들어주셔서 감사합니다. 서로를 응원하고 격려하는 문화를 만들어준 최고의 아이디어였습니다.',
      team: '반도체Global사업개발팀'
    },
    {
      id: 'quote-2',
      content: '복잡한 프로젝트 이슈 속에서도 항상 침착하고 긍정적인 태도로 해결책을 이끌어 주셔서 큰 귀감이 되었습니다.',
      team: '반도체AX사업개발팀'
    },
    {
      id: 'quote-3',
      content: '다른 팀의 긴급한 지원 요청에도 두 팔 걷고 먼저 손 내밀어 주시는 배려와 전문성에 깊은 감동을 받았습니다.',
      team: '반도체전략사업개발팀'
    }
  ];

  const approvedQuotes = curatedPraises.length >= 3
    ? curatedPraises.slice(0, 5).map((p, idx) => ({
        id: `quote-${idx + 1}`,
        content: p.refined_content || p.content,
        team: p.recipient_team || '반도체사업본부'
      }))
    : highQualityFallbacks;

  const statsPayload = {
    totalUsers: activeUsers.length,
    totalPraises: praises.length,
    weeklyPraises,
    totalNotes: notes.length,
    wallViews,
    teamStats,
    keywords: defaultKeywords,
    approvedQuotes
  };

  // Deterministic Hash
  const hashSource = JSON.stringify({
    cutoff: OFFICIAL_CUTOFF_KST,
    userCount: activeUsers.length,
    praiseCount: praises.length,
    noteCount: notes.length,
    maxTimestamp,
    statsPayload
  });
  const dataHash = crypto.createHash('sha256').update(hashSource).digest('hex');

  // Check existing snapshot with same hash
  const { data: existingSnapshots } = await supabase
    .from('reveal_snapshots')
    .select('*')
    .eq('event_id', options.eventId)
    .order('version', { ascending: false });

  if (existingSnapshots && existingSnapshots.length > 0 && !options.forceNewVersion) {
    const latest = existingSnapshots[0];
    if (latest.data_hash === dataHash) {
      return {
        snapshot: {
          id: latest.id,
          eventId: latest.event_id,
          version: latest.version,
          cutoffAt: latest.cutoff_at,
          dataHash: latest.data_hash,
          sourceUsersCount: latest.source_users_count,
          sourcePraisesCount: latest.source_praises_count,
          sourceNotesCount: latest.source_notes_count,
          sourceMaxTimestamp: latest.source_max_timestamp,
          statsPayload: latest.stats_payload,
          createdBy: latest.created_by,
          reason: latest.reason,
          createdAt: latest.created_at
        },
        isNew: false
      };
    }
  }

  const nextVersion = (existingSnapshots && existingSnapshots.length > 0)
    ? existingSnapshots[0].version + 1
    : 1;

  const snapshotId = `snap-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const now = new Date().toISOString();

  const insertRow = {
    id: snapshotId,
    event_id: options.eventId,
    version: nextVersion,
    cutoff_at: OFFICIAL_CUTOFF_KST,
    data_hash: dataHash,
    source_users_count: activeUsers.length,
    source_praises_count: praises.length,
    source_notes_count: notes.length,
    source_max_timestamp: maxTimestamp,
    stats_payload: statsPayload,
    created_by: options.adminId,
    reason: options.reason || 'Official Reveal Day Cutoff Snapshot',
    created_at: now
  };

  const { error: insertErr } = await supabase
    .from('reveal_snapshots')
    .insert(insertRow);

  if (insertErr) {
    throw new Error(`Failed to save snapshot: ${insertErr.message}`);
  }

  // Record audit log
  await supabase.from('reveal_audit_logs').insert({
    id: `audit-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    event_id: options.eventId,
    action: 'CREATE_SNAPSHOT',
    actor_id: options.adminId,
    details: { version: nextVersion, dataHash, usersCount: activeUsers.length, praiseCount: praises.length },
    created_at: now
  });

  return {
    snapshot: {
      id: snapshotId,
      eventId: options.eventId,
      version: nextVersion,
      cutoffAt: OFFICIAL_CUTOFF_KST,
      dataHash,
      sourceUsersCount: activeUsers.length,
      sourcePraisesCount: praises.length,
      sourceNotesCount: notes.length,
      sourceMaxTimestamp: maxTimestamp,
      statsPayload,
      createdBy: options.adminId,
      reason: options.reason,
      createdAt: now
    },
    isNew: true
  };
}
