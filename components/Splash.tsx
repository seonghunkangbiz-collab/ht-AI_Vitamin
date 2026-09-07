'use client';

import React from 'react';
import { Sparkles, Heart, Users, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface SplashProps {
  onStart: () => void;
}

export default function Splash({ onStart }: SplashProps) {
  return (
    <div className="flex flex-col items-center justify-between min-h-[90vh] p-6 text-center">
      {/* Top Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full pt-4 flex flex-col items-center"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-pink-100 text-pink-600 mb-3 shadow-sm">
          <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
          좋은 사람들이 좋은 변화를 만듭니다
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          HT사업본부 <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            AI Vitamin Program
          </span>
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Connecting People, Growing Together
        </p>
      </motion.div>

      {/* Middle Illustration Graphic */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="my-8 relative w-full flex justify-center items-center"
      >
        <div className="w-64 h-64 rounded-full bg-gradient-to-tr from-sky-100 via-indigo-100 to-purple-100 flex flex-col items-center justify-center p-6 shadow-inner relative overflow-hidden">
          <div className="absolute top-4 left-6 animate-pulse opacity-60">
            <Sparkles className="w-6 h-6 text-sky-400" />
          </div>
          <div className="absolute bottom-6 right-6 animate-pulse opacity-60">
            <Heart className="w-6 h-6 text-purple-400 fill-purple-200" />
          </div>

          <div className="w-20 h-20 rounded-3xl bg-white shadow-card flex items-center justify-center mb-3">
            <span className="text-4xl">🌱</span>
          </div>

          <p className="text-sm font-bold text-slate-800">
            작은 관심이,<br /> 더 좋은 팀을 만듭니다.
          </p>
          <p className="text-[11px] text-slate-500 mt-2 px-2">
            가볍게, 즐겁게, 자연스럽게! <br />동료의 좋은 점을 발견하고 응원해보세요.
          </p>
        </div>
      </motion.div>

      {/* Bottom Start Action */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full flex flex-col items-center gap-3 mb-6"
      >
        <button
          onClick={onStart}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-base shadow-float hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>시작하기</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <p className="text-xs text-slate-400 font-medium">
          지금, 좋은 이야기를 시작해볼까요?
        </p>

        <div className="mt-4 p-3 bg-white/80 rounded-xl border border-slate-100 text-left text-[11px] text-slate-500 w-full flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-50 text-sky-600 rounded-lg flex items-center justify-center flex-shrink-0 font-bold">
            QR
          </div>
          <div>
            <p className="font-semibold text-slate-700">참여코드로 접속</p>
            <p className="text-[10px] text-slate-400">발급받으신 8자리 코드(예: VIT-7F2A9)를 입력하세요.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
