'use client';

import React, { useState, useEffect } from 'react';
import MobileLayout from '@/components/MobileLayout';
import { User, PraiseMessage } from '@/lib/types';
import { getCurrentUser, getMatesForUser, getPraises, getIsRevealActive } from '@/lib/db';
import { fetchAITimeCapsule } from '@/lib/aiService';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Gift, Heart, Award, ArrowLeft, Lock, Star, MessageCircle } from 'lucide-react';

export default function RevealPage() {
  const [currentUser, setUserState] = useState<User | null>(null);
  const [isRevealActive, setIsRevealActive] = useState<boolean>(false);
  const [myMates, setMyMates] = useState<User[]>([]);
  const [receivedPraises, setReceivedPraises] = useState<PraiseMessage[]>([]);
  const [timeCapsule, setTimeCapsule] = useState<{ letter: string; keywords: string[] } | null>(null);
  const [isLoadingCapsule, setIsLoadingCapsule] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      const user = await getCurrentUser();
      setUserState(user);

      const reveal = await getIsRevealActive();
      setIsRevealActive(reveal);

      if (user) {
        // Fetch assigned mates
        const mates = await getMatesForUser(user.id);
        setMyMates(mates);

        // Fetch received praises
        const allPraises = await getPraises();
        const myReceived = allPraises.filter(p => p.recipientUserId === user.id);
        setReceivedPraises(myReceived);

        // Generate Time Capsule
        if (reveal) {
          setIsLoadingCapsule(true);
          const capsule = await fetchAITimeCapsule(
            user.name,
            myReceived.map(p => p.refinedContent || p.content)
          );
          setTimeCapsule(capsule);
          setIsLoadingCapsule(false);

          // Fire celebratory confetti!
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 }
            });
          } catch (e) {}
        }
      }
    }
    loadData();
  }, []);

  if (!currentUser) {
    return (
      <MobileLayout>
        <div className="p-6 text-center text-slate-500">
          참여코드를 입력해 로그인해 주세요.
        </div>
      </MobileLayout>
    );
  }

  if (!isRevealActive) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 gap-4">
          <div className="w-20 h-20 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shadow-inner">
            <Lock className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Reveal Day 준비 중입니다 🎁
          </h2>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            HT사업본부 AI Vitamin Program 운영이 완료된 후, 나를 관심 깊게 지켜봐 준 Mystery Mate와 AI Time Capsule 편지가 여기서 공개됩니다!
          </p>
          <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 text-[11px] text-purple-700 font-bold mt-2">
            관리자가 Reveal을 실행하면 즉시 열람 가능합니다.
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="flex flex-col gap-6 pb-6">
        {/* Top Banner */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-6 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-500 text-white text-center shadow-float relative overflow-hidden flex flex-col items-center gap-2"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-sm mb-1">
            🎁
          </div>
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-[11px] font-black rounded-full uppercase tracking-wider text-purple-100">
            Reveal Day
          </span>
          <h2 className="text-2xl font-black tracking-tight">
            Reveal Day에 오신 것을 축하합니다!
          </h2>
          <p className="text-xs text-purple-100 max-w-xs leading-relaxed font-medium">
            그동안 서로의 좋은 점을 발견해 주셔서 감사합니다.
          </p>
        </motion.div>

        {/* Section 1: 내가 응원했던 Mystery Mate */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
            <Gift className="w-4 h-4 text-purple-600" />
            내가 응원했던 Mystery Mate
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {myMates.map((mate) => (
              <div
                key={mate.id}
                className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col items-center text-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-2xl">
                  {mate.avatar || '👤'}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">{mate.name}님</h4>
                  <span className="text-[10px] text-slate-400 font-medium">{mate.team}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: 나에게 가장 많이 남겨진 키워드 */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-blue-600" />
            나에게 가장 많이 남겨진 키워드
          </h3>

          <div className="flex flex-wrap gap-2 p-4 bg-white rounded-3xl border border-slate-100 shadow-xs">
            {(timeCapsule?.keywords || ['협업', '배려', '책임감', '전문성', '긍정에너지']).map((kw, i) => (
              <span
                key={i}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-2xs ${
                  i === 0 ? 'bg-blue-600 text-white' :
                  i === 1 ? 'bg-purple-600 text-white' :
                  i === 2 ? 'bg-sky-500 text-white' :
                  i === 3 ? 'bg-indigo-500 text-white' : 'bg-pink-500 text-white'
                }`}
              >
                #{kw}
              </span>
            ))}
          </div>
        </div>

        {/* Section 3: AI Time Capsule Letter */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-300" />
            AI Time Capsule 개인 헌정 편지
          </h3>

          <div className="p-6 rounded-3xl gradient-hero border border-sky-200/90 shadow-card flex flex-col gap-4 relative overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💌</span>
              <span className="text-xs font-black text-slate-800">
                {currentUser.name}님을 위한 감사 편지
              </span>
            </div>

            {isLoadingCapsule ? (
              <div className="p-6 text-center text-xs text-slate-500">
                AI가 수집된 칭찬을 분석해 편지를 작성하고 있습니다...
              </div>
            ) : (
              <p className="text-xs font-bold text-slate-800 leading-relaxed bg-white/90 p-4 rounded-2xl border border-sky-100 shadow-xs">
                {timeCapsule?.letter}
              </p>
            )}
          </div>
        </div>

        {/* Section 4: 나에게 도착한 칭찬 메시지 리스트 */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-pink-500 fill-pink-300" />
            나에게 도착한 칭찬 메시지 ({receivedPraises.length}개)
          </h3>

          <div className="flex flex-col gap-2.5">
            {receivedPraises.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-2xl text-xs text-slate-400 border border-slate-100">
                아직 도착한 칭찬 메시지가 없습니다.
              </div>
            ) : (
              receivedPraises.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col gap-1.5"
                >
                  <p className="text-xs font-bold text-slate-800 leading-relaxed">
                    &ldquo;{p.refinedContent || p.content}&rdquo;
                  </p>
                  <span className="text-[10px] text-purple-600 font-bold self-end bg-purple-50 px-2 py-0.5 rounded-full">
                    ❤️ {p.likes}개 공감받음
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
