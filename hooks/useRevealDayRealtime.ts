'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { RevealPublicState } from '@/lib/reveal-day/types';

export type RealtimeConnectionStatus = 'connected' | 'polling' | 'disconnected';

interface UseRevealDayRealtimeProps {
  eventId: string;
  initialState?: RevealPublicState | null;
  onStateChange?: (state: RevealPublicState) => void;
}

export function useRevealDayRealtime({ eventId, initialState, onStateChange }: UseRevealDayRealtimeProps) {
  const [publicState, setPublicState] = useState<RevealPublicState | null>(initialState || null);
  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>('disconnected');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [snapshotStats, setSnapshotStats] = useState<any>(null);

  const isMountedRef = useRef(true);
  const channelRef = useRef<any>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLatestState = useCallback(async () => {
    try {
      const res = await fetch(`/api/reveal-day/public/state?eventId=${encodeURIComponent(eventId)}&_t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (isMountedRef.current && data.publicState) {
          setPublicState(data.publicState);
          setLastSyncTime(new Date());
          if (data.snapshotStats) {
            setSnapshotStats(data.snapshotStats);
          }
          if (onStateChange) {
            onStateChange(data.publicState);
          }
        }
      }
    } catch (err) {
      // Network or offline error
    }
  }, [eventId, onStateChange]);

  const startPolling = useCallback((interval = 1000) => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    setConnectionStatus('polling');
    pollingTimerRef.current = setInterval(() => {
      fetchLatestState();
    }, interval);
  }, [fetchLatestState]);

  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  const sendBroadcast = useCallback((event: string, payload: any) => {
    try {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event,
          payload
        });
      } else {
        const sb = getSupabaseClient();
        sb.channel(`reveal_channel_${eventId}`).send({
          type: 'broadcast',
          event,
          payload
        });
      }
    } catch {}
  }, [eventId]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchLatestState();

    if (!isSupabaseConfigured()) {
      startPolling(1000);
      return () => {
        isMountedRef.current = false;
        stopPolling();
      };
    }

    try {
      const supabase = getSupabaseClient();
      const channelName = `reveal_channel_${eventId}`;

      const channel = supabase
        .channel(channelName)
        // 1. Direct Broadcast messages from mobile / admin for sub-50ms latency
        .on('broadcast', { event: 'checkin' }, (payload) => {
          if (isMountedRef.current) {
            if (payload?.payload?.checkinCount !== undefined) {
              setPublicState(prev => prev ? { ...prev, checkinCount: payload.payload.checkinCount } : null);
            }
            fetchLatestState();
          }
        })
        .on('broadcast', { event: 'checkin_reset' }, () => {
          if (isMountedRef.current) {
            setPublicState(prev => prev ? { ...prev, checkinCount: 0 } : null);
            fetchLatestState();
          }
        })
        .on('broadcast', { event: 'reaction' }, (payload) => {
          if (isMountedRef.current) {
            if (payload?.payload?.reactionCounts) {
              setPublicState(prev => prev ? { ...prev, reactionCounts: payload.payload.reactionCounts } : null);
            }
          }
        })
        .on('broadcast', { event: 'capsule_index' }, (payload) => {
          if (isMountedRef.current) {
            const raw = payload?.payload || payload || {};
            const idx = typeof raw.index === 'number' ? raw.index : (typeof raw.currentCapsuleIndex === 'number' ? raw.currentCapsuleIndex : null);
            if (idx !== null) {
              setPublicState(prev => {
                if (!prev || prev.currentCapsuleIndex === idx) return prev;
                return { ...prev, currentCapsuleIndex: idx };
              });
            }
          }
        })
        .on('broadcast', { event: 'state_change' }, (payload) => {
          if (isMountedRef.current) {
            const data = payload?.payload || payload || {};
            // Instant optimistic update from broadcast payload (0ms latency on display screen)
            if (data.segment) {
              setPublicState(prev => prev ? { ...prev, currentSegment: data.segment } : null);
            }
            if (data.isBlackout !== undefined || data.isHolding !== undefined) {
              setPublicState(prev => prev ? {
                ...prev,
                isBlackout: data.isBlackout ?? prev.isBlackout,
                isHolding: data.isHolding ?? prev.isHolding
              } : null);
            }
            if (data.currentRevealIndex !== undefined) {
              setPublicState(prev => prev ? {
                ...prev,
                currentRevealIndex: data.currentRevealIndex,
                revealedPairsCount: data.revealedPairsCount ?? prev.revealedPairsCount
              } : null);
            }
            const capIdx = typeof data.currentCapsuleIndex === 'number' ? data.currentCapsuleIndex : (typeof data.capsuleIndex === 'number' ? data.capsuleIndex : null);
            if (capIdx !== null) {
              setPublicState(prev => prev ? {
                ...prev,
                currentCapsuleIndex: capIdx
              } : null);
            }
            fetchLatestState();
          }
        })
        // 2. Database postgres_changes on reveal_public_state
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reveal_public_state',
            filter: `event_id=eq.${eventId}`
          },
          (payload) => {
            if (isMountedRef.current && payload.new) {
              const row: any = payload.new;
              const mapped: RevealPublicState = {
                eventId: row.event_id,
                mode: row.mode,
                status: row.status,
                currentSegment: row.current_segment,
                currentRevealIndex: row.current_reveal_index,
                currentBatchIndex: row.current_batch_index,
                revealedPairsCount: row.revealed_pairs_count,
                dataVersion: row.data_version,
                sequence: row.sequence,
                isBlackout: row.is_blackout,
                isHolding: row.is_holding,
                reactionCounts: row.reaction_counts,
                checkinCount: row.checkin_count,
                lastDataSyncAt: row.last_data_sync_at,
                updatedAt: row.updated_at
              };
              setPublicState(mapped);
              setLastSyncTime(new Date());
              if (onStateChange) onStateChange(mapped);
            }
          }
        )
        // 3. Database postgres_changes on reveal_interactions for instant check-in detection
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'reveal_interactions',
            filter: `event_id=eq.${eventId}`
          },
          () => {
            if (isMountedRef.current) {
              fetchLatestState();
            }
          }
        )
        .subscribe((status) => {
          if (!isMountedRef.current) return;
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
            // Keep a light 1000ms safety poll even when connected
            startPolling(1000);
            fetchLatestState(); // Re-sync on connect
          } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR' || status === 'CLOSED') {
            startPolling(1000);
          }
        });

      channelRef.current = channel;
    } catch {
      startPolling(1000);
    }

    return () => {
      isMountedRef.current = false;
      stopPolling();
      if (channelRef.current) {
        try {
          const supabase = getSupabaseClient();
          supabase.removeChannel(channelRef.current);
        } catch {}
      }
    };
  }, [eventId, fetchLatestState, startPolling, stopPolling, onStateChange]);

  return {
    publicState,
    setPublicState,
    snapshotStats,
    connectionStatus,
    lastSyncTime,
    refetch: fetchLatestState,
    sendBroadcast
  };
}
