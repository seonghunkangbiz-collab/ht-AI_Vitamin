'use client';

import React, { useState, useEffect } from 'react';
import MobileLayout from '@/components/MobileLayout';
import { User, PrivateNote } from '@/lib/types';
import { getCurrentUser, getAllUsers, getNotesForUser, saveNote } from '@/lib/db';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Lock, Plus, Save, Trash2, ArrowLeft, CheckCircle } from 'lucide-react';

export default function NotesPage() {
  const [currentUser, setUserState] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [notes, setNotes] = useState<PrivateNote[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [noteText, setNoteText] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    async function loadData() {
      const user = await getCurrentUser();
      setUserState(user);

      if (user) {
        const users = await getAllUsers();
        setAllUsers(users.filter(u => u.id !== user.id && u.role !== 'admin'));

        const userNotes = await getNotesForUser(user.id);
        setNotes(userNotes);
      }
    }
    loadData();
  }, []);

  const handleSelectTarget = (targetId: string) => {
    setSelectedTargetId(targetId);
    const existing = notes.find(n => n.targetUserId === targetId);
    setNoteText(existing ? existing.content : '');
  };

  const handleSave = async () => {
    if (!currentUser || !selectedTargetId) return;
    const saved = await saveNote(currentUser.id, selectedTargetId, noteText);
    
    // Refresh notes
    const updatedNotes = await getNotesForUser(currentUser.id);
    setNotes(updatedNotes);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

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
        {/* Top Header */}
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-full hover:bg-slate-200/60 text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            내 관찰 메모장
          </h2>
        </div>

        {/* Notice */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 shadow-xs">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold text-emerald-900">
              100% 비공개 메모
            </h3>
            <p className="text-[11px] text-emerald-700 mt-0.5 leading-snug font-medium">
              이 공간에 적는 메모는 오직 본인만 볼 수 있습니다. Reveal Day 칭찬 메시지 작성에 활용해보세요.
            </p>
          </div>
        </div>

        {/* Note Writing Section */}
        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-card flex flex-col gap-3">
          <label className="text-xs font-bold text-slate-700">
            관찰할 동료 선택
          </label>
          <select
            value={selectedTargetId}
            onChange={(e) => handleSelectTarget(e.target.value)}
            className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">-- 동료를 선택하세요 --</option>
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}님 ({u.team})
              </option>
            ))}
          </select>

          {selectedTargetId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex flex-col gap-3 mt-2"
            >
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="이 동료의 멋진 행동, 배려받은 순간, 칭찬거리를 자유롭게 적어보세요..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] resize-none"
              />
              <div className="flex items-center justify-between">
                {isSaved ? (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> 성공적으로 저장되었습니다!
                  </span>
                ) : <span />}

                <button
                  onClick={handleSave}
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all ml-auto"
                >
                  <Save className="w-4 h-4" />
                  <span>메모 저장</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Existing Notes List */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
            <BookOpen className="w-4 h-4 text-emerald-500" />
            저장된 관찰 메모 ({notes.length}개)
          </h3>

          {notes.length === 0 ? (
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
                  onClick={() => handleSelectTarget(n.targetUserId)}
                  className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs hover:border-emerald-200 transition-all cursor-pointer flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      {targetUser.name}님 <span className="text-slate-400 font-normal">({targetUser.team})</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(n.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl">
                    &ldquo;{n.content}&rdquo;
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
