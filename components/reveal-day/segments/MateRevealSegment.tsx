'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Lock, Sparkles, UserCheck, ShieldCheck, Heart } from 'lucide-react';
import { MatePairReveal, ReactionCounts } from '@/lib/reveal-day/types';

interface MateRevealSegmentProps {
  pairs: MatePairReveal[];
  currentRevealIndex: number;
  currentBatchIndex: number;
  reactionCounts?: ReactionCounts;
}

export default function MateRevealSegment({
  pairs,
  currentRevealIndex,
  currentBatchIndex,
  reactionCounts
}: MateRevealSegmentProps) {
  // Filter pairs for current batch (8 relations per batch)
  const currentBatchPairs = pairs.filter(p => p.batchIndex === currentBatchIndex);

  // Group current batch pairs by target user
  const groupedByTarget = new Map<string, { targetName: string; targetTeam: string; observers: MatePairReveal[] }>();
  currentBatchPairs.forEach(p => {
    if (!groupedByTarget.has(p.targetId)) {
      groupedByTarget.set(p.targetId, {
        targetName: p.targetName,
        targetTeam: p.targetTeam,
        observers: []
      });
    }
    groupedByTarget.get(p.targetId)!.observers.push(p);
  });

  const targets = Array.from(groupedByTarget.entries());

  return (
    <div className="w-full h-full flex flex-col justify-between p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white relative overflow-hidden select-none">
      {/* Floating Reaction Emojis Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {reactionCounts && reactionCounts.heart > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: [0, 0.8, 0], y: -300 }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeOut' }}
            className="absolute bottom-10 right-20 text-4xl"
          >
            ❤️
          </motion.div>
        )}
        {reactionCounts && reactionCounts.clap > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: [0, 0.8, 0], y: -350 }}
            transition={{ repeat: Infinity, duration: 3.5, delay: 1, ease: 'easeOut' }}
            className="absolute bottom-10 right-48 text-4xl"
          >
            👏
          </motion.div>
        )}
        {reactionCounts && reactionCounts.party > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: [0, 0.8, 0], y: -320 }}
            transition={{ repeat: Infinity, duration: 4.5, delay: 0.5, ease: 'easeOut' }}
            className="absolute bottom-10 left-32 text-4xl"
          >
            🎉
          </motion.div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div>
          <span className="text-xs font-bold tracking-widest text-sky-400 uppercase">Segment 3</span>
          <h2 className="text-2xl font-black text-white">Mystery Mate Reveal</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-xs font-bold text-indigo-300">
            Batch {currentBatchIndex + 1} / 6
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            공개 현황: <span className="text-sky-400 font-bold">{currentRevealIndex}</span> / {pairs.length}건
          </div>
        </div>
      </div>

      {/* Main Grid: 4 Targets per Batch */}
      <div className="my-auto grid grid-cols-4 gap-5 z-10">
        {targets.map(([targetId, info], targetIdx) => (
          <motion.div
            key={targetId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: targetIdx * 0.1 }}
            className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl flex flex-col justify-between"
          >
            {/* Target Card Header */}
            <div className="text-center pb-4 border-b border-slate-800">
              <span className="text-[11px] font-bold text-sky-400 tracking-wider block mb-1">
                {info.targetTeam}
              </span>
              <h3 className="text-2xl font-black text-white flex items-center justify-center gap-1.5">
                <span>{info.targetName}</span>
                <span className="text-sm font-medium text-slate-400">님</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">나를 관찰한 2명의 비타민은?</p>
            </div>

            {/* Two Observers Cards */}
            <div className="flex flex-col gap-3 my-4">
              {info.observers.map((observer, obsIdx) => {
                const isRevealed = observer.isRevealed;

                return (
                  <div
                    key={observer.id}
                    className={`p-3.5 rounded-2xl transition-all duration-500 border ${
                      isRevealed
                        ? 'bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-purple-500/20 border-sky-400/50 shadow-lg shadow-sky-500/10'
                        : 'bg-slate-800/40 border-slate-700/50 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">
                        Mystery Mate #{obsIdx + 1}
                      </span>
                      {isRevealed ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <UserCheck className="w-3 h-3" />
                          <span>공개 완료</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Lock className="w-3 h-3" />
                          <span>비공개</span>
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition-all ${
                          isRevealed
                            ? 'bg-gradient-to-tr from-sky-400 to-indigo-600 text-white shadow-md'
                            : 'bg-slate-700/60 text-slate-400'
                        }`}
                      >
                        {isRevealed ? '✨' : '?'}
                      </div>
                      <div>
                        {isRevealed ? (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.4 }}
                          >
                            <div className="text-base font-black text-white">
                              {observer.observerName} 님
                            </div>
                            <div className="text-[11px] text-sky-300 font-medium">
                              {observer.observerTeam}
                            </div>
                          </motion.div>
                        ) : (
                          <div>
                            <div className="text-sm font-bold text-slate-400 tracking-wider">
                              ??? 님
                            </div>
                            <div className="text-[11px] text-slate-600">
                              비공개 메이트
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Target Card Footer */}
            <div className="pt-2 text-center text-[10px] text-slate-500">
              HT사업본부 크로스팀 매칭
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Control Hint */}
      <div className="z-10 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-3">
        <span>* 관리자 콘솔에서 1단계씩 확인 후 안전하게 공개가 진행됩니다.</span>
        <span>Space: 다음 메이트 공개 | ➡️: 다음 배치</span>
      </div>
    </div>
  );
}
