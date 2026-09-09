'use client';

import React, { useState, useEffect, useRef } from 'react';
import MobileLayout from '@/components/MobileLayout';
import SupabaseConfigError from '@/components/SupabaseConfigError';
import { User, PraiseMessage, TimeCapsule } from '@/lib/types';
import { getCurrentUser, getMatesForUser, getPraises, getIsRevealActive } from '@/lib/db';
import { fetchAITimeCapsule } from '@/lib/aiService';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Gift, Heart, Award, ArrowLeft, Lock, FileText, Image as ImageIcon, Download, CheckCircle2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function RevealPage() {
  const [currentUser, setUserState] = useState<User | null>(null);
  const [isRevealActive, setIsRevealActive] = useState<boolean>(false);
  const [myMates, setMyMates] = useState<User[]>([]);
  const [receivedPraises, setReceivedPraises] = useState<PraiseMessage[]>([]);
  const [timeCapsule, setTimeCapsule] = useState<TimeCapsule | null>(null);
  const [isLoadingCapsule, setIsLoadingCapsule] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [configError, setConfigError] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      const user = await getCurrentUser();
      setUserState(user);

      const reveal = await getIsRevealActive();
      setIsRevealActive(reveal);

      if (user) {
        // Fetch assigned mates
        const matesRes = await getMatesForUser(user.id);
        if (matesRes.error === 'SUPABASE_UNCONFIGURED') {
          setConfigError(true);
          return;
        }
        setMyMates(matesRes.mates || []);

        // Fetch received praises
        const praisesRes = await getPraises();
        if (praisesRes.error === 'SUPABASE_UNCONFIGURED') {
          setConfigError(true);
          return;
        }
        const myReceived = (praisesRes.praises || []).filter(p => p.recipientUserId === user.id);
        setReceivedPraises(myReceived);

        // Generate Time Capsule
        if (reveal) {
          setIsLoadingCapsule(true);
          const capsule = await fetchAITimeCapsule(
            user.name,
            myReceived.map(p => p.refinedContent || p.content)
          );
          setTimeCapsule(capsule);
          setIsLoadingCapsule(false);

          // Fire celebratory confetti!
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 }
            });
          } catch (e) {}
        }
      }
    }
    loadData();
  }, []);

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `HT_AI_Vitamin_TimeCapsule_${currentUser?.name || 'User'}.png`;
      link.click();
    } catch (err) {
      console.error('Image export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`HT_AI_Vitamin_TimeCapsule_${currentUser?.name || 'User'}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  if (configError) {
    return (
      <MobileLayout>
        <SupabaseConfigError />
      </MobileLayout>
    );
  }

  if (!currentUser) {
    return (
      <MobileLayout>
        <div className="p-6 text-center text-slate-500">
          참여코드를 입력해 로그인해 주세요.
        </div>
      </MobileLayout>
    );
  }

  if (!isRevealActive) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 gap-4">
          <div className="w-20 h-20 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shadow-inner">
            <Lock className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Reveal Day 준비 중입니다 🎁
          </h2>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            HT사업본부 AI Vitamin Program 운영이 완료된 후, 나를 관심 깊게 지켜봐 준 Mystery Mate와 AI Time Capsule 편지가 여기서 공개됩니다!
          </p>
          <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 text-[11px] text-purple-700 font-bold mt-2">
            관리자가 Reveal을 실행하면 즉시 열람 가능합니다.
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="flex flex-col gap-6 pb-6">
        {/* Top Header */}
        <div className="flex items-center gap-3">
          <Link href="/" prefetch={true} className="p-2 rounded-full hover:bg-slate-200/60 text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Reveal Day
          </h2>
        </div>

        {/* Top Banner */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-6 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-500 text-white text-center shadow-float relative overflow-hidden flex flex-col items-center gap-2"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-sm mb-1">
            🎁
          </div>
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-[11px] font-black rounded-full uppercase tracking-wider text-purple-100">
            Reveal Day
          </span>
          <h2 className="text-2xl font-black tracking-tight">
            Reveal Day에 오신 것을 축하합니다!
          </h2>
          <p className="text-xs text-purple-100 max-w-xs leading-relaxed font-medium">
            그동안 서로의 좋은 점을 발견해 주셔서 감사합니다.
          </p>
        </motion.div>

        {/* Section 1: 내가 응원했던 Mystery Mate */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
            <Gift className="w-4 h-4 text-purple-600" />
            내가 응원했던 Mystery Mate
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {myMates.map((mate) => (
              <div
                key={mate.id}
                className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col items-center text-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-2xl">
                  {mate.avatar || '👤'}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">{mate.name}님</h4>
                  <span className="text-[10px] text-slate-400 font-medium">{mate.team}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature 3: Apple Style AI Time Capsule Card (with Export options) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-300" />
              AI Time Capsule 헌정 카드
            </h3>
            
            {/* Export Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleDownloadImage}
                disabled={isExporting || isLoadingCapsule}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-extrabold flex items-center gap-1 shadow-2xs transition-all active:scale-95"
              >
                <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                <span>이미지 저장</span>
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={isExporting || isLoadingCapsule}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-2xs transition-all active:scale-95"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF 저장</span>
              </button>
            </div>
          </div>

          {/* Exportable Apple Style Card Element */}
          <div 
            ref={cardRef}
            className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-card flex flex-col gap-5 relative overflow-hidden"
          >
            {/* Header branding */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-600 text-white flex items-center justify-center text-2xl shadow-sm">
                  {currentUser.avatar || '👤'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-base font-black text-slate-900">{currentUser.name}님</h4>
                    <span className="text-[10px] bg-sky-100 text-sky-700 font-extrabold px-2 py-0.5 rounded-full">
                      HT AI Vitamin
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{currentUser.team}</span>
                </div>
              </div>
              <span className="text-2xl">💌</span>
            </div>

            {isLoadingCapsule ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                <span>AI가 수집된 칭찬을 분석해 편지를 작성하고 있습니다...</span>
              </div>
            ) : (
              <>
                {/* ① 대표 키워드 */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-extrabold text-slate-500 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-blue-600" />
                    대표 키워드
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(timeCapsule?.keywords || ['협업', '배려', '책임감', '전문성', '긍정에너지']).map((kw, i) => (
                      <span
                        key={i}
                        className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                          i === 0 ? 'bg-sky-100 text-sky-700' :
                          i === 1 ? 'bg-purple-100 text-purple-700' :
                          i === 2 ? 'bg-emerald-100 text-emerald-700' :
                          i === 3 ? 'bg-indigo-100 text-indigo-700' : 'bg-pink-100 text-pink-700'
                        }`}
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ② AI 분석 요약 */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-extrabold text-slate-500">
                    AI 동료 분석
                  </span>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-800 leading-relaxed">
                    {timeCapsule?.analysis || `동료들은 ${currentUser.name}님을 항상 먼저 도와주는 사람, 회의 분위기를 좋게 만드는 사람으로 기억했습니다.`}
                  </div>
                </div>

                {/* ③ AI 감사 편지 */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-extrabold text-slate-500">
                    AI 헌정 편지
                  </span>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50/60 border border-sky-100 text-xs font-bold text-slate-800 leading-relaxed whitespace-pre-line shadow-xs">
                    {timeCapsule?.letter || `지난 두 달 동안 동료들이 보내준 응원과 칭찬을 분석했습니다.\n많은 사람들이 ${currentUser.name}님의 배려와 책임감을 이야기했습니다.\n앞으로도 좋은 에너지를 전해주세요.\n\n- AI Vitamin -`}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Section 4: 나에게 도착한 칭찬 메시지 리스트 */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-pink-500 fill-pink-300" />
            나에게 도착한 칭찬 메시지 ({receivedPraises.length}개)
          </h3>

          <div className="flex flex-col gap-2.5">
            {receivedPraises.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-2xl text-xs text-slate-400 border border-slate-100">
                아직 도착한 칭찬 메시지가 없습니다.
              </div>
            ) : (
              receivedPraises.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col gap-1.5"
                >
                  <p className="text-xs font-bold text-slate-800 leading-relaxed">
                    &ldquo;{p.refinedContent || p.content}&rdquo;
                  </p>
                  <span className="text-[10px] text-purple-600 font-bold self-end bg-purple-50 px-2 py-0.5 rounded-full">
                    ❤️ {p.likes}개 공감받음
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
