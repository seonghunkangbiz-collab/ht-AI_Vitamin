'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RevealSegment, RevealPublicState, MatePairReveal, RevealTimeCapsuleItem, RevealDrawItem } from '@/lib/reveal-day/types';
import OpeningSegment from './segments/OpeningSegment';
import JourneySegment from './segments/JourneySegment';
import MateRevealSegment from './segments/MateRevealSegment';
import TimeCapsuleSegment from './segments/TimeCapsuleSegment';
import LuckyDrawSegment from './segments/LuckyDrawSegment';
import SongSegment from './segments/SongSegment';
import ClosingSegment from './segments/ClosingSegment';
import PizzaPartySongSegment from './segments/PizzaPartySongSegment';
import CheerOverlay from './CheerOverlay';
import { AlertTriangle, Clock } from 'lucide-react';

interface StageCanvasProps {
  publicState: RevealPublicState;
  snapshotStats?: any;
  matePairs?: MatePairReveal[];
  capsules?: RevealTimeCapsuleItem[];
  draws?: RevealDrawItem[];
  songUrl?: string;
  showCheerToasts?: boolean;
  onNavigateCapsule?: (newIndex: number) => void;
  hideControls?: boolean;
}

export default function StageCanvas({
  publicState,
  snapshotStats,
  matePairs = [],
  capsules = [],
  draws = [],
  songUrl,
  showCheerToasts = false,
  onNavigateCapsule,
  hideControls = false
}: StageCanvasProps) {
  const { currentSegment, isBlackout, isHolding, mode, checkinCount, reactionCounts } = publicState;

  // 1. Instant Blackout (B key)
  if (isBlackout) {
    return (
      <div className="w-full h-full aspect-video bg-black flex items-center justify-center select-none shadow-2xl overflow-hidden rounded-2xl">
        <span className="text-zinc-900 text-xs font-mono">BLACKOUT</span>
      </div>
    );
  }

  // 2. Standby / Holding Screen (H key)
  if (isHolding) {
    return (
      <div className="w-full h-full aspect-video bg-slate-950 flex flex-col items-center justify-center p-12 text-white select-none shadow-2xl overflow-hidden rounded-2xl border border-slate-800">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-3xl mb-4"
        >
          <Clock className="w-8 h-8" />
        </motion.div>
        <h2 className="text-3xl font-black text-white">잠시만 기다려 주세요</h2>
        <p className="text-sm text-slate-400 mt-2 font-medium">행사 무대 준비 중입니다. 잠시 후 재개됩니다.</p>
        <div className="mt-6 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-500">
          HT사업본부 AI Vitamin Program – Reveal Day
        </div>
      </div>
    );
  }

  // 3. 16:9 Presentation Stage
  return (
    <div className="w-full h-full aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSegment}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full h-full"
        >
          {currentSegment === 'opening' && (
            <OpeningSegment
              checkinCount={checkinCount}
              totalAttendees={24}
              mode={mode}
            />
          )}

          {currentSegment === 'journey' && (
            <JourneySegment stats={snapshotStats} />
          )}

          {currentSegment === 'mate_reveal' && (
            <MateRevealSegment
              pairs={matePairs}
              currentRevealIndex={publicState.currentRevealIndex}
              currentBatchIndex={publicState.currentBatchIndex}
              reactionCounts={reactionCounts}
            />
          )}

          {currentSegment === 'time_capsule' && (
            <TimeCapsuleSegment
              capsules={capsules}
              currentIndex={publicState.currentCapsuleIndex ?? 0}
              onNavigate={onNavigateCapsule}
              hideControls={hideControls}
            />
          )}

          {currentSegment === 'lucky_draw' && (
            <LuckyDrawSegment
              draws={draws}
              totalEligible={26}
            />
          )}

          {(currentSegment === 'song' || currentSegment === 'pizza_party' || currentSegment === 'ended') && (
            <PizzaPartySongSegment
              eventId={publicState.eventId}
              initialSeconds={publicState.pizzaTimerSeconds ?? 50 * 60}
              isPausedInitial={publicState.isPizzaTimerPaused ?? false}
            />
          )}

          {currentSegment === 'closing' && (
            <ClosingSegment />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Real-time Cheering Overlay (Floating Emojis & Optional Message Toasts) */}
      <CheerOverlay eventId={publicState.eventId} showToasts={showCheerToasts} />
    </div>
  );
}
