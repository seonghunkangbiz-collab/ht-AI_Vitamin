'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pizza, Camera, Sparkles, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

interface PizzaPartySegmentProps {
  eventId?: string;
  initialSeconds?: number;
  isPausedInitial?: boolean;
}

export default function PizzaPartySegment({
  eventId = 'event-rehearsal',
  initialSeconds = 50 * 60,
  isPausedInitial = false
}: PizzaPartySegmentProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isPaused, setIsPaused] = useState(isPausedInitial);

  // Sync with prop updates
  useEffect(() => {
    if (typeof initialSeconds === 'number') {
      setSecondsLeft(initialSeconds);
    }
  }, [initialSeconds]);

  useEffect(() => {
    if (typeof isPausedInitial === 'boolean') {
      setIsPaused(isPausedInitial);
    }
  }, [isPausedInitial]);

  // Realtime Broadcast Listener for Pizza Timer Control
  useEffect(() => {
    try {
      if (!isSupabaseConfigured()) return;
      const sb = getSupabaseClient();
      const channel = sb
        .channel(`reveal_channel_${eventId}`)
        .on('broadcast', { event: 'pizza_timer' }, (payload) => {
          const data = payload?.payload || payload;
          if (typeof data.seconds === 'number') {
            setSecondsLeft(data.seconds);
          }
          if (typeof data.isPaused === 'boolean') {
            setIsPaused(data.isPaused);
          }
        })
        .subscribe();

      return () => {
        try {
          sb.removeChannel(channel);
        } catch {}
      };
    } catch {}
  }, [eventId]);

  // Countdown loop
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 text-white relative overflow-hidden select-none">
      {/* Background glow */}
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div>
          <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">Segment 8</span>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <span>Vitamin Pizza Party</span>
            <Pizza className="w-6 h-6 text-amber-400" />
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {isPaused && (
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold animate-pulse">
              ⏸️ 타이머 일시정지 중
            </span>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>자유 네트워킹 & 단체사진 (50분)</span>
          </div>
        </div>
      </div>

      {/* Center 50-min Countdown & Photo Guide */}
      <div className="my-auto grid grid-cols-12 gap-8 items-center z-10 max-w-4xl mx-auto w-full">
        {/* Left: 50-min Countdown Timer */}
        <div className="col-span-6 flex flex-col items-center text-center p-8 rounded-3xl bg-slate-900/80 border border-amber-500/30 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-3xl mb-3">
            🍕
          </div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
            Networking Timer (50 min)
          </span>
          <div className="text-6xl font-black text-white font-mono tracking-tight my-2">
            {formatTimer(secondsLeft)}
          </div>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            따뜻한 피자와 함께 동료들과 자유롭게 이야기를 나누어 보세요!
          </p>
        </div>

        {/* Right: Group Photo & Personal Reveal Link */}
        <div className="col-span-6 flex flex-col gap-4">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">전원 단체 기념 촬영</h3>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">
                잠시 후 무대 앞으로 모여 2달간의 비타민 프로그램을 기념하는 단체 사진을 촬영합니다.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-r from-sky-500/20 to-indigo-500/20 border border-sky-400/40 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-sky-300">내 폰으로 저장하기</span>
              <h4 className="text-sm font-black text-white mt-0.5">나의 타임캡슐 보러가기</h4>
            </div>
            <Link
              href="/reveal"
              target="_blank"
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <span>/reveal 열기</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="z-10 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-3">
        <span>* 참석자 모바일 (/live) 하단에도 개인 Reveal 페이지 이동 버튼이 제공됩니다.</span>
        <span>운영자 콘솔에서 [행사 최종 종료] 시 status가 ended로 보존됩니다.</span>
      </div>
    </div>
  );
}
