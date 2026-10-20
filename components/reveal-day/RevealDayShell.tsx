'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RevealEvent, RevealPublicState, RevealSegment, MatePairReveal, RevealTimeCapsuleItem, RevealDrawItem } from '@/lib/reveal-day/types';
import { SEGMENT_METADATA } from '@/lib/reveal-day/state-machine';
import EventTimeline from './EventTimeline';
import StageCanvas from './StageCanvas';
import OperatorPanel from './OperatorPanel';
import PreflightPanel from './PreflightPanel';
import { 
  Maximize2, 
  Minimize2, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Users, 
  Clock, 
  ShieldCheck, 
  Monitor, 
  Eye, 
  EyeOff,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

interface RevealDayShellProps {
  event: RevealEvent;
  publicState: RevealPublicState;
  snapshotStats?: any;
  matePairs?: MatePairReveal[];
  capsules?: RevealTimeCapsuleItem[];
  draws?: RevealDrawItem[];
  connectionStatus: 'connected' | 'polling' | 'disconnected';
  lastSyncTime: Date;
  onTransitionSegment: (segment: RevealSegment) => void;
  onAdvanceMateIndex: (type: 'reveal_next' | 'reveal_batch' | 'next_batch' | 'prev_batch') => void;
  onExecuteDraw: (roundNumber: number, prizeName: string) => void;
  onToggleEmergency: (type: 'blackout' | 'holding', active: boolean) => void;
  onResetCheckins?: () => void;
  onFactoryReset?: () => void;
  onRefreshData?: () => void;
  onNavigateCapsule?: (newIndex: number) => void;
  onAdjustPizzaTimer?: (seconds: number, isPaused: boolean) => void;
  isDisplayOnly?: boolean;
}

export default function RevealDayShell({
  event,
  publicState,
  snapshotStats,
  matePairs = [],
  capsules = [],
  draws = [],
  connectionStatus,
  lastSyncTime,
  onTransitionSegment,
  onAdvanceMateIndex,
  onExecuteDraw,
  onToggleEmergency,
  onResetCheckins,
  onFactoryReset,
  onRefreshData,
  onNavigateCapsule,
  onAdjustPizzaTimer,
  isDisplayOnly = false
}: RevealDayShellProps) {
  // Screen width & Fullscreen state
  const [windowWidth, setWindowWidth] = useState<number>(1920);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isHideControls, setIsHideControls] = useState<boolean>(isDisplayOnly);
  const [showPreflight, setShowPreflight] = useState<boolean>(false);

  // KST Clock
  const [kstTime, setKstTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format in Asia/Seoul
      const formatter = new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      setKstTime(`${formatter.format(now)} KST`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Monitor Window Resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fullscreen toggle handler
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(() => {});
      }
    }
  }, []);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Rule: Disable shortcuts when input or textarea is focused!
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        onToggleEmergency('blackout', !publicState.isBlackout);
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        onToggleEmergency('holding', !publicState.isHolding);
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (publicState.currentSegment === 'mate_reveal') {
          onAdvanceMateIndex('reveal_next');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen, onToggleEmergency, onAdvanceMateIndex, publicState]);

  // Width < 1280px Guard: Show High Contrast Notice, Do NOT mobile-ize
  if (windowWidth < 1280 && !isDisplayOnly) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-white select-none">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
          <Monitor className="w-8 h-8" />
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
          PC 전용 행사 운영 콘솔
        </span>
        <h1 className="text-2xl font-black text-white max-w-md">
          PC 행사 운영 화면입니다
        </h1>
        <p className="text-xs text-slate-400 max-w-sm mt-2 leading-relaxed">
          본 운영 콘솔은 1920×1080 해상도(최소 1280px 폭)에 최적화되어 있습니다.
          대형 디스플레이 또는 PC 브라우저 창을 최대화하여 접속해 주세요.
        </p>
        <div className="mt-6 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-500 font-mono">
          현재 창 너비: {windowWidth}px / 최소 요구: 1280px
        </div>
      </div>
    );
  }

  const meta = SEGMENT_METADATA[publicState.currentSegment];

  return (
    <div className="w-screen h-screen bg-slate-950 text-white flex flex-col overflow-hidden select-none font-sans">
      {/* Top Fixed Status Bar */}
      <header className="h-14 bg-slate-900/95 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 z-30">
        {/* Left: Clock, Title, Mode */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-3 py-1.5 rounded-lg border border-sky-400/20">
            <Clock className="w-3.5 h-3.5" />
            <span>{kstTime || '16:00:00 KST'}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white tracking-tight">HT Reveal Day 2026</span>
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
              publicState.mode === 'live'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {publicState.mode.toUpperCase()}
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 border-l border-slate-800 pl-4">
            <span className="font-semibold text-slate-300">{meta.title}</span>
            <span className="text-slate-500 font-mono">({meta.timeRange})</span>
          </div>
        </div>

        {/* Right: Realtime status, Checkin count, Display Mode, Fullscreen */}
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">
            {connectionStatus === 'connected' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-semibold text-[11px]">Realtime 연결됨</span>
              </>
            ) : connectionStatus === 'polling' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-amber-400 font-semibold text-[11px]">Polling 동기화 중 (3.5s)</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-red-400 font-semibold text-[11px]">오프라인</span>
              </>
            )}
          </div>

          {/* Checkin Count */}
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-bold text-white">{publicState.checkinCount}</span>
            <span className="text-slate-500 text-[10px]">/ 24명</span>
          </div>

          {/* Projector Display Window (Dual Monitor Support) */}
          {!isDisplayOnly && (
            <button
              onClick={() => {
                const url = `/admin/reveal-day/display?mode=${publicState.mode}&eventId=${event.id}`;
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                publicState.mode === 'rehearsal'
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-amber-950/40'
                  : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white border border-indigo-500/40 shadow-indigo-950/40'
              }`}
              title={`현재 ${publicState.mode === 'rehearsal' ? '리허설' : '라이브'} 모드의 빔프로젝터 무대 화면을 새 창으로 엽니다`}
            >
              <ExternalLink className={`w-3.5 h-3.5 ${publicState.mode === 'rehearsal' ? 'text-amber-400' : 'text-indigo-400'}`} />
              <span className="hidden sm:inline">
                {publicState.mode === 'rehearsal' ? '리허설 빔 화면 열기' : '라이브 빔 화면 열기'}
              </span>
            </button>
          )}

          {/* Hide / Show Controls in Presentation View */}
          {!isDisplayOnly && (
            <button
              onClick={() => setIsHideControls(!isHideControls)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all flex items-center gap-1"
              title={isHideControls ? '운영 패널 표시' : '발표 전용 모드 (컨트롤 숨김)'}
            >
              {isHideControls ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
            title="전체화면 (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main 3-Column Studio Layout */}
      <main className="flex-1 p-4 grid grid-cols-12 gap-4 overflow-hidden">
        {/* Left: Event Timeline (col-span-2) */}
        {!isHideControls && (
          <aside className="col-span-2 h-full overflow-hidden">
            <EventTimeline
              currentSegment={publicState.currentSegment}
              onSelectSegment={onTransitionSegment}
            />
          </aside>
        )}

        {/* Center: 16:9 Presentation Stage Canvas */}
        <section className={`h-full flex items-center justify-center overflow-hidden ${
          isHideControls ? 'col-span-12' : 'col-span-7'
        }`}>
          <div className="w-full max-w-[1600px] h-full flex items-center justify-center p-2">
            <StageCanvas
              publicState={publicState}
              snapshotStats={snapshotStats}
              matePairs={matePairs}
              capsules={capsules}
              draws={draws}
              songUrl="/audio/vitamin_song.mp3"
              onNavigateCapsule={onNavigateCapsule}
            />
          </div>
        </section>

        {/* Right: Operator Panel & MC Teleprompter (col-span-3) */}
        {!isHideControls && (
          <aside className="col-span-3 h-full overflow-hidden">
            <OperatorPanel
              event={event}
              publicState={publicState}
              onTransitionSegment={onTransitionSegment}
              onAdvanceMateIndex={onAdvanceMateIndex}
              onExecuteDraw={onExecuteDraw}
              onToggleEmergency={onToggleEmergency}
              onResetCheckins={onResetCheckins}
              onFactoryReset={onFactoryReset}
              onOpenPreflight={() => setShowPreflight(true)}
              onNavigateCapsule={onNavigateCapsule}
              capsulesCount={capsules.length}
              onAdjustPizzaTimer={onAdjustPizzaTimer}
            />
          </aside>
        )}
      </main>

      {/* Preflight Modal */}
      <PreflightPanel
        isOpen={showPreflight}
        onClose={() => setShowPreflight(false)}
        eventId={event.id}
        onStartLive={() => {
          setShowPreflight(false);
          onTransitionSegment('opening');
        }}
      />
    </div>
  );
}
