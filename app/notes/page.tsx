'use client';

import React, { useState, useEffect } from 'react';
import MobileLayout from '@/components/MobileLayout';
import SupabaseConfigError from '@/components/SupabaseConfigError';
import { User, PrivateNote } from '@/lib/types';
import { getCurrentUser, getAllUsers, getNotesForUser, saveNote, deleteNote } from '@/lib/db';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Lock, Plus, Save, Trash2, ArrowLeft, CheckCircle, Edit3, X, User as UserIcon } from 'lucide-react';

export default function NotesPage() {
  const [currentUser, setUserState] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [notes, setNotes] = useState<PrivateNote[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);
  const [configError, setConfigError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const user = await getCurrentUser();
        setUserState(user);

        if (user) {
          const [usersRes, notesRes] = await Promise.all([
            getAllUsers(),
            getNotesForUser(user.id)
          ]);

          if (usersRes.error === 'SUPABASE_UNCONFIGURED' || notesRes.error === 'SUPABASE_UNCONFIGURED') {
            setConfigError(true);
            return;
          }

          setAllUsers((usersRes.users || []).filter(u => u.id !== user.id && u.role !== 'admin'));
          setNotes(notesRes.notes || []);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSelectTarget = (targetId: string) => {
    setSelectedTargetId(targetId);
    setEditingNoteId(null);
    setNoteText('');
  };

  const handleStartEditNote = (note: PrivateNote) => {
    setSelectedTargetId(note.targetUserId);
    setEditingNoteId(note.id);
    setNoteText(note.content);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setNoteText('');
  };

  const handleSave = async () => {
    if (!currentUser || !selectedTargetId || !noteText.trim()) return;
    const res = await saveNote(currentUser.id, selectedTargetId, noteText.trim(), editingNoteId || undefined);
    if (res.error === 'SUPABASE_UNCONFIGURED') {
      setConfigError(true);
      return;
    }
    
    // Refresh notes
    const updatedNotes = await getNotesForUser(currentUser.id);
    setNotes(updatedNotes.notes || []);
    setNoteText('');
    setEditingNoteId(null);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!currentUser) return;
    if (!window.confirm('이 관찰 메모를 삭제하시겠습니까?')) return;

    await deleteNote(currentUser.id, noteId);
    const updatedNotes = await getNotesForUser(currentUser.id);
    setNotes(updatedNotes.notes || []);
    if (editingNoteId === noteId) {
      setEditingNoteId(null);
      setNoteText('');
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

  const selectedTargetUser = allUsers.find(u => u.id === selectedTargetId);
  const targetNotes = notes.filter(n => n.targetUserId === selectedTargetId);

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5">
        {/* Top Header */}
        <div className="flex items-center gap-3">
          <Link href="/" prefetch={true} className="p-2 rounded-full hover:bg-slate-200/60 text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              내 관찰 메모장
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">동료 한 명에게 여러 개의 관찰 메모를 남길 수 있습니다</p>
          </div>
        </div>

        {/* Notice */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 shadow-xs">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold text-emerald-900">
              100% 비공개 다중 관찰 메모
            </h3>
            <p className="text-[11px] text-emerald-700 mt-0.5 leading-snug font-medium">
              이 공간에 적는 메모는 오직 본인만 볼 수 있습니다. 발견할 때마다 편하게 여러 개를 기록해 보세요.
            </p>
          </div>
        </div>

        {/* Note Writing Section */}
        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              관찰할 동료 선택
            </label>
            {editingNoteId && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                기존 메모 수정 모드
              </span>
            )}
          </div>
          <select
            value={selectedTargetId}
            onChange={(e) => handleSelectTarget(e.target.value)}
            className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">-- 동료를 선택하세요 --</option>
            {allUsers.map((u) => {
              const count = notes.filter(n => n.targetUserId === u.id).length;
              return (
                <option key={u.id} value={u.id}>
                  {u.name}님 ({u.team}) {count > 0 ? `[메모 ${count}개]` : ''}
                </option>
              );
            })}
          </select>

          {selectedTargetId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex flex-col gap-3 mt-1"
            >
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                  {selectedTargetUser?.name}님에 대한 메모 {editingNoteId ? '수정' : '추가'}
                </span>
                {editingNoteId && (
                  <button
                    onClick={handleCancelEdit}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-700 flex items-center gap-0.5"
                  >
                    <X className="w-3.5 h-3.5" /> 새 메모 작성으로 전환
                  </button>
                )}
              </div>

              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="이 동료의 멋진 행동, 배려받은 순간, 칭찬거리 아이디어를 적어보세요..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[90px] resize-none"
              />
              <div className="flex items-center justify-between">
                {isSaved ? (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> 성공적으로 저장되었습니다!
                  </span>
                ) : <span />}

                <div className="flex items-center gap-2 ml-auto">
                  {editingNoteId && (
                    <button
                      onClick={handleCancelEdit}
                      className="py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all"
                    >
                      취소
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={!noteText.trim()}
                    className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    {editingNoteId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    <span>{editingNoteId ? '메모 수정 완료' : '+ 새 메모 추가'}</span>
                  </button>
                </div>
              </div>

              {/* List of notes for currently selected target */}
              {targetNotes.length > 0 && (
                <div className="mt-2 pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <span className="text-[11px] font-extrabold text-slate-700">
                    {selectedTargetUser?.name}님에게 남긴 메모 ({targetNotes.length}개)
                  </span>
                  <div className="flex flex-col gap-2">
                    {targetNotes.map((tn) => (
                      <div
                        key={tn.id}
                        className={`p-3 rounded-xl border transition-all text-xs flex flex-col gap-1.5 ${
                          editingNoteId === tn.id
                            ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400'
                            : 'bg-slate-50/80 border-slate-100'
                        }`}
                      >
                        <p className="text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                          {tn.content}
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[10px] text-slate-400">
                          <span>{new Date(tn.updatedAt).toLocaleDateString()}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStartEditNote(tn)}
                              className="font-bold text-emerald-600 hover:underline flex items-center gap-0.5"
                            >
                              <Edit3 className="w-3 h-3" /> 수정
                            </button>
                            <button
                              onClick={() => handleDeleteNote(tn.id)}
                              className="font-bold text-rose-500 hover:underline flex items-center gap-0.5"
                            >
                              <Trash2 className="w-3 h-3" /> 삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Existing Notes List */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              저장된 전체 관찰 메모 ({isLoading ? '...' : `${notes.length}개`})
            </h3>
            {notes.length > 0 && (
              <span className="text-[10px] text-slate-400 font-medium">
                {new Set(notes.map(n => n.targetUserId)).size}명의 동료
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs animate-pulse flex flex-col gap-2">
                  <div className="flex justify-between">
                    <div className="h-3.5 w-24 bg-slate-200 rounded" />
                    <div className="h-3 w-16 bg-slate-200 rounded" />
                  </div>
                  <div className="h-10 w-full bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-2xl border border-slate-100 text-xs text-slate-400">
              작성된 메모가 없습니다. 위에서 동료를 선택하여 메모를 남겨보세요.
            </div>
          ) : (
            notes.map((n) => {
              const targetUser = allUsers.find(u => u.id === n.targetUserId);
              if (!targetUser) return null;

              return (
                <div
                  key={n.id}
                  className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs hover:border-emerald-200 transition-all flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span 
                      onClick={() => handleSelectTarget(n.targetUserId)}
                      className="text-xs font-bold text-slate-800 cursor-pointer hover:text-emerald-600"
                    >
                      {targetUser.name}님 <span className="text-slate-400 font-normal">({targetUser.team})</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(n.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl whitespace-pre-wrap">
                    &ldquo;{n.content}&rdquo;
                  </p>
                  <div className="flex items-center justify-end gap-3 pt-0.5 text-[11px]">
                    <button
                      onClick={() => handleStartEditNote(n)}
                      className="font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> 수정
                    </button>
                    <button
                      onClick={() => handleDeleteNote(n.id)}
                      className="font-bold text-rose-500 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 삭제
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

