'use client';

import React, { useState } from 'react';
import { User } from '@/lib/types';
import { getUserByCode } from '@/lib/db';
import SupabaseConfigError from './SupabaseConfigError';
import { KeyRound, CheckCircle2, ArrowRight, X, Sparkles } from 'lucide-react';

interface CodeLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export default function CodeLoginModal({ isOpen, onClose, onLoginSuccess }: CodeLoginModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isUnconfigured, setIsUnconfigured] = useState(false);
  const [foundUser, setFoundUser] = useState<User | null>(null);

  if (!isOpen) return null;

  const handleCheckCode = async () => {
    setError('');
    setIsUnconfigured(false);
    if (!code.trim()) {
      setError('참여코드를 입력해 주세요.');
      return;
    }

    const res = await getUserByCode(code);
    if (res.error === 'SUPABASE_UNCONFIGURED') {
      setIsUnconfigured(true);
      return;
    }

    if (res.error || !res.user) {
      setError(res.error || '올바르지 않은 참여코드입니다. (예: VIT-7F2A9)');
      return;
    }

    setFoundUser(res.user);
  };

  const handleConfirmLogin = () => {
    if (foundUser) {
      onLoginSuccess(foundUser);
      onClose();
    }
  };

  const handleQuickSelect = async (sampleCode: string) => {
    setCode(sampleCode);
    setError('');
    setIsUnconfigured(false);
    const res = await getUserByCode(sampleCode);
    if (res.error === 'SUPABASE_UNCONFIGURED') {
      setIsUnconfigured(true);
      return;
    }
    if (res.user) {
      setFoundUser(res.user);
    } else {
      setError(res.error || '사용자를 찾을 수 없습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-slate-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">참여코드 입력</h3>
            <p className="text-xs text-slate-500">본인에게 발급된 코드를 입력하세요.</p>
          </div>
        </div>

        {isUnconfigured ? (
          <SupabaseConfigError />
        ) : !foundUser ? (
          <div className="flex flex-col gap-3 mt-2">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                참여코드 (8자리)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="예: VIT-7F2A9"
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono font-bold text-center tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all uppercase"
                />
                <button
                  onClick={handleCheckCode}
                  className="py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-1 shrink-0"
                >
                  확인
                </button>
              </div>
              {error && <p className="text-xs text-red-500 font-medium mt-1.5">{error}</p>}
            </div>

            {/* Quick Demo Accounts for Testing */}
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                빠른 테스트용 계정 선택:
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  onClick={() => handleQuickSelect('VIT-7F2A9')}
                  className="p-2 bg-slate-50 hover:bg-sky-50 rounded-lg text-left text-slate-700 font-medium border border-slate-100 transition-colors"
                >
                  👩‍💼 김지현 <span className="text-[10px] text-slate-400 block">전략기획팀</span>
                </button>
                <button
                  onClick={() => handleQuickSelect('VIT-8K3B1')}
                  className="p-2 bg-slate-50 hover:bg-sky-50 rounded-lg text-left text-slate-700 font-medium border border-slate-100 transition-colors"
                >
                  👨‍💻 박서준 <span className="text-[10px] text-slate-400 block">마케팅팀</span>
                </button>
                <button
                  onClick={() => handleQuickSelect('VIT-4N2D8')}
                  className="p-2 bg-slate-50 hover:bg-sky-50 rounded-lg text-left text-slate-700 font-medium border border-slate-100 transition-colors"
                >
                  👨‍🏫 이민호 <span className="text-[10px] text-slate-400 block">서비스기획팀</span>
                </button>
                <button
                  onClick={() => handleQuickSelect('VIT-ADMIN')}
                  className="p-2 bg-amber-50 hover:bg-amber-100 rounded-lg text-left text-amber-900 font-bold border border-amber-200 transition-colors"
                >
                  👑 관리자 계정 <span className="text-[10px] text-amber-600 block">운영팀</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-2">
            <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 flex items-center gap-3">
              <span className="text-3xl">{foundUser.avatar || '👤'}</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 text-base">{foundUser.name}님</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-100" />
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {foundUser.team} · 코드 {foundUser.code}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 text-center">
              반갑습니다! 본인 계정이 맞으시면 아래 버튼을 눌러 시작하세요.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setFoundUser(null)}
                className="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all"
              >
                다시 입력
              </button>
              <button
                onClick={handleConfirmLogin}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-1"
              >
                <span>시작하기</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
