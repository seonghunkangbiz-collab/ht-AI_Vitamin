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

  const activeUsers = (users || []).filter(u => u.role !== 'admin');

  // 2. Fetch Praises up to Cutoff
  const { data: allPraises, error: praiseErr } = await supabase
    .from('praise_messages')
    .select('id, sender_user_id, recipient_user_id, recipient_name, recipient_team, content, refined_content, created_at')
    .lte('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: true });
  if (praiseErr) throw new Error(`Snapshot failed to fetch praises: ${praiseErr.message}`);

  const praises = allPraises || [];

  // 3. Fetch Notes up to Cutoff
  const { data: allNotes, error: noteErr } = await supabase
    .from('private_notes')
    .select('id, user_id, target_user_id, content, updated_at')
    .lte('updated_at', cutoffDate.toISOString());
  if (noteErr) throw new Error(`Snapshot failed to fetch notes: ${noteErr.message}`);

  const notes = allNotes || [];

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

  const teamStats: Record<string, { praiseGiven: number; praiseReceived: number; userCount: number }> = {};
  activeUsers.forEach(u => {
    if (!teamStats[u.team]) {
      teamStats[u.team] = { praiseGiven: 0, praiseReceived: 0, userCount: 0 };
    }
    teamStats[u.team].userCount += 1;
  });

  const userTeamMap = new Map(activeUsers.map(u => [u.id, u.team]));
  praises.forEach(p => {
    const senderTeam = userTeamMap.get(p.sender_user_id);
    if (senderTeam && teamStats[senderTeam]) {
      teamStats[senderTeam].praiseGiven += 1;
    }
    if (p.recipient_team && teamStats[p.recipient_team]) {
      teamStats[p.recipient_team].praiseReceived += 1;
    }
  });

  const defaultKeywords = ['열정', '협업', '배려', '책임감', '긍정에너지', '신뢰', '전문성', '소통', '도전', '성장'];

  // Safe anonymous praise quotes for stage
  const approvedQuotes = praises.slice(0, 10).map((p, idx) => ({
    id: `quote-${idx + 1}`,
    content: p.refined_content || p.content,
    team: p.recipient_team
  }));

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
