'use client';

import React, { useState, useEffect } from 'react';
import MobileLayout from '@/components/MobileLayout';
import SupabaseConfigError from '@/components/SupabaseConfigError';
import { User, PraiseMessage } from '@/lib/types';
import { getCurrentUser, getPraises, incrementWallViewCount } from '@/lib/db';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, MessageSquare, ArrowLeft, Sparkles, Smile } from 'lucide-react';

export default function WallPage() {
  const [currentUser, setUserState] = useState<User | null>(null);
  const [praises, setPraises] = useState<PraiseMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'recent'>('all');
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    async function loadData() {
      const user = await getCurrentUser();
      setUserState(user);

      incrementWallViewCount();

      const listRes = await getPraises();
      if (listRes.error === 'SUPABASE_UNCONFIGURED') {
        setConfigError(true);
        return;
      }
      setPraises(listRes.praises || []);
    }
    loadData();
  }, []);

  const getFilteredPraises = () => {
    const list = [...praises];
    if (activeTab === 'recent') {
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list; // 'all'
  };

  const filteredPraises = getFilteredPraises();

  if (configError) {
    return (
      <MobileLayout>
        <SupabaseConfigError />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5">
        {/* Top Header */}
        <div className="flex items-center gap-3">
          <Link href="/" prefetch={true} className="p-2 rounded-full hover:bg-slate-200/60 text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Vitamin Wall
          </h2>
        </div>

        {/* Sub Header */}
        <p className="text-xs text-slate-500 font-medium -mt-2">
          우리 본부의 좋은 이야기 함께 보면, 더 좋은 팀이 됩니다.
        </p>

        {/* Filter Tabs */}
        <div className="flex bg-slate-200/70 p-1 rounded-2xl gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-white text-sky-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            전체 ({praises.length})
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'recent'
                ? 'bg-white text-purple-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            최근순
          </button>
        </div>

        {/* Cards Feed */}
        <div className="flex flex-col gap-3.5">
          {filteredPraises.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 text-slate-400 text-xs">
              아직 도착한 칭찬 메시지가 없습니다. 첫 번째 비타민을 보내보세요!
            </div>
          ) : (
            filteredPraises.map((praise, idx) => (
              <motion.div
                key={praise.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-5 rounded-3xl bg-white border border-slate-100 shadow-card flex flex-col gap-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 text-white font-bold text-xs flex items-center justify-center">
                      {praise.recipientName.substring(0, 1)}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">
                        {praise.recipientName}님
                      </h4>
                      {praise.recipientTeam && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {praise.recipientTeam}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-full">
                    {praise.isMatePraise ? '익명의 Vitamin Mate' : '익명의 동료'}
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  &ldquo;{praise.refinedContent || praise.content}&rdquo;
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(praise.createdAt).toLocaleDateString()}
                  </span>

                  <span className="inline-flex items-center gap-1 text-[10px] text-pink-500 font-bold bg-pink-50 px-2 py-0.5 rounded-full">
                    <Heart className="w-3 h-3 fill-pink-500" /> 비타민 전달됨
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
