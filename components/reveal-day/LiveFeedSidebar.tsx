'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSupabaseClient } from '@/lib/supabase';
import { MessageSquare, Heart, Sparkles, Users, X, ChevronRight } from 'lucide-react';
import { REACTION_EMOJIS, REACTION_LABELS } from './CheerOverlay';

export interface FeedMessage {
  id: string;
  senderName: string;
  senderTeam: string;
  message?: string | null;
  reaction: string;
  timestamp: number;
}

interface LiveFeedSidebarProps {
  eventId: string;
  checkinCount?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function LiveFeedSidebar({
  eventId,
  checkinCount = 0,
  isOpen,
  onClose
}: LiveFeedSidebarProps) {
  const [messages, setMessages] = useState<FeedMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(true);

  // Add message with deduplication
  const addMessage = useCallback((msg: FeedMessage) => {
    if (seenIdsRef.current.has(msg.id)) return;
    seenIdsRef.current.add(msg.id);
    if (seenIdsRef.current.size > 200) {
      const arr = Array.from(seenIdsRef.current);
      seenIdsRef.current = new Set(arr.slice(-100));
    }
    setMessages(prev => [...prev.slice(-40), msg]);
  }, []);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 1. Supabase Realtime Broadcast Listener (Sub-50ms instant live communication)
  useEffect(() => {
    isMountedRef.current = true;
    try {
      const sb = getSupabaseClient();
      const channelName = `reveal_channel_${eventId}`;

      const channel = sb
        .channel(channelName)
        .on('broadcast', { event: 'cheer' }, (payload) => {
          if (!isMountedRef.current) return;
          const data = payload?.payload || payload;
          if (!data) return;
          addMessage({
            id: data.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            senderName: data.senderName || '익명 메이트',
            senderTeam: data.senderTeam || '',
            message: data.message || null,
            reaction: data.reaction || 'clap',
            timestamp: Date.now()
          });
        })
        .on('broadcast', { event: 'reaction' }, (payload) => {
          if (!isMountedRef.current) return;
          const data = payload?.payload || payload;
          if (!data) return;
          addMessage({
            id: data.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            senderName: data.senderName || '익명 메이트',
            senderTeam: data.senderTeam || '',
            message: null,
            reaction: data.reaction || 'heart',
            timestamp: Date.now()
          });
        })
        .subscribe();

      return () => {
        isMountedRef.current = false;
        try {
          sb.removeChannel(channel);
        } catch {}
      };
    } catch {}
  }, [eventId, addMessage]);

  // 2. Initial & Periodic Fallback Poll for Recent Cheers
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await fetch(`/api/reveal-day/interactions?type=recent_cheers&eventId=${encodeURIComponent(eventId)}&_t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.cheers) && isMountedRef.current) {
            data.cheers.reverse().forEach((c: any) => {
              addMessage({
                id: c.id,
                senderName: c.senderName || '익명 메이트',
                senderTeam: c.senderTeam || '',
                message: c.message,
                reaction: c.reaction || 'heart',
                timestamp: c.timestamp || Date.now()
              });
            });
          }
        }
      } catch {}
    };

    fetchRecent();
    const interval = setInterval(fetchRecent, 1500);
    return () => clearInterval(interval);
  }, [eventId, addMessage]);

  if (!isOpen) return null;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 80, width: 0 }}
      animate={{ opacity: 1, x: 0, width: 360 }}
      exit={{ opacity: 0, x: 80, width: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="h-full flex flex-col bg-slate-900/95 border-l border-slate-800 backdrop-blur-2xl shadow-2xl relative select-none shrink-0 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white tracking-tight">라이브 소통 피드</span>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Users className="w-3 h-3 text-sky-400" />
              <span>체크인: <strong>{checkinCount}</strong>명 참여 중</span>
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          title="소통 피드 접기 (C)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message Feed Area */}
      <div
        ref={scrollRef}
        className="flex-1 p-3.5 overflow-y-auto space-y-2.5 scroll-smooth custom-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center text-2xl text-slate-400">
              💬
            </div>
            <p className="text-xs font-bold text-slate-400">아직 도착한 메시지가 없습니다</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              모바일 화면에서 응원 문구나 반응을 보내면 실시간으로 여기에 표시됩니다.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((item) => {
              const emojiChar = REACTION_EMOJIS[item.reaction] || '❤️';
              const reactionLabel = REACTION_LABELS[item.reaction] || `${emojiChar} 응원`;
              const formattedTime = new Date(item.timestamp).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 15, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-sm flex items-start gap-2.5 hover:bg-slate-800 transition-colors"
                >
                  {/* Emoji Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-slate-700/50 border border-slate-600/50 flex items-center justify-center text-xl shrink-0 shadow-inner">
                    {emojiChar}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-black text-white truncate">
                          {item.senderName}
                        </span>
                        {item.senderTeam && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 font-semibold truncate border border-sky-500/20">
                            {item.senderTeam}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 shrink-0">
                        {formattedTime}
                      </span>
                    </div>

                    {item.message ? (
                      <p className="text-xs font-bold text-slate-100 leading-relaxed break-words bg-slate-900/60 p-2 rounded-xl border border-slate-700/40">
                        {item.message}
                      </p>
                    ) : (
                      <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                        <span>{reactionLabel}을 보냈습니다!</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/70 text-center">
        <span className="text-[10px] text-slate-500">
          모바일 <span className="text-sky-400 font-mono font-bold">/live</span> 화면에서 실시간 참여 중
        </span>
      </div>
    </motion.aside>
  );
}
