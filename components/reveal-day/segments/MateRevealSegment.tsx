'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Lock, Sparkles, UserCheck, ShieldCheck, Heart } from 'lucide-react';
import { MatePairReveal, ReactionCounts } from '@/lib/reveal-day/types';
import { getUserTitle } from '@/lib/reveal-day/titles';

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
  // Comma/bullet separated names of targets currently being revealed in this batch
  const currentTargetNames = targets.map(([_, info]) => `${info.targetName} 님`).join(' · ');

  return (
    <div className="w-full h-full flex flex-col justify-between px-6 py-4 2xl:px-10 2xl:py-6 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white relative overflow-hidden select-none">
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

      {/* Header: Show whose mate is being revealed in this batch */}
      <div className="flex items-center justify-between z-10 shrink-0 mb-2 2xl:mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-widest text-sky-400 uppercase">Segment 3</span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 font-bold">
              비타민 메이트 매칭 공개
            </span>
          </div>
          <h2 className="text-xl 2xl:text-2xl font-black text-white flex items-center gap-2">
            <span className="text-white drop-shadow">{currentTargetNames || '참여 구성원'}</span>
            <span className="text-sky-300 font-semibold text-lg 2xl:text-xl">의 메이트 공개</span>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 2xl:px-3.5 2xl:py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-[11px] 2xl:text-xs font-bold text-indigo-300">
            진행 그룹 {currentBatchIndex + 1} / {pairs.length > 0 ? Math.max(...pairs.map(p => p.batchIndex)) + 1 : 6}
          </div>
          <div className="px-3 py-1 2xl:px-3.5 2xl:py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] 2xl:text-xs text-slate-300">
            공개 현황: <span className="text-sky-400 font-bold">{currentRevealIndex}</span> / {pairs.length}건
          </div>
        </div>
      </div>

      {/* Main Grid: 4 Targets per Batch (Flex-1 with auto scroll protection) */}
      <div className="my-auto grid grid-cols-4 gap-3 2xl:gap-5 z-10 flex-1 min-h-0">
        {targets.map(([targetId, info], targetIdx) => (
          <motion.div
            key={targetId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: targetIdx * 0.1 }}
            className="p-3 2xl:p-4 rounded-2xl 2xl:rounded-3xl bg-slate-900/85 border border-slate-800 shadow-2xl flex flex-col justify-between h-full min-h-0 overflow-hidden"
          >
            {/* Target Card Header */}
            <div className="text-center pb-2 2xl:pb-2.5 border-b border-slate-800 shrink-0">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <span className="text-[10px] 2xl:text-[11px] font-bold text-sky-400 tracking-wider">
                  {info.targetTeam}
                </span>
                {(info.observers[0]?.isTargetCheckedIn ?? true) && (
                  <span className="text-[8.5px] 2xl:text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                    체크인 완료
                  </span>
                )}
              </div>
              <h3 className="text-lg 2xl:text-2xl font-black text-white flex items-center justify-center gap-1.5">
                <span>{info.targetName}</span>
                <span className="text-[10px] 2xl:text-xs font-bold text-sky-300 bg-sky-950/80 border border-sky-400/30 px-2 py-0.2 rounded-full">
                  {getUserTitle(info.targetName)}
                </span>
              </h3>
              <p className="text-[10px] 2xl:text-[11.5px] text-sky-300/90 font-bold mt-0.5">
                나를 지켜봐 준 비밀 메이트는 누구?
              </p>
            </div>

            {/* Observers Cards (Flex-1 with scrollbar protection so long text never overflows) */}
            {info.observers.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-800/20 border border-dashed border-slate-700/50 text-center my-2 flex flex-col items-center justify-center flex-1">
                <Sparkles className="w-5 h-5 text-sky-400/60 mb-1.5" />
                <span className="text-xs text-slate-300 font-bold">전체 비타민 파트너</span>
                <span className="text-[10px] text-slate-500 mt-0.5">자유 칭찬 및 타임캡슐 연결 완료</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 2xl:gap-2.5 my-1.5 2xl:my-2 flex-1 min-h-0 overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-slate-700/60">
                {info.observers.map((observer, obsIdx) => {
                  const isRevealed = observer.isRevealed;

                  return (
                    <div
                      key={observer.id}
                      className={`p-2.5 2xl:p-3 rounded-xl 2xl:rounded-2xl transition-all duration-500 border shrink-0 ${
                        isRevealed
                          ? observer.isGuessedCorrectly
                            ? 'bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/25 border-amber-400 shadow-xl shadow-amber-500/20 ring-1 ring-amber-400/60'
                            : 'bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-purple-500/20 border-sky-400/50 shadow-lg shadow-sky-500/10'
                          : 'bg-slate-800/40 border-slate-700/50 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] 2xl:text-[10px] font-bold text-slate-400">
                          {info.targetName} 님의 비밀 메이트 #{obsIdx + 1}
                        </span>
                        {isRevealed ? (
                          <div className="flex items-center gap-1.5">
                            {observer.isGuessedCorrectly && (
                              <span className="flex items-center gap-0.5 text-[9px] 2xl:text-[10px] font-black text-amber-950 bg-gradient-to-r from-amber-300 to-yellow-400 px-2 py-0.2 rounded-full animate-pulse shadow-md">
                                <span>🎯</span>
                                <span>추측 적중!</span>
                              </span>
                            )}
                            <span className="flex items-center gap-0.5 text-[9px] 2xl:text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/20">
                              <UserCheck className="w-2.5 h-2.5 2xl:w-3 2xl:h-3" />
                              <span>공개</span>
                            </span>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-[9.5px] 2xl:text-[10px] text-slate-500">
                            <Lock className="w-2.5 h-2.5 2xl:w-3 2xl:h-3" />
                            <span>비공개</span>
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 2xl:w-9 2xl:h-9 rounded-lg 2xl:rounded-xl flex items-center justify-center text-sm 2xl:text-base font-bold transition-all shrink-0 ${
                            isRevealed
                              ? observer.isGuessedCorrectly
                                ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/30'
                                : 'bg-gradient-to-tr from-sky-400 to-indigo-600 text-white shadow-sm'
                              : 'bg-slate-700/60 text-slate-400'
                          }`}
                        >
                          {isRevealed ? (observer.isGuessedCorrectly ? '🎯' : '✨') : '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          {isRevealed ? (
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.4 }}
                            >
                              <div className="text-sm 2xl:text-base font-black text-white flex items-center gap-1.5 truncate">
                                <span>{observer.observerName}</span>
                                <span className="text-[9.5px] 2xl:text-[10.5px] font-bold text-amber-300 bg-amber-950/70 border border-amber-400/30 px-1.5 py-0.2 rounded-md">
                                  {getUserTitle(observer.observerName)}
                                </span>
                              </div>
                              <div className="text-[10px] 2xl:text-[11px] text-sky-300 font-medium truncate">
                                {observer.observerTeam}
                              </div>
                              {observer.isGuessedCorrectly && (
                                <div className="mt-0.5 inline-flex items-center gap-1 text-[8.5px] 2xl:text-[9.5px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-1.5 py-0.2 rounded-md">
                                  <span>🎯</span>
                                  <span>추측 적중!</span>
                                </div>
                              )}
                            </motion.div>
                          ) : (
                            <div>
                              <div className="text-xs 2xl:text-sm font-bold text-slate-400 tracking-wider">
                                ??? 님
                              </div>
                              <div className="text-[10px] 2xl:text-[11px] text-slate-500">
                                누가 나를 챙겨줬을까요?
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Case 1: Observation Note (Highest Priority) */}
                      {isRevealed && observer.noteMessage && (
                        <div className="mt-1.5 2xl:mt-2 p-2 2xl:p-2.5 rounded-xl bg-gradient-to-r from-sky-500/15 via-slate-900/95 to-slate-900/95 border border-sky-400/40 border-l-3 2xl:border-l-4 border-l-sky-400 text-xs shadow-md">
                          <div className="flex items-center justify-between text-[9px] 2xl:text-[10px] text-sky-300 font-bold mb-0.5">
                            <div className="flex items-center gap-1 truncate">
                              <Sparkles className="w-3 h-3 text-sky-400 shrink-0" />
                              <span className="tracking-wide truncate">{observer.observerName} 메이트의 최신 관찰 메모</span>
                            </div>
                            {observer.noteMessage.length > 50 && (
                              <span className="text-[8px] 2xl:text-[8.5px] text-sky-400/80 font-normal shrink-0 ml-1">스크롤</span>
                            )}
                          </div>
                          <div className="max-h-16 2xl:max-h-24 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-sky-500/40 scrollbar-track-transparent">
                            <p className={`italic ${observer.noteMessage.length > 70 ? 'text-[9.5px] 2xl:text-[10.5px]' : 'text-[10px] 2xl:text-[11.5px]'} leading-relaxed text-slate-100 whitespace-pre-line break-words`}>
                              &ldquo;{observer.noteMessage}&rdquo;
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Case 2: Praise Message Fallback (when Observation Note is absent) */}
                      {isRevealed && !observer.noteMessage && observer.praiseMessage && (
                        <div className="mt-1.5 2xl:mt-2 p-2 2xl:p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-slate-900/95 to-slate-900/95 border border-amber-400/40 border-l-3 2xl:border-l-4 border-l-amber-400 text-xs shadow-md">
                          <div className="flex items-center justify-between text-[9px] 2xl:text-[10px] text-amber-300 font-bold mb-0.5">
                            <div className="flex items-center gap-1 truncate">
                              <Heart className="w-3 h-3 text-rose-400 fill-rose-400 shrink-0" />
                              <span className="tracking-wide truncate">{observer.observerName} 메이트가 전한 칭찬 메시지</span>
                            </div>
                            {observer.praiseMessage.length > 50 && (
                              <span className="text-[8px] 2xl:text-[8.5px] text-amber-400/80 font-normal shrink-0 ml-1">스크롤</span>
                            )}
                          </div>
                          <div className="max-h-16 2xl:max-h-24 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-amber-500/40 scrollbar-track-transparent">
                            <p className={`italic ${observer.praiseMessage.length > 70 ? 'text-[9.5px] 2xl:text-[10.5px]' : 'text-[10px] 2xl:text-[11.5px]'} leading-relaxed text-slate-100 whitespace-pre-line break-words`}>
                              &ldquo;{observer.praiseMessage}&rdquo;
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Case 3: Gentle default fallback if both note and praise are absent */}
                      {isRevealed && !observer.noteMessage && !observer.praiseMessage && (
                        <div className="mt-1.5 2xl:mt-2 p-1.5 2xl:p-2 rounded-xl bg-slate-900/60 border border-slate-700/50 text-[9.5px] 2xl:text-[10.5px] text-slate-400 italic text-center">
                          &ldquo;{observer.observerName} 메이트가 보이지 않는 곳에서 항상 응원하고 있었습니다! ✨&rdquo;
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Target Card Footer */}
            <div className="pt-1 2xl:pt-1.5 text-center text-[9px] 2xl:text-[10px] text-slate-500 shrink-0">
              HT사업본부 크로스팀 매칭
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Control Hint */}
      <div className="z-10 flex items-center justify-between text-[10px] 2xl:text-xs text-slate-500 border-t border-slate-800/80 pt-2 2xl:pt-2.5 shrink-0">
        <span>* 관리자 콘솔에서 1단계씩 확인 후 안전하게 공개가 진행됩니다.</span>
        <span>Space: 다음 메이트 공개 | ➡️: 다음 배치</span>
      </div>
    </div>
  );
}
