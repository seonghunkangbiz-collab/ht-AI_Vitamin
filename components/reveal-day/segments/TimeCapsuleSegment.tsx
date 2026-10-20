'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, ChevronLeft, ChevronRight, Award, Quote, CheckCircle } from 'lucide-react';
import { RevealTimeCapsuleItem } from '@/lib/reveal-day/types';

interface TimeCapsuleSegmentProps {
  capsules: RevealTimeCapsuleItem[];
  currentIndex?: number;
  onNavigate?: (newIndex: number) => void;
  hideControls?: boolean;
}

export default function TimeCapsuleSegment({ capsules, currentIndex, onNavigate, hideControls }: TimeCapsuleSegmentProps) {
  const spotlightCapsules = useMemo(() => {
    const approved = capsules.filter(c => c.approvalStatus === 'approved');
    return approved.length > 0 ? approved : capsules;
  }, [capsules]);

  const [localIndex, setLocalIndex] = useState(0);
  const activeIndex = typeof currentIndex === 'number' 
    ? (spotlightCapsules.length > 0 ? currentIndex % spotlightCapsules.length : 0)
    : localIndex;

  const activeCapsule = spotlightCapsules[activeIndex] || null;

  const handlePrev = () => {
    const prevIdx = activeIndex === 0 ? spotlightCapsules.length - 1 : activeIndex - 1;
    if (typeof currentIndex !== 'number') {
      setLocalIndex(prevIdx);
    }
    if (onNavigate) onNavigate(prevIdx);
  };

  const handleNext = () => {
    const nextIdx = activeIndex === spotlightCapsules.length - 1 ? 0 : activeIndex + 1;
    if (typeof currentIndex !== 'number') {
      setLocalIndex(nextIdx);
    }
    if (onNavigate) onNavigate(nextIdx);
  };

  if (!activeCapsule) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">승인된 타임캡슐이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-between p-10 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white relative overflow-hidden select-none">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div>
          <span className="text-xs font-bold tracking-widest text-sky-400 uppercase">Segment 4</span>
          <h2 className="text-2xl font-black text-white">AI Time Capsule Spotlight</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono font-bold">
            {activeIndex + 1} / {spotlightCapsules.length}
          </span>
          {!hideControls && (
            <div className="flex gap-1.5">
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                title="이전 타임캡슐"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                title="다음 타임캡슐"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Spotlight Card */}
      <div className="my-auto max-w-4xl mx-auto w-full z-10">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={activeCapsule.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="p-8 rounded-3xl bg-slate-900/90 border border-indigo-500/30 shadow-2xl backdrop-blur-md relative"
          >
            {/* Top Badge & Member Info */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-sky-500/20">
                  ✨
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-white">{activeCapsule.recipientName} 님</h3>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle className="w-3 h-3" />
                      <span>검수 승인 완료</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{activeCapsule.recipientTeam}</p>
                </div>
              </div>

              {/* Keywords */}
              <div className="flex flex-wrap gap-1.5 max-w-sm justify-end">
                {activeCapsule.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Analysis Quote */}
            <div className="my-6 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 flex items-start gap-3">
              <Quote className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-indigo-200 leading-relaxed">
                {activeCapsule.analysis}
              </p>
            </div>

            {/* AI Letter Body */}
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Vitamin Letter</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                {activeCapsule.letter}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="z-10 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-3">
        <span>* 참석자 모바일 (/live)에서 본인 전용 타임캡슐을 직접 열람할 수 있습니다.</span>
        <span>Space: 다음 스포트라이트 | ⬅️/➡️: 이전/다음 캡슐</span>
      </div>
    </div>
  );
}
