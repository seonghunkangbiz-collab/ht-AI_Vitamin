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
  seedSupabaseData,
  deletePraiseMessage
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
  Database,
  Trash2,
  Lock
} from 'lucide-react';

export default function AdminPage() {
  const [currentUser, setUserState] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [praises, setPraises] = useState<PraiseMessage[]>([]);
  const [isRevealActive, setIsRevealActive] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [configError, setConfigError] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      const user = await getCurrentUser();
      setUserState(user);

      if (user && user.role === 'admin') {
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
    showStatus('Supabase 공용 DB에 초기 24명 임직원 데이터 저장이 완료되었습니다!');
    
    // Refresh user list
    const allUsersRes = await getAllUsers();
    setUsers((allUsersRes.users || []).filter(u => u.role !== 'admin'));
  };

  const handleToggleReveal = async () => {
    const nextState = !isRevealActive;
    await toggleRevealActive(nextState);
    setIsRevealActive(nextState);
    showStatus(nextState ? 'Reveal Day가 공개되었습니다! 🎁' : 'Reveal Day가 비공개 상태로 변경되었습니다.');
  };

  const handleConfirmShuffleMates = async () => {
    setShowConfirmModal(false);
    const res = await assignRandomMatesCrossTeam();
    if (res.error === 'SUPABASE_UNCONFIGURED') {
      setConfigError(true);
      return;
    }
    if (res.error) {
      showStatus(`배정 오류: ${res.error}`);
      return;
    }
    showStatus(`24명 임직원에 대한 타팀 우선 Mystery Mate 2명 배정이 완료되었습니다!`);
  };

  const handleDeletePraise = async (id: string) => {
    if (!window.confirm('이 칭찬 메시지를 부적절 내용으로 판단하여 삭제하시겠습니까?')) return;
    const res = await deletePraiseMessage(id);
    if (res.error) {
      showStatus(`삭제 실패: ${res.error}`);
      return;
    }
    setPraises(prev => prev.filter(p => p.id !== id));
    showStatus('메시지가 삭제 처리되었습니다.');
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'ID,작성자ID(관리자),수신자,수신팀,칭찬내용,작성일시\n';
    praises.forEach(p => {
      const row = `"${p.id}","${p.senderUserId || ''}","${p.recipientName}","${p.recipientTeam || ''}","${p.refinedContent || p.content}","${p.createdAt}"`;
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

  // Requirement #12: Role Protection for Admin Page
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <MobileLayout>
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">
            접근 권한이 없습니다
          </h3>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            운영자(role=admin) 전용 화면입니다. 참여코드 <code className="bg-slate-200 px-2 py-0.5 rounded font-mono font-bold text-slate-800">VIT-ADMIN</code> 계정으로 로그인해 주세요.
          </p>
          <Link
            href="/"
            className="mt-2 py-2.5 px-5 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5 pb-6">
        {/* Top Title */}
        <div className="flex items-center gap-3">
          <Link href="/" prefetch={true} className="p-2 rounded-full hover:bg-slate-200/60 text-slate-600 transition-colors">
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
          {/* Seed Initial Data */}
          <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-600" />
                24명 임직원 데이터 초기 등록
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Supabase 등록</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              HT사업본부 24명 임직원 프로필과 참여코드를 Supabase DB에 등록합니다.
            </p>
            <button
              onClick={handleSeedData}
              className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Database className="w-4 h-4" />
              <span>초기 24명 데이터 저장 실행</span>
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
              HT사업본부 대상 타 부서 임직원을 우선하여 Mystery Mate 2명을 배정합니다.
            </p>
            <button
              onClick={() => setShowConfirmModal(true)}
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
              수집된 전체 Vitamin Wall 칭찬 메시지 데이터를 CSV 파일로 추출합니다.
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

        {/* Praise Moderation Section */}
        <div className="flex flex-col gap-3 mt-2">
          <h3 className="text-xs font-extrabold text-slate-900 flex items-center justify-between">
            <span>게시된 칭찬 메시지 관리 ({praises.length}건)</span>
          </h3>

          <div className="flex flex-col gap-2">
            {praises.length === 0 ? (
              <div className="p-4 text-center bg-white rounded-2xl text-xs text-slate-400">
                등록된 칭찬 메시지가 없습니다.
              </div>
            ) : (
              praises.map(p => (
                <div key={p.id} className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      수신: <span className="text-blue-600">{p.recipientName}님</span> ({p.recipientTeam})
                    </span>
                    <button
                      onClick={() => handleDeletePraise(p.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 삭제
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl">
                    &ldquo;{p.refinedContent || p.content}&rdquo;
                  </p>
                </div>
              ))
            )}
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

      {/* Confirmation Modal for Mystery Mate Re-assignment (Requirement #7) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Mystery Mate 재배정 확인</h3>
              <p className="text-xs text-amber-700 font-bold mt-1">
                &ldquo;기존 Mystery Mate 배정이 모두 변경됩니다.&rdquo;
              </p>
              <p className="text-xs text-slate-500 mt-1">
                전체 24명 임직원에게 새로운 타팀 Mystery Mate 2명이 새로 랜덤 매칭됩니다. 계속하시겠습니까?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl"
              >
                취소
              </button>
              <button
                onClick={handleConfirmShuffleMates}
                className="flex-1 py-3 bg-sky-600 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                새로 배정하기
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
