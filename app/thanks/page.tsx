'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MobileLayout from '@/components/MobileLayout';
import { User } from '@/lib/types';
import { getCurrentUser, getAllUsers, addPraise } from '@/lib/db';
import { fetchAIRefinedPraise } from '@/lib/aiService';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Sparkles, Send, ArrowLeft, CheckCircle2, Info } from 'lucide-react';

function ThanksForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialRecipientId = searchParams.get('recipientId') || '';

  const [currentUser, setUserState] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(initialRecipientId);
  const [content, setContent] = useState<string>('');
  const [refinedContent, setRefinedContent] = useState<string>('');
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSent, setIsSent] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      const user = await getCurrentUser();
      setUserState(user);

      if (user) {
        const users = await getAllUsers();
        setAllUsers(users.filter(u => u.id !== user.id && u.role !== 'admin'));
      }
    }
    loadData();
  }, []);

  const handleAIRefine = async () => {
    if (!content.trim()) {
      setError('칭찬/응원 내용을 먼저 작성해 주세요.');
      return;
    }
    setError('');
    setIsRefining(true);
    try {
      const refined = await fetchAIRefinedPraise(content);
      setRefinedContent(refined);
    } catch (e) {
      setError('AI 다듬기 중 오류가 발생했습니다.');
    } finally {
      setIsRefining(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) return;
    if (!selectedRecipientId) {
      setError('칭찬할 동료를 선택해 주세요.');
      return;
    }
    if (!content.trim()) {
      setError('칭찬/응원 내용을 작성해 주세요.');
      return;
    }

    const recipient = allUsers.find(u => u.id === selectedRecipientId);
    if (!recipient) return;

    setIsSubmitting(true);
    try {
      await addPraise(
        currentUser.id,
        recipient.id,
        recipient.name,
        recipient.team,
        content,
        refinedContent || content
      );
      setIsSent(true);
      setTimeout(() => {
        router.push('/wall');
      }, 1500);
    } catch (e) {
      setError('전송 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="p-6 text-center text-slate-500">
        참여코드를 입력해 로그인해 주세요.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Top Title */}
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-full hover:bg-slate-200/60 text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Vitamin Thanks
        </h2>
      </div>

      {/* Sub Title */}
      <p className="text-xs text-slate-500 font-medium -mt-2">
        좋은 사람에게, 좋은 말을 익명으로 전해보세요.
      </p>

      {isSent ? (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-8 rounded-3xl bg-white border border-slate-100 shadow-card text-center flex flex-col items-center gap-3 my-8"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-lg font-black text-slate-900">비타민 칭찬 전송 완료!</h3>
          <p className="text-xs text-slate-500">
            소중한 마음이 익명으로 전달되었습니다.<br />Vitamin Wall로 이동합니다...
          </p>
        </motion.div>
      ) : (
        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-card flex flex-col gap-4">
          {/* Recipient Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold text-slate-700">
              칭찬할 동료 선택
            </label>
            <select
              value={selectedRecipientId}
              onChange={(e) => {
                setSelectedRecipientId(e.target.value);
                setError('');
              }}
              className="w-full py-3 px-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">-- 동료 선택 --</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}님 ({u.team})
                </option>
              ))}
            </select>
          </div>

          {/* Praise Content Area */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700">
                칭찬 / 응원 내용
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                {content.length}/300
              </span>
            </div>
            <textarea
              maxLength={300}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="예) 회의에서 다른 사람 의견을 먼저 들어주는 모습이 인상적이었습니다."
              className="w-full p-4 rounded-2xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 h-32 resize-none leading-relaxed"
            />
          </div>

          {/* AI Refined Preview Box */}
          {refinedContent && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl gradient-card-purple border border-purple-200 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  AI가 따뜻하게 다듬은 문장
                </span>
                <button
                  onClick={() => setRefinedContent('')}
                  className="text-[10px] text-slate-400 hover:text-slate-600"
                >
                  원문 사용
                </button>
              </div>
              <p className="text-xs font-bold text-slate-800 leading-relaxed bg-white/80 p-3 rounded-xl border border-purple-100">
                &ldquo;{refinedContent}&rdquo;
              </p>
            </motion.div>
          )}

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={handleAIRefine}
              disabled={isRefining}
              className="w-full py-3 px-4 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Sparkles className={`w-4 h-4 text-purple-600 ${isRefining ? 'animate-spin' : ''}`} />
              <span>{isRefining ? 'AI가 다듬는 중...' : 'AI로 문장 다듬기 ✨'}</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-sm shadow-float hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>익명으로 전달하기</span>
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p>
              작성자는 절대 공개되지 않습니다. 상대방 실명과 메시지만 Vitamin Wall에 표시됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ThanksPage() {
  return (
    <MobileLayout>
      <Suspense fallback={<div className="p-6 text-center text-slate-400">불러오는 중...</div>}>
        <ThanksForm />
      </Suspense>
    </MobileLayout>
  );
}
