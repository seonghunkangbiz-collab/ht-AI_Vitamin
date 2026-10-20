'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  AlertCircle,
  Sparkles,
  Edit3,
  Upload,
  Check,
  Type
} from 'lucide-react';

interface SongSegmentProps {
  songUrl?: string;
}

interface LyricSection {
  id: string;
  tag: string;
  type: 'verse' | 'chorus' | 'bridge' | 'outro' | 'intro';
  lines: string[];
}

const DEFAULT_LYRICS: LyricSection[] = [
  {
    id: 'intro',
    tag: 'Intro',
    type: 'intro',
    lines: ['(경쾌하고 따뜻한 어쿠스틱 멜로디와 AI 비트가 시작됩니다)']
  },
  {
    id: 'verse1',
    tag: 'Verse 1',
    type: 'verse',
    lines: [
      '모니터 너머로 스며든 작은 관심',
      '서먹했던 아침 공기, 문득 건네진 다정한 한마디',
      '"오늘도 힘내요, 당신은 우리 팀의 비타민!"',
      '보이지 않는 손길이 내 하루를 채웠네'
    ]
  },
  {
    id: 'chorus1',
    tag: 'Chorus',
    type: 'chorus',
    lines: [
      '함께 피어난 우리들의 AI 비타민!',
      '마음을 잇고, 격려를 더해 만든 작은 기적',
      '서로가 서로의 비밀 메이트가 되어',
      'HT사업본부의 내일을 환하게 비추네!'
    ]
  },
  {
    id: 'verse2',
    tag: 'Verse 2',
    type: 'verse',
    lines: [
      '바쁜 마감 속 지친 한숨 내려앉을 때',
      '책상 위에 놓여있던 커피 한 잔의 온기',
      'AI가 분석한 우리의 따뜻한 발자국들',
      '혼자가 아니란 걸 다시금 깨달았던 4주'
    ]
  },
  {
    id: 'bridge',
    tag: 'Bridge',
    type: 'bridge',
    lines: [
      '이제는 베일을 벗고 서로의 눈을 보며',
      '수줍게 건네는 고마움의 미소',
      '"내가 네 메이트였어, 언제나 널 응원해!"'
    ]
  },
  {
    id: 'chorus2',
    tag: 'Chorus',
    type: 'chorus',
    lines: [
      '함께 피어난 우리들의 AI 비타민!',
      '마음을 잇고, 격려를 더해 만든 작은 기적',
      '서로가 서로의 비밀 메이트가 되어',
      'HT사업본부의 내일을 환하게 비추네!'
    ]
  },
  {
    id: 'outro',
    tag: 'Outro',
    type: 'outro',
    lines: [
      '끝이 아닌 새로운 시작의 약속',
      '매일매일 서로에게 힘이 되어줄 우리',
      '우리가 함께 만든 가장 빛나는 비타민 ✨'
    ]
  }
];

