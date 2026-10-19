'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageSquare, BookOpen, Eye, Award, Sparkles, Clock, CheckCircle } from 'lucide-react';

interface JourneySegmentProps {
  stats: {
    totalUsers: number;
    totalPraises: number;
    weeklyPraises: number;
    totalNotes: number;
    wallViews: number;
    teamStats: Record<string, { praiseGiven: number; praiseReceived: number; userCount: number }>;
    keywords: string[];
    approvedQuotes: Array<{ id: string; content: string; team?: string }>;
    cutoffAt?: string;
  } | null;
}

export default function JourneySegment({ stats }: JourneySegmentProps) {
  const fallbackStats = {
    totalUsers: 24,
    totalPraises: 39,
    weeklyPraises: 12,
    totalNotes: 3,
    wallViews: 118,
    teamStats: {
      '전략사업개발팀': { praiseGiven: 18, praiseReceived: 16, userCount: 11 },
      'Global사업개발팀': { praiseGiven: 12, praiseReceived: 14, userCount: 5 },
      'AX 사업개발팀': { praiseGiven: 9, praiseReceived: 9, userCount: 8 }
    },
    keywords: ['협업과 배려', '신뢰와 책임', '문제해결', '전문성', '긍정에너지', '팀워크', '열정'],
    approvedQuotes: [
      { id: '1', content: '복잡한 이슈 속에서도 항상 침착하고 긍정적인 태도로 해결책을 이끌어 주셔서 큰 귀감이 되었습니다.', team: 'AX 사업개발팀' },
      { id: '2', content: '다른 팀의 긴급한 지원 요청에도 두 팔 걷고 나서주시는 배려에 깊은 감동을 받았습니다.', team: '전략사업개발팀' },
      { id: '3', content: '보이지 않는 곳에서도 프로젝트의 기초를 묵묵히 다져주시는 노고에 언제나 감사드립니다.', team: 'Global사업개발팀' }
    ],
    cutoffAt: '2026-10-27 23:59:59 (KST)'
  };

  const currentStats = stats || fallbackStats;

  return (
    <div className="w-full h-full flex flex-col justify-between p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white relative overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div>
          <span className="text-xs font-bold tracking-widest text-sky-400 uppercase">Segment 2</span>
          <h2 className="text-2xl font-black text-white">Vitamin Journey (2026.09 ~ 2026.10)</h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span>공식 마감: 2026-10-27 23:59:59 KST</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="my-auto grid grid-cols-12 gap-6 z-10">
        {/* Left Column: Big Numbers */}
        <div className="col-span-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl"
            >
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center mb-2">
                <Heart className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-400">누적 칭찬 메시지</div>
              <div className="text-3xl font-black text-white mt-0.5">{currentStats.totalPraises}건</div>
              <div className="text-[11px] text-pink-400/80 mt-1">최근 7일: {currentStats.weeklyPraises}건</div>
            </motion.div>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center mb-2">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-400">비공개 관찰 메모</div>
              <div className="text-3xl font-black text-white mt-0.5">{currentStats.totalNotes}건</div>
              <div className="text-[11px] text-sky-400/80 mt-1">따뜻한 시선 기록</div>
            </motion.div>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2">
                <Eye className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-400">칭찬의 벽 조회수</div>
              <div className="text-3xl font-black text-white mt-0.5">{currentStats.wallViews}회</div>
              <div className="text-[11px] text-amber-400/80 mt-1">익명 열람 및 공감</div>
            </motion.div>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
                <Award className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-400">전체 참여 구성원</div>
              <div className="text-3xl font-black text-white mt-0.5">{currentStats.totalUsers}명</div>
              <div className="text-[11px] text-emerald-400/80 mt-1">100% 교차 매칭 배정</div>
            </motion.div>
          </div>

          {/* Keywords Cloud */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>동료들이 가장 많이 언급한 긍정 키워드</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(currentStats.keywords || []).map((kw, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/15 border border-indigo-400/30 text-indigo-300"
                >
                  #{kw}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Curated Highlights & Team Harmony */}
        <div className="col-span-7 flex flex-col gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                <span>승인된 익명 칭찬 하이라이트</span>
              </span>
              <span className="text-[11px] text-slate-500">익명성 철저 보장</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {(currentStats.approvedQuotes || []).slice(0, 3).map((q, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800/80 flex items-start gap-3"
                >
                  <span className="text-lg">💬</span>
                  <div className="flex-1">
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      “{q.content}”
                    </p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      수신 부서: {q.team || 'HT사업본부'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Participation Harmony */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs font-bold text-slate-300 mb-2">팀별 상호 격려 현황 (Praise Flow)</div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(currentStats.teamStats || {}).map(([team, info]) => (
                <div key={team} className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-center">
                  <div className="text-[11px] font-bold text-slate-300 truncate">{team}</div>
                  <div className="text-xs text-slate-400 mt-1">인원 {info.userCount}명</div>
                  <div className="text-[11px] text-sky-400 font-semibold mt-0.5">
                    전달 {info.praiseGiven} / 수신 {info.praiseReceived}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="z-10 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-3">
        <span>* 개인 순위나 저조한 참여자는 일체 집계하지 않으며, 전사 긍정 데이터만을 기반으로 산출되었습니다.</span>
        <span>HT사업본부 운영위원회</span>
      </div>
    </div>
  );
}
