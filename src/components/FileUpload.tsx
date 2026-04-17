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
      setTimeout(() => {
        setStatus('error');
        setErrorMsg(
          'PPTX/DOCX はMVPでは未対応です。PDFまたはTXTをご利用ください。',
        );
      }, 400);
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

  const dropClass = dragOver
    ? 'border-[var(--accent)] bg-accent-soft'
    : 'border-apple-line bg-apple-white hover:border-apple-fg-2';

  return (
    <div className="w-full">
      <label
        htmlFor="upload-input"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={() => setDragOver(false)}
        className={`block rounded-xl border border-dashed cursor-pointer p-12 text-center transition-colors ${dropClass} ${
          status === 'parsing' ? 'pointer-events-none opacity-60' : ''
        }`}
      >
        <div className="t-subtitle text-apple-fg mb-2">資料をアップロード</div>
        <div className="t-body text-apple-fg-2 mb-1">
          ドラッグ＆ドロップ または クリックして選択
        </div>
        <div className="t-caption text-apple-fg-2">{ACCEPT_PRETTY}</div>
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
        <div className="mt-6 p-5 bg-apple-gray rounded-xl">
          <div className="t-small text-apple-fg-2 mb-2">
            ファイル: <span className="text-apple-fg">{fileName}</span>
          </div>
          {status === 'parsing' && (
            <div className="flex items-center gap-3">
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)] rec-blink" />
              <span className="t-body text-apple-fg">Claude AIが分析中...</span>
            </div>
          )}
          {status === 'error' && errorMsg && (
            <div className="space-y-3">
              <div className="t-body text-apple-fg">⚠ {errorMsg}</div>
              <button type="button" onClick={reset} className="link-chev">
                別のファイルを試す
              </button>
            </div>
          )}
          {status === 'done' && (
            <div className="space-y-3">
              <div className="t-body text-apple-fg">
                ✓ 分析完了。下に結果を表示しました。
              </div>
              <button type="button" onClick={reset} className="link-chev">
                別のファイルを分析
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
