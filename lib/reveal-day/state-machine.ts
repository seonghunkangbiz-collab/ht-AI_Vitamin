import crypto from 'crypto';
import { getSupabaseServerClient } from '@/lib/supabase';
import type { RevealSegment, RevealStatus, RevealEvent, RevealPublicState } from './types';

export const ORDERED_SEGMENTS: RevealSegment[] = [
  'opening',
  'journey',
  'mate_reveal',
  'time_capsule',
  'lucky_draw',
  'song',
  'closing',
  'pizza_party',
  'ended'
];

export const SEGMENT_METADATA: Record<RevealSegment, { title: string; durationMinutes: number; timeRange: string; description: string }> = {
  opening: {
    title: 'Opening',
    durationMinutes: 5,
    timeRange: '16:00~16:05',
    description: '행사 오프닝, 콘셉트 소개 및 참석자 실시간 체크인'
  },
  journey: {
    title: 'Vitamin Journey',
    durationMinutes: 10,
    timeRange: '16:05~16:15',
    description: '2개월간의 비타민 프로그램 발자취 및 칭찬 통계 공유'
  },
  mate_reveal: {
    title: 'Mystery Mate Reveal',
    durationMinutes: 20,
    timeRange: '16:15~16:35',
    description: '나를 묵묵히 관찰하고 지켜봐 준 Mystery Mate 공개'
  },
  time_capsule: {
    title: 'AI Time Capsule',
    durationMinutes: 10,
    timeRange: '16:35~16:45',
    description: '동료들의 칭찬을 AI가 분석한 개인 맞춤형 타임캡슐 오픈'
  },
  lucky_draw: {
    title: 'AI Lucky Draw',
    durationMinutes: 15,
    timeRange: '16:45~17:00',
    description: '서버 CSPRNG 기반 공정하고 투명한 럭키 드로우'
  },
  song: {
    title: 'HT 사업본부 AI Vitamin Song',
    durationMinutes: 5,
    timeRange: '17:00~17:05',
    description: 'AI가 제작한 HT사업본부 비타민 헌정곡 감상'
  },
  closing: {
    title: 'Closing',
    durationMinutes: 5,
    timeRange: '17:05~17:10',
    description: '본부장님 마무리 말씀 및 감사 인사'
  },
  pizza_party: {
    title: 'Pizza Party & Photo',
    durationMinutes: 50,
    timeRange: '17:10~18:00',
    description: '피자 파티, 자유 네트워킹 및 단체 기념 촬영'
  },
  ended: {
    title: '행사 종료',
    durationMinutes: 0,
    timeRange: '17:30~',
    description: 'Reveal Day 행사가 성공적으로 종료되었습니다.'
  }
};

const LEASE_DURATION_SECONDS = 45;

/**
 * Controller lease management for multi-operator protection
 */
