'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles, Award, ArrowRight } from 'lucide-react';

export default function ClosingSegment() {
  return (
    <div className="w-full h-full flex flex-col justify-between p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white relative overflow-hidden select-none">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div>
          <span className="text-xs font-bold tracking-widest text-sky-400 uppercase">Segment 6</span>
          <h2 className="text-2xl font-black text-white">Closing Remarks</h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
          <Award className="w-3.5 h-3.5 text-sky-400" />
          <span>본부장님 맺음말씀</span>
        </div>
      </div>

      {/* Center Card */}
      <div className="my-auto max-w-3xl mx-auto w-full z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="p-10 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-md flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-3xl mb-4 shadow-lg shadow-sky-500/20">
            🤝
          </div>

          <h3 className="text-3xl font-black text-white leading-snug">
            “서로를 발견하고 함께 성장한
            <br />
            <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              2달간의 비타민 여정
            </span>”
          </h3>

          <p className="text-sm text-slate-300 leading-relaxed max-w-xl mt-4 font-medium">
            동료의 묵묵한 헌신을 발견하고, 작은 칭찬으로 서로에게 힘이 되어준
            <br />
            HT사업본부 모든 가족 여러분께 진심으로 감사드립니다.
          </p>
        </motion.div>
      </div>

      {/* Footer Info */}
      <div className="z-10 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-3">
        <span>* 참석자 모바일 (/live)에서 박수 및 하트 반응을 보내실 수 있습니다.</span>
        <span>➡️: 피자 파티 & AI Vitamin Song 세그먼트로 이동</span>
      </div>
    </div>
  );
}
