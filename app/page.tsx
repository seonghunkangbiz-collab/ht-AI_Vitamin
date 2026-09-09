'use client';

import React, { useState, useEffect } from 'react';
import MobileLayout from '@/components/MobileLayout';
import Splash from '@/components/Splash';
import CodeLoginModal from '@/components/CodeLoginModal';
import SupabaseConfigError from '@/components/SupabaseConfigError';
import { User, PraiseMessage, AISuggestion, ActivityStats } from '@/lib/types';
import { 
  getCurrentUser, 
  setCurrentUser, 
  getPraises, 
  getMatesForUser,
  getAISuggestionsList,
  getActivityStats,
  getIsRevealActive
} from '@/lib/db';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Users, 
  Heart, 
  MessageSquare, 
  BookOpen, 
  RefreshCw, 
  Sparkles, 
  ChevronRight, 
  Smile, 
  Award,
  BarChart3
} from 'lucide-react';

const DEFAULT_SUGGESTIONS: string[] = [
  '이번 주에는 다른 팀 동료 한 명에게 "고마웠던 점" 한 가지를 이야기해보세요.',
  '다른 팀 동료와 커피 한잔 해보세요.',
  '회의에서 좋은 의견을 먼저 인정해 보세요.',
  '도움을 받았다면 짧게 감사해 보세요.',
  'Mystery Mate가 아니어도 좋은 점을 발견하면 응원해 보세요.',
  '점심시간에 평소 이야기하지 않았던 동료와 대화해 보세요.',
  '누군가의 장점을 발견하면 Vitamin Thanks를 남겨보세요.'
];

