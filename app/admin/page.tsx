'use client';

import React, { useState, useEffect } from 'react';
import MobileLayout from '@/components/MobileLayout';
import SupabaseConfigError from '@/components/SupabaseConfigError';
import { User, PraiseMessage, AISuggestion, ActivityStats } from '@/lib/types';
import { 
  getCurrentUser, 
  setCurrentUser,
  getUserByCode,
  getAllUsers, 
  getPraises, 
  getIsRevealActive, 
  toggleRevealActive, 
  assignRandomMatesCrossTeam,
  seedSupabaseData,
  deletePraiseMessage,
  getAISuggestionsList,
  saveAISuggestionsList,
  getActivityStats,
  setRevealTargetDate
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
  Lock,
  BarChart3,
  Plus,
  Calendar,
  Eye,
  MessageSquare,
  Monitor,
  ExternalLink,
  KeyRound,
  RefreshCw
} from 'lucide-react';

export default function AdminPage() {
  const [currentUser, setUserState] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [praises, setPraises] = useState<PraiseMessage[]>([]);
  const [isRevealActive, setIsRevealActive] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [configError, setConfigError] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // New admin state for suggestions & stats
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [newSuggestionInput, setNewSuggestionInput] = useState<string>('');
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [targetDateInput, setTargetDateInput] = useState<string>('2026-10-28');
  const [revealDayInfo, setRevealDayInfo] = useState<{ status: string; mode: string; hasWarnings: boolean; hasErrors: boolean } | null>(null);

  // Admin Login Form State
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [adminCodeError, setAdminCodeError] = useState<string | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const loadAdminDashboardData = async () => {
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

    // Fetch AI suggestions
    const sugRes = await getAISuggestionsList();
    if (sugRes.suggestions) {
      setSuggestions(sugRes.suggestions);
    }

    // Fetch Stats
    const statsRes = await getActivityStats();
    if (statsRes.stats) {
      setStats(statsRes.stats);
      setTargetDateInput(statsRes.stats.revealDate || '2026-10-28');
    }

    // Fetch Reveal Day Event Info & Preflight Summary
    try {
      const evRes = await fetch('/api/admin/reveal-day/state?eventId=event-live-20261028');
      const pfRes = await fetch('/api/admin/reveal-day/preflight?eventId=event-live-20261028');
      if (evRes.ok && pfRes.ok) {
        const evData = await evRes.json();
        const pfData = await pfRes.json();
        setRevealDayInfo({
          status: evData.event?.status || 'ready',
          mode: evData.event?.mode || 'live',
          hasWarnings: pfData.hasWarnings,
          hasErrors: pfData.hasErrors
        });
      }
    } catch {}
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminCodeError(null);
    if (!adminCodeInput.trim()) {
      setAdminCodeError('관리자 코드를 입력해 주세요.');
      return;
    }

    setIsVerifyingCode(true);
    try {
      const res = await getUserByCode(adminCodeInput.trim());
      if (res.error) {
        setAdminCodeError(res.error || '올바르지 않은 관리자 코드입니다.');
        setIsVerifyingCode(false);
        return;
      }

      if (res.user && res.user.role === 'admin') {
        await setCurrentUser(res.user);
        setUserState(res.user);
        await loadAdminDashboardData();
        showStatus('관리자 인증이 완료되었습니다. 대시보드에 접속했습니다.');
      } else {
        setAdminCodeError('입력하신 코드는 관리자 권한이 없습니다. ADMIN 전용 코드를 입력해 주세요.');
      }
    } catch (err: any) {
      setAdminCodeError(err.message || '인증 중 오류가 발생했습니다.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  useEffect(() => {
    async function checkCurrentSession() {
      const user = await getCurrentUser();
      setUserState(user);

      if (user && user.role === 'admin') {
        await loadAdminDashboardData();
      }
    }
    checkCurrentSession();
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

  const handleAddSuggestion = async () => {
    if (!newSuggestionInput.trim()) return;
    const updated = [
      ...suggestions,
      { id: `sug-${Date.now()}`, content: newSuggestionInput.trim() }
    ];
    const res = await saveAISuggestionsList(updated);
    if (res.error) {
      showStatus(`저장 실패: ${res.error}`);
      return;
    }
    setSuggestions(updated);
    setNewSuggestionInput('');
    showStatus('새로운 AI Suggestion이 등록되었습니다.');
  };

  const handleDeleteSuggestion = async (id: string) => {
    const updated = suggestions.filter(s => s.id !== id);
    const res = await saveAISuggestionsList(updated);
    if (res.error) {
      showStatus(`삭제 실패: ${res.error}`);
      return;
    }
    setSuggestions(updated);
    showStatus('Suggestion이 삭제되었습니다.');
  };

  const handleSaveRevealDate = async () => {
    if (!targetDateInput) return;
    const res = await setRevealTargetDate(targetDateInput);
    if (res.error) {
      showStatus(`설정 실패: ${res.error}`);
      return;
    }
    showStatus(`Reveal Day 목표일이 ${targetDateInput}로 설정되었습니다.`);
    const statsRes = await getActivityStats();
    if (statsRes.stats) setStats(statsRes.stats);
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

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <MobileLayout>
        <div className="p-6 text-center flex flex-col items-center justify-center min-h-[65vh] gap-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 text-amber-500 flex items-center justify-center border border-amber-500/30 shadow-lg">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-500/15 text-amber-700 border border-amber-500/30 uppercase tracking-wider">
              Admin Authentication
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2 tracking-tight">
              운영 관리자 인증
            </h2>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed mt-1">
              HT사업본부 AI Vitamin Program 관리자 및 <strong>Reveal Day 운영 콘솔</strong> 진입을 위해 ADMIN 코드를 입력해 주세요.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="w-full max-w-xs flex flex-col gap-3 mt-1">
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[11px] font-bold text-slate-700">관리자 인증 코드</label>
              <div className="relative">
                <input
                  type="password"
                  value={adminCodeInput}
                  onChange={(e) => setAdminCodeInput(e.target.value)}
                  placeholder="ADMIN 코드 입력"
                  className="w-full py-3.5 px-4 pr-10 rounded-2xl border border-slate-200 bg-white text-slate-900 font-mono font-bold text-center tracking-widest focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-xs"
                  autoFocus
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {adminCodeError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-1.5 text-left"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{adminCodeError}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isVerifyingCode}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:opacity-95 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
            >
              {isVerifyingCode ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>관리자 권한 검증 중...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>관리자 대시보드 진입</span>
                </>
              )}
            </button>
          </form>

          <Link
            href="/"
            prefetch={true}
            className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors mt-2"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5 pb-6">
        {/* Top Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
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

          <Link
            href="/admin/reveal-day"
            className="px-3 py-1.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black text-xs shadow-sm flex items-center gap-1.5 hover:opacity-95 active:scale-95 transition-all shrink-0"
          >
            <span>🖥️ Reveal Day 운영</span>
          </Link>
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

        {/* 2026-10-28 PC Reveal Day Operation Console Entry Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-500/30 flex flex-col gap-3 relative overflow-hidden ring-2 ring-indigo-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <Monitor className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">PC Reveal Day 운영</h3>
                <span className="text-[10px] text-sky-400 font-bold">2026.10.28 (수) 16:00~17:30</span>
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex items-center gap-1.5">
              {revealDayInfo && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  revealDayInfo.mode === 'live'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {revealDayInfo.mode}
                </span>
              )}
              {revealDayInfo?.hasErrors && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>점검 오류</span>
                </span>
              )}
              {revealDayInfo?.hasWarnings && !revealDayInfo?.hasErrors && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  사전 경고
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            대형 화면 행사 진행, 리허설, 실시간 참여 및 추첨을 관리합니다.
          </p>

          <div className="flex gap-2 mt-1">
            <Link
              href="/admin/reveal-day"
              className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <Monitor className="w-4 h-4 text-sky-200" />
              <span className="text-sm tracking-tight">🖥️ Reveal Day 운영 화면 열기</span>
            </Link>

            <Link
              href="/admin/reveal-day"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center justify-center border border-slate-700 shadow-sm"
              title="새 탭으로 열기"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Feature 4 Admin: Detailed Activity Summary Stats */}
        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-sky-600" />
              프로그램 전체 상세 활동 통계
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">실시간 DB 집계</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-3 rounded-2xl bg-sky-50 border border-sky-100 flex flex-col items-center">
              <span className="text-[11px] text-slate-500 font-bold">총 참여자</span>
              <span className="text-lg font-black text-sky-600 mt-0.5">{stats?.totalUserCount ?? users.length}명</span>
            </div>

            <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 flex flex-col items-center">
              <span className="text-[11px] text-slate-500 font-bold">응원 등록</span>
              <span className="text-lg font-black text-indigo-600 mt-0.5">{stats?.totalPraiseCount ?? praises.length}건</span>
            </div>

            <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100 flex flex-col items-center">
              <span className="text-[11px] text-slate-500 font-bold">Private Note</span>
              <span className="text-lg font-black text-purple-600 mt-0.5">{stats?.totalNoteCount ?? 0}건</span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col items-center">
              <span className="text-[11px] text-slate-500 font-bold">Vitamin Wall 조회</span>
              <span className="text-lg font-black text-emerald-600 mt-0.5">{stats?.wallViewCount ?? 0}회</span>
            </div>
          </div>
        </div>

        {/* Feature 1 Admin: AI Weekly Suggestion Management */}
        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              🌱 이번 주 AI Suggestion 문구 관리 ({suggestions.length}개)
            </h3>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            사용자 Home 상단에 무작위로 제시될 6~8개 제안 문구를 등록 및 관리합니다.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={newSuggestionInput}
              onChange={(e) => setNewSuggestionInput(e.target.value)}
              placeholder="예: 회의에서 좋은 의견을 먼저 인정해 보세요."
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleAddSuggestion}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> 추가
            </button>
          </div>

          <div className="flex flex-col gap-2 mt-1">
            {suggestions.map((s) => (
              <div key={s.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2 text-xs font-medium text-slate-800">
                <span>&ldquo;{s.content}&rdquo;</span>
                <button
                  onClick={() => handleDeleteSuggestion(s.id)}
                  className="text-red-500 hover:text-red-700 p-1 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Feature 2 Admin: Reveal Target Date Setting */}
        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-purple-600" />
              🎁 Reveal Day 목표 날짜 설정
            </h3>
            <span className="text-[10px] text-purple-600 font-extrabold bg-purple-50 px-2 py-0.5 rounded-full">
              D-{stats?.revealDaysLeft ?? 0}일 남음
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="date"
              value={targetDateInput}
              onChange={(e) => setTargetDateInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSaveRevealDate}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shrink-0"
            >
              날짜 설정
            </button>
          </div>
        </div>

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

      {/* Confirmation Modal for Mystery Mate Re-assignment */}
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
