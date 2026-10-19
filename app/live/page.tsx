'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MobileLayout from '@/components/MobileLayout';
import CodeLoginModal from '@/components/CodeLoginModal';
import { User, TimeCapsule } from '@/lib/types';
import { getCurrentUser, setCurrentUser } from '@/lib/db';
import { useRevealDayRealtime } from '@/hooks/useRevealDayRealtime';
import { getSupabaseClient } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  CheckCircle2, 
  Heart, 
  Gift, 
  Trophy, 
  Lock, 
  ArrowRight, 
  Clock, 
  HelpCircle,
  FileText
} from 'lucide-react';

function LiveAttendeeContent() {
  const searchParams = useSearchParams();
  const queryEventId = searchParams.get('eventId');
  const queryMode = searchParams.get('mode');

  // Dynamic eventId based on mode or query parameter
  const eventId = queryEventId || (queryMode === 'rehearsal' ? 'event-rehearsal' : 'event-live-20261028');
  const isRehearsal = eventId.includes('rehearsal') || queryMode === 'rehearsal';

  const [currentUserState, setUserState] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [myWinningPrize, setMyWinningPrize] = useState<{ prizeName: string; roundNumber: number } | null>(null);
  const [myCapsule, setMyCapsule] = useState<any | null>(null);
  const [isLoadingCapsule, setIsLoadingCapsule] = useState(false);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [selectedGuess, setSelectedGuess] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Realtime hook
  const { publicState } = useRevealDayRealtime({ eventId });

  // 1. Initial User Check
  useEffect(() => {
    async function initUser() {
      const user = await getCurrentUser();
      setUserState(user);

      if (!user) {
        setIsLoginModalOpen(true);
      } else {
        // Fetch checkin status & win status
        try {
          const res = await fetch(`/api/reveal-day/interactions?type=my_status&eventId=${eventId}`);
          if (res.ok) {
            const data = await res.json();
            setIsCheckedIn(data.isCheckedIn);
            if (data.winningPrize) {
              setMyWinningPrize(data.winningPrize);
            }
          }
        } catch {}

        // Fetch users for guess selector
        try {
          const uRes = await fetch('/api/users');
          if (uRes.ok) {
            const uData = await uRes.json();
            setAllUsers((uData.users || []).filter((u: any) => u.id !== user.id));
          }
        } catch {}
      }
    }
    initUser();
  }, [eventId]);

  // Check for winning alert
  useEffect(() => {
    if (!currentUserState) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/reveal-day/interactions?type=my_status&eventId=${eventId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.winningPrize && !myWinningPrize) {
            setMyWinningPrize(data.winningPrize);
            try {
              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            } catch {}
          }
        }
      } catch {}
    }, 4000);
    return () => clearInterval(interval);
  }, [currentUserState, eventId, myWinningPrize]);

  // Checkin Handler
  const handleCheckin = async () => {
    try {
      const res = await fetch('/api/reveal-day/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, action: 'checkin' })
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setIsCheckedIn(true);
        // Instant broadcast for sub-50ms stage synchronization
        try {
          const sb = getSupabaseClient();
          sb.channel(`reveal_channel_${eventId}`).send({
            type: 'broadcast',
            event: 'checkin',
            payload: { checkinCount: data.checkinCount }
          });
        } catch {}
        try {
          confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
        } catch {}
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`체크인 실패: ${data.error || '잠시 후 다시 시도해 주세요.'}`);
      }
    } catch (e: any) {
      alert(`네트워크 오류: ${e.message}`);
    }
  };

  // Emoji Reaction Sender
  const handleSendReaction = async (reaction: 'heart' | 'clap' | 'party' | 'sparkle' | 'fire') => {
    try {
      fetch('/api/reveal-day/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, action: 'reaction', reaction })
      });
      // Broadcast reaction for instant visual feedback on stage
      try {
        const sb = getSupabaseClient();
        sb.channel(`reveal_channel_${eventId}`).send({
          type: 'broadcast',
          event: 'reaction',
          payload: { reaction }
        });
      } catch {}
      try {
        confetti({
          particleCount: 15,
          spread: 40,
          origin: { y: 0.85 },
          scalar: 0.8
        });
      } catch {}
    } catch {}
  };

  // Open Personal Capsule Handler
  const handleOpenMyCapsule = async () => {
    setIsLoadingCapsule(true);
    try {
      const res = await fetch(`/api/reveal-day/interactions?type=my_capsule&eventId=${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setMyCapsule(data.capsule);
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch {}
      }
    } catch {} finally {
      setIsLoadingCapsule(false);
    }
  };

  // Guess Submission Handler
  const handleSendGuess = async () => {
    if (!selectedGuess) return;
    try {
      await fetch('/api/reveal-day/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, action: 'guess', guessedUserId: selectedGuess })
      });
      setHasGuessed(true);
    } catch {}
  };

  const currentSegment = publicState?.currentSegment || 'opening';

  return (
    <MobileLayout>
      <div className="flex flex-col gap-4 pb-12">
        {/* Top Header Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${isRehearsal ? 'bg-amber-400 text-slate-950 font-black' : 'bg-white/20 text-white'} uppercase tracking-widest`}>
              {isRehearsal ? '🛠️ Rehearsal Mode' : 'Live Interaction'}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-sky-200">
              <span className={`w-2 h-2 rounded-full ${isRehearsal ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
              <span>{isRehearsal ? '리허설 무대 동기화' : '무대 동기화 중'}</span>
            </div>
          </div>

          <h2 className="text-xl font-black">
            {isRehearsal ? 'AI Vitamin [리허설]' : 'AI Vitamin Reveal Day'}
          </h2>
          <p className="text-xs text-sky-100 mt-0.5">
            {isRehearsal ? '리허설 시뮬레이션 상호작용 채널입니다.' : '실시간 행사 상호작용 채널'}
          </p>

          {currentUserState && (
            <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentUserState.avatar || '👤'}</span>
                <div>
                  <div className="text-sm font-bold">{currentUserState.name} 님</div>
                  <div className="text-[11px] text-sky-200">{currentUserState.team}</div>
                </div>
              </div>
              {isCheckedIn && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>체크인 완료</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Lucky Draw Winner Announcement Popup */}
        {myWinningPrize && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-5 rounded-3xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-2xl flex flex-col items-center text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-white text-3xl flex items-center justify-center mb-2 shadow">
              👑
            </div>
            <span className="text-xs font-black uppercase tracking-wider">축하합니다! Lucky Draw 당첨!</span>
            <h3 className="text-lg font-black mt-1">Round {myWinningPrize.roundNumber}: {myWinningPrize.prizeName}</h3>
            <p className="text-xs text-slate-900 mt-1 font-medium">행사 종료 후 운영진으로부터 상품을 수령하세요!</p>
          </motion.div>
        )}

        {/* Dynamic Interactive Segment Section */}
        {currentSegment === 'opening' && (
          <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <span>참석자 체크인</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              무대 시작 전, 본인 확인 및 체크인을 완료해 주세요. 체크인 시 Lucky Draw 추첨 풀에 자동 등록됩니다.
            </p>

            {isCheckedIn ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center gap-2 text-emerald-600 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>체크인이 완료되었습니다.</span>
              </div>
            ) : (
              <button
                onClick={handleCheckin}
                className="w-full py-3.5 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>체크인 / 준비 완료</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {currentSegment === 'mate_reveal' && (
          <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <span>Mystery Mate 추측하기</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              지난 2개월간 나를 묵묵히 관찰하고 지켜봐 준 비타민은 누구였을까요? 예상되는 동료를 선택해 보세요!
            </p>

            {hasGuessed ? (
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-center text-xs text-indigo-600 font-bold">
                추측이 제출되었습니다! 무대 공개를 기대해 주세요.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <select
                  value={selectedGuess}
                  onChange={(e) => setSelectedGuess(e.target.value)}
                  className="py-3 px-3.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50"
                >
                  <option value="">동료를 선택하세요</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.team})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSendGuess}
                  disabled={!selectedGuess}
                  className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition-all disabled:opacity-50"
                >
                  추측 제출하기
                </button>
              </div>
            )}
          </div>
        )}

        {currentSegment === 'time_capsule' && (
          <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <span>나의 AI Time Capsule</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              동료들이 전해준 따뜻한 칭찬 메시지를 AI가 분석하여 작성한 나만의 타임캡슐을 오픈해 보세요!
            </p>

            {myCapsule ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
                <div className="flex flex-wrap gap-1">
                  {(myCapsule.keywords || []).map((k: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                      #{k}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-700 font-medium italic">
                  “{myCapsule.analysis}”
                </p>
                <div className="pt-2 border-t border-slate-200 text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                  {myCapsule.letter}
                </div>
              </div>
            ) : (
              <button
                onClick={handleOpenMyCapsule}
                disabled={isLoadingCapsule}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:opacity-95 text-white font-bold text-sm shadow transition-all flex items-center justify-center gap-2"
              >
                <span>{isLoadingCapsule ? '캡슐 여는 중...' : '나의 타임캡슐 열기'}</span>
                <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Real-time Emoji Reactions Card (Available throughout) */}
        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">무대로 실시간 반응 보내기</span>
            <span className="text-[10px] text-slate-400">터치 시 무대 화면에 표시</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[
              { emoji: '❤️', label: '하트', type: 'heart' as const },
              { emoji: '👏', label: '박수', type: 'clap' as const },
              { emoji: '🎉', label: '축하', type: 'party' as const },
              { emoji: '💡', label: '공감', type: 'sparkle' as const },
              { emoji: '🔥', label: '응원', type: 'fire' as const },
            ].map((btn) => (
              <button
                key={btn.type}
                onClick={() => handleSendReaction(btn.type)}
                className="py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-90 border border-slate-200 transition-all flex flex-col items-center justify-center"
              >
                <span className="text-2xl">{btn.emoji}</span>
                <span className="text-[10px] text-slate-500 font-medium mt-1">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Go to Personal Reveal Page Link Card */}
        <div className="p-4 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-800">개인 타임캡슐 보관함</div>
            <div className="text-[11px] text-slate-500">인증서 이미지/PDF 다운로드</div>
          </div>
          <Link
            href="/reveal"
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 shadow-sm transition-all flex items-center gap-1"
          >
            <span>/reveal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Code Login Modal */}
      <CodeLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(user) => {
          setUserState(user);
          setCurrentUser(user);
          setIsLoginModalOpen(false);
          // Auto trigger checkin
          setTimeout(() => {
            handleCheckin();
          }, 300);
        }}
      />
    </MobileLayout>
  );
}

export default function LiveAttendeePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm font-bold">
        <span>무대 연결 중...</span>
      </div>
    }>
      <LiveAttendeeContent />
    </Suspense>
  );
}