export default function HomePage() {
  const [currentUser, setUserState] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  
  const [suggestionsList, setSuggestionsList] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState<number>(0);
  const [recentPraises, setRecentPraises] = useState<PraiseMessage[]>([]);
  const [mateCount, setMateCount] = useState<number>(0);
  const [isRevealActive, setIsRevealActive] = useState<boolean>(false);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      const user = await getCurrentUser();
      setUserState(user);
      setIsInitializing(false);

      // Non-blocking parallel fetches
      getIsRevealActive().then(setIsRevealActive).catch(() => {});
      
      getAISuggestionsList().then(res => {
        if (res.suggestions && res.suggestions.length > 0) {
          setSuggestionsList(res.suggestions.map(s => s.content));
        }
      }).catch(() => {});

      getActivityStats().then(res => {
        if (res.stats) {
          setActivityStats(res.stats);
        }
      }).catch(() => {});

      if (user) {
        Promise.all([
          getMatesForUser(user.id),
          getPraises()
        ]).then(([matesRes, praisesRes]) => {
          if (matesRes.error === 'SUPABASE_UNCONFIGURED' || praisesRes.error === 'SUPABASE_UNCONFIGURED') {
            setConfigError(true);
            return;
          }
          setMateCount((matesRes.mates || []).length);
          setRecentPraises((praisesRes.praises || []).slice(0, 3));
        }).catch(() => {});
      } else {
        getPraises().then(praisesRes => {
          if (praisesRes.error === 'SUPABASE_UNCONFIGURED') {
            setConfigError(true);
            return;
          }
          setRecentPraises((praisesRes.praises || []).slice(0, 3));
        }).catch(() => {});
      }
    }
    loadInitialData();
  }, []);

  const handleNextSuggestion = () => {
    if (suggestionsList.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * suggestionsList.length);
    if (nextIdx === currentSuggestionIndex) {
      nextIdx = (currentSuggestionIndex + 1) % suggestionsList.length;
    }
    setCurrentSuggestionIndex(nextIdx);
  };

  const handleLoginSuccess = async (user: User) => {
    await setCurrentUser(user);
    setUserState(user);
    const matesRes = await getMatesForUser(user.id);
    setMateCount((matesRes.mates || []).length);
  };

  // Helper to format D-Day text
  const getCountdownLabel = (daysLeft?: number) => {
    if (isRevealActive) return '🎉 Reveal Day 진행중';
    if (daysLeft === undefined || daysLeft === null) return 'D-Day';
    if (daysLeft < 0) return '종료됨';
    if (daysLeft === 0) return 'Today';
    if (daysLeft === 1) return 'Tomorrow';
    return `D-${daysLeft}`;
  };

  if (configError) {
    return (
      <MobileLayout>
        <SupabaseConfigError />
      </MobileLayout>
    );
  }

  if (isInitializing) {
    return (
      <div className="w-full max-w-[480px] min-h-screen bg-slate-50 relative flex items-center justify-center border-x border-slate-200/60">
        <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="w-full max-w-[480px] min-h-screen bg-slate-50 relative flex flex-col shadow-2xl overflow-x-hidden border-x border-slate-200/60">
        <Splash onStart={() => setLoginModalOpen(true)} />
        <CodeLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  const currentSuggestionText = suggestionsList[currentSuggestionIndex] || DEFAULT_SUGGESTIONS[0];

  return (
    <MobileLayout>
      <div className="flex flex-col gap-4">
        {/* Welcome Greeting */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-1 pt-1"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              안녕하세요, <br />
              <span className="text-blue-600 font-black">{currentUser.name}님</span> 👋
            </h2>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 text-white flex items-center justify-center text-2xl shadow-md">
              {currentUser.avatar || '👤'}
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            오늘도 좋은 하루 되세요! <br />작은 관심이 더 좋은 팀을 만듭니다.
          </p>
        </motion.div>

        {/* Feature 1. 🌱 이번 주 AI Suggestion Card (Hidden during Reveal) */}
        {!isRevealActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="p-5 rounded-3xl gradient-hero border border-sky-200/90 shadow-subtle relative overflow-hidden flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/95 text-emerald-700 text-[11px] font-extrabold rounded-full shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 fill-emerald-200" />
                🌱 이번 주 AI Suggestion
              </span>
              <button
                onClick={handleNextSuggestion}
                className="text-slate-600 hover:text-sky-700 text-xs font-bold flex items-center gap-1 bg-white/70 hover:bg-white px-2.5 py-1 rounded-full transition-all shadow-2xs active:scale-95"
              >
                <RefreshCw className="w-3 h-3 text-sky-600" />
                <span>다른 제안 보기</span>
              </button>
            </div>

            <p className="text-xs font-extrabold text-slate-800 leading-relaxed px-1 my-1">
              &ldquo;{currentSuggestionText}&rdquo;
            </p>
          </motion.div>
        )}

        {/* Feature 2. 🎁 Reveal Day Countdown Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 text-white shadow-float flex items-center justify-between relative overflow-hidden"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              🎁
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-purple-100">Reveal Day</span>
                {isRevealActive && (
                  <span className="text-[10px] bg-amber-400 text-slate-900 font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-purple-100 font-medium mt-0.5">
                {isRevealActive
                  ? "지금 Reveal 화면에서 내 칭찬 결과를 확인하세요!"
                  : "조금씩 Reveal Day가 다가오고 있습니다."}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xl font-black tracking-tight text-white block">
              {getCountdownLabel(activityStats?.revealDaysLeft)}
            </span>
          </div>
        </motion.div>

        {/* Feature 4. 📊 이번 주 Activity Summary Card (Anonymous Stats Only) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-3xl bg-white border border-slate-100 shadow-subtle flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-sky-600" />
              이번 주 Activity
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">HT AI Vitamin 통계</span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-sky-50 border border-sky-100/60 flex flex-col items-center justify-center">
              <span className="text-[10px] text-slate-500 font-bold">이번 주 응원</span>
              <span className="text-base font-black text-sky-600 mt-0.5">
                {activityStats?.weeklyPraiseCount ?? 0}건
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-purple-50 border border-purple-100/60 flex flex-col items-center justify-center">
              <span className="text-[10px] text-slate-500 font-bold">Reveal Day</span>
              <span className="text-base font-black text-purple-600 mt-0.5">
                {getCountdownLabel(activityStats?.revealDaysLeft)}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-pink-50 border border-pink-100/60 flex flex-col items-center justify-center">
              <span className="text-[10px] text-slate-500 font-bold">최근 등록</span>
              <span className="text-base font-black text-pink-600 mt-0.5">
                {activityStats?.recentPraiseCount ?? 0}건
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-100/60 flex flex-col items-center justify-center">
              <span className="text-[10px] text-slate-500 font-bold">전체 응원</span>
              <span className="text-base font-black text-indigo-600 mt-0.5">
                {activityStats?.totalPraiseCount ?? 0}건
              </span>
            </div>
          </div>
        </motion.div>

        {/* 2x2 Quick Navigation Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/mate"
            prefetch={true}
            className="p-4 rounded-3xl bg-white border border-slate-100 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between h-32 relative overflow-hidden group"
          >
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-sm">My Mystery Mate</span>
                <span className="text-xs text-sky-600 font-bold bg-sky-50 px-2 py-0.5 rounded-full">
                  {mateCount}명
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">나의 관심 동료 확인하기</p>
            </div>
          </Link>

          <Link
            href="/thanks"
            prefetch={true}
            className="p-4 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-float hover:opacity-95 transition-all flex flex-col justify-between h-32 relative overflow-hidden group"
          >
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center font-bold">
              <Heart className="w-5 h-5 fill-white/30" />
            </div>
            <div>
              <span className="font-extrabold text-white text-sm block">Vitamin Thanks</span>
              <p className="text-[10px] text-purple-100 mt-0.5">익명으로 따뜻한 칭찬 전달</p>
            </div>
          </Link>

          <Link
            href="/wall"
            prefetch={true}
            className="p-4 rounded-3xl bg-white border border-slate-100 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between h-32 relative overflow-hidden group"
          >
            <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-sm block">Vitamin Wall</span>
              <p className="text-[10px] text-slate-400 mt-0.5">우리 본부의 칭찬 이야기</p>
            </div>
          </Link>

          <Link
            href="/notes"
            prefetch={true}
            className="p-4 rounded-3xl bg-white border border-slate-100 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between h-32 relative overflow-hidden group"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-sm block">내 메모</span>
              <p className="text-[10px] text-slate-400 mt-0.5">나만 보는 동료 메모장</p>
            </div>
          </Link>
        </div>

        {/* Recent Vitamin Wall Activity */}
        <div className="flex flex-col gap-3 mt-1 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-purple-500" />
              최근 도착한 비타민 소식
            </h3>
            <Link href="/wall" prefetch={true} className="text-xs text-sky-600 font-bold flex items-center">
              전체보기 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-2.5">
            {recentPraises.map((praise) => (
              <div
                key={praise.id}
                className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Smile className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-blue-600">{praise.recipientName}님</span>에게 전해진 비타민
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    ❤️ {praise.likes}
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium bg-slate-50 p-2 rounded-xl">
                  &ldquo;{praise.refinedContent || praise.content}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
