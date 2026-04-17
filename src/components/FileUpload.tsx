'use client';

import { useRef, useState, type DragEvent } from 'react';
import type { AnalysisResult } from '@/types';
import { getPreferences } from '@/lib/storage';

type Status = 'idle' | 'parsing' | 'done' | 'error';

const ACCEPT = '.pdf,.txt,.pptx,.docx';
const ACCEPT_PRETTY = 'PDF / TXT (PPTX/DOCX は近日対応)';

type Props = {
  onResult: (result: AnalysisResult) => void;
};

export function FileUpload({ onResult }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setStatus('parsing');
    setErrorMsg(null);

    const ext = file.name.toLowerCase().split('.').pop() ?? '';
    if (ext === 'pptx' || ext === 'docx') {
      // MVP: keep mock for these formats.
      setTimeout(() => {
        setStatus('error');
        setErrorMsg(
          'PPTX/DOCX はMVPでは未対応です。PDFまたはTXTをご利用ください。',
        );
      }, 600);
      return;
    }

    try {
      const form = new FormData();
      form.append('file', file);
      const industryId = getPreferences()?.industryId;
      if (industryId) form.append('industryId', industryId);
      const res = await fetch('/api/analyze-file', {
        method: 'POST',
        body: form,
      });
      const data = (await res.json()) as
        | (AnalysisResult & { error?: undefined })
        | { error: string };
      if (!res.ok || 'error' in data) {
        throw new Error(
          ('error' in data && data.error) || `分析に失敗しました (${res.status})`,
        );
      }
      onResult(data as AnalysisResult);
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : '分析に失敗しました');
    }
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const onDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const reset = () => {
    setStatus('idle');
    setFileName(null);
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <label
        htmlFor="upload-input"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={() => setDragOver(false)}
        className={`block rounded-3xl border-2 border-dashed cursor-pointer p-10 text-center transition ${
          dragOver
            ? 'border-amber-400 bg-amber-500/10'
            : 'border-border-soft bg-surface-1/60 hover:border-amber-500/60 hover:bg-surface-2/60'
        } ${status === 'parsing' ? 'pointer-events-none opacity-60' : ''}`}
      >
        <div className="text-4xl mb-3" aria-hidden>📄</div>
        <div className="font-display tracking-widest uppercase text-sm text-amber-200 mb-1">
          資料をアップロード
        </div>
        <div className="text-xs text-amber-100/60 mb-2">
          ドラッグ＆ドロップ または クリックして選択
        </div>
        <div className="text-[10px] text-amber-200/40">{ACCEPT_PRETTY}</div>
        <input
          id="upload-input"
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          disabled={status === 'parsing'}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </label>

      {status !== 'idle' && (
        <div className="mt-4 rounded-2xl bg-surface-2/80 border border-border-soft p-4">
          <div className="text-xs text-amber-100/70 mb-2">
            ファイル: <span className="text-amber-200">{fileName}</span>
          </div>
          {status === 'parsing' && (
            <div className="flex items-center gap-3">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400 pulse-amber" />
              <span className="text-sm text-amber-200">
                Claude AIが分析中...
              </span>
            </div>
          )}
          {status === 'error' && errorMsg && (
            <div className="space-y-3">
              <div className="text-sm text-red-200">⚠ {errorMsg}</div>
              <button
                type="button"
                onClick={reset}
                className="text-[11px] font-display tracking-wider uppercase text-amber-200/70 hover:text-amber-200"
              >
                ↻ 別のファイルを試す
              </button>
            </div>
          )}
          {status === 'done' && (
            <div className="space-y-2">
              <div className="text-sm text-emerald-300">
                ✓ 分析完了。下に結果を表示しました。
              </div>
              <button
                type="button"
                onClick={reset}
                className="text-[11px] font-display tracking-wider uppercase text-amber-200/70 hover:text-amber-200"
              >
                ↻ 別のファイルを分析
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
