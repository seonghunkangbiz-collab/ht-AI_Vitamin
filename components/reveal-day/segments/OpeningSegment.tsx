'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Users, Calendar, Clock, QrCode, ArrowRight, ShieldCheck } from 'lucide-react';
import { ORDERED_SEGMENTS, SEGMENT_METADATA } from '@/lib/reveal-day/state-machine';

interface OpeningSegmentProps {
  checkinCount: number;
  totalAttendees?: number;
  mode: 'live' | 'rehearsal';
}

export default function OpeningSegment({ checkinCount, totalAttendees = 26, mode }: OpeningSegmentProps) {
  const isRehearsal = mode === 'rehearsal';
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.ht-ai-vitamin.app';
  
  // Differentiated QR Target URL by Mode
  const targetLiveUrl = isRehearsal 
    ? `${appUrl}/live?mode=rehearsal&eventId=event-rehearsal`
    : `${appUrl}/live?mode=live&eventId=event-live-20261028`;

  // Distinct QR Colors and styling
  // Rehearsal: Amber-600 (d97706), Live: Sky-600 (0284c7)
  const qrColor = isRehearsal ? 'd97706' : '0284c7';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&color=${qrColor}&data=${encodeURIComponent(targetLiveUrl)}`;

  return (
    <div className="w-full h-full flex flex-col justify-between p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white relative overflow-hidden select-none">
      {/* Background glow effects */}
      <div className={`absolute top-0 left-1/4 w-96 h-96 ${isRehearsal ? 'bg-amber-500/10' : 'bg-sky-500/10'} rounded-full blur-3xl pointer-events-none`} />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl ${isRehearsal ? 'bg-gradient-to-tr from-amber-400 to-orange-600 shadow-amber-500/20' : 'bg-gradient-to-tr from-sky-400 to-indigo-600 shadow-sky-500/20'} flex items-center justify-center shadow-lg`}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className={`text-xs font-bold tracking-widest ${isRehearsal ? 'text-amber-400' : 'text-sky-400'} uppercase`}>HT Business Division</span>
            <h3 className="text-sm font-semibold text-slate-300">AI Vitamin Program</h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isRehearsal ? (
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>REHEARSAL MODE (리허설 운영 중)</span>
            </span>
          ) : (
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>OFFICIAL LIVE (본 행사 라이브)</span>
            </span>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <span>2026. 10. 28 (수) 16:00~17:30</span>
          </div>
        </div>
      </div>

      {/* Hero Body */}
      <div className="my-auto grid grid-cols-12 gap-8 items-center z-10">
        <div className="col-span-7 flex flex-col gap-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className={`inline-block px-3 py-1 rounded-lg ${isRehearsal ? 'bg-amber-500/15 border-amber-400/30 text-amber-300' : 'bg-sky-500/15 border-sky-400/30 text-sky-300'} border text-xs font-bold tracking-wider mb-2`}>
              {isRehearsal ? 'REHEARSAL PREVIEW' : 'REVEAL DAY'}
            </span>
            <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
              HT사업본부 AI Vitamin
              <br />
              <span className={isRehearsal ? 'bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent'}>
                {isRehearsal ? 'Reveal Day [리허설]' : 'Reveal Day'}
              </span>
            </h1>
            <p className="text-base text-slate-300 font-medium mt-3">
              “Connecting People, Growing Together”
            </p>
            <p className="text-xs text-slate-400 max-w-lg leading-relaxed mt-1">
              지난 두 달 동안 서로를 묵묵히 관찰하고 따뜻한 격려를 전해준 비타민 메이트와 AI 타임캡슐을 전격 공개합니다.
            </p>
          </motion.div>

          {/* Check-in Counter Card */}
          <div className={`flex items-center gap-4 p-4 rounded-2xl bg-slate-900/90 border ${isRehearsal ? 'border-amber-500/30 shadow-amber-500/5' : 'border-slate-800 shadow-sky-500/5'} max-w-md shadow-2xl`}>
            <div className={`w-12 h-12 rounded-xl ${isRehearsal ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-sky-500/10 border-sky-500/20 text-sky-400'} border flex items-center justify-center`}>
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400">실시간 참석자 체크인</div>
              <div className="text-2xl font-black text-white flex items-baseline gap-1.5">
                <motion.span 
                  key={checkinCount}
                  initial={{ scale: 1.25, color: isRehearsal ? '#f59e0b' : '#38bdf8' }}
                  animate={{ scale: 1, color: isRehearsal ? '#fbbf24' : '#38bdf8' }}
                  transition={{ duration: 0.3 }}
                  className="font-black"
                >
                  {checkinCount}
                </motion.span>
                <span className="text-sm font-normal text-slate-500">/ {totalAttendees}명</span>
              </div>
            </div>
            <div className={`ml-auto flex items-center gap-1.5 text-xs ${isRehearsal ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'} px-2.5 py-1 rounded-full border font-bold`}>
              <span className={`w-2 h-2 rounded-full ${isRehearsal ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
              <span>{isRehearsal ? 'REHEARSAL' : 'LIVE'}</span>
            </div>
          </div>
        </div>

        {/* QR Code Card */}
        <div className="col-span-5 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className={`p-5 rounded-3xl ${isRehearsal ? 'bg-amber-950/20 border-amber-500/30 shadow-amber-500/10' : 'bg-slate-900/60 border-white/20 shadow-sky-500/10'} backdrop-blur-md border shadow-2xl flex flex-col items-center text-center`}
          >
            <div className={`p-3 bg-white rounded-2xl shadow-inner mb-3 border-2 ${isRehearsal ? 'border-amber-400' : 'border-sky-400'}`}>
              <img
                src={qrUrl}
                alt={isRehearsal ? 'Rehearsal Mobile QR' : 'Official Live Mobile QR'}
                className="w-44 h-44 object-contain rounded-lg"
              />
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-bold ${isRehearsal ? 'text-amber-400' : 'text-sky-300'}`}>
              <QrCode className="w-3.5 h-3.5" />
              <span>{isRehearsal ? '🛠️ 모바일 리허설 접속: /live?mode=rehearsal' : '🔴 공식 모바일 접속: /live'}</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 max-w-[220px] leading-relaxed">
              {isRehearsal 
                ? '리허설 시뮬레이션용 QR입니다. 카메라로 스캔하여 테스트 체크인하세요.' 
                : '스마트폰 카메라로 QR코드를 스캔하여 실시간 체크인에 참여하세요.'}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Bottom Timeline Preview */}
      <div className="z-10 pt-4 border-t border-slate-800/80">
        <div className="grid grid-cols-8 gap-2">
          {ORDERED_SEGMENTS.filter(s => s !== 'ended').map((seg, idx) => {
            const meta = SEGMENT_METADATA[seg];
            const isCurrent = seg === 'opening';
            return (
              <div
                key={seg}
                className={`p-2 rounded-xl text-center transition-all ${
                  isCurrent
                    ? 'bg-sky-500/20 border border-sky-400/40 text-white shadow-md shadow-sky-500/10'
                    : 'bg-slate-900/50 border border-slate-800/60 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-bold text-sky-400">{meta.timeRange.split('~')[0]}</div>
                <div className="text-xs font-semibold truncate mt-0.5">{meta.title}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
