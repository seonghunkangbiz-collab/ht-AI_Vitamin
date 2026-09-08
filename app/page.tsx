'use client';

import React, { useState, useEffect } from 'react';
import MobileLayout from '@/components/MobileLayout';
import Splash from '@/components/Splash';
import CodeLoginModal from '@/components/CodeLoginModal';
import SupabaseConfigError from '@/components/SupabaseConfigError';
import { User, PraiseMessage } from '@/lib/types';
import { getCurrentUser, setCurrentUser, getPraises, getMatesForUser } from '@/lib/db';
import { fetchAISuggestion } from '@/lib/aiService';
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
  Award
} from 'lucide-react';

export default function HomePage() {
  const [currentUser, setUserState] = useState<User | null>(null);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<string>('');
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [recentPraises, setRecentPraises] = useState<PraiseMessage[]>([]);
  const [mateCount, setMateCount] = useState<number>(0);
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      const user = await getCurrentUser();
      setUserState(user);

      if (user) {
        const matesRes = await getMatesForUser(user.id);
        if (matesRes.error === 'SUPABASE_UNCONFIGURED') {
          setConfigError(true);
          return;
        }
        setMateCount((matesRes.mates || []).length);
      }

      const praisesRes = await getPraises();
      if (praisesRes.error === 'SUPABASE_UNCONFIGURED') {
        setConfigError(true);
        return;
      }
      setRecentPraises((praisesRes.praises || []).slice(0, 3));

      // Initial AI Suggestion
      loadSuggestion();
    }
    loadInitialData();
  }, []);

  const loadSuggestion = async () => {
    setIsLoadingSuggestion(true);
    try {
      const text = await fetchAISuggestion();
      setSuggestion(text);
    } catch (e) {
      setSuggestion('"회의 중 좋은 의견이 있다면 짧게 좋은 의견이네요"라고 표현해 보세요.');
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const handleLoginSuccess = async (user: User) => {
    await setCurrentUser(user);
    setUserState(user);
    const matesRes = await getMatesForUser(user.id);
    setMateCount((matesRes.mates || []).length);
  };

  if (configError) {
    return (
      <MobileLayout>
        <SupabaseConfigError />
      </MobileLayout>
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

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5">
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

        {/* 오늘의 AI Suggestion Box */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-3xl gradient-hero border border-sky-200/80 shadow-subtle relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 text-sky-700 text-[11px] font-bold rounded-full shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-sky-500 fill-sky-200" />
              오늘의 AI Suggestion
            </span>
            <button
              onClick={loadSuggestion}
              disabled={isLoadingSuggestion}
              className="text-slate-500 hover:text-sky-600 text-xs font-semibold flex items-center gap-1 bg-white/60 hover:bg-white/90 px-2.5 py-1 rounded-full transition-all"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingSuggestion ? 'animate-spin' : ''}`} />
              <span>다른 제안 보기</span>
            </button>
          </div>

          <p className="text-sm font-bold text-slate-800 leading-relaxed my-2 px-1">
            &ldquo;{suggestion}&rdquo;
          </p>
        </motion.div>

        {/* 2x2 Quick Navigation Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/mate"
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
        <div className="flex flex-col gap-3 mt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-purple-500" />
              최근도착한 비타민 소식
            </h3>
            <Link href="/wall" className="text-xs text-sky-600 font-bold flex items-center">
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
