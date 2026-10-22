'use client';

import React, { useState } from 'react';
import { RevealSegment, RevealEvent, RevealPublicState, MatePairReveal, RevealDrawItem } from '@/lib/reveal-day/types';
import { SEGMENT_METADATA, ORDERED_SEGMENTS } from '@/lib/reveal-day/state-machine';
import { 
  Play, 
  ChevronRight, 
  ChevronLeft, 
  Eye, 
  CheckCircle, 
  Trophy, 
  Gift, 
  RotateCcw, 
  AlertTriangle, 
  Lock, 
  Sparkles,
  FileText,
  Volume2,
  Square,
  Pause,
  Clock,
  Plus,
  Award,
  Check
} from 'lucide-react';

interface OperatorPanelProps {
  event: RevealEvent;
  publicState: RevealPublicState;
  draws?: RevealDrawItem[];
  onTransitionSegment: (nextSegment: RevealSegment) => void;
  onAdvanceMateIndex: (type: 'reveal_next' | 'reveal_batch' | 'next_batch' | 'prev_batch') => void;
  onExecuteDraw: (roundNumber: number, prizeName: string) => void;
  onVoidDraw?: (drawId: string, reason: string) => void;
  onToggleEmergency: (type: 'blackout' | 'holding', active: boolean) => void;
  onResetCheckins?: () => void;
  onFactoryReset?: () => void;
  onOpenPreflight?: () => void;
  onNavigateCapsule?: (newIndex: number) => void;
  capsulesCount?: number;
  onAdjustPizzaTimer?: (seconds: number, isPaused: boolean) => void;
  isProcessing?: boolean;
}

