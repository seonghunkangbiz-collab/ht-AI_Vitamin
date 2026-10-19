'use client';

import React, { useState, useEffect } from 'react';
import StageCanvas from '@/components/reveal-day/StageCanvas';
import { useRevealDayRealtime } from '@/hooks/useRevealDayRealtime';
import { MatePairReveal, RevealTimeCapsuleItem, RevealDrawItem } from '@/lib/reveal-day/types';
import { Maximize2, Minimize2 } from 'lucide-react';

export default function DisplayPage() {
  const eventId = 'event-live-20261028';

  const [matePairs, setMatePairs] = useState<MatePairReveal[]>([]);
  const [capsules, setCapsules] = useState<RevealTimeCapsuleItem[]>([]);
  const [draws, setDraws] = useState<RevealDrawItem[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Subscribe to safe public state
  const { publicState, snapshotStats } = useRevealDayRealtime({ eventId });

  // Fetch only public revealed pairs and valid draws
  useEffect(() => {
    const fetchDisplayAssets = async () => {
      try {
        // Fetch revealed pairs only
        const matesRes = await fetch(`/api/reveal-day/public/mates?eventId=${eventId}`);
        if (matesRes.ok) {
          const data = await matesRes.json();
          if (data.revealedPairs) setMatePairs(data.revealedPairs);
        }

        // Fetch valid draws
        const drawsRes = await fetch(`/api/admin/reveal-day/draw?eventId=${eventId}`);
        if (drawsRes.ok) {
          const data = await drawsRes.json();
          if (data.draws) setDraws(data.draws.filter((d: any) => !d.isVoided));
        }

        // Fetch approved capsules
        const capsRes = await fetch(`/api/admin/reveal-day/capsules?eventId=${eventId}`);
        if (capsRes.ok) {
          const data = await capsRes.json();
          if (data.capsules) setCapsules(data.capsules.filter((c: any) => c.approvalStatus === 'approved'));
        }
      } catch {}
    };

    fetchDisplayAssets();
    const interval = setInterval(fetchDisplayAssets, 4000);
    return () => clearInterval(interval);
  }, [eventId]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  if (!publicState) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden relative select-none">
      {/* Discreet Fullscreen Button */}
      <button
        onClick={toggleFullscreen}
        className="absolute bottom-4 right-4 z-40 p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-white transition-all opacity-30 hover:opacity-100"
        title="전체화면"
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>

      {/* Presentation Stage Canvas */}
      <div className="w-full h-full max-w-[1920px] max-h-[1080px] flex items-center justify-center p-4">
        <StageCanvas
          publicState={publicState}
          snapshotStats={snapshotStats}
          matePairs={matePairs}
          capsules={capsules}
          draws={draws}
          songUrl="/audio/vitamin_song.mp3"
        />
      </div>
    </div>
  );
}
