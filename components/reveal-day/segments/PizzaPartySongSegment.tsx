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
  Share2,
  Video,
  Film,
  Maximize,
  Minimize,
  ExternalLink,
  Check,
  Folder,
  HardDrive,
  Upload,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { AI_VITAMIN_PLAYLIST, SongTrack, LyricSection, parseVideoUrl, ParsedVideoInfo } from '@/lib/reveal-day/song-playlist';
import { saveLocalVideoToDB, getLocalVideoFromDB, clearLocalVideoFromDB } from '@/lib/reveal-day/local-video-storage';

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

  // Dual Mode: 'audio' (오디오 & 가사) vs 'video' (뮤직비디오 영상)
  const [displayMode, setDisplayMode] = useState<'audio' | 'video'>('audio');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [parsedVideo, setParsedVideo] = useState<ParsedVideoInfo>(() => parseVideoUrl(''));
  const [theaterMode, setTheaterMode] = useState<boolean>(false);
  const [manualVideoInput, setManualVideoInput] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const displayFileInputRef = useRef<HTMLInputElement | null>(null);

  // Video Playback Synchronization State & Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const isRemoteVideoActionRef = useRef<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);

  // Broadcast video playback state to Operator & other tabs
  const broadcastVideoState = useCallback((
    action: 'video_play' | 'video_pause' | 'video_seek' | 'video_metadata',
    time?: number,
    dur?: number
  ) => {
    const curTime = typeof time === 'number' ? time : (videoRef.current?.currentTime || 0);
    const totalDur = typeof dur === 'number' ? dur : (videoRef.current?.duration || videoDuration);

    // 1. Local BroadcastChannel (0ms latency for dual monitor on same PC)
    try {
      const bc = new BroadcastChannel('reveal_local_video_channel');
      bc.postMessage({
        type: 'VIDEO_PLAYBACK_ACTION',
        action,
        currentTime: curTime,
        duration: totalDur,
      });
      bc.close();
    } catch {}

    // 2. Supabase Channel (network devices)
    try {
      if (isSupabaseConfigured()) {
        const sb = getSupabaseClient();
        sb.channel(`reveal_channel_${eventId}`).send({
          type: 'broadcast',
          event: 'song_control',
          payload: {
            action,
            currentTime: curTime,
            duration: totalDur,
            mode: 'video',
          },
        });
      }
    } catch {}
  }, [eventId, videoDuration]);

  // Apply received video commands from Operator Panel
  const applyVideoControl = useCallback((action: string, currentTime?: number, targetVolume?: number, targetMuted?: boolean) => {
    if (action === 'video_play') {
      if (videoRef.current) {
        if (typeof currentTime === 'number' && Math.abs(videoRef.current.currentTime - currentTime) > 1.5) {
          videoRef.current.currentTime = currentTime;
        }
        isRemoteVideoActionRef.current = true;
        videoRef.current.play().catch(() => {});
        setIsVideoPlaying(true);
      } else if (iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        setIsVideoPlaying(true);
      }
    } else if (action === 'video_pause') {
      if (videoRef.current) {
        isRemoteVideoActionRef.current = true;
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else if (iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        setIsVideoPlaying(false);
      }
    } else if (action === 'video_seek' && typeof currentTime === 'number') {
      if (videoRef.current) {
        isRemoteVideoActionRef.current = true;
        videoRef.current.currentTime = currentTime;
        setVideoCurrentTime(currentTime);
      } else if (iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func: 'seekTo', args: [currentTime, true] }),
          '*'
        );
      }
    } else if (action === 'video_volume') {
      if (videoRef.current) {
        if (typeof targetVolume === 'number') {
          const clamped = Math.max(0, Math.min(1, targetVolume));
          videoRef.current.volume = clamped;
          setVolume(clamped);
        }
        if (typeof targetMuted === 'boolean') {
          videoRef.current.muted = targetMuted;
          setIsMuted(targetMuted);
        }
      }
    }
  }, []);

  // Initialize saved mode & video URL from LocalStorage and IndexedDB
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('reveal_day_song_mode');
      if (savedMode === 'video' || savedMode === 'audio') {
        setDisplayMode(savedMode);
      }
      const savedUrl = localStorage.getItem('reveal_day_video_url');
      if (savedUrl) {
        setVideoUrl(savedUrl);
        setParsedVideo(parseVideoUrl(savedUrl));
      }
      // Check IndexedDB for locally stored MP4 video
      getLocalVideoFromDB().then((res) => {
        if (res && res.blobUrl) {
          setVideoUrl(res.blobUrl);
          setParsedVideo({
            type: 'local',
            embedUrl: res.blobUrl,
            originalUrl: res.name,
            fileName: res.name,
            isValid: true,
          });
        }
      });
    } catch {}
  }, []);

  // Realtime BroadcastChannel listener for local browser tabs (same PC / dual monitors)
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('reveal_local_video_channel');
      bc.onmessage = async (e) => {
        if (e.data?.type === 'VIDEO_UPDATED') {
          const localData = await getLocalVideoFromDB();
          if (localData?.blobUrl) {
            setVideoUrl(localData.blobUrl);
            setParsedVideo({
              type: 'local',
              embedUrl: localData.blobUrl,
              originalUrl: localData.name,
              fileName: localData.name,
              isValid: true,
            });
            setDisplayMode('video');
            audioRef.current?.pause();
            setIsPlaying(false);
          }
        } else if (e.data?.type === 'VIDEO_CLEARED') {
          setVideoUrl('');
          setParsedVideo(parseVideoUrl(''));
        } else if (e.data?.type === 'VIDEO_PLAYBACK_ACTION') {
          const { action, currentTime, volume: vVol, muted: vMuted } = e.data;
          applyVideoControl(action, currentTime, vVol, vMuted);
        }
      };
    } catch {}
    return () => {
      try {
        bc?.close();
      } catch {}
    };
  }, [applyVideoControl]);

  const handleDisplayFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Save directly into browser IndexedDB (zero network upload, no 4.5MB Vercel limit, instant playback)
      const blobUrl = await saveLocalVideoToDB(file);

      // 2. Set active video state
      setParsedVideo({
        type: 'local',
        embedUrl: blobUrl,
        originalUrl: file.name,
        fileName: file.name,
        isValid: true,
      });
      setVideoUrl(blobUrl);
      setDisplayMode('video');
      audioRef.current?.pause();
      setIsPlaying(false);
      setShowManualInput(false);

      try {
        localStorage.setItem('reveal_day_video_url', blobUrl);
        localStorage.setItem('reveal_day_song_mode', 'video');
        localStorage.setItem('reveal_day_local_filename', file.name);

        // 3. Broadcast to other tabs on the same origin (e.g. Operator Panel tab)
        const bc = new BroadcastChannel('reveal_local_video_channel');
        bc.postMessage({ type: 'VIDEO_UPDATED', fileName: file.name, fileSize: file.size });
        bc.close();
      } catch {}

      // 4. Broadcast via Supabase channel
      try {
        if (isSupabaseConfigured()) {
          const sb = getSupabaseClient();
          sb.channel(`reveal_channel_${eventId}`).send({
            type: 'broadcast',
            event: 'song_control',
            payload: {
              action: 'set_video_url',
              videoUrl: blobUrl,
              mode: 'video',
              fileName: file.name,
              isLocalFile: true,
            },
          });
        }
      } catch {}
    } catch (err: any) {
      alert('동영상 로딩 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setIsUploading(false);
      if (displayFileInputRef.current) displayFileInputRef.current.value = '';
    }
  };

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

          if (data.action === 'set_mode' && (data.mode === 'audio' || data.mode === 'video')) {
            setDisplayMode(data.mode);
            try { localStorage.setItem('reveal_day_song_mode', data.mode); } catch {}
            if (data.mode === 'video') {
              audio?.pause();
              setIsPlaying(false);
            }
            if (data.videoUrl) {
              setVideoUrl(data.videoUrl);
              setParsedVideo(parseVideoUrl(data.videoUrl));
              try { localStorage.setItem('reveal_day_video_url', data.videoUrl); } catch {}
            }
          } else if (data.action === 'set_video_url') {
            if (data.isLocalFile) {
              getLocalVideoFromDB().then((localData) => {
                if (localData?.blobUrl) {
                  setVideoUrl(localData.blobUrl);
                  setParsedVideo({
                    type: 'local',
                    embedUrl: localData.blobUrl,
                    originalUrl: localData.name,
                    fileName: localData.name,
                    isValid: true,
                  });
                } else if (typeof data.videoUrl === 'string') {
                  setVideoUrl(data.videoUrl);
                  setParsedVideo(parseVideoUrl(data.videoUrl));
                }
              });
            } else if (typeof data.videoUrl === 'string') {
              setVideoUrl(data.videoUrl);
              setParsedVideo(parseVideoUrl(data.videoUrl));
              try { localStorage.setItem('reveal_day_video_url', data.videoUrl); } catch {}
            }
            if (data.mode === 'video' || data.mode === 'audio') {
              setDisplayMode(data.mode);
              try { localStorage.setItem('reveal_day_song_mode', data.mode); } catch {}
              if (data.mode === 'video') {
                audio?.pause();
                setIsPlaying(false);
              }
            }
          } else if (data.action === 'change_track' && typeof data.trackIndex === 'number') {
            if (data.trackIndex !== currentTrackIndex) {
              setCurrentTrackIndex(data.trackIndex);
              if (audio) {
                audio.src = AI_VITAMIN_PLAYLIST[data.trackIndex].src;
                audio.currentTime = 0;
              }
            }
            if (data.shouldPlay && audio) {
              audio.play().then(() => setIsPlaying(true)).catch(() => setNeedsUserInteraction(true));
            }
          } else if (data.action === 'play') {
            if (audio) {
              audio.play().then(() => {
                setIsPlaying(true);
                setNeedsUserInteraction(false);
              }).catch(() => setNeedsUserInteraction(true));
            }
          } else if (data.action === 'pause') {
            if (audio) {
              audio.pause();
              setIsPlaying(false);
            }
          } else if (data.action === 'seek' && typeof data.currentTime === 'number') {
            if (audio) {
              audio.currentTime = data.currentTime;
              setCurrentTime(data.currentTime);
            }
          } else if (
            data.action === 'video_play' ||
            data.action === 'video_pause' ||
            data.action === 'video_seek' ||
            data.action === 'video_volume'
          ) {
            applyVideoControl(data.action, data.currentTime, data.volume, data.muted);
          }
        })
        .subscribe();

      return () => {
        try {
          sb.removeChannel(channel);
        } catch {}
      };
    } catch {}
  }, [eventId, currentTrackIndex, applyVideoControl]);

  const handleModeChange = (mode: 'audio' | 'video') => {
    setDisplayMode(mode);
    try { localStorage.setItem('reveal_day_song_mode', mode); } catch {}
    if (mode === 'video') {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
    try {
      if (isSupabaseConfigured()) {
        const sb = getSupabaseClient();
        sb.channel(`reveal_channel_${eventId}`).send({
          type: 'broadcast',
          event: 'song_control',
          payload: { action: 'set_mode', mode, videoUrl }
        });
      }
    } catch {}
  };

  const handleUpdateVideoUrl = (url: string) => {
    const trimmed = url.trim();
    setVideoUrl(trimmed);
    setParsedVideo(parseVideoUrl(trimmed));
    setDisplayMode('video');
    audioRef.current?.pause();
    setIsPlaying(false);
    try {
      localStorage.setItem('reveal_day_video_url', trimmed);
      localStorage.setItem('reveal_day_song_mode', 'video');
    } catch {}
    try {
      if (isSupabaseConfigured()) {
        const sb = getSupabaseClient();
        sb.channel(`reveal_channel_${eventId}`).send({
          type: 'broadcast',
          event: 'song_control',
          payload: { action: 'set_video_url', videoUrl: trimmed, mode: 'video' }
        });
      }
    } catch {}
  };

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
            <span>Segment 7</span>
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

        {/* Header Right: Mode Switcher & Controls */}
        <div className="flex items-center gap-2">
          {/* Dual Mode Switcher: Video vs Audio */}
          <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleModeChange('video')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                displayMode === 'video'
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>🎬 영상 모드 (뮤직비디오)</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('audio')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                displayMode === 'audio'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>🎵 오디오 & 가사 모드</span>
            </button>
          </div>

          {/* If audio mode: Track badges and font controls */}
          {displayMode === 'audio' && (
            <>
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
            </>
          )}

          {/* If video mode: Theater Mode Toggle */}
          {displayMode === 'video' && (
            <button
              type="button"
              onClick={() => setTheaterMode(prev => !prev)}
              className="px-2.5 py-1 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-1 transition-all"
              title={theaterMode ? '일반 분할 뷰 (피자 타이머 함께 표시)' : '와이드 영상 뷰 (영상 확대)'}
            >
              {theaterMode ? <Minimize className="w-3.5 h-3.5 text-amber-400" /> : <Maximize className="w-3.5 h-3.5 text-amber-400" />}
              <span>{theaterMode ? '분할 뷰' : '영상 확대'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Autoplay blocked banner (if browser blocks audio and in audio mode) */}
      {needsUserInteraction && displayMode === 'audio' && (
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

      {/* Dual Screen Architecture: Video Mode vs Audio & Lyrics Mode */}
      {displayMode === 'video' ? (
        /* ============================================================ */
        /* 1. VIDEO MODE: Only Pizza Timer + Maximized Centered Video Player */
        /* (단체 기념 촬영 & 롤링페이퍼 제거, 동영상 영역 중앙 최대 배치) */
        /* ============================================================ */
        <div className="flex-1 flex flex-col justify-between gap-3 min-h-0 z-10 py-2">
          {/* 1. 피자 타임 남은 시간 (Top Horizontal Sleek Banner) */}
          <div className="shrink-0 px-6 py-3 rounded-2xl bg-slate-900/85 border border-amber-500/35 shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl shadow-inner shadow-amber-500/20 shrink-0">
                🍕
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                    피자 타임 남은 시간 (Pizza Networking Time)
                  </span>
                  {isTimerPaused ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold animate-pulse">
                      ⏸️ 일시정지
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      실시간 카운트다운 중
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-300 hidden md:block mt-0.5">
                  준비된 따뜻한 피자와 함께 2달간의 비타민 여정을 나눈 동료들과 자유롭게 이야기를 나누어 보세요!
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">피자 파티 종료까지</div>
                <div className="text-[11px] text-amber-400/90 font-medium font-mono">50 Min Session</div>
              </div>
              <div className="text-4xl md:text-5xl font-black text-amber-300 font-mono tracking-tight drop-shadow-lg px-4 py-1.5 rounded-2xl bg-slate-950/90 border border-amber-500/30">
                {formatTimer(secondsLeft)}
              </div>
            </div>
          </div>

          {/* 2. 동영상 재생 영역 (화면 중앙 & 최대 크기 배치) */}
          <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col justify-between gap-2.5 h-full min-h-0 bg-slate-900/80 border border-slate-800 rounded-3xl p-4 md:p-5 shadow-2xl">
            {/* Video Player Header Bar */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shrink-0">
                  <Film className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                      AI VITAMIN SONG M/V
                    </span>
                    <span className="text-xs font-bold text-amber-400 truncate">
                      {parsedVideo.type === 'youtube'
                        ? 'YouTube 재생'
                        : parsedVideo.type === 'local'
                        ? `💻 로컬 MP4: ${parsedVideo.fileName || '비디오'}`
                        : parsedVideo.type === 'direct'
                        ? 'MP4 비디오'
                        : parsedVideo.type === 'vimeo'
                        ? 'Vimeo'
                        : '뮤직비디오'}
                    </span>
                  </div>
                  <h3 className="text-sm md:text-base font-black text-white truncate mt-0.5">
                    〈다 잘하고 있어〉 Hi-Tech 사업본부 AI Vitamin Song 뮤직비디오
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Realtime Sync Badge */}
                <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>오퍼레이터 화면 실시간 동기화 중</span>
                </span>

                <button
                  type="button"
                  onClick={() => setShowManualInput(prev => !prev)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition-all border border-slate-700/60"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>경로/파일 {showManualInput ? '닫기' : '선택'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('audio')}
                  className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>가사 보기</span>
                </button>
              </div>
            </div>

            {/* Quick Input Bar if toggled */}
            {showManualInput && (
              <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/40 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-lg shrink-0">
                <input
                  type="file"
                  ref={displayFileInputRef}
                  onChange={handleDisplayFileSelect}
                  accept="video/mp4,video/quicktime,video/webm,video/*"
                  className="hidden"
                />
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={manualVideoInput}
                    onChange={(e) => setManualVideoInput(e.target.value)}
                    placeholder="로컬 PC 파일 경로(예: /Users/.../song.mp4, C:\... 또는 파일명) 또는 유튜브 링크"
                    className="w-full py-1.5 pl-7 pr-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                  />
                  <HardDrive className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2.5" />
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => displayFileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1"
                  >
                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <Folder className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{isUploading ? '로딩 중...' : 'PC 파일 찾기'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (manualVideoInput.trim()) {
                        handleUpdateVideoUrl(manualVideoInput);
                        setShowManualInput(false);
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 flex items-center gap-1 shadow"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>적용</span>
                  </button>
                </div>
              </div>
            )}

            {/* Video Screen Container - Centered and Maximized */}
            <div className="flex-1 w-full min-h-[440px] lg:min-h-[540px] rounded-2xl bg-black/95 border border-slate-800/90 overflow-hidden relative flex items-center justify-center shadow-inner">
              {parsedVideo.isValid ? (
                parsedVideo.type === 'youtube' || parsedVideo.type === 'vimeo' ? (
                  <iframe
                    ref={iframeRef}
                    src={parsedVideo.embedUrl}
                    title="AI Vitamin Song Music Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full border-0 rounded-2xl"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    src={parsedVideo.embedUrl}
                    controls
                    loop
                    playsInline
                    onPlay={() => {
                      setIsVideoPlaying(true);
                      if (!isRemoteVideoActionRef.current) {
                        broadcastVideoState('video_play', videoRef.current?.currentTime);
                      }
                      isRemoteVideoActionRef.current = false;
                    }}
                    onPause={() => {
                      setIsVideoPlaying(false);
                      if (!isRemoteVideoActionRef.current) {
                        broadcastVideoState('video_pause', videoRef.current?.currentTime);
                      }
                      isRemoteVideoActionRef.current = false;
                    }}
                    onTimeUpdate={() => {
                      if (videoRef.current) {
                        setVideoCurrentTime(videoRef.current.currentTime);
                      }
                    }}
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        const d = videoRef.current.duration;
                        setVideoDuration(d);
                        broadcastVideoState('video_metadata', 0, d);
                      }
                    }}
                    className="w-full h-full object-contain rounded-2xl mx-auto"
                  />
                )
              ) : (
                /* Standby / Guide when no video link registered */
                <div className="flex flex-col items-center justify-center text-center p-6 max-w-md">
                  <input
                    type="file"
                    ref={displayFileInputRef}
                    onChange={handleDisplayFileSelect}
                    accept="video/mp4,video/quicktime,video/webm,video/*"
                    className="hidden"
                  />
                  <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3 animate-pulse">
                    <Film className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-black text-white mb-1">
                    AI Vitamin Song 뮤직비디오 영상 대기 중
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    오퍼레이터 화면(/admin/reveal-day)에서 <strong>로컬 PC의 MP4 파일 경로</strong>나 유튜브 주소를 입력하거나, 아래 <strong>[로컬 MP4 파일 선택]</strong> 버튼으로 동영상을 바로 연결할 수 있습니다.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => displayFileInputRef.current?.click()}
                      disabled={isUploading}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black text-xs hover:opacity-90 shadow-lg shadow-rose-500/20 transition-all flex items-center gap-1.5"
                    >
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Folder className="w-4 h-4" />}
                      <span>{isUploading ? '로딩 중...' : '로컬 MP4 파일 선택'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowManualInput(true)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5"
                    >
                      <HardDrive className="w-4 h-4 text-sky-400" />
                      <span>경로 직접 입력</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModeChange('audio')}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5"
                    >
                      <Music className="w-4 h-4 text-sky-400" />
                      <span>가사 모드로 전환</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Video Bottom Info Footer */}
            <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-xs text-slate-400 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-slate-200 font-medium truncate">
                  하이테크 사업본부 동료들에게 전하는 감사의 헌정곡 & 뮤직비디오
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleModeChange('audio')}
                className="text-sky-400 hover:text-sky-300 font-bold text-[11px] underline shrink-0"
              >
                가사 전체 보기 & 오디오 플레이어로 전환 →
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* 2. AUDIO & FORMATTED LYRICS MODE */
        /* ============================================================ */
        <div className="my-auto flex-1 grid grid-cols-12 gap-5 items-stretch z-10 py-3 min-h-0">
          {/* Left Side: Pizza Party 50-Min Timer Card */}
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

            {/* Quick Mode Switch Prompt Card */}
            <div className="p-4 rounded-3xl bg-slate-900/80 border border-rose-500/30 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-xl">
                  🎬
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">뮤직비디오 영상 감상하기</h4>
                  <p className="text-[11px] text-slate-300">영상 모드로 전환하면 대화면으로 감상하실 수 있습니다.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleModeChange('video')}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black text-xs shadow-md"
              >
                영상 모드
              </button>
            </div>
          </div>

          {/* Right Side: AI Vitamin Song Audio & Full Lyrics Board */}
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
        )}
      </div>
    );
  }
