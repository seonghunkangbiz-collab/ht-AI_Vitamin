'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSupabaseClient } from '@/lib/supabase';
import { Heart, MessageSquare, Sparkles } from 'lucide-react';

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
}

export default function CheerOverlay({ eventId }: CheerOverlayProps) {
  const [particles, setParticles] = useState<FloatingCheerParticle[]>([]);
  const [toasts, setToasts] = useState<CheeringToast[]>([]);
  const isMountedRef = useRef(true);

  // Spawn visual floating emojis
  const spawnParticles = (emoji: string, count = 2) => {
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
  };

  // Add toast message
  const addToast = (toast: CheeringToast) => {
    setToasts(prev => [...prev.slice(-2), toast]);
  };

  // Listen to Realtime Broadcast on reveal_channel_{eventId}
  useEffect(() => {
    isMountedRef.current = true;
    try {
      const sb = getSupabaseClient();
      const channelName = `reveal_channel_${eventId}`;

      const channel = sb
        .channel(`cheer_listener_${eventId}`)
        .on('broadcast', { event: 'cheer' }, (payload) => {
          if (!isMountedRef.current || !payload?.payload) return;
          const data = payload.payload;
          const emojiChar = REACTION_EMOJIS[data.reaction] || data.emoji || '❤️';

          // 1. Spawn floating emoji particles
          spawnParticles(emojiChar, data.message ? 3 : 2);

          // 2. If text message is included, show toast
          if (data.message && data.message.trim()) {
            addToast({
              id: data.id || `toast-${Date.now()}-${Math.random()}`,
              senderName: data.senderName || '참석자',
              senderTeam: data.senderTeam || 'HT사업본부',
              message: data.message.trim(),
              emoji: emojiChar,
              timestamp: Date.now()
            });
          }
        })
        .on('broadcast', { event: 'reaction' }, (payload) => {
          if (!isMountedRef.current || !payload?.payload) return;
          const rType = payload.payload.reaction;
          const emojiChar = REACTION_EMOJIS[rType] || '❤️';
          spawnParticles(emojiChar, 2);
        })
        .subscribe();

      return () => {
        isMountedRef.current = false;
        try {
          sb.removeChannel(channel);
        } catch {}
      };
    } catch {}
  }, [eventId]);

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
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden select-none">
      {/* 1. Flying Floating Emoji Particles */}
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

      {/* 2. Live Cheering Messages Overlay (Bottom-Right Toast Stack) */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2.5 max-w-sm w-full z-40 items-end">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="p-3.5 rounded-2xl bg-slate-900/90 border border-sky-400/40 shadow-2xl backdrop-blur-md flex items-start gap-3 w-full"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 border border-sky-400/30 flex items-center justify-center text-xl shrink-0 shadow-inner">
                {toast.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-black text-white truncate">
                    {toast.senderName}
                  </span>
                  <span className="text-[10px] text-sky-300 font-medium truncate">
                    ({toast.senderTeam})
                  </span>
                  <span className="text-[9px] text-emerald-400 font-mono ml-auto shrink-0 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
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
    </div>
  );
}