export default function SongSegment({ songUrl = '/audio/vitamin_song.mp3' }: SongSegmentProps) {
  const [currentSongUrl, setCurrentSongUrl] = useState<string>(songUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(180);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Large Lyrics Display States
  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large' | 'huge'>('large');
  const [activeSectionId, setActiveSectionId] = useState<string>('all');
  const [sections, setSections] = useState<LyricSection[]>(DEFAULT_LYRICS);
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [rawLyricsText, setRawLyricsText] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lyricsScrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setCurrentSongUrl(songUrl);
  }, [songUrl]);

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
  }, [currentSongUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setLoadError(false);
        })
        .catch(() => {
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setCurrentSongUrl(objectUrl);
      setLoadError(false);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.load();
      }
    }
  };

  const openLyricsEditor = () => {
    // Generate text from current sections
    const text = sections
      .map(s => `[${s.tag}]\n` + s.lines.join('\n'))
      .join('\n\n');
    setRawLyricsText(text);
    setIsEditingLyrics(true);
  };

  const saveEditedLyrics = () => {
    const raw = rawLyricsText.trim();
    if (!raw) {
      setSections(DEFAULT_LYRICS);
      setIsEditingLyrics(false);
      return;
    }

    const blocks = raw.split(/\n\s*\n/);
    const parsed: LyricSection[] = [];

    blocks.forEach((block, idx) => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) return;

      let tag = `Section ${idx + 1}`;
      let contentLines = lines;

      if (lines[0].startsWith('[') && lines[0].endsWith(']')) {
        tag = lines[0].slice(1, -1);
        contentLines = lines.slice(1);
      }

      const lower = tag.toLowerCase();
      let type: LyricSection['type'] = 'verse';
      if (lower.includes('chorus') || lower.includes('후렴')) type = 'chorus';
      else if (lower.includes('bridge') || lower.includes('브릿지')) type = 'bridge';
      else if (lower.includes('outro') || lower.includes('아웃트로')) type = 'outro';
      else if (lower.includes('intro') || lower.includes('인트로')) type = 'intro';

      parsed.push({
        id: `custom-${idx}`,
        tag,
        type,
        lines: contentLines
      });
    });

    if (parsed.length > 0) {
      setSections(parsed);
    }
    setIsEditingLyrics(false);
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    if (sectionId === 'all') {
      lyricsScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(`lyric-sec-${sectionId}`);
    if (el && lyricsScrollRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Font size styles based on level
  const fontStyles = {
    normal: {
      line: 'text-lg lg:text-xl font-semibold leading-relaxed tracking-wide',
      tag: 'text-xs font-bold px-2 py-0.5',
      chorusLine: 'text-xl lg:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-purple-200 to-sky-200 leading-relaxed'
    },
    large: {
      line: 'text-xl lg:text-2xl font-bold leading-relaxed tracking-wide',
      tag: 'text-xs font-extrabold px-2.5 py-1',
      chorusLine: 'text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-purple-200 to-sky-200 leading-relaxed drop-shadow'
    },
    huge: {
      line: 'text-2xl lg:text-3xl font-extrabold leading-loose tracking-wide',
      tag: 'text-sm font-black px-3 py-1',
      chorusLine: 'text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-purple-200 to-sky-200 leading-loose drop-shadow-md'
    }
  }[fontSizeLevel];

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 lg:p-8 bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-900 text-white relative overflow-hidden select-none">
      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={currentSongUrl} preload="auto" />

      {/* Hidden File Input for MP3 Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Background ambient light */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between z-10 pb-3 border-b border-purple-500/20">
        <div className="flex items-center gap-3">
          <span className="text-xs font-extrabold tracking-widest text-purple-400 uppercase bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
            Segment 6
          </span>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <span>HT 사업본부 AI Vitamin Song</span>
            <Music className="w-5 h-5 text-purple-400" />
          </h2>
          <span className="hidden md:inline-block text-xs text-purple-300/80 font-medium ml-2">
            AI가 작곡·작사한 우리 본부의 비타민 송
          </span>
        </div>

        {/* Controls: Font Size & Lyric Section Navigation */}
        <div className="flex items-center gap-2">
          {/* Font Size Selector */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 text-xs">
            <Type className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <button
              onClick={() => setFontSizeLevel('normal')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                fontSizeLevel === 'normal'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              보통
            </button>
            <button
              onClick={() => setFontSizeLevel('large')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                fontSizeLevel === 'large'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              크게
            </button>
            <button
              onClick={() => setFontSizeLevel('huge')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                fontSizeLevel === 'huge'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              특대
            </button>
          </div>

          {/* Quick Edit Lyrics Modal Button */}
          <button
            onClick={openLyricsEditor}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all"
            title="가사 직접 입력 및 수정"
          >
            <Edit3 className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">가사 편집</span>
          </button>

          {/* Custom Audio Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all"
            title="음원 파일 직접 선택 (.mp3/.wav)"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">음원 교체</span>
          </button>
        </div>
      </div>

      {/* Main Dual Stage View: Left = Audio Player, Right = Large Stage Lyrics */}
      <div className="flex-1 grid grid-cols-12 gap-6 my-4 min-h-0 z-10">
        {/* Left Column: Player & Album Art (~35% width, cols 1-4) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col justify-center items-center">
          <motion.div
            animate={{ scale: isPlaying ? [1, 1.015, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="w-full max-w-sm p-6 rounded-3xl bg-slate-900/90 border border-purple-500/30 shadow-2xl backdrop-blur-md flex flex-col items-center text-center"
          >
            {/* Spinning Vinyl Album Art */}
            <div className="relative mb-4">
              <motion.div
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={
                  isPlaying
                    ? { repeat: Infinity, duration: 8, ease: 'linear' }
                    : { duration: 0.5 }
                }
                className="w-36 h-36 rounded-full bg-gradient-to-tr from-purple-900 via-indigo-950 to-slate-900 border-4 border-slate-700/80 flex items-center justify-center shadow-2xl shadow-purple-600/30 relative"
              >
                {/* Vinyl Grooves */}
                <div className="absolute inset-2 rounded-full border border-purple-500/20" />
                <div className="absolute inset-5 rounded-full border border-purple-500/20" />
                <div className="absolute inset-8 rounded-full border border-purple-500/20" />
                {/* Center Label */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-inner">
                  <Music className="w-7 h-7 text-white" />
                </div>
              </motion.div>
              {isPlaying && (
                <span className="absolute -top-1 -right-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-[10px] font-black text-white shadow animate-pulse">
                  PLAYING
                </span>
              )}
            </div>

            <h3 className="text-xl font-black text-white tracking-tight">HT 사업본부 AI Vitamin Song</h3>
            <p className="text-xs text-purple-300 mt-1 font-medium">
              AI Generated • 2026 HT 사업본부
            </p>

            {/* Soundwave Visualizer Bars */}
            <div className="flex items-end justify-center gap-1 h-12 my-4 w-full px-4">
              {Array.from({ length: 24 }).map((_, i) => {
                const height = isPlaying
                  ? Math.sin(i * 0.8 + currentTime * 6) * 18 + 24
                  : 6;
                return (
                  <motion.div
                    key={i}
                    animate={{ height: `${height}px` }}
                    transition={{ duration: 0.1 }}
                    className="w-1.5 rounded-full bg-gradient-to-t from-purple-600 via-indigo-500 to-sky-400"
                  />
                );
              })}
            </div>

            {/* Error Banner preserving exact test string */}
            {loadError && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] mb-3 text-left w-full">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>지정된 음원 파일을 로드하지 못했습니다. (자산 확인 필요: {currentSongUrl})</span>
              </div>
            )}

            {/* Audio Progress Slider */}
            <div className="w-full flex flex-col gap-1 px-2 mb-3">
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

            {/* Audio Control Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleRestart}
                className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                title="처음부터 재생"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="p-4 rounded-3xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-95 text-white shadow-xl shadow-purple-500/30 transition-all flex items-center justify-center"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </button>

              <button
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.muted = !isMuted;
                    setIsMuted(!isMuted);
                  }
                }}
                className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                title={isMuted ? '음소거 해제' : '음소거'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Stage Large Lyrics Teleprompter (~65% width, cols 5-12) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col h-full min-h-0 bg-slate-900/60 rounded-3xl border border-purple-500/20 shadow-2xl backdrop-blur-md overflow-hidden">
          {/* Lyrics Section Filter Bar */}
          <div className="flex items-center gap-1.5 p-3 px-5 border-b border-purple-500/20 bg-slate-950/40 overflow-x-auto shrink-0">
            <span className="text-[11px] font-bold text-purple-400 mr-2 shrink-0">구간 이동:</span>
            <button
              onClick={() => scrollToSection('all')}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 ${
                activeSectionId === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              전체
            </button>
            {sections.map(sec => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 ${
                  activeSectionId === sec.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {sec.tag}
              </button>
            ))}
          </div>

          {/* Large Lyrics Scroll Area */}
          <div
            ref={lyricsScrollRef}
            className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 scroll-smooth"
          >
            {sections.map(section => {
              const isChorus = section.type === 'chorus';
              const isIntro = section.type === 'intro';
              return (
                <div
                  key={section.id}
                  id={`lyric-sec-${section.id}`}
                  className={`p-5 rounded-2xl transition-all border ${
                    isChorus
                      ? 'bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-purple-950/70 border-purple-500/50 shadow-lg shadow-purple-950/50'
                      : isIntro
                      ? 'bg-slate-950/40 border-slate-800/80'
                      : 'bg-slate-900/40 border-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`rounded-full tracking-wider uppercase font-mono ${
                        isChorus
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                          : 'bg-slate-800 text-purple-300 border border-slate-700'
                      } ${fontStyles.tag}`}
                    >
                      {section.tag}
                    </span>
                    {isChorus && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                        <Sparkles className="w-3 h-3" /> 후렴구 (떼창 구간)
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {section.lines.map((line, lineIdx) => (
                      <p
                        key={lineIdx}
                        className={
                          isChorus
                            ? fontStyles.chorusLine
                            : isIntro
                            ? 'text-sm lg:text-base text-slate-400 italic'
                            : fontStyles.line
                        }
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="z-10 flex items-center justify-between text-xs text-slate-400 border-t border-purple-500/20 pt-2.5">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>무대 대형 스크린 전용 가사 모드 활성화됨 • 글자 크기 변경 가능</span>
        </span>
        <span className="font-mono text-slate-500">Space: 재생/일시정지</span>
      </div>

      {/* Lyrics Edit Modal */}
      {isEditingLyrics && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl p-6 max-w-xl w-full text-white shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2 text-purple-300">
                <Edit3 className="w-5 h-5 text-purple-400" />
                <span>비타민 송 가사 직접 편집</span>
              </h3>
              <span className="text-[11px] text-slate-400">[섹션명] 형식으로 구분</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              제공받으신 실제 가사를 아래에 붙여넣으세요. 빈 줄을 기준으로 섹션이 구분되며,
              [Chorus] 또는 [후렴]으로 표시된 부분은 무대 화면에 강조 표시됩니다.
            </p>

            <textarea
              value={rawLyricsText}
              onChange={e => setRawLyricsText(e.target.value)}
              rows={12}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs leading-relaxed focus:border-purple-400 focus:outline-none"
              placeholder="[Verse 1]&#10;가사 첫째 줄&#10;가사 둘째 줄&#10;&#10;[Chorus]&#10;후렴구 가사..."
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditingLyrics(false)}
                className="py-2 px-4 rounded-xl bg-slate-800 text-xs font-bold hover:bg-slate-700 text-slate-300"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setSections(DEFAULT_LYRICS);
                  setIsEditingLyrics(false);
                }}
                className="py-2 px-3 rounded-xl bg-slate-800 text-xs font-bold hover:bg-slate-700 text-amber-300"
              >
                기본 가사로 복원
              </button>
              <button
                onClick={saveEditedLyrics}
                className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center gap-1 shadow"
              >
                <Check className="w-4 h-4" />
                <span>가사 반영하기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
