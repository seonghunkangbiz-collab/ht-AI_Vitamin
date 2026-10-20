'use client';

import React, { useState } from 'react';
import { RevealSegment, RevealEvent, RevealPublicState, MatePairReveal } from '@/lib/reveal-day/types';
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
  Square
} from 'lucide-react';

interface OperatorPanelProps {
  event: RevealEvent;
  publicState: RevealPublicState;
  onTransitionSegment: (nextSegment: RevealSegment) => void;
  onAdvanceMateIndex: (type: 'reveal_next' | 'reveal_batch' | 'next_batch' | 'prev_batch') => void;
  onExecuteDraw: (roundNumber: number, prizeName: string) => void;
  onVoidDraw?: (drawId: string, reason: string) => void;
  onToggleEmergency: (type: 'blackout' | 'holding', active: boolean) => void;
  onResetCheckins?: () => void;
  onFactoryReset?: () => void;
  onOpenPreflight?: () => void;
  isProcessing?: boolean;
}

export default function OperatorPanel({
  event,
  publicState,
  onTransitionSegment,
  onAdvanceMateIndex,
  onExecuteDraw,
  onToggleEmergency,
  onResetCheckins,
  onFactoryReset,
  onOpenPreflight,
  isProcessing
}: OperatorPanelProps) {
  const { currentSegment, isBlackout, isHolding } = publicState;
  const currentIdx = ORDERED_SEGMENTS.indexOf(currentSegment);
  const nextSegment = currentIdx < ORDERED_SEGMENTS.length - 1 ? ORDERED_SEGMENTS[currentIdx + 1] : null;
  const prevSegment = currentIdx > 0 ? ORDERED_SEGMENTS[currentIdx - 1] : null;

  // Modals / Inputs
  const [showConfirmModal, setShowConfirmModal] = useState<string | null>(null);
  const [drawRound, setDrawRound] = useState<number>(1);
  const [drawPrizeName, setDrawPrizeName] = useState<string>('소니 프리미엄 노이즈캔슬링 헤드폰');

  const meta = SEGMENT_METADATA[currentSegment];

  // MC Teleprompter Notes
  const mcNotes: Record<RevealSegment, string> = {
    opening: '“안녕하십니까, HT사업본부 비타민 프로그램 Reveal Day에 오신 것을 환영합니다! 스마트폰으로 화면의 QR을 스캔하여 /live에 체크인해 주시기 바랍니다.”',
    journey: '“지난 2달 동안 우리 본부 가족들이 남겨주신 소중한 칭찬과 관찰 메모 통계를 함께 확인하겠습니다. 놀랍게도 서로에게 수많은 따뜻한 마음들이 모였습니다.”',
    mate_reveal: '“이제 모두가 가장 기다려온 순서입니다! 나를 지켜보고 격려해 준 비밀 비타민 메이트는 과연 누구였을까요? 한 분씩 공개해 드리겠습니다.”',
    time_capsule: '“동료들의 응원 메시지를 AI가 분석하여 작성한 감동의 타임캡슐을 오픈합니다. 참석자 여러분은 지금 모바일 화면에서 본인 캡슐을 확인하실 수 있습니다!”',
    lucky_draw: '“행사의 즐거움을 더할 AI 럭키 드로우 시간입니다! 서버의 난수 알고리즘을 통해 공정하게 추첨을 진행하겠습니다. 첫 번째 라운드 시작합니다!”',
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

        {currentSegment === 'lucky_draw' && (
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/30 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400">AI Lucky Draw 추첨 실행</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">전체 24명 자동 풀 등록</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">라운드</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={drawRound}
                    onChange={(e) => setDrawRound(Number(e.target.value))}
                    className="w-full py-1.5 px-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setDrawRound(prev => Math.min(10, prev + 1))}
                    className="py-1 px-1.5 rounded bg-slate-800 text-[10px] text-slate-300 font-bold hover:bg-slate-700"
                    title="다음 라운드로 +1"
                  >
                    +1
                  </button>
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-slate-400 block mb-1">상품명</label>
                <input
                  type="text"
                  value={drawPrizeName}
                  onChange={(e) => setDrawPrizeName(e.target.value)}
                  placeholder="추첨 상품명 입력"
                  className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>
            </div>

            {/* Quick Prize Presets */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-slate-400">상품 프리셋 빠른 선택:</span>
              <div className="flex flex-wrap gap-1">
                {[
                  { round: 1, name: '1등: 소니 노이즈캔슬링 헤드폰' },
                  { round: 2, name: '2등: 신세계 상품권 10만원권' },
                  { round: 3, name: '3등: 배달의민족 상품권 5만원권' },
                  { round: 4, name: '특별상: 스타벅스 e-카드 3만원권' },
                  { round: 5, name: '행운상: 올리브영 기프트카드 2만원권' },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setDrawRound(preset.round);
                      setDrawPrizeName(preset.name);
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                      drawPrizeName === preset.name
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                    }`}
                  >
                    {preset.name.split(':')[0]}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowConfirmModal('execute_draw')}
              disabled={isProcessing}
              className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:opacity-95 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Gift className="w-4 h-4" />
              <span>Round {drawRound} 서버 난수 추첨 실행</span>
            </button>
            <p className="text-[10px] text-slate-500">
              * CSPRNG 난수 알고리즘으로 이전 라운드 당첨자는 자동 제외(1인 1당첨)됩니다.
            </p>
          </div>
        )}

        {currentSegment === 'pizza_party' && (
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-red-500/30 flex flex-col gap-2">
            <div className="text-[11px] font-bold text-red-400">행사 최종 마감</div>
            <button
              onClick={() => setShowConfirmModal('end_event')}
              disabled={isProcessing}
              className="py-2.5 px-3 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Square className="w-4 h-4" />
              <span>행사 최종 종료 확정 (End Event)</span>
            </button>
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
                <div>• 참석자 체크인: <strong className="text-white">0명</strong>으로 리셋</div>
                <div>• 럭키드로우 추첨: <strong className="text-white">당첨 기록 삭제</strong></div>
                <div>• 메이트 공개: <strong className="text-white">모두 미공개</strong>로 리셋</div>
                <div>• 실시간 응원/리액션: <strong className="text-white">초기화</strong></div>
              </div>
              <p className="text-[11px] text-amber-300">
                * 테스트 진행 후 본 행사 시작 직전에 깨끗한 초기 상태로 세팅할 때 사용합니다.
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