export async function manageControllerLease(
  eventId: string,
  adminId: string,
  adminName: string,
  action: 'acquire' | 'heartbeat' | 'release' | 'takeover'
): Promise<{ success: boolean; conflict?: boolean; currentController?: { id: string; name: string; expiresAt: string } }> {
  const supabase = getSupabaseServerClient();
  const now = new Date();

  const { data: event, error } = await supabase
    .from('reveal_events')
    .select('controller_id, controller_name, controller_lease_until')
    .eq('id', eventId)
    .single();

  if (error || !event) {
    throw new Error('Event not found');
  }

  const leaseUntil = event.controller_lease_until ? new Date(event.controller_lease_until) : null;
  const isLeaseActive = leaseUntil && leaseUntil.getTime() > now.getTime();
  const isSelf = event.controller_id === adminId;

  if (action === 'release') {
    if (isSelf) {
      await supabase.from('reveal_events').update({
        controller_id: null,
        controller_name: null,
        controller_lease_until: null,
        updated_at: now.toISOString()
      }).eq('id', eventId);
    }
    return { success: true };
  }

  if (action === 'heartbeat') {
    if (!isSelf && isLeaseActive) {
      return {
        success: false,
        conflict: true,
        currentController: {
          id: event.controller_id!,
          name: event.controller_name || '관리자',
          expiresAt: leaseUntil!.toISOString()
        }
      };
    }
  }

  if (action === 'acquire') {
    if (isLeaseActive && !isSelf) {
      return {
        success: false,
        conflict: true,
        currentController: {
          id: event.controller_id!,
          name: event.controller_name || '관리자',
          expiresAt: leaseUntil!.toISOString()
        }
      };
    }
  }

  // Grant or refresh lease
  const newLeaseExpiry = new Date(now.getTime() + LEASE_DURATION_SECONDS * 1000).toISOString();
  await supabase.from('reveal_events').update({
    controller_id: adminId,
    controller_name: adminName,
    controller_lease_until: newLeaseExpiry,
    updated_at: now.toISOString()
  }).eq('id', eventId);

  if (action === 'takeover') {
    await supabase.from('reveal_audit_logs').insert({
      id: `audit-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      event_id: eventId,
      action: 'CONTROLLER_TAKEOVER',
      actor_id: adminId,
      actor_name: adminName,
      details: { previousController: event.controller_id },
      created_at: now.toISOString()
    });
  }

  return { success: true };
}

/**
 * Optimistic Locking Segment Transition
 */
export async function transitionSegment(
  eventId: string,
  targetSegment: RevealSegment,
  expectedVersion: number,
  adminId: string,
  adminName: string
): Promise<{ success: boolean; conflict?: boolean; currentEvent?: RevealEvent }> {
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();

  // 1. Fetch current event row
  const { data: current, error } = await supabase
    .from('reveal_events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error || !current) {
    throw new Error('Event not found');
  }

  // 2. Check optimistic lock version
  if (current.version !== expectedVersion) {
    return {
      success: false,
      conflict: true,
      currentEvent: {
        id: current.id,
        mode: current.mode,
        status: current.status,
        title: current.title,
        concept: current.concept,
        scheduledAt: current.scheduled_at,
        cutoffAt: current.cutoff_at,
        currentSegment: current.current_segment,
        currentRevealIndex: current.current_reveal_index,
        currentBatchIndex: current.current_batch_index,
        version: current.version,
        controllerId: current.controller_id,
        controllerName: current.controller_name,
        controllerLeaseUntil: current.controller_lease_until,
        isBlackout: current.is_blackout,
        isHolding: current.is_holding,
        createdAt: current.created_at,
        updatedAt: current.updated_at
      }
    };
  }

  const nextVersion = current.version + 1;
  const newStatus: RevealStatus = targetSegment === 'ended' 
    ? 'ended' 
    : current.status === 'ready' && targetSegment !== 'opening' 
      ? 'live' 
      : current.status;

  // 3. Update reveal_events
  const { error: updateErr } = await supabase
    .from('reveal_events')
    .update({
      current_segment: targetSegment,
      status: newStatus,
      version: nextVersion,
      updated_at: now
    })
    .eq('id', eventId)
    .eq('version', expectedVersion);

  if (updateErr) {
    throw new Error(`Failed to update event state: ${updateErr.message}`);
  }

  // 4. Update reveal_public_state
  const { data: pubState } = await supabase
    .from('reveal_public_state')
    .select('sequence')
    .eq('event_id', eventId)
    .single();

  const nextSequence = (pubState?.sequence || 1) + 1;

  const { error: pubErr } = await supabase
    .from('reveal_public_state')
    .update({
      current_segment: targetSegment,
      status: newStatus,
      sequence: nextSequence,
      updated_at: now
    })
    .eq('event_id', eventId);

  if (pubErr) {
    throw new Error(`Failed to update public state: ${pubErr.message}`);
  }

  // 5. Record audit log
  await supabase.from('reveal_audit_logs').insert({
    id: `audit-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    event_id: eventId,
    action: 'TRANSITION_SEGMENT',
    actor_id: adminId,
    actor_name: adminName,
    details: { from: current.current_segment, to: targetSegment, version: nextVersion },
    created_at: now
  });

  return { success: true };
}

/**
 * Emergency Blackout & Holding Toggles
 */
export async function toggleEmergencyMode(
  eventId: string,
  type: 'blackout' | 'holding',
  active: boolean,
  adminId: string
): Promise<void> {
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();

  const field = type === 'blackout' ? 'is_blackout' : 'is_holding';

  await supabase
    .from('reveal_events')
    .update({ [field]: active, updated_at: now })
    .eq('id', eventId);

  await supabase
    .from('reveal_public_state')
    .update({ [field]: active, updated_at: now })
    .eq('event_id', eventId);

  await supabase.from('reveal_audit_logs').insert({
    id: `audit-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    event_id: eventId,
    action: `TOGGLE_${type.toUpperCase()}`,
    actor_id: adminId,
    details: { active },
    created_at: now
  });
}
