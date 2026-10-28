import crypto from 'crypto';
import { getSupabaseServerClient } from '@/lib/supabase';
import { fetchAITimeCapsule } from '@/lib/aiService';
import { OFFICIAL_CUTOFF_KST } from './snapshot';
import type { RevealTimeCapsuleItem } from './types';

/**
 * Pre-generates Time Capsules for all active users based on official cutoff praises
 */
export async function pregenerateAllTimeCapsules(adminId: string): Promise<{ generated: number; updated: number }> {
  const supabase = getSupabaseServerClient();
  const cutoffDate = new Date(OFFICIAL_CUTOFF_KST);

  // 1. Fetch Users
  const { data: users, error: userErr } = await supabase
    .from('users')
    .select('id, name, team, role');
  if (userErr) throw new Error(`Failed to fetch users: ${userErr.message}`);

  const activeUsers = (users || []).filter(u => u.role !== 'admin');

  // 2. Fetch Praises (incorporating all praises entered up to current Reveal Day)
  const { data: praises, error: praiseErr } = await supabase
    .from('praise_messages')
    .select('recipient_user_id, content, refined_content, created_at')
    .order('created_at', { ascending: true });
  if (praiseErr) throw new Error(`Failed to fetch praises: ${praiseErr.message}`);

  // 3. Fetch Observation Notes from private_note_history
  const { data: notes } = await supabase
    .from('private_note_history')
    .select('target_user_id, content, change_type')
    .order('created_at', { ascending: true });

  const activeNotes = (notes || []).filter(n => n.change_type !== 'delete' && n.content?.trim());

  const feedbackMap = new Map<string, string[]>();
  (praises || []).forEach(p => {
    const list = feedbackMap.get(p.recipient_user_id) || [];
    list.push(p.refined_content || p.content);
    feedbackMap.set(p.recipient_user_id, list);
  });

  activeNotes.forEach(n => {
    const list = feedbackMap.get(n.target_user_id) || [];
    list.push(`[동료의 시선과 메모] ${n.content}`);
    feedbackMap.set(n.target_user_id, list);
  });

  let generatedCount = 0;
  let updatedCount = 0;

  for (const user of activeUsers) {
    const userFeedbacks = feedbackMap.get(user.id) || [];
    const hashSource = JSON.stringify({ userId: user.id, feedbacks: userFeedbacks });
    const sourceHash = crypto.createHash('sha256').update(hashSource).digest('hex');

    // Check existing capsule
    const { data: existing } = await supabase
      .from('reveal_time_capsules')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing && existing.source_hash === sourceHash && existing.approval_status === 'approved') {
      continue; // Up to date
    }

    // Generate capsule grounded in actual praises & observation notes
    const result = await fetchAITimeCapsule(user.name, userFeedbacks);
    const now = new Date().toISOString();

    const capsuleId = existing?.id || `cap-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const row = {
      id: capsuleId,
      user_id: user.id,
      recipient_name: user.name,
      recipient_team: user.team,
      keywords: result.keywords,
      analysis: result.analysis,
      letter: result.letter,
      approval_status: existing?.approval_status || 'approved', // Default approved for pre-generated
      source_hash: sourceHash,
      is_spotlight: existing?.is_spotlight || false,
      generation_method: process.env.OPENAI_API_KEY ? 'openai' : 'fallback',
      reviewed_by: adminId,
      reviewed_at: now,
      created_at: existing?.created_at || now
    };

    const { error: upsertErr } = await supabase
      .from('reveal_time_capsules')
      .upsert(row);

    if (upsertErr) {
      console.warn(`Failed to upsert capsule for ${user.name}:`, upsertErr.message);
    } else {
      if (existing) updatedCount++;
      else generatedCount++;
    }
  }

  return { generated: generatedCount, updated: updatedCount };
}

/**
 * Fetches approved Time Capsule for a specific authenticated user
 */
export async function getApprovedCapsuleForUser(userId: string): Promise<RevealTimeCapsuleItem | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('reveal_time_capsules')
    .select('*')
    .eq('user_id', userId)
    .eq('approval_status', 'approved')
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    recipientName: data.recipient_name,
    recipientTeam: data.recipient_team,
    keywords: data.keywords,
    analysis: data.analysis,
    letter: data.letter,
    approvalStatus: data.approval_status,
    sourceHash: data.source_hash,
    isSpotlight: data.is_spotlight,
    generationMethod: data.generation_method,
    reviewedBy: data.reviewed_by,
    reviewedAt: data.reviewed_at,
    createdAt: data.created_at
  };
}
