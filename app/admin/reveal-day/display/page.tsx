'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import StageCanvas from '@/components/reveal-day/StageCanvas';
import LiveFeedSidebar from '@/components/reveal-day/LiveFeedSidebar';
import { useRevealDayRealtime } from '@/hooks/useRevealDayRealtime';
import { MatePairReveal, RevealTimeCapsuleItem, RevealDrawItem } from '@/lib/reveal-day/types';
import { Maximize2, Minimize2, Radio, Sparkles, MessageSquare } from 'lucide-react';

function DisplayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryEventId = searchParams.get('eventId');
  const queryMode = searchParams.get('mode');
  const eventId = queryEventId || (queryMode === 'rehearsal' ? 'event-rehearsal' : 'event-live-20261028');
  const isRehearsal = eventId.includes('rehearsal') || queryMode === 'rehearsal';

  const [matePairs, setMatePairs] = useState<MatePairReveal[]>([]);
  const [capsules, setCapsules] = useState<RevealTimeCapsuleItem[]>([]);
  const [draws, setDraws] = useState<RevealDrawItem[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);

  // Subscribe to safe public state
  const { publicState, snapshotStats } = useRevealDayRealtime({ eventId });

  // Fetch only public revealed pairs and valid draws
  useEffect(() => {
    const fetchDisplayAssets = async () => {
      try {
        const t = Date.now();
        // Fetch revealed pairs only
        const matesRes = await fetch(`/api/reveal-day/public/mates?eventId=${eventId}&_t=${t}`);
        if (matesRes.ok) {
          const data = await matesRes.json();
          if (data.revealedPairs) setMatePairs(data.revealedPairs);
        }

        // Fetch valid draws
        const drawsRes = await fetch(`/api/admin/reveal-day/draw?eventId=${eventId}&_t=${t}`);
        if (drawsRes.ok) {
          const data = await drawsRes.json();
          if (data.draws) setDraws(data.draws.filter((d: any) => !d.isVoided));
        }

        // Fetch approved capsules
        const capsRes = await fetch(`/api/admin/reveal-day/capsules?eventId=${eventId}&_t=${t}`);
        if (capsRes.ok) {
          const data = await capsRes.json();
          if (data.capsules) setCapsules(data.capsules.filter((c: any) => c.approvalStatus === 'approved'));
        }
      } catch {}
    };

    fetchDisplayAssets();
    const interval = setInterval(fetchDisplayAssets, 3000);
    return () => clearInterval(interval);
  }, [eventId, publicState?.currentSegment, publicState?.currentRevealIndex, publicState?.sequence]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  // Keyboard shortcuts: 'F' for fullscreen, 'C' for live chat sidebar toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input field
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setIsChatOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!publicState) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black flex overflow-hidden relative select-none">
      {/* Rehearsal Watermark Pill (Top) */}
      {isRehearsal && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-wide backdrop-blur-md shadow-lg flex items-center gap-1.5 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>리허설 무대 송출 중 (REHEARSAL DISPLAY)</span>
        </div>
      )}

      {/* Floating Mode Switcher & Monitor Info (Bottom Left, Subtle on idle, clear on hover) */}
      <div className="absolute bottom-4 left-4 z-40 flex items-center gap-2 p-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs backdrop-blur-md opacity-30 hover:opacity-100 transition-opacity">
        <button
          onClick={() => router.push('/admin/reveal-day/display?mode=rehearsal&eventId=event-rehearsal')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
            isRehearsal
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
          title="리허설 모드 무대 화면으로 전환"
        >
          리허설 빔
        </button>
        <button
          onClick={() => router.push('/admin/reveal-day/display?mode=live&eventId=event-live-20261028')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
            !isRehearsal
              ? 'bg-sky-500 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
          title="라이브 모드 무대 화면으로 전환"
        >
          라이브 빔
        </button>
      </div>

      {/* Discreet Chat Sidebar & Fullscreen Controls (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsChatOpen(prev => !prev)}
          className={`px-3 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg backdrop-blur-md ${
            isChatOpen
              ? 'bg-sky-500/80 hover:bg-sky-500 text-white border border-sky-400/40'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 opacity-60 hover:opacity-100'
          }`}
          title="소통 피드 토글 (C)"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>소통창 {isChatOpen ? 'ON' : 'OFF'} (C)</span>
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-slate-400 hover:text-white transition-all border border-slate-800 shadow-lg backdrop-blur-md opacity-40 hover:opacity-100"
          title="전체화면 (F)"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Presentation Stage Canvas (Left / Center) */}
      <div className="flex-1 h-full flex items-center justify-center p-3.5 overflow-hidden">
        <div className="w-full h-full max-w-[1920px] max-h-[1080px] flex items-center justify-center">
          <StageCanvas
            publicState={publicState}
            snapshotStats={snapshotStats}
            matePairs={matePairs}
            capsules={capsules}
            draws={draws}
            songUrl="/audio/vitamin_song.mp3"
            showCheerToasts={false}
          />
        </div>
      </div>

      {/* Dedicated Live Communication Chat Sidebar (Right) */}
      <LiveFeedSidebar
        eventId={eventId}
        checkinCount={publicState.checkinCount}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}

export default function DisplayPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-white">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DisplayContent />
    </Suspense>
  );
}
