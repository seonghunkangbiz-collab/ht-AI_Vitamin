'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music, Play, Pause, RotateCcw, Volume2, VolumeX, AlertCircle, Sparkles } from 'lucide-react';

interface SongSegmentProps {
  songUrl?: string;
}

export default function SongSegment({ songUrl = '/audio/vitamin_song.mp3' }: SongSegmentProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(180); // 3 minutes default
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 180);
      setLoadError(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setLoadError(true);
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [songUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setLoadError(false);
      }).catch(() => {
        setLoadError(true);
      });
    }
  };

  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().then(() => {
      setIsPlaying(true);
    });
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = Number(e.target.value);
    setCurrentTime(target);
    if (audioRef.current) {
      audioRef.current.currentTime = target;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-10 bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-900 text-white relative overflow-hidden select-none">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={songUrl}
        preload="auto"
      />

      {/* Background glow */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div>
          <span className="text-xs font-bold tracking-widest text-purple-400 uppercase">Segment 6</span>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <span>Suno AI Vitamin Song</span>
            <Music className="w-6 h-6 text-purple-400" />
          </h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>AI가 작곡·작사한 우리 본부의 비타민 송</span>
        </div>
      </div>

      {/* Center Visualizer & Player */}
      <div className="my-auto max-w-2xl mx-auto w-full z-10 flex flex-col items-center">
        <motion.div
          animate={{ scale: isPlaying ? [1, 1.02, 1] : 1 }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="p-8 rounded-3xl bg-slate-900/90 border border-purple-500/30 shadow-2xl backdrop-blur-md w-full flex flex-col items-center text-center"
        >
          {/* Vinyl / Cover Art */}
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-5xl shadow-2xl shadow-purple-500/30 mb-5 relative">
            <Music className="w-16 h-16 text-white" />
            {isPlaying && (
              <span className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow">
                PLAYING
              </span>
            )}
          </div>

          <h3 className="text-2xl font-black text-white">HT AI Vitamin Song</h3>
          <p className="text-xs text-purple-300 mt-1">Suno AI Generated • 2026 HT Business Division</p>

          {/* Animated Visualizer Bars */}
          <div className="flex items-end justify-center gap-1.5 h-16 my-6 w-full px-6">
            {Array.from({ length: 28 }).map((_, i) => {
              const height = isPlaying ? Math.sin((i + currentTime * 5)) * 25 + 35 : 8;
              return (
                <motion.div
                  key={i}
                  animate={{ height: `${height}px` }}
                  transition={{ duration: 0.15 }}
                  className="w-2 rounded-full bg-gradient-to-t from-purple-600 to-sky-400"
                />
              );
            })}
          </div>

          {/* Load error warning */}
          {loadError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>지정된 음원 파일을 로드하지 못했습니다. (자산 확인 필요: {songUrl})</span>
            </div>
          )}

          {/* Audio Progress Bar */}
          <div className="w-full flex flex-col gap-1.5 px-4 mb-4">
            <input
              type="range"
              min={0}
              max={duration || 180}
              value={currentTime}
              onChange={handleSeek}
              className="w-full accent-purple-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleRestart}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              title="처음부터 재생"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={togglePlay}
              className="p-5 rounded-3xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-95 text-white shadow-xl shadow-purple-500/20 transition-all flex items-center justify-center"
            >
              {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
            </button>

            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              title={isMuted ? '음소거 해제' : '음소거'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Footer Info */}
      <div className="z-10 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-3">
        <span>* 브라우저 오디오 보안 정책에 따라 관리자가 [재생] 버튼을 클릭하면 시작됩니다.</span>
        <span>Space: 재생/일시정지</span>
      </div>
    </div>
  );
}
