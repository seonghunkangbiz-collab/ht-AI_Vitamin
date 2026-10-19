'use client';

import React, { useState, useEffect } from 'react';
import { PreflightReport, PreflightItem } from '@/lib/reveal-day/types';
import { CheckCircle2, AlertTriangle, XCircle, RotateCcw, X, ShieldCheck, ArrowRight } from 'lucide-react';

interface PreflightPanelProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onStartLive?: (overrideReason?: string) => void;
}

export default function PreflightPanel({ isOpen, onClose, eventId, onStartLive }: PreflightPanelProps) {
  const [report, setReport] = useState<PreflightReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const fetchPreflight = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/reveal-day/preflight?eventId=${encodeURIComponent(eventId)}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPreflight();
    }
  }, [isOpen, eventId]);

  if (!isOpen) return null;

  const canProceed = report && !report.hasErrors && (!report.hasWarnings || overrideReason.trim().length >= 5);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl text-white overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">행사 전 사전 점검 (Preflight Checklist)</h2>
              <p className="text-xs text-slate-400">라이브 무대 개시 전 데이터 및 인프라 무결성을 전수 점검합니다.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Items */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-3">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">시스템 및 데이터 무결성 검사 중...</span>
            </div>
          ) : report ? (
            <div className="flex flex-col gap-2.5">
              {report.items.map((item) => (
                <div
                  key={item.key}
                  className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                    item.status === 'pass'
                      ? 'bg-slate-950/40 border-slate-800/80 text-slate-300'
                      : item.status === 'warn'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                        : 'bg-red-500/10 border-red-500/30 text-red-200'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {item.status === 'pass' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {item.status === 'warn' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                    {item.status === 'fail' && <XCircle className="w-4 h-4 text-red-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{item.title}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        item.status === 'pass'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : item.status === 'warn'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-red-500/20 text-red-300'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.message}</p>
                  </div>
                </div>
              ))}

              {/* Warning override input */}
              {report.hasWarnings && !report.hasErrors && (
                <div className="mt-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2">
                  <span className="text-xs font-bold text-amber-300">
                    경고 항목 확인 및 진행 사유 입력
                  </span>
                  <p className="text-[11px] text-slate-400">
                    일부 경고 항목이 있습니다. 관리자 확인 사유를 5자 이상 입력하시면 라이브를 시작할 수 있습니다.
                  </p>
                  <input
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="예: 리허설 진행으로 사전 점검 승인함"
                    className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              점검 결과를 불러오지 못했습니다.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
          <button
            onClick={fetchPreflight}
            disabled={isLoading}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>재검사</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all"
            >
              닫기
            </button>
            {onStartLive && (
              <button
                onClick={() => onStartLive(overrideReason)}
                disabled={!canProceed || isLoading}
                className={`py-2.5 px-5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg ${
                  canProceed
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:opacity-95 text-white shadow-sky-500/20'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                <span>라이브 행사 시작</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
