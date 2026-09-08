'use client';

import React from 'react';
import { AlertTriangle, Database, Terminal, FileCode } from 'lucide-react';

export default function SupabaseConfigError() {
  return (
    <div className="p-6 rounded-3xl bg-amber-50 border-2 border-amber-200 shadow-lg flex flex-col gap-4 my-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-amber-950">
            Supabase 환경변수 설정이 필요합니다
          </h3>
          <p className="text-xs text-amber-800 font-medium">
            실제 공용 DB(Supabase) 연동 모드로 설정되었습니다.
          </p>
        </div>
      </div>

      <div className="p-4 bg-white/90 rounded-2xl border border-amber-200/80 text-xs flex flex-col gap-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <FileCode className="w-4 h-4 text-amber-600" />
          <span>.env.local 파일 설정 방법:</span>
        </div>
        <p className="text-[11px] text-slate-600">
          프로젝트 루트 디렉토리의 <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-amber-700">.env.local</code> 파일에 본인의 Supabase 키를 입력하세요:
        </p>
        <pre className="bg-slate-900 text-amber-300 p-3 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here`}
        </pre>
      </div>

      <div className="p-3 bg-amber-100/70 rounded-xl text-[11px] text-amber-900 flex items-start gap-2 font-medium">
        <Database className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p>
          Supabase SQL Editor에서 <code className="font-bold underline">supabase_schema.sql</code> 파일을 실행하시면 테이블과 권한 설정이 완료됩니다.
        </p>
      </div>
    </div>
  );
}
