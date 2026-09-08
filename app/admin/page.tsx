'use client';

import React, { useState, useEffect } from 'react';
import MobileLayout from '@/components/MobileLayout';
import SupabaseConfigError from '@/components/SupabaseConfigError';
import { User, PraiseMessage } from '@/lib/types';
import { 
  getCurrentUser, 
  getAllUsers, 
  getPraises, 
  getIsRevealActive, 
  toggleRevealActive, 
  assignRandomMatesCrossTeam,
  seedSupabaseData 
} from '@/lib/db';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Users, 
  Shuffle, 
  Sparkles, 
  Download, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Database
} from 'lucide-react';

export default function AdminPage() {
  const [currentUser, setUserState] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [praises, setPraises] = useState<PraiseMessage[]>([]);
  const [isRevealActive, setIsRevealActive] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    async function loadData() {
      const user = await getCurrentUser();
      setUserState(user);

      const allUsersRes = await getAllUsers();
      if (allUsersRes.error === 'SUPABASE_UNCONFIGURED') {
        setConfigError(true);
        return;
      }
      setUsers((allUsersRes.users || []).filter(u => u.role !== 'admin'));

      const allPraisesRes = await getPraises(true);
      if (allPraisesRes.error === 'SUPABASE_UNCONFIGURED') {
        setConfigError(true);
        return;
      }
      setPraises(allPraisesRes.praises || []);

      const reveal = await getIsRevealActive();
      setIsRevealActive(reveal);
    }
    loadData();
  }, []);

  const handleSeedData = async () => {
    const res = await seedSupabaseData();
    if (res.error === 'SUPABASE_UNCONFIGURED') {
      setConfigError(true);
      return;
    }
    if (res.error) {
      showStatus(`시드 오류: ${res.error}`);
      return;
    }
    showStatus('Supabase 공용 DB에 초기 24명 임직원 및 샘플 데이터 시드가 완료되었습니다!');
    
    // Refresh list
    const allUsersRes = await getAllUsers();
    setUsers((allUsersRes.users || []).filter(u => u.role !== 'admin'));
    const allPraisesRes = await getPraises(true);
    setPraises(allPraisesRes.praises || []);
  };

  const handleToggleReveal = async () => {
    const nextState = !isRevealActive;
    await toggleRevealActive(nextState);
    setIsRevealActive(nextState);
    showStatus(nextState ? 'Reveal Day가 공개되었습니다! 🎁' : 'Reveal Day가 비공개 상태로 변경되었습니다.');
  };

  const handleShuffleMates = async () => {
    const res = await assignRandomMatesCrossTeam();
    if (res.error === 'SUPABASE_UNCONFIGURED') {
      setConfigError(true);
      return;
    }
    if (res.error) {
      showStatus(`배정 오류: ${res.error}`);
      return;
    }
    showStatus(`24명 임직원에 대한 타팀 우선 Mystery Mate 2명 배정이 Supabase DB에 저장되었습니다!`);
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'ID,수신자,수신팀,칭찬내용,좋아요수,작성일시\n';
    praises.forEach(p => {
      const row = `"${p.id}","${p.recipientName}","${p.recipientTeam || ''}","${p.refinedContent || p.content}",${p.likes},"${p.createdAt}"`;
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HT_AI_Vitamin_Praises_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showStatus('칭찬 데이터가 CSV 파일로 엑스포트되었습니다.');
  };

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  if (configError) {
    return (
      <MobileLayout>
        <SupabaseConfigError />
      </MobileLayout>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <MobileLayout>
        <div className="p-8 text-center flex flex-col items-center gap-3">
          <AlertCircle className="w-10 h-10 text-amber-500" />
          <h3 className="font-bold text-slate-800">관리자 권한이 필요합니다</h3>
          <p className="text-xs text-slate-500">
            참여코드 <code className="bg-slate-200 px-2 py-0.5 rounded font-mono">VIT-ADMIN</code> 계정으로 로그인해 주세요.
          </p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5 pb-6">
        {/* Top Title */}
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-full hover:bg-slate-200/60 text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              운영 관리자 대시보드
            </h2>
          </div>
        </div>

        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-xs"
          >
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </motion.div>
        )}

        {/* Action Controls */}
        <div className="grid grid-cols-1 gap-3">
          {/* Seed Data Button */}
          <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-600" />
                Supabase 초기 데이터 시드
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">24명 임직원 기본 등록</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Supabase DB가 비어있는 경우 초기 24명 HT사업본부 유저와 시드 데이터를 주입합니다.
            </p>
            <button
              onClick={handleSeedData}
              className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Database className="w-4 h-4" />
              <span>Supabase DB 초기 시드 실행</span>
            </button>
          </div>

          {/* Mystery Mate Assignment Button */}
          <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Shuffle className="w-4 h-4 text-sky-600" />
                Mystery Mate 타팀 우선 배정
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">1인당 2명 자동매칭</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              HT사업본부 24명 대상 타 부서 임직원을 우선하여 Mystery Mate 2명을 랜덤으로 새로 배정합니다.
            </p>
            <button
              onClick={handleShuffleMates}
              className="w-full py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Shuffle className="w-4 h-4" />
              <span>Mystery Mate 2명 셔플 배정 실행</span>
            </button>
          </div>

          {/* Reveal Day Toggle */}
          <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Reveal Day 공개 여부 설정
              </h3>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                isRevealActive ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {isRevealActive ? '공개 중' : '비공개 중'}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              프로그램 종료 시점(9~10월 말)에 Reveal Day 및 AI Time Capsule 감사 편지를 전체 유저에게 공개합니다.
            </p>
            <button
              onClick={handleToggleReveal}
              className={`w-full py-3 px-4 rounded-2xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 ${
                isRevealActive
                  ? 'bg-slate-700 hover:bg-slate-800 text-white'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isRevealActive ? 'Reveal Day 비공개 전환' : 'Reveal Day 즉시 공개하기 🎁'}</span>
            </button>
          </div>

          {/* Data Export */}
          <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-600" />
                데이터 엑스포트 (CSV)
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">총 {praises.length}건 칭찬</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              수집된 전체 Vitamin Wall 칭찬 메시지와 공감(좋아요) 수치를 CSV로 저장합니다.
            </p>
            <button
              onClick={handleExportCSV}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>칭찬 데이터 CSV 다운로드</span>
            </button>
          </div>
        </div>

        {/* User Codes List */}
        <div className="flex flex-col gap-3 mt-2">
          <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slate-600" />
            HT사업본부 임직원 목록 & 참여코드 ({users.length}명)
          </h3>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-card divide-y divide-slate-100 overflow-hidden">
            {users.map((u) => (
              <div key={u.id} className="p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{u.avatar || '👤'}</span>
                  <div>
                    <span className="font-bold text-slate-900">{u.name}</span>
                    <span className="text-[10px] text-slate-400 block">{u.team}</span>
                  </div>
                </div>
                <code className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-mono font-bold text-[11px]">
                  {u.code}
                </code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
