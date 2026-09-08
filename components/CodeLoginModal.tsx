'use client';

import React, { useState } from 'react';
import { User } from '@/lib/types';
import { getUserByCode } from '@/lib/db';
import SupabaseConfigError from './SupabaseConfigError';
import { KeyRound, CheckCircle2, ArrowRight, X } from 'lucide-react';

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
      setError('올바르지 않은 참여코드입니다. 발급받으신 코드를 확인해 주세요.');
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
            <p className="text-xs text-slate-500">본인에게 발급된 개인 코드를 입력하세요.</p>
          </div>
        </div>

        {isUnconfigured ? (
          <SupabaseConfigError />
        ) : !foundUser ? (
          <div className="flex flex-col gap-3 mt-2">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                참여코드
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="참여코드 입력"
                  className="flex-1 py-3.5 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono font-bold text-center tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all uppercase"
                />
                <button
                  onClick={handleCheckCode}
                  className="py-3.5 px-5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-1 shrink-0"
                >
                  확인
                </button>
              </div>
              {error && <p className="text-xs text-red-500 font-medium mt-2 text-center">{error}</p>}
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
                  {foundUser.team}
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
