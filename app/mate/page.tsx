'use client';

import React, { useState, useEffect } from 'react';
import MobileLayout from '@/components/MobileLayout';
import SupabaseConfigError from '@/components/SupabaseConfigError';
import { User, PrivateNote } from '@/lib/types';
import { getCurrentUser, getMatesForUser, getNotesForUser, saveNote } from '@/lib/db';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, EyeOff, Heart, PenTool, Lightbulb, CheckCircle, ArrowLeft } from 'lucide-react';

export default function MatePage() {
  const [currentUser, setUserState] = useState<User | null>(null);
  const [mates, setMates] = useState<User[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [editingMateId, setEditingMateId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  const [configError, setConfigError] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const user = await getCurrentUser();
        setUserState(user);

        if (user) {
          const [matesRes, notesRes] = await Promise.all([
            getMatesForUser(user.id),
            getNotesForUser(user.id)
          ]);

          if (matesRes.error === 'SUPABASE_UNCONFIGURED' || notesRes.error === 'SUPABASE_UNCONFIGURED') {
            setConfigError(true);
            return;
          }

          setMates(matesRes.mates || []);

          const noteMap: Record<string, string> = {};
          (notesRes.notes || []).forEach(n => {
            noteMap[n.targetUserId] = n.content;
          });
          setNotes(noteMap);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenNoteEditor = (targetUser: User) => {
    setEditingMateId(targetUser.id);
    setTempNote(notes[targetUser.id] || '');
  };

  const handleSaveNote = async (targetUserId: string) => {
    if (!currentUser) return;
    const res = await saveNote(currentUser.id, targetUserId, tempNote);
    if (res.error === 'SUPABASE_UNCONFIGURED') {
      setConfigError(true);
      return;
    }
    setNotes(prev => ({ ...prev, [targetUserId]: tempNote }));
    setEditingMateId(null);
    setSavedSuccess(targetUserId);
    setTimeout(() => setSavedSuccess(null), 3000);
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

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5">
        {/* Top Title */}
        <div className="flex items-center gap-3">
          <Link href="/" prefetch={true} className="p-2 rounded-full hover:bg-slate-200/60 text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            My Mystery Mate
          </h2>
        </div>

        {/* Notice Card */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-3 shadow-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">
            <EyeOff className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-indigo-900">
              이번 기간, 내가 관심 가질 동료
            </h3>
            <p className="text-[11px] text-indigo-600 mt-0.5 leading-snug font-medium">
              상대방은 내가 누구인지 절대 알 수 없어요! 자연스럽게 좋은 점을 찾아보세요.
            </p>
          </div>
        </motion.div>

        {/* Mate List Cards */}
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="flex flex-col gap-4">
              <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-xs animate-pulse flex flex-col gap-3">
                <div className="h-4 w-20 bg-slate-200 rounded-full" />
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-200" />
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-24 bg-slate-200 rounded" />
                    <div className="h-3 w-32 bg-slate-200 rounded" />
                  </div>
                </div>
              </div>
              <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-xs animate-pulse flex flex-col gap-3">
                <div className="h-4 w-20 bg-slate-200 rounded-full" />
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-200" />
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-24 bg-slate-200 rounded" />
                    <div className="h-3 w-32 bg-slate-200 rounded" />
                  </div>
                </div>
              </div>
            </div>
          ) : mates.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 text-slate-400 text-xs">
              배정된 Mystery Mate가 없습니다. 관리자에게 문의해 주세요.
            </div>
          ) : (
            mates.map((mate, index) => {
              const noteContent = notes[mate.id] || '';
              const isEditing = editingMateId === mate.id;

              return (
                <motion.div
                  key={mate.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-5 rounded-3xl bg-white border border-slate-100 shadow-card flex flex-col gap-4 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-sky-50 text-sky-700 text-xs font-black rounded-full">
                      Mate 0{index + 1}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">타팀 비밀 배정</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-100 to-indigo-100 flex items-center justify-center text-3xl shadow-sm">
                      {mate.avatar || '👤'}
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900">
                        {mate.name}님
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">{mate.team}</p>
                    </div>
                  </div>

                  {/* Note Section */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <PenTool className="w-3.5 h-3.5 text-emerald-500" />
                        나만의 비공개 관찰 메모
                      </span>
                      {!isEditing && (
                        <button
                          onClick={() => handleOpenNoteEditor(mate)}
                          className="text-[11px] font-bold text-emerald-600 hover:underline"
                        >
                          {noteContent ? '수정' : '+ 작성하기'}
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="flex flex-col gap-2 mt-1">
                        <textarea
                          value={tempNote}
                          onChange={(e) => setTempNote(e.target.value)}
                          placeholder="동료의 좋은 점이나 칭찬거리 아이디어를 비공개로 적어두세요..."
                          className="w-full p-2.5 rounded-xl border border-emerald-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 h-20 resize-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingMateId(null)}
                            className="px-3 py-1 bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg"
                          >
                            취소
                          </button>
                          <button
                            onClick={() => handleSaveNote(mate.id)}
                            className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-xs"
                          >
                            저장
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {noteContent ? (
                          <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-2.5 rounded-xl border border-slate-100">
                            &ldquo;{noteContent}&rdquo;
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">
                            아직 적어둔 메모가 없습니다. 칭찬할만한 좋은 점을 적어두세요.
                          </p>
                        )}
                      </div>
                    )}

                    {savedSuccess === mate.id && (
                      <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-1">
                        <CheckCircle className="w-3.5 h-3.5" /> 메모가 안심 저장되었습니다!
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Link
                      href={`/thanks?recipientId=${mate.id}`}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm hover:opacity-95 text-center flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Heart className="w-4 h-4 fill-white/20" />
                      <span>{mate.name}님에게 칭찬 보내기</span>
                    </Link>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Tip Box */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/70 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed font-medium">
            <span className="font-bold">💡 팁:</span> 꼭 먼저 다가갈 필요는 없어요. 평소 업무 속에서 자연스럽게 좋은 점을 발견해 보세요.
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}