export default function OperatorPanel({
  event,
  publicState,
  draws = [],
  onTransitionSegment,
  onAdvanceMateIndex,
  onExecuteDraw,
  onToggleEmergency,
  onResetCheckins,
  onFactoryReset,
  onOpenPreflight,
  onNavigateCapsule,
  capsulesCount = 24,
  onAdjustPizzaTimer,
  isProcessing
}: OperatorPanelProps) {
  const { currentSegment, isBlackout, isHolding } = publicState;
  const isRehearsal = publicState.mode === 'rehearsal';
  const currentIdx = ORDERED_SEGMENTS.indexOf(currentSegment);
  const nextSegment = currentIdx < ORDERED_SEGMENTS.length - 1 ? ORDERED_SEGMENTS[currentIdx + 1] : null;
  const prevSegment = currentIdx > 0 ? ORDERED_SEGMENTS[currentIdx - 1] : null;

  // Modals / Inputs
  const [showConfirmModal, setShowConfirmModal] = useState<string | null>(null);

  const completedDraws = draws.filter(d => !d.isVoided);
  const completedRounds = completedDraws.map(d => d.roundNumber);
  const maxCompletedRound = completedRounds.length > 0 ? Math.max(...completedRounds) : 0;
  const nextAvailableRound = maxCompletedRound + 1;

  const [drawRound, setDrawRound] = useState<number>(nextAvailableRound);
  const [drawPrizeName, setDrawPrizeName] = useState<string>(
    isRehearsal ? '아이패드 에어 11 M4 256GB' : '베스트 칭찬상 : 스타벅스 상품권 2만원권'
  );

  // Automatically keep drawRound synced to nextAvailableRound if drawRound is already completed or lower
  React.useEffect(() => {
    if (completedRounds.includes(drawRound) || drawRound < nextAvailableRound) {
      setDrawRound(nextAvailableRound);
    }
  }, [nextAvailableRound, draws]);

  const meta = SEGMENT_METADATA[currentSegment];

  // MC Teleprompter Notes
  const mcNotes: Record<RevealSegment, string> = {
    opening: '“안녕하십니까, HT사업본부 비타민 프로그램 Reveal Day에 오신 것을 환영합니다! 스마트폰으로 화면의 QR을 스캔하여 /live에 체크인해 주시기 바랍니다.”',
    journey: '“지난 2달 동안 우리 본부 가족들이 남겨주신 소중한 칭찬과 관찰 메모 통계를 함께 확인하겠습니다. 놀랍게도 서로에게 수많은 따뜻한 마음들이 모였습니다.”',
    mate_reveal: '“이제 모두가 가장 기다려온 순서입니다! 나를 지켜보고 격려해 준 비밀 비타민 메이트는 과연 누구였을까요? 한 분씩 공개해 드리겠습니다.”',
    time_capsule: '“동료들의 응원 메시지를 AI가 분석하여 작성한 감동의 타임캡슐을 오픈합니다. 참석자 여러분은 지금 모바일 화면에서 본인 캡슐을 확인하실 수 있습니다!”',
    lucky_draw: '“행사의 즐거움을 더할 AI 럭키 드로우 시간입니다! 지난 2달간 가장 많은 칭찬을 받으신 분께 드리는 ‘베스트 칭찬상’, 가장 많은 칭찬을 전해주신 ‘베스트 칭찬러상’, 그리고 실시간 행운상 추첨을 시작합니다!”',
    song: '“AI가 우리 본부의 비타민 여정을 바탕으로 작곡하고 노래한 비타민 헌정곡입니다. 가사를 음미하며 함께 감상하시겠습니다.”',
    closing: '“마지막으로 지난 2달간 함께 힘써주신 모든 분들을 위해 본부장님의 맺음말씀이 있겠습니다. 본부장님을 큰 박수로 모시겠습니다!”',
    pizza_party: '“모든 순서가 끝났습니다! 준비된 피자와 함께 자유롭게 네트워킹을 즐겨주시고, 잠시 후 무대 앞에서 단체 기념사진을 촬영하겠습니다!”',
    ended: '행사가 완전히 종료되었습니다. 수고 많으셨습니다!'
  };

  return (
    <div className="w-full h-full flex flex-col justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-4 select-none">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Operator Controls</h3>
          <span className="text-[11px] text-sky-400 font-semibold">{meta.title} ({meta.timeRange})</span>
        </div>
        {onOpenPreflight && (
          <button
            onClick={onOpenPreflight}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-all"
          >
            사전 점검
          </button>
        )}
      </div>

      {/* Segment Specific Controls */}
      <div className="my-3 flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
        {/* Navigation Step Buttons */}
        <div className="flex gap-2">
          {prevSegment && (
            <button
              onClick={() => onTransitionSegment(prevSegment)}
              disabled={isProcessing}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1 border border-slate-700"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>이전 순서</span>
            </button>
          )}

          {nextSegment && (
            <button
              onClick={() => {
                if (currentSegment === 'opening') {
                  setShowConfirmModal('start_event');
                } else {
                  onTransitionSegment(nextSegment);
                }
              }}
              disabled={isProcessing}
              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:opacity-95 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-md shadow-sky-500/20"
            >
              <span>다음 순서 ({SEGMENT_METADATA[nextSegment].title})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dynamic Controls based on Segment */}
        {currentSegment === 'opening' && (
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-sky-500/30 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-400">참석자 체크인 세션 관리</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 font-bold">
                체크인: <strong>{publicState.checkinCount || 0}</strong> / 24명
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              화면의 QR을 스캔한 참가자들이 모바일에서 실시간 체크인 중입니다.
              <span className="block text-[10px] text-amber-300/90 mt-1">
                * 현재 채널: {event.mode === 'rehearsal' ? '🛠️ 리허설 세션 (event-rehearsal)' : '🟢 본행사 LIVE 세션 (event-live-20261028)'}
              </span>
            </p>
            <button
              type="button"
              onClick={() => setShowConfirmModal('reset_checkins')}
              disabled={isProcessing}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-red-950/60 hover:border-red-500/60 border border-slate-700 text-xs font-bold text-slate-300 hover:text-red-300 transition-all flex items-center justify-center gap-1.5 shadow"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-400" />
              <span>체크인 세션 초기화 / 종료 ({event.mode === 'rehearsal' ? '리허설' : '라이브'})</span>
            </button>
          </div>
        )}

        {currentSegment === 'mate_reveal' && (
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-400">메이트 공개 컨트롤</span>
              <span className="text-[10px] font-mono text-slate-400">
                공개: <strong className="text-sky-300">{publicState.currentRevealIndex || 0}</strong>건 | 배치: <strong className="text-indigo-300">{(publicState.currentBatchIndex || 0) + 1}</strong>/6
              </span>
            </div>

            {/* Batch Navigation */}
            <div className="flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => onAdvanceMateIndex('prev_batch')}
                disabled={isProcessing || (publicState.currentBatchIndex || 0) <= 0}
                className="py-1 px-2.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-[11px] font-bold text-slate-300 flex items-center gap-1 transition-all"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>이전 배치</span>
              </button>

              <span className="text-xs font-black text-indigo-300 font-mono">
                Batch {(publicState.currentBatchIndex || 0) + 1} / 6
              </span>

              <button
                type="button"
                onClick={() => onAdvanceMateIndex('next_batch')}
                disabled={isProcessing || (publicState.currentBatchIndex || 0) >= 5}
                className="py-1 px-2.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-[11px] font-bold text-slate-300 flex items-center gap-1 transition-all"
              >
                <span>다음 배치</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Reveal Step Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => onAdvanceMateIndex('reveal_next')}
                disabled={isProcessing}
                className="flex-1 py-3 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
              >
                <Eye className="w-4 h-4" />
                <span>다음 1명 공개 (Space)</span>
              </button>

              <button
                onClick={() => setShowConfirmModal('batch_reveal')}
                disabled={isProcessing}
                className="py-3 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1"
                title="시간 부족 시 현재 배치 일괄 공개"
              >
                <Sparkles className="w-4 h-4" />
                <span>현재 배치 일괄 공개</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              * 일괄 공개 시 현재 배치의 모든 메이트 관계가 즉시 공개되며 화면에 유지됩니다.
            </p>
          </div>
        )}

        {currentSegment === 'time_capsule' && (
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-indigo-500/30 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-300">AI Time Capsule Spotlight 넘기기</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {(publicState.currentCapsuleIndex || 0) + 1} / {capsulesCount || 24}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const max = capsulesCount || 24;
                  const cur = publicState.currentCapsuleIndex || 0;
                  const prev = cur === 0 ? max - 1 : cur - 1;
                  if (onNavigateCapsule) onNavigateCapsule(prev);
                }}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 border border-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>이전 캡슐</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const max = capsulesCount || 24;
                  const cur = publicState.currentCapsuleIndex || 0;
                  const next = cur === max - 1 ? 0 : cur + 1;
                  if (onNavigateCapsule) onNavigateCapsule(next);
                }}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:opacity-90 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 shadow shadow-sky-600/20"
              >
                <span>다음 캡슐</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              * 다음 캡슐을 클릭하면 빔프로젝터 송출 화면과 실시간으로 연동되어 동일한 타임캡슐이 즉시 표시됩니다.
            </p>
          </div>
        )}

        {currentSegment === 'lucky_draw' && (
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/30 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                <Gift className="w-4 h-4" />
                <span>AI Lucky Draw 추첨 콘솔</span>
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                24명 자동 풀 등록 (1인 1당첨)
              </span>
            </div>

            {/* Presets Group 1: 본 행사 사전 셋팅 상 (3종) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>사전 셋팅 공식 상 (3종)</span>
                </span>
                <span className="text-[9px] text-slate-400">선택 시 다음 순차 라운드로 지정</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  {
                    key: 'best_received',
                    name: '베스트 칭찬상 : 스타벅스 상품권 2만원권',
                    subtitle: '칭찬을 가장 많이 받은 사람',
                    tag: '👏 칭찬 최다 수신'
                  },
                  {
                    key: 'best_giver',
                    name: '베스트 칭찬러 : 스타벅스 상품권 2만원권',
                    subtitle: '칭찬을 가장 많이 한 사람',
                    tag: '💌 칭찬 최다 발신'
                  },
                  {
                    key: 'lucky_1',
                    name: '행운상 : 스타벅스 상품권 2만원권',
                    subtitle: '실시간 행운 난수 추첨',
                    tag: '🍀 행운 난수 추첨'
                  }
                ].map((preset) => {
                  const existingDraw = completedDraws.find(d => d.prizeName.includes(preset.name.split(' :')[0]));
                  const isCompleted = !!existingDraw;
                  const isSelected = !isCompleted && drawPrizeName === preset.name && drawRound === nextAvailableRound;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      disabled={isCompleted || isProcessing}
                      onClick={() => {
                        setDrawRound(nextAvailableRound);
                        setDrawPrizeName(preset.name);
                      }}
                      className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                        isCompleted
                          ? 'bg-slate-900/40 border-slate-800/60 text-slate-500 cursor-not-allowed opacity-80'
                          : isSelected
                          ? 'bg-amber-500/20 text-white border-amber-400 shadow-sm shadow-amber-500/20'
                          : 'bg-slate-900/80 hover:bg-slate-800/90 text-slate-300 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isCompleted
                            ? 'bg-slate-800 text-slate-400'
                            : isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-amber-400'
                        }`}>
                          {isCompleted ? `R${existingDraw.roundNumber}` : `R${nextAvailableRound}`}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{preset.name}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                            <span className="text-amber-300/90 font-medium">{preset.tag}</span>
                            <span>·</span>
                            <span>{preset.subtitle}</span>
                          </div>
                        </div>
                      </div>
                      {isCompleted ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 whitespace-nowrap">
                          ✓ R{existingDraw.roundNumber} {existingDraw.winnerName}
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-semibold whitespace-nowrap">
                          선택 시 R{nextAvailableRound}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Presets Group 2: 테스트 추첨용 사전 셋팅 (1, 2번) */}
            <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>테스트 추첨 셋팅 (1~2번)</span>
                </span>
                <span className="text-[9px] text-sky-400/80">사전 테스트 (당첨 시 본 추첨 모수 제외)</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { key: 'test_1', name: '아이패드 에어 11 M4 256GB', tag: '테스트 1' },
                  { key: 'test_2', name: '애플 맥북 프로 14 M5', tag: '테스트 2' },
                ].map((preset) => {
                  const existingDraw = completedDraws.find(d => d.prizeName.includes(preset.name));
                  const isCompleted = !!existingDraw;
                  const isSelected = !isCompleted && drawPrizeName === preset.name && drawRound === nextAvailableRound;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      disabled={isCompleted || isProcessing}
                      onClick={() => {
                        setDrawRound(nextAvailableRound);
                        setDrawPrizeName(preset.name);
                      }}
                      className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 ${
                        isCompleted
                          ? 'bg-slate-900/40 border-slate-800/60 text-slate-500 cursor-not-allowed opacity-80'
                          : isSelected
                          ? 'bg-sky-500/20 text-white border-sky-400 shadow-sm shadow-sky-500/20'
                          : 'bg-slate-900/80 hover:bg-slate-800/90 text-slate-300 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] px-1 rounded font-bold ${
                          isCompleted ? 'bg-slate-800 text-slate-400' : 'bg-sky-500/20 text-sky-300'
                        }`}>
                          {preset.tag}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {isCompleted ? `R${existingDraw.roundNumber} 완료` : `R${nextAvailableRound}`}
                        </span>
                      </div>
                      <span className="text-xs font-bold leading-tight line-clamp-1">{preset.name}</span>
                      {isCompleted ? (
                        <div className="text-[9px] text-emerald-400 font-medium truncate">
                          ✓ {existingDraw.winnerName} (모수 제외)
                        </div>
                      ) : (
                        <div className="text-[9px] text-slate-500">클릭 시 R{nextAvailableRound} 세팅</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add Next Round / Custom Round Setup */}
            <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-300">이후 라운드 추가 및 수동 지정</span>
                  <div className="text-[9px] text-slate-400">
                    진행 완료: {completedRounds.length > 0 ? completedRounds.sort((a,b)=>a-b).map(r => `R${r}`).join(', ') : '없음'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDrawRound(nextAvailableRound);
                    setDrawPrizeName(`행운상 ${Math.max(2, nextAvailableRound - 2)}차 : 스타벅스 상품권 2만원권`);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 text-[10px] font-bold flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ 다음 라운드(R{nextAvailableRound}) 추가</span>
                </button>
              </div>

              {/* Quick Template Chips */}
              <div className="flex flex-wrap gap-1">
                {[
                  '행운상 2차 : 스타벅스 상품권 2만원권',
                  '행운상 3차 : 스타벅스 상품권 2만원권',
                  '특별상 : 스타벅스 상품권 2만원권',
                  '깜짝상 : 스타벅스 상품권 2만원권'
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setDrawRound(nextAvailableRound);
                      setDrawPrizeName(chip);
                    }}
                    className={`text-[9px] px-1.5 py-0.5 rounded border transition-all ${
                      drawPrizeName === chip
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                    }`}
                  >
                    {chip.split(':')[0]}
                  </button>
                ))}
              </div>

              {/* Editable Round & Prize inputs */}
              <div className="grid grid-cols-3 gap-2 mt-0.5">
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[9px] text-slate-400 block">라운드</label>
                    <span className="text-[8px] text-amber-400 font-mono">min: R{nextAvailableRound}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={nextAvailableRound}
                      max={30}
                      value={drawRound}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val < nextAvailableRound) {
                          setDrawRound(nextAvailableRound);
                        } else {
                          setDrawRound(val);
                        }
                      }}
                      className="w-full py-1.5 px-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                    />
                    <button
                      type="button"
                      disabled={drawRound <= nextAvailableRound}
                      onClick={() => setDrawRound(prev => Math.max(nextAvailableRound, prev - 1))}
                      className="py-1 px-1.5 rounded bg-slate-800 disabled:opacity-30 text-[10px] text-slate-300 font-bold hover:bg-slate-700"
                      title="라운드 -1"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrawRound(prev => Math.min(30, prev + 1))}
                      className="py-1 px-1.5 rounded bg-slate-800 text-[10px] text-slate-300 font-bold hover:bg-slate-700"
                      title="라운드 +1"
                    >
                      +1
                    </button>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] text-slate-400 block mb-0.5">추첨 상품명</label>
                  <input
                    type="text"
                    value={drawPrizeName}
                    onChange={(e) => setDrawPrizeName(e.target.value)}
                    placeholder="추첨 상품명 입력"
                    className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Execute Draw CTA Button */}
            <button
              onClick={() => {
                if (completedRounds.includes(drawRound)) {
                  alert(`Round ${drawRound}은 이미 추첨이 완료되었습니다. 다음 미추첨 라운드(Round ${nextAvailableRound})로 진행해주세요.`);
                  setDrawRound(nextAvailableRound);
                  return;
                }
                setShowConfirmModal('execute_draw');
              }}
              disabled={isProcessing}
              className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:opacity-95 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 mt-1"
            >
              <Gift className="w-4 h-4" />
              <span>Round {drawRound} {drawPrizeName.includes('베스트') ? '선정 및 확정' : '추첨 실행'}</span>
            </button>
            <p className="text-[10px] text-slate-500">
              * 진행된 라운드(1~{maxCompletedRound})는 중복 선택이 차단되며, 테스트 당첨자는 본 추첨 모수에서 자동 제외됩니다.
            </p>
          </div>
        )}

        {currentSegment === 'pizza_party' && (
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/30 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <Clock className="w-4 h-4" />
                <span>🍕 피자 파티 카운트다운 타이머</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                publicState.isPizzaTimerPaused
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {publicState.isPizzaTimerPaused ? '일시정지 중' : '실시간 카운트다운 중'}
              </span>
            </div>

            {/* Large Digital Timer Readout */}
            <div className="flex items-center justify-center py-2 px-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="font-mono text-3xl font-black tracking-wider text-emerald-400">
                {String(Math.floor((publicState.pizzaTimerSeconds ?? 50 * 60) / 60)).padStart(2, '0')}
                :
                {String((publicState.pizzaTimerSeconds ?? 50 * 60) % 60).padStart(2, '0')}
              </span>
            </div>

            {/* Quick Adjust Buttons */}
            <div className="flex flex-col gap-1.5">
              <div className="text-[10px] text-slate-400 font-semibold">시간 미세 조정 (빔프로젝터 실시간 동기화)</div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: '-10분', delta: -10 * 60 },
                  { label: '-5분', delta: -5 * 60 },
                  { label: '+5분', delta: 5 * 60 },
                  { label: '+10분', delta: 10 * 60 },
                ].map(({ label, delta }) => (
                  <button
                    key={label}
                    onClick={() => {
                      const cur = publicState.pizzaTimerSeconds ?? 50 * 60;
                      const next = Math.max(0, cur + delta);
                      onAdjustPizzaTimer?.(next, publicState.isPizzaTimerPaused ?? false);
                    }}
                    disabled={isProcessing}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-[11px] font-bold text-slate-200 transition-all border border-slate-700/60"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-col gap-1.5">
              <div className="text-[10px] text-slate-400 font-semibold">빠른 시간 세팅</div>
              <div className="grid grid-cols-4 gap-1.5">
                {[50, 40, 30, 20].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => onAdjustPizzaTimer?.(mins * 60, publicState.isPizzaTimerPaused ?? false)}
                    disabled={isProcessing}
                    className={`py-1.5 px-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                      Math.floor((publicState.pizzaTimerSeconds ?? 50 * 60) / 60) === mins
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                    }`}
                  >
                    {mins}분{mins === 50 ? ' (기본)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Pause / Resume & Reset Controls */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  const cur = publicState.pizzaTimerSeconds ?? 50 * 60;
                  const nextPaused = !publicState.isPizzaTimerPaused;
                  onAdjustPizzaTimer?.(cur, nextPaused);
                }}
                disabled={isProcessing}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                  publicState.isPizzaTimerPaused
                    ? 'bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 border-emerald-500/40'
                    : 'bg-amber-600/30 hover:bg-amber-600/40 text-amber-200 border-amber-500/40'
                }`}
              >
                {publicState.isPizzaTimerPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>타이머 재개</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>일시정지</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onAdjustPizzaTimer?.(50 * 60, false)}
                disabled={isProcessing}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>50분 초기화</span>
              </button>
            </div>

            {/* End Event Modal Trigger */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
              <button
                onClick={() => setShowConfirmModal('end_event')}
                disabled={isProcessing}
                className="py-2 px-3 rounded-xl bg-red-600/70 hover:bg-red-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Square className="w-3.5 h-3.5" />
                <span>행사 최종 종료 확정 (End Event)</span>
              </button>
            </div>
          </div>
        )}

        {/* MC Teleprompter Note Box */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-300">
            <FileText className="w-3.5 h-3.5" />
            <span>MC 진행 큐노트</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-medium bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
            {mcNotes[currentSegment]}
          </p>
        </div>
      </div>

      {/* Emergency & Stage Safety Controls */}
      <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          비상 대응 컨트롤
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onToggleEmergency('blackout', !isBlackout)}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
              isBlackout
                ? 'bg-red-600 text-white border-red-500 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <span>블랙아웃 (B)</span>
          </button>

          <button
            onClick={() => onToggleEmergency('holding', !isHolding)}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
              isHolding
                ? 'bg-amber-600 text-white border-amber-500 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <span>대기 화면 (H)</span>
          </button>
        </div>

        {/* Full Factory Reset Button */}
        {onFactoryReset && (
          <button
            onClick={() => setShowConfirmModal('factory_reset')}
            className="w-full py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 hover:border-red-600 shadow-sm"
            title="테스트 후 행사 시작 전 초기 상태로 전체 리셋"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>행사 전체 초기화 (Factory Reset)</span>
          </button>
        )}
      </div>

      {/* Confirmation Modals */}
      {showConfirmModal === 'batch_reveal' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-white shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base">배치 일괄 공개 확인</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              현재 배치의 모든 메이트 관계를 즉시 일괄 공개하시겠습니까? 공개된 관계는 실시간으로 무대와 모바일에 전달됩니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold hover:bg-slate-700"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(null);
                  onAdvanceMateIndex('reveal_batch');
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-xs font-bold hover:bg-indigo-500"
              >
                확인 및 공개
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal === 'execute_draw' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-white shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-amber-400">
              <Trophy className="w-6 h-6" />
              <h3 className="font-bold text-base">Lucky Draw 추첨 실행 확인</h3>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
              <div>라운드: <span className="font-bold text-white">Round {drawRound}</span></div>
              <div>상품명: <span className="font-bold text-amber-400">{drawPrizeName}</span></div>
              <div>엔진: <span className="font-mono text-emerald-400">Server CSPRNG</span></div>
            </div>
            <p className="text-xs text-slate-400">
              추첨 결과는 데이터베이스에 영구 감사 로그로 보존되며 모바일과 무대에 즉시 반영됩니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold hover:bg-slate-700"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(null);
                  onExecuteDraw(drawRound, drawPrizeName);
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400"
              >
                추첨 실행
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal === 'start_event' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-white shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-sky-400">
              <Play className="w-6 h-6" />
              <h3 className="font-bold text-base">Reveal Day 본 행사 시작</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Opening을 마치고 공식 2번째 순서인 <strong>Vitamin Journey</strong>로 전환하시겠습니까?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold hover:bg-slate-700"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(null);
                  onTransitionSegment('journey');
                }}
                className="flex-1 py-2.5 rounded-xl bg-sky-500 text-white font-bold text-xs hover:bg-sky-400"
              >
                행사 시작
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal === 'end_event' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-white shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base">Reveal Day 행사 종료</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              행사를 최종 종료 처리하시겠습니까? 종료 후 행사 상태가 `ended`로 보존되며 참석자들은 언제든 개인 타임캡슐을 열람할 수 있습니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold hover:bg-slate-700"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(null);
                  onTransitionSegment('ended');
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-500"
              >
                최종 종료
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal === 'reset_checkins' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 max-w-sm w-full text-white shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-red-400">
              <RotateCcw className="w-6 h-6" />
              <h3 className="font-bold text-base">체크인 세션 초기화 / 종료</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              현재 <strong className="text-amber-400">{event.mode === 'rehearsal' ? '리허설 모드' : '라이브 모드'}</strong>에 등록된 모든 참석자 체크인({publicState.checkinCount || 0}명)을 초기화하고 세션을 종료하시겠습니까?
              <br /><br />
              <span className="text-amber-300 font-medium">
                * 참석자 모바일 화면의 체크인 상태도 실시간으로 즉시 미체크인으로 초기화되며 다시 체크인할 수 있게 됩니다.
              </span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold hover:bg-slate-700"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(null);
                  if (onResetCheckins) onResetCheckins();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-500 shadow-lg shadow-red-600/30"
              >
                초기화 확정
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal === 'factory_reset' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl p-6 max-w-sm w-full text-white shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
              <h3 className="font-bold text-base">행사 전체 초기화 (Factory Reset)</h3>
            </div>
            <div className="text-xs text-slate-300 leading-relaxed space-y-2">
              <p>
                현재 <strong className="text-amber-400">{event.mode === 'rehearsal' ? '리허설 모드' : '본행사 LIVE 모드'}</strong>를 행사 시작 전 최초 상태로 완벽히 되돌리시겠습니까?
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>• 진행 순서: <strong className="text-sky-400">Opening</strong>으로 복귀</div>
                <div>• 당일 체크인: <strong className="text-white">0명</strong>으로 리셋</div>
                <div>• 럭키드로우: <strong className="text-white">추첨 기록만 초기화</strong></div>
                <div>• 무대 화면: <strong className="text-white">공개 단계 0</strong>으로 리셋</div>
                <div>• 실시간 응원/피드: <strong className="text-white">초기화</strong></div>
              </div>
              <p className="text-[11px] text-emerald-400 font-medium">
                ✓ <strong>개인 화면 데이터 보존:</strong> 기존 메이트 배정(Mate), 롤링페이퍼(Wall), 칭찬 메시지, 개인 메모(Memo) 데이터는 100% 안전하게 유지되며 절대 삭제되지 않습니다.
              </p>
              <p className="text-[11px] text-amber-300">
                * 테스트 진행 후 본 행사 시작 직전에 무대 송출 및 당일 기록만 깨끗한 초기 상태로 세팅할 때 사용합니다.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold hover:bg-slate-700"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(null);
                  if (onFactoryReset) onFactoryReset();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-500 shadow-lg shadow-red-600/40"
              >
                전체 초기화 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
