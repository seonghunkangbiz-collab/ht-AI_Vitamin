'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pizza,
  Music,
  Camera,
  Sparkles,
  Clock,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Volume2,
  VolumeX,
  Type,
  Repeat,
  Heart,
  Share2
} from 'lucide-react';
import Link from 'next/link';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { AI_VITAMIN_PLAYLIST, SongTrack, LyricSection } from '@/lib/reveal-day/song-playlist';

interface PizzaPartySongSegmentProps {
  eventId?: string;
  initialSeconds?: number;
  isPausedInitial?: boolean;
}

export default function PizzaPartySongSegment({
  eventId = 'event-rehearsal',
  initialSeconds = 50 * 60,
  isPausedInitial = false
}: PizzaPartySongSegmentProps) {
  // ==========================================
  // 1. Pizza Party Countdown Timer States
  // ==========================================
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isTimerPaused, setIsTimerPaused] = useState(isPausedInitial);

  // Sync with prop updates
  useEffect(() => {
    if (typeof initialSeconds === 'number') {
      setSecondsLeft(initialSeconds);
    }
  }, [initialSeconds]);

  useEffect(() => {
    if (typeof isPausedInitial === 'boolean') {
      setIsTimerPaused(isPausedInitial);
    }
  }, [isPausedInitial]);

  // Realtime Broadcast Listener for Pizza Timer Control
  useEffect(() => {
    try {
      if (!isSupabaseConfigured()) return;
      const sb = getSupabaseClient();
      const channel = sb
        .channel(`reveal_channel_${eventId}`)
        .on('broadcast', { event: 'pizza_timer' }, (payload) => {
          const data = payload?.payload || payload;
          if (typeof data.seconds === 'number') {
            setSecondsLeft(data.seconds);
          }
          if (typeof data.isPaused === 'boolean') {
            setIsTimerPaused(data.isPaused);
          }
        })
        .subscribe();

      return () => {
        try {
          sb.removeChannel(channel);
        } catch {}
      };
    } catch {}
  }, [eventId]);

  // Countdown loop
  useEffect(() => {
    if (isTimerPaused) return;
    const timer = setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isTimerPaused]);

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // ==========================================
  // 2. AI Vitamin Song Multi-Track Player States
  // ==========================================
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(AI_VITAMIN_PLAYLIST[0].durationSeconds);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [needsUserInteraction, setNeedsUserInteraction] = useState<boolean>(false);
  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large' | 'huge'>('large');

  const currentTrack: SongTrack = AI_VITAMIN_PLAYLIST[currentTrackIndex] || AI_VITAMIN_PLAYLIST[0];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

  // Load track and handle auto-play / sequence
  const switchTrack = useCallback((index: number, shouldPlay = true) => {
    const newIdx = (index + AI_VITAMIN_PLAYLIST.length) % AI_VITAMIN_PLAYLIST.length;
    setCurrentTrackIndex(newIdx);
    setCurrentTime(0);
    const audio = audioRef.current;
    if (audio) {
      audio.src = AI_VITAMIN_PLAYLIST[newIdx].src;
      audio.currentTime = 0;
      if (shouldPlay) {
        audio.play().then(() => {
          setIsPlaying(true);
          setNeedsUserInteraction(false);
        }).catch(() => {
          setIsPlaying(false);
          setNeedsUserInteraction(true);
        });
      }
    }
    // Broadcast track switch to sync
    try {
      if (isSupabaseConfigured()) {
        const sb = getSupabaseClient();
        sb.channel(`reveal_channel_${eventId}`).send({
          type: 'broadcast',
          event: 'song_control',
          payload: { action: 'change_track', trackIndex: newIdx, shouldPlay }
        });
      }
    } catch {}
  }, [eventId]);

  // Audio Event Listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || currentTrack.durationSeconds);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    // Sequential Loop: Track 0 -> Track 1 -> Track 0 (infinite repeat)
    const handleEnded = () => {
      const nextIdx = (currentTrackIndex + 1) % AI_VITAMIN_PLAYLIST.length;
      switchTrack(nextIdx, true);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack, currentTrackIndex, switchTrack]);

  // Realtime Broadcast Listener for Song Control from Operator
  useEffect(() => {
    try {
      if (!isSupabaseConfigured()) return;
      const sb = getSupabaseClient();
      const channel = sb
        .channel(`reveal_channel_${eventId}`)
        .on('broadcast', { event: 'song_control' }, (payload) => {
          const data = payload?.payload || payload;
          const audio = audioRef.current;
          if (!audio) return;

          if (data.action === 'change_track' && typeof data.trackIndex === 'number') {
            if (data.trackIndex !== currentTrackIndex) {
              setCurrentTrackIndex(data.trackIndex);
              audio.src = AI_VITAMIN_PLAYLIST[data.trackIndex].src;
              audio.currentTime = 0;
            }
            if (data.shouldPlay) {
              audio.play().then(() => setIsPlaying(true)).catch(() => setNeedsUserInteraction(true));
            }
          } else if (data.action === 'play') {
            audio.play().then(() => {
              setIsPlaying(true);
              setNeedsUserInteraction(false);
            }).catch(() => setNeedsUserInteraction(true));
          } else if (data.action === 'pause') {
            audio.pause();
            setIsPlaying(false);
          } else if (data.action === 'seek' && typeof data.currentTime === 'number') {
            audio.currentTime = data.currentTime;
            setCurrentTime(data.currentTime);
          }
        })
        .subscribe();

      return () => {
        try {
          sb.removeChannel(channel);
        } catch {}
      };
    } catch {}
  }, [eventId, currentTrackIndex]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      try {
        if (isSupabaseConfigured()) {
          const sb = getSupabaseClient();
          sb.channel(`reveal_channel_${eventId}`).send({
            type: 'broadcast',
            event: 'song_control',
            payload: { action: 'pause' }
          });
        }
      } catch {}
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
        setNeedsUserInteraction(false);
        try {
          if (isSupabaseConfigured()) {
            const sb = getSupabaseClient();
            sb.channel(`reveal_channel_${eventId}`).send({
              type: 'broadcast',
              event: 'song_control',
              payload: { action: 'play' }
            });
          }
        } catch {}
      }).catch(() => {
        setNeedsUserInteraction(true);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    try {
      if (isSupabaseConfigured()) {
        const sb = getSupabaseClient();
        sb.channel(`reveal_channel_${eventId}`).send({
          type: 'broadcast',
          event: 'song_control',
          payload: { action: 'seek', currentTime: newTime }
        });
      }
    } catch {}
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 0.8;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const formatAudioTime = (sec: number) => {
    if (isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 md:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 text-white relative overflow-hidden select-none">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack.src}
        preload="auto"
      />

      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 z-20">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-widest flex items-center gap-1.5">
            <Pizza className="w-3.5 h-3.5 text-amber-400" />
            <span>Segment 6 & 8</span>
          </span>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <span>Vitamin Pizza Party</span>
              <span className="text-amber-400">&</span>
              <span className="text-sky-300">AI Vitamin Song</span>
              <Music className="w-5 h-5 text-sky-400 animate-bounce" />
            </h2>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span>HT 사업본부 비타민 헌정곡 감상 & 50분 자유 네트워킹</span>
              <span>·</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <Repeat className="w-3 h-3" /> 2곡 연속 무한 반복 재생
              </span>
            </div>
          </div>
        </div>

        {/* Header Right: Track Switcher Quick Badges & Font Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Track Badges */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {AI_VITAMIN_PLAYLIST.map((track, idx) => (
              <button
                key={track.id}
                onClick={() => switchTrack(idx, isPlaying)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentTrackIndex === idx
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span>{idx === 0 ? '1. 긴 음악(4:27)' : '2. 스페셜(2:46)'}</span>
                {currentTrackIndex === idx && isPlaying && (
                  <span className="flex gap-0.5 items-end h-2.5">
                    <span className="w-0.5 h-full bg-slate-950 animate-pulse" />
                    <span className="w-0.5 h-1.5 bg-slate-950 animate-pulse delay-75" />
                    <span className="w-0.5 h-full bg-slate-950 animate-pulse delay-150" />
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Lyrics Font Size Toggle */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 px-1 font-semibold flex items-center gap-0.5">
              <Type className="w-3 h-3 text-slate-400" />
              가사:
            </span>
            {(['normal', 'large', 'huge'] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => setFontSizeLevel(lvl)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  fontSizeLevel === lvl
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lvl === 'normal' ? '보통' : lvl === 'large' ? '크게' : '아주크게'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Autoplay blocked banner (if browser blocks audio) */}
      {needsUserInteraction && (
        <div className="z-30 my-2 p-3 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>브라우저 오디오 재생 정책으로 인해 활성화가 필요합니다. 버튼을 클릭하면 음악이 재생됩니다.</span>
          </div>
          <button
            onClick={togglePlay}
            className="px-4 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:bg-amber-300 shadow-md transition-all flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>음악 재생하기</span>
          </button>
        </div>
      )}

      {/* Main Split Content: Left (Pizza & Photo) + Right (Music & Full Lyrics) */}
      <div className="my-auto flex-1 grid grid-cols-12 gap-5 items-stretch z-10 py-3 min-h-0">
        {/* Left Side: Pizza Party 50-Min Timer, Group Photo Guide & Cheering Ticker (5 cols) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col justify-between gap-3 h-full">
          {/* 50-min Countdown Timer Card */}
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-amber-500/30 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-3 right-3">
              {isTimerPaused ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold animate-pulse">
                  ⏸️ 일시정지
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                  🟢 카운트다운 중
                </span>
              )}
            </div>

            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl mb-1.5 shadow-inner shadow-amber-500/20">
              🍕
            </div>
            <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest">
              Networking & Pizza Timer (50 min)
            </span>
            <div className="text-5xl md:text-6xl font-black text-white font-mono tracking-tight my-1 drop-shadow-md">
              {formatTimer(secondsLeft)}
            </div>
            <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
              준비된 따뜻한 피자와 함께 2달간의 비타민 여정을 나눈 동료들과 자유롭게 이야기를 나누어 보세요!
            </p>
          </div>

          {/* Group Photo Announcement Card */}
          <div className="p-4 rounded-3xl bg-slate-900/80 border border-indigo-500/30 shadow-xl flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 text-xl">
              📸
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>HT 사업본부 전원 단체 기념 촬영</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">Photo</span>
              </h3>
              <p className="text-xs text-slate-300 leading-tight mt-0.5">
                잠시 후 무대 앞으로 모여 2달간의 비타민 프로그램을 기념하는 단체 사진을 촬영합니다.
              </p>
            </div>
          </div>

          {/* Mobile Direct Link to Time Capsule Card */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-purple-500/20 border border-sky-400/40 shadow-xl flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-sky-300 tracking-wide">내 폰으로 영구 소장하기</span>
              <h4 className="text-sm font-black text-white truncate">나의 AI 롤링페이퍼 & 타임캡슐</h4>
              <p className="text-[11px] text-slate-300 mt-0.5">
                모바일 화면에서 나에게 전달된 칭찬과 카드를 언제든 확인하실 수 있습니다.
              </p>
            </div>
            <Link
              href="/live"
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-black shrink-0 ml-3 transition-all shadow-md shadow-sky-500/20 flex items-center gap-1"
            >
              <span>열기</span>
              <Share2 className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Side: AI Vitamin Song Audio Player & Full Formatted Lyrics Board (7 cols) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col justify-between gap-3 h-full min-h-0 bg-slate-900/70 border border-slate-800 rounded-3xl p-5 shadow-2xl">
          {/* Audio Player Controller Bar */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col gap-2.5 shrink-0">
            {/* Track Info & Current Status */}
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
                    Track {currentTrackIndex + 1} / {AI_VITAMIN_PLAYLIST.length}
                  </span>
                  <span className="text-xs font-bold text-amber-400 truncate">
                    {currentTrack.badge}
                  </span>
                </div>
                <h3 className="text-sm md:text-base font-black text-white truncate mt-0.5">
                  {currentTrack.title}
                </h3>
              </div>

              {/* Player Button Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => switchTrack(currentTrackIndex - 1, isPlaying)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                  title="이전 곡 (1. 긴 음악)"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black hover:opacity-90 active:scale-95 transition-all shadow-md shadow-amber-500/20"
                  title={isPlaying ? '일시정지' : '재생'}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => switchTrack(currentTrackIndex + 1, isPlaying)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                  title="다음 곡 (2. 스페셜)"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Seek Bar & Audio Progress */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-slate-400 w-10 text-right">
                {formatAudioTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.5}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1.5 rounded-lg bg-slate-800 accent-amber-400 cursor-pointer"
              />
              <span className="text-[10px] font-mono text-slate-400 w-10">
                {formatAudioTime(duration)}
              </span>

              {/* Volume Slider */}
              <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-800">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="text-slate-400 hover:text-white"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 rounded-lg bg-slate-800 accent-sky-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Formatted Lyrics Board (Scrollable) */}
          <div
            ref={lyricsContainerRef}
            className="flex-1 min-h-[300px] overflow-y-auto pr-2 rounded-2xl bg-slate-950/60 border border-slate-800/80 p-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
          >
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/60 sticky top-0 bg-slate-950/90 backdrop-blur-sm z-10">
              <div className="flex items-center gap-2">
                <Music className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-white">가사 전문 (전곡 순서 연동)</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {currentTrackIndex === 0 ? '긴 음악 (Intro~Outro 11개 섹션)' : '스페셜 (Verse1~Outro 7개 섹션)'}
              </span>
            </div>

            <div className="space-y-4">
              {currentTrack.sections.map((section, sIdx) => {
                const isChorus = section.type === 'chorus' || section.tag.includes('Chorus');
                const isPreChorus = section.type === 'pre-chorus';
                const isBridge = section.type === 'bridge';
                const isOutro = section.type === 'outro';

                return (
                  <div
                    key={`${currentTrack.id}-sec-${sIdx}`}
                    className={`p-3.5 rounded-2xl transition-all ${
                      isChorus
                        ? 'bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-400/40 shadow-sm'
                        : isBridge
                        ? 'bg-sky-500/10 border border-sky-400/30'
                        : isOutro
                        ? 'bg-emerald-500/10 border border-emerald-400/30'
                        : 'bg-slate-900/50 border border-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                          isChorus
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : isBridge
                            ? 'bg-sky-400 text-slate-950 font-black'
                            : isOutro
                            ? 'bg-emerald-400 text-slate-950 font-black'
                            : isPreChorus
                            ? 'bg-purple-500/30 text-purple-200'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        [{section.tag}]
                      </span>
                      {isChorus && (
                        <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>함께 부르는 후렴구</span>
                        </span>
                      )}
                    </div>

                    <div
                      className={`space-y-1 ${
                        fontSizeLevel === 'normal'
                          ? 'text-xs md:text-sm leading-relaxed'
                          : fontSizeLevel === 'large'
                          ? 'text-sm md:text-base leading-relaxed'
                          : 'text-base md:text-lg leading-loose font-medium'
                      } ${
                        isChorus
                          ? 'text-amber-100 font-bold'
                          : isBridge
                          ? 'text-sky-100'
                          : isOutro
                          ? 'text-emerald-100 font-semibold'
                          : 'text-slate-200'
                      }`}
                    >
                      {section.lines.map((line, lIdx) =>
                        line === '' ? (
                          <div key={lIdx} className="h-1.5" />
                        ) : (
                          <div key={lIdx} className="hover:text-amber-300 transition-colors">
                            {line}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
