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
      const res = await fetch(`/api/reveal-day/public/state?eventId=${encodeURIComponent(eventId)}`, {
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

  const startPolling = useCallback(() => {
    if (pollingTimerRef.current) return;
    setConnectionStatus('polling');
    pollingTimerRef.current = setInterval(() => {
      fetchLatestState();
    }, 3500);
  }, [fetchLatestState]);

  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchLatestState();

    if (!isSupabaseConfigured()) {
      startPolling();
      return () => {
        isMountedRef.current = false;
        stopPolling();
      };
    }

    try {
      const supabase = getSupabaseClient();
      const channelName = `reveal_public_state_${eventId}`;

      const channel = supabase
        .channel(channelName)
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
        .subscribe((status) => {
          if (!isMountedRef.current) return;
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
            stopPolling();
            fetchLatestState(); // Re-sync on connect
          } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR' || status === 'CLOSED') {
            startPolling();
          }
        });

      channelRef.current = channel;
    } catch {
      startPolling();
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
    snapshotStats,
    connectionStatus,
    lastSyncTime,
    refetch: fetchLatestState
  };
}
