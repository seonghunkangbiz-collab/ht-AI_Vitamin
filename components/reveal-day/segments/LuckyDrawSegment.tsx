'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Award, Sparkles, Trophy, CheckCircle, ShieldCheck } from 'lucide-react';
import { RevealDrawItem } from '@/lib/reveal-day/types';

interface LuckyDrawSegmentProps {
  draws: RevealDrawItem[];
  activeDraw?: RevealDrawItem | null;
  isDrawing?: boolean;
  totalEligible: number;
}

export default function LuckyDrawSegment({
  draws,
  activeDraw,
  isDrawing,
  totalEligible
}: LuckyDrawSegmentProps) {
  const validDraws = draws.filter(d => !d.isVoided);
  const latestWinner = activeDraw || (validDraws.length > 0 ? validDraws[validDraws.length - 1] : null);

  return (
    <div className="w-full h-full flex flex-col justify-between p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 text-white relative overflow-hidden select-none">
      {/* Background celebration glow */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div>
          <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">Segment 5</span>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <span>AI Lucky Draw</span>
            <Trophy className="w-6 h-6 text-amber-400" />
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Node CSPRNG 검증 난수 엔진</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-xs font-bold text-amber-300">
            추첨 풀: {totalEligible}명
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="my-auto grid grid-cols-12 gap-8 items-center z-10">
        {/* Left Area: Big Winner Card or Roulette State */}
        <div className="col-span-8 flex flex-col items-center justify-center">
          {isDrawing ? (
            <motion.div
              animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="p-12 rounded-3xl bg-slate-900/90 border border-amber-500/40 shadow-2xl flex flex-col items-center text-center max-w-lg w-full"
            >
              <div className="w-20 h-20 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-4xl mb-4 animate-bounce">
                🎲
              </div>
              <h3 className="text-2xl font-black text-white">행운의 주인공을 추첨 중입니다...</h3>
              <p className="text-xs text-amber-300/80 mt-2 font-mono">
                CSPRNG Server Entropy Generating...
              </p>
            </motion.div>
          ) : latestWinner ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="p-10 rounded-3xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-amber-400/40 shadow-2xl flex flex-col items-center text-center max-w-xl w-full relative"
            >
              <div className="absolute -top-6 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black shadow-lg">
                🎉 ROUND {latestWinner.roundNumber} 당첨자 확정 🎉
              </div>

              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-600 flex items-center justify-center text-5xl my-4 shadow-xl shadow-amber-500/20">
                👑
              </div>

              <span className="text-sm font-black text-amber-400 tracking-wider">
                {latestWinner.prizeName}
              </span>

              {/* Award category badge */}
              {latestWinner.prizeName.includes('베스트 칭찬상') && (
                <div className="mt-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <span>👏</span>
                  <span>칭찬을 가장 많이 받은 주인공!</span>
                </div>
              )}
              {latestWinner.prizeName.includes('베스트 칭찬러') && (
                <div className="mt-1.5 px-3.5 py-1 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <span>💌</span>
                  <span>따뜻한 칭찬을 가장 많이 전한 주인공!</span>
                </div>
              )}
              {latestWinner.prizeName.includes('행운상') && (
                <div className="mt-1.5 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <span>🍀</span>
                  <span>실시간 행운 난수 추첨 당첨!</span>
                </div>
              )}
              {(latestWinner.prizeName.includes('아이패드') || latestWinner.prizeName.includes('맥북')) && (
                <div className="mt-1.5 px-3.5 py-1 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <span>🧪</span>
                  <span>리허설 사전 테스트 추첨</span>
                </div>
              )}

              <div className="mt-3 flex items-baseline justify-center gap-2">
                <h2 className="text-4xl font-black text-white">{latestWinner.winnerName}</h2>
                <span className="text-lg font-bold text-slate-400">님</span>
              </div>

              <p className="text-sm font-semibold text-slate-300 mt-1">
                {latestWinner.winnerTeam}
              </p>

              <div className="mt-6 pt-4 border-t border-slate-800 w-full flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Pool: {latestWinner.poolSize}명</span>
                <span>Hash: {latestWinner.poolHash.substring(0, 12)}...</span>
                <span>Id: #{latestWinner.selectedIndex + 1}</span>
              </div>
            </motion.div>
          ) : (
            <div className="p-10 rounded-3xl bg-slate-900/60 border border-slate-800 text-center max-w-md">
              <Gift className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-300">추첨 대기 중</h3>
              <p className="text-xs text-slate-500 mt-1">
                운영자 콘솔에서 상품 라운드를 선택하고 [추첨 실행]을 누르세요.
              </p>
            </div>
          )}
        </div>

        {/* Right Area: List of Previous Round Winners */}
        <div className="col-span-4 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400">당첨자 명단 (Honor Roll)</span>
            <span className="text-xs text-amber-400 font-bold">{validDraws.length}명</span>
          </div>

          <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
            {validDraws.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-8">아직 당첨자가 없습니다.</p>
            ) : (
              validDraws.map((d, i) => (
                <div
                  key={d.id}
                  className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-black text-xs">
                      R{d.roundNumber}
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">{d.winnerName} 님</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{d.prizeName}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">{d.winnerTeam}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="z-10 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-3">
        <span>* 당첨 결과는 모든 참석자 모바일 (/live)에 실시간으로 동기화됩니다.</span>
        <span>운영자 콘솔에서 추첨 확정 및 무효(Void) 처리가 가능합니다.</span>
      </div>
    </div>
  );
}
