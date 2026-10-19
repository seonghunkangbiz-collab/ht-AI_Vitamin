'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import RevealDayShell from '@/components/reveal-day/RevealDayShell';
import { useRevealDayRealtime } from '@/hooks/useRevealDayRealtime';
import { RevealEvent, RevealPublicState, RevealSegment, MatePairReveal, RevealTimeCapsuleItem, RevealDrawItem } from '@/lib/reveal-day/types';
import { getCurrentUser } from '@/lib/db';
import { getSupabaseClient } from '@/lib/supabase';

export default function AdminRevealDayPage() {
  const router = useRouter();

  // Mode & Event ID
  const [mode, setMode] = useState<'live' | 'rehearsal'>('live');
  const eventId = mode === 'live' ? 'event-live-20261028' : 'event-rehearsal';

  // Admin authentication check
  const [isAdminChecked, setIsAdminChecked] = useState(false);
  const [eventData, setEventData] = useState<RevealEvent | null>(null);
  const [matePairs, setMatePairs] = useState<MatePairReveal[]>([]);
  const [capsules, setCapsules] = useState<RevealTimeCapsuleItem[]>([]);
  const [draws, setDraws] = useState<RevealDrawItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Realtime hook
  const {
    publicState,
    snapshotStats,
    connectionStatus,
    lastSyncTime,
    refetch: refetchState
  } = useRevealDayRealtime({ eventId });

  // 1. Initial Admin Auth & Data Fetching
  const fetchAllData = useCallback(async () => {
    try {
      // Check session
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meData.user || meData.user.role !== 'admin') {
        router.push('/admin');
        return;
      }
      setIsAdminChecked(true);

      // Fetch Event & Public State
      const stateRes = await fetch(`/api/admin/reveal-day/state?eventId=${eventId}`);
      if (stateRes.ok) {
        const data = await stateRes.json();
        if (data.event) setEventData(data.event);
      }

      // Fetch Mate Pairs
      const matesRes = await fetch(`/api/admin/reveal-day/mates?eventId=${eventId}`);
      if (matesRes.ok) {
        const data = await matesRes.json();
        if (data.pairs) setMatePairs(data.pairs);
      }

      // Fetch Capsules
      const capsRes = await fetch(`/api/admin/reveal-day/capsules?eventId=${eventId}`);
      if (capsRes.ok) {
        const data = await capsRes.json();
        if (data.capsules) setCapsules(data.capsules);
      }

      // Fetch Draws
      const drawsRes = await fetch(`/api/admin/reveal-day/draw?eventId=${eventId}`);
      if (drawsRes.ok) {
        const data = await drawsRes.json();
        if (data.draws) setDraws(data.draws);
      }
    } catch (e: any) {
      setErrorMessage(e.message || '데이터 로드 실패');
    }
  }, [eventId, router]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // 2. Controller Lease Heartbeat Loop (every 15s)
  useEffect(() => {
    if (!isAdminChecked) return;

    // Acquire lease on load
    fetch('/api/admin/reveal-day/lease', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, action: 'acquire' })
    }).catch(() => {});

    const heartbeatTimer = setInterval(() => {
      fetch('/api/admin/reveal-day/lease', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, action: 'heartbeat' })
      }).catch(() => {});
    }, 15000);

    return () => {
      clearInterval(heartbeatTimer);
      // Release lease on unmount
      fetch('/api/admin/reveal-day/lease', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, action: 'release' })
      }).catch(() => {});
    };
  }, [eventId, isAdminChecked]);

  // 3. Segment Transition Handler with Optimistic Locking
  const handleTransitionSegment = async (targetSegment: RevealSegment) => {
    if (!eventData) return;
    try {
      const res = await fetch('/api/admin/reveal-day/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          action: 'transition_segment',
          targetSegment,
          expectedVersion: eventData.version
        })
      });

      if (res.status === 409) {
        alert('다른 운영자가 상태를 변경했습니다. 최신 상태로 새로고침합니다.');
        await fetchAllData();
        refetchState();
        return;
      }

      if (res.ok) {
        await fetchAllData();
        refetchState();
        try {
          const sb = getSupabaseClient();
          sb.channel(`reveal_channel_${eventId}`).send({
            type: 'broadcast',
            event: 'state_change',
            payload: { segment: targetSegment }
          });
        } catch {}
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`순서 전환 오류: ${errData.error || errData.message || res.statusText}`);
      }
    } catch (e: any) {
      alert(`상태 전이 실패: ${e.message}`);
    }
  };

  // 4. Mate Reveal Advance Handler
  const handleAdvanceMateIndex = async (type: 'reveal_next' | 'reveal_batch' | 'next_batch' | 'prev_batch') => {
    try {
      const res = await fetch('/api/admin/reveal-day/mates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          action: type
        })
      });

      if (res.ok) {
        const matesRes = await fetch(`/api/admin/reveal-day/mates?eventId=${eventId}`);
        if (matesRes.ok) {
          const data = await matesRes.json();
          if (data.pairs) setMatePairs(data.pairs);
        }
        refetchState();
        try {
          const sb = getSupabaseClient();
          sb.channel(`reveal_channel_${eventId}`).send({
            type: 'broadcast',
            event: 'state_change',
            payload: { action: type }
          });
        } catch {}
      }
    } catch (e: any) {
      alert(`공개 단계 진행 실패: ${e.message}`);
    }
  };

  // 5. Lucky Draw Execution Handler
  const handleExecuteDraw = async (roundNumber: number, prizeName: string) => {
    try {
      const idempotencyKey = `draw-${eventId}-r${roundNumber}-${Date.now()}`;
      const res = await fetch('/api/admin/reveal-day/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          action: 'draw',
          roundNumber,
          prizeName,
          excludePreviousWinners: true,
          idempotencyKey
        })
      });

      if (res.ok) {
        const drawsRes = await fetch(`/api/admin/reveal-day/draw?eventId=${eventId}`);
        if (drawsRes.ok) {
          const data = await drawsRes.json();
          if (data.draws) setDraws(data.draws);
        }
        refetchState();
      } else {
        const err = await res.json();
        alert(`추첨 실패: ${err.error || '오류 발생'}`);
      }
    } catch (e: any) {
      alert(`추첨 요청 오류: ${e.message}`);
    }
  };

  // 6. Emergency Blackout & Holding Toggles
  const handleToggleEmergency = async (type: 'blackout' | 'holding', active: boolean) => {
    try {
      await fetch('/api/admin/reveal-day/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          action: type === 'blackout' ? 'toggle_blackout' : 'toggle_holding',
          active
        })
      });
      refetchState();
    } catch {}
  };

  // 7. Reset Checkins Handler
  const handleResetCheckins = async () => {
    try {
      const res = await fetch('/api/admin/reveal-day/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          action: 'reset_checkins'
        })
      });

      if (res.ok) {
        refetchState();
        try {
          const sb = getSupabaseClient();
          sb.channel(`reveal_channel_${eventId}`).send({
            type: 'broadcast',
            event: 'checkin_reset',
            payload: { checkinCount: 0 }
          });
        } catch {}
        alert(`[${mode === 'rehearsal' ? '리허설' : '라이브'}] 체크인 세션이 초기화되었습니다. (체크인 수: 0명)`);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`초기화 실패: ${err.error || '오류 발생'}`);
      }
    } catch (e: any) {
      alert(`초기화 통신 오류: ${e.message}`);
    }
  };

  if (!isAdminChecked || !eventData || !publicState) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold text-slate-200">Reveal Day 콘솔 로딩 중...</h2>
        <p className="text-xs text-slate-500 mt-1">관리자 권한 및 실시간 동기화 채널 확인 중</p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      {/* Rehearsal / Live Switcher Bar */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-1 rounded-full bg-slate-900/90 border border-slate-700 backdrop-blur-md shadow-xl text-xs">
        <button
          onClick={() => setMode('live')}
          className={`px-3 py-1 rounded-full font-bold transition-all ${
            mode === 'live'
              ? 'bg-sky-500 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          LIVE 모드
        </button>
        <button
          onClick={() => setMode('rehearsal')}
          className={`px-3 py-1 rounded-full font-bold transition-all ${
            mode === 'rehearsal'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          리허설 모드
        </button>
      </div>

      <RevealDayShell
        event={eventData}
        publicState={publicState}
        snapshotStats={snapshotStats}
        matePairs={matePairs}
        capsules={capsules}
        draws={draws}
        connectionStatus={connectionStatus}
        lastSyncTime={lastSyncTime}
        onTransitionSegment={handleTransitionSegment}
        onAdvanceMateIndex={handleAdvanceMateIndex}
        onExecuteDraw={handleExecuteDraw}
        onToggleEmergency={handleToggleEmergency}
        onResetCheckins={handleResetCheckins}
        onRefreshData={fetchAllData}
        isDisplayOnly={false}
      />
    </div>
  );
}
