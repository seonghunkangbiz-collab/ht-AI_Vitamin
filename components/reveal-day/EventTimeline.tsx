'use client';

import React from 'react';
import { ORDERED_SEGMENTS, SEGMENT_METADATA } from '@/lib/reveal-day/state-machine';
import { RevealSegment } from '@/lib/reveal-day/types';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface EventTimelineProps {
  currentSegment: RevealSegment;
  onSelectSegment?: (segment: RevealSegment) => void;
  disabled?: boolean;
}

export default function EventTimeline({ currentSegment, onSelectSegment, disabled }: EventTimelineProps) {
  const currentIdx = ORDERED_SEGMENTS.indexOf(currentSegment);

  return (
    <div className="w-full h-full flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl p-4 select-none">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Event Timeline</h3>
        <span className="text-[11px] text-sky-400 font-semibold">16:00 ~ 17:30</span>
      </div>

      <div className="flex-1 flex flex-col justify-between gap-1 overflow-y-auto">
        {ORDERED_SEGMENTS.filter(s => s !== 'ended').map((seg, idx) => {
          const meta = SEGMENT_METADATA[seg];
          const isCurrent = seg === currentSegment;
          const isPassed = idx < currentIdx;

          return (
            <button
              key={seg}
              onClick={() => onSelectSegment && !disabled && onSelectSegment(seg)}
              disabled={disabled}
              className={`flex items-start gap-3 p-2.5 rounded-xl text-left transition-all relative ${
                isCurrent
                  ? 'bg-gradient-to-r from-sky-500/20 to-indigo-500/10 border border-sky-400/40 text-white shadow-md shadow-sky-500/10'
                  : isPassed
                    ? 'hover:bg-slate-800/60 text-slate-400 border border-transparent'
                    : 'hover:bg-slate-800/40 text-slate-500 border border-transparent'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isPassed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isCurrent ? (
                  <div className="w-4 h-4 rounded-full bg-sky-400 animate-pulse flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                ) : (
                  <Circle className="w-4 h-4 text-slate-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold truncate ${isCurrent ? 'text-white' : isPassed ? 'text-slate-300' : 'text-slate-400'}`}>
                    {idx + 1}. {meta.title}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{meta.durationMinutes}m</span>
                </div>
                <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                  {meta.timeRange}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
