import crypto from 'crypto';
import { getSupabaseServerClient } from '@/lib/supabase';
import type { RevealDrawItem } from './types';
import { REHEARSAL_USERS } from './rehearsal-data';

export interface DrawOptions {
  eventId: string;
  roundNumber: number;
  prizeName: string;
  excludePreviousWinners?: boolean;
  adminId: string;
  idempotencyKey: string;
}

export interface CandidateUser {
  id: string;
  name: string;
  team: string;
}

/**
 * Pure CSPRNG winner selection with exclusion and stable pool hashing
 */
export function selectWinnerWithCSPRNG(candidates: CandidateUser[], excludeIds?: Set<string>): { winner: CandidateUser; selectedIndex: number; poolHash: string; poolSize: number } {
  const eligible = excludeIds ? candidates.filter(c => !excludeIds.has(c.id)) : candidates;
  if (eligible.length === 0) {
    throw new Error('No eligible candidates found for draw.');
  }
  const sorted = [...eligible].sort((a, b) => a.id.localeCompare(b.id));
  const poolHash = crypto
    .createHash('sha256')
    .update(sorted.map(c => c.id).join(','))
    .digest('hex');
  const selectedIndex = crypto.randomInt(0, sorted.length);
  return { winner: sorted[selectedIndex], selectedIndex, poolHash, poolSize: sorted.length };
}

/**
 * Executes a CSPRNG draw with strict server-side transaction logging & idempotency
 */
export async function executeServerDraw(options: DrawOptions): Promise<{ draw: RevealDrawItem; isIdempotentReplay: boolean }> {
  const supabase = getSupabaseServerClient();
  const isRehearsal = options.eventId.includes('rehearsal');

  // 1. Check Idempotency Key
  const { data: existingDraw } = await supabase
    .from('reveal_draws')
    .select('*')
    .eq('idempotency_key', options.idempotencyKey)
    .maybeSingle();

  if (existingDraw) {
    return {
      draw: {
        id: existingDraw.id,
        eventId: existingDraw.event_id,
        roundNumber: existingDraw.round_number,
        prizeName: existingDraw.prize_name,
        winnerId: existingDraw.winner_id,
        winnerName: existingDraw.winner_name,
        winnerTeam: existingDraw.winner_team,
        poolHash: existingDraw.pool_hash,
        poolSize: existingDraw.pool_size,
        selectedIndex: existingDraw.selected_index,
        executedBy: existingDraw.executed_by,
        idempotencyKey: existingDraw.idempotency_key,
        isVoided: existingDraw.is_voided,
        voidReason: existingDraw.void_reason,
        createdAt: existingDraw.created_at
      },
      isIdempotentReplay: true
    };
  }

  // 2. Fetch candidate pool
  let candidates: CandidateUser[] = [];

  if (isRehearsal) {
    candidates = REHEARSAL_USERS.map(u => ({ id: u.id, name: u.name, team: u.team }));
  } else {
    // Live: fetch from users table excluding admin
    const { data: dbUsers, error } = await supabase
      .from('users')
      .select('id, name, team, role');
    if (error) throw new Error(`Failed to fetch users for draw: ${error.message}`);
    candidates = (dbUsers || [])
      .filter(u => u.role !== 'admin')
      .map(u => ({ id: u.id, name: u.name, team: u.team }));
  }

  if (candidates.length === 0) {
    throw new Error('No eligible candidates found for draw.');
  }

  // 3. Exclude previous winners if requested
  if (options.excludePreviousWinners !== false) {
    const { data: previousDraws } = await supabase
      .from('reveal_draws')
      .select('winner_id')
      .eq('event_id', options.eventId)
      .eq('is_voided', false);

    const winnerIds = new Set((previousDraws || []).map(d => d.winner_id));
    candidates = candidates.filter(c => !winnerIds.has(c.id));
  }

  if (candidates.length === 0) {
    throw new Error('All eligible candidates have already won in previous rounds.');
  }

  // 4. Stable sort pool for deterministic hash
  const sortedCandidates = [...candidates].sort((a, b) => a.id.localeCompare(b.id));
  const poolHash = crypto
    .createHash('sha256')
    .update(sortedCandidates.map(c => c.id).join(','))
    .digest('hex');

  // 5. Node CSPRNG (crypto.randomInt)
  const selectedIndex = crypto.randomInt(0, sortedCandidates.length);
  const winner = sortedCandidates[selectedIndex];

  // 6. Persist Draw
  const drawId = `draw-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const now = new Date().toISOString();

  const drawRow = {
    id: drawId,
    event_id: options.eventId,
    round_number: options.roundNumber,
    prize_name: options.prizeName,
    winner_id: winner.id,
    winner_name: winner.name,
    winner_team: winner.team,
    pool_hash: poolHash,
    pool_size: sortedCandidates.length,
    selected_index: selectedIndex,
    executed_by: options.adminId,
    idempotency_key: options.idempotencyKey,
    is_voided: false,
    created_at: now
  };

  const { error: insertErr } = await supabase
    .from('reveal_draws')
    .insert(drawRow);

  if (insertErr) {
    throw new Error(`Failed to persist draw result: ${insertErr.message}`);
  }

  // Audit log
  await supabase.from('reveal_audit_logs').insert({
    id: `audit-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    event_id: options.eventId,
    action: 'EXECUTE_LUCKY_DRAW',
    actor_id: options.adminId,
    details: {
      roundNumber: options.roundNumber,
      prizeName: options.prizeName,
      winnerId: winner.id,
      winnerName: winner.name,
      poolSize: sortedCandidates.length,
      selectedIndex,
      poolHash
    },
    created_at: now
  });

  return {
    draw: {
      id: drawId,
      eventId: options.eventId,
      roundNumber: options.roundNumber,
      prizeName: options.prizeName,
      winnerId: winner.id,
      winnerName: winner.name,
      winnerTeam: winner.team,
      poolHash,
      poolSize: sortedCandidates.length,
      selectedIndex,
      executedBy: options.adminId,
      idempotencyKey: options.idempotencyKey,
      isVoided: false,
      createdAt: now
    },
    isIdempotentReplay: false
  };
}

/**
 * Voids a faulty or canceled draw without deleting audit records
 */
export async function voidDraw(drawId: string, reason: string, adminId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();

  const { data: draw, error: fetchErr } = await supabase
    .from('reveal_draws')
    .select('*')
    .eq('id', drawId)
    .single();

  if (fetchErr || !draw) {
    throw new Error('Draw not found');
  }

  const { error: updateErr } = await supabase
    .from('reveal_draws')
    .update({
      is_voided: true,
      void_reason: reason
    })
    .eq('id', drawId);

  if (updateErr) {
    throw new Error(`Failed to void draw: ${updateErr.message}`);
  }

  await supabase.from('reveal_audit_logs').insert({
    id: `audit-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    event_id: draw.event_id,
    action: 'VOID_LUCKY_DRAW',
    actor_id: adminId,
    details: { drawId, roundNumber: draw.round_number, reason },
    created_at: now
  });
}
