'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSupabaseClient } from '@/lib/supabase';
import { getUserTitle } from '@/lib/reveal-day/titles';

export const REACTION_EMOJIS: Record<string, string> = {
  heart: '❤️',
  clap: '👏',
  party: '🎉',
  sparkle: '✨',
  fire: '🔥',
  coffee: '☕️',
  pizza: '🍕',
  rocket: '🚀'
};

export const REACTION_LABELS: Record<string, string> = {
  heart: '❤️ 하트 응원',
  clap: '👏 박수 응원',
  party: '🎉 축하 응원',
  sparkle: '✨ 감동 응원',
  fire: '🔥 열정 응원',
  coffee: '☕️ 힐링 응원',
  pizza: '🍕 파티 응원',
  rocket: '🚀 화이팅 응원'
};

export interface FloatingCheerParticle {
  id: string;
  emoji: string;
  left: number; // percentage (10 to 85)
  size: number; // px
  drift: number; // px horizontal drift
  duration: number; // seconds
}

export interface CheeringToast {
  id: string;
  senderName: string;
  senderTeam: string;
  message: string;
  emoji: string;
  timestamp: number;
}

interface CheerOverlayProps {
  eventId: string;
  showToasts?: boolean;
}

export default function CheerOverlay({ eventId, showToasts = false }: CheerOverlayProps) {
  const [particles, setParticles] = useState<FloatingCheerParticle[]>([]);
  const [toasts, setToasts] = useState<CheeringToast[]>([]);
  const isMountedRef = useRef(true);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const contentSignaturesRef = useRef<Map<string, number>>(new Map());

  // Spawn visual floating emojis
  const spawnParticles = useCallback((emoji: string, count = 2) => {
    const newItems: FloatingCheerParticle[] = [];
    for (let i = 0; i < count; i++) {
      newItems.push({
        id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        emoji,
        left: Math.floor(Math.random() * 75) + 12, // 12% to 87%
        size: Math.floor(Math.random() * 16) + 26, // 26px to 42px
        drift: Math.floor(Math.random() * 60) - 30, // -30px to +30px
        duration: Math.random() * 1.2 + 3.2 // 3.2s to 4.4s
      });
    }

    setParticles(prev => [...prev.slice(-25), ...newItems]);
  }, []);

  // Add toast message with dual deduplication (Exact ID + Content Time Window)
  const addToast = useCallback((toast: CheeringToast) => {
    // 1. Exact ID Deduplication
    if (seenIdsRef.current.has(toast.id)) return;

    // 2. Content + Sender + Recent Time Window Deduplication
    const cleanMsg = (toast.message || '').trim();
    const contentKey = `${toast.senderName}_${toast.emoji}_${cleanMsg}`;
    const now = Date.now();
    const lastSeen = contentSignaturesRef.current.get(contentKey);

    if (lastSeen && now - lastSeen < 3500) {
      seenIdsRef.current.add(toast.id);
      return;
    }

    seenIdsRef.current.add(toast.id);
    contentSignaturesRef.current.set(contentKey, now);

    if (seenIdsRef.current.size > 300) {
      const arr = Array.from(seenIdsRef.current);
      seenIdsRef.current = new Set(arr.slice(-150));
    }

    // Clean old signatures
    if (contentSignaturesRef.current.size > 200) {
      const entries = Array.from(contentSignaturesRef.current.entries());
      const filtered = entries.filter(([_, t]) => now - t < 10000);
      contentSignaturesRef.current = new Map(filtered);
    }

    setToasts(prev => [...prev.slice(-3), toast]);
  }, []);

  // 1. Listen to Realtime Broadcast on reveal_channel_{eventId}
  useEffect(() => {
    isMountedRef.current = true;
    try {
      const sb = getSupabaseClient();
      const channelName = `reveal_channel_${eventId}`;

      const channel = sb
        .channel(channelName)
        .on('broadcast', { event: 'cheer' }, (payload) => {
          if (!isMountedRef.current || !payload?.payload) return;
          const data = payload.payload;
          const emojiChar = REACTION_EMOJIS[data.reaction] || data.emoji || '❤️';
          const reactionLabel = REACTION_LABELS[data.reaction] || `${emojiChar} 응원`;

          // 1. Spawn floating emoji particles
          spawnParticles(emojiChar, data.message ? 3 : 2);

          // 2. Add toast card with sender name and message/reaction
          const displayMessage = data.message && data.message.trim() 
            ? data.message.trim() 
            : `${reactionLabel}을 보냈습니다!`;

          addToast({
            id: data.id || `toast-${Date.now()}-${Math.random()}`,
            senderName: data.senderName || '익명 메이트',
            senderTeam: data.senderTeam || '',
            message: displayMessage,
            emoji: emojiChar,
            timestamp: Date.now()
          });
        })
        .on('broadcast', { event: 'reaction' }, (payload) => {
          if (!isMountedRef.current || !payload?.payload) return;
          const rType = payload.payload.reaction;
          const emojiChar = REACTION_EMOJIS[rType] || '❤️';
          const reactionLabel = REACTION_LABELS[rType] || `${emojiChar} 응원`;

          spawnParticles(emojiChar, 2);

          addToast({
            id: payload.payload.id || `reaction-${Date.now()}-${Math.random()}`,
            senderName: payload.payload.senderName || '익명 메이트',
            senderTeam: payload.payload.senderTeam || '',
            message: `${reactionLabel}을 보냈습니다!`,
            emoji: emojiChar,
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
  }, [eventId, addToast, spawnParticles]);

  // 2. Safety Fallback: Poll recent cheers every 2.5 seconds
  useEffect(() => {
    const fetchRecentCheers = async () => {
      try {
        const res = await fetch(`/api/reveal-day/interactions?type=recent_cheers&eventId=${encodeURIComponent(eventId)}&_t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.cheers) && isMountedRef.current) {
            // Find any new cheers from the last 15 seconds not yet seen
            const cutoff = Date.now() - 15000;
            data.cheers.reverse().forEach((c: any) => {
              if (c.timestamp > cutoff && !seenIdsRef.current.has(c.id)) {
                const emojiChar = REACTION_EMOJIS[c.reaction] || '❤️';
                const reactionLabel = REACTION_LABELS[c.reaction] || `${emojiChar} 응원`;
                spawnParticles(emojiChar, c.message ? 2 : 1);
                addToast({
                  id: c.id,
                  senderName: c.senderName || '익명 메이트',
                  senderTeam: c.senderTeam || '',
                  message: c.message ? c.message : `${reactionLabel}을 보냈습니다!`,
                  emoji: emojiChar,
                  timestamp: c.timestamp
                });
              }
            });
          }
        }
      } catch {}
    };

    const interval = setInterval(fetchRecentCheers, 2500);
    return () => clearInterval(interval);
  }, [eventId, addToast, spawnParticles]);

  // Particle cleanup timer
  useEffect(() => {
    if (particles.length === 0) return;
    const timer = setTimeout(() => {
      setParticles(prev => prev.slice(2));
    }, 2000);
    return () => clearTimeout(timer);
  }, [particles]);

  // Toast auto-dismiss after 5.5 seconds
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, 5500);
    return () => clearTimeout(timer);
  }, [toasts]);

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden select-none">
      {/* 1. Flying Floating Emoji Particles from Bottom */}
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{
              opacity: 0,
              y: '100%',
              x: 0,
              scale: 0.5
            }}
            animate={{
              opacity: [0, 0.95, 0.95, 0],
              y: '-120%',
              x: p.drift,
              scale: [0.6, 1.25, 1, 0.8]
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: p.duration,
              ease: [0.25, 0.1, 0.25, 1]
            }}
            style={{
              position: 'absolute',
              bottom: '10px',
              left: `${p.left}%`,
              fontSize: `${p.size}px`
            }}
            className="filter drop-shadow-lg will-change-transform"
          >
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 2. Live Cheering Messages Overlay (Optional TOP-RIGHT Stack on Stage Canvas) */}
      {showToasts && (
        <div className="absolute top-6 right-6 flex flex-col gap-2.5 max-w-sm w-full z-50 items-end pointer-events-none">
          <AnimatePresence>
            {toasts.map(toast => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 80, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.85 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="p-3.5 rounded-2xl bg-slate-900/95 border border-sky-400/40 shadow-2xl backdrop-blur-xl flex items-start gap-3 w-full border-l-4 border-l-sky-400"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 border border-sky-400/30 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                  {toast.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-black text-white truncate">
                      {toast.senderName}
                    </span>
                    <span className="text-[10px] font-bold text-amber-300/90 bg-amber-400/10 px-1 py-0.2 rounded border border-amber-400/20 shrink-0">
                      {getUserTitle(toast.senderName)}
                    </span>
                    {toast.senderTeam && (
                      <span className="text-[10px] text-sky-300 font-semibold truncate">
                        ({toast.senderTeam})
                      </span>
                    )}
                    <span className="text-[9px] text-emerald-400 font-mono ml-auto shrink-0 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      LIVE
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-100 leading-snug break-words">
                    {toast.message}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
