'use client';

import { useRef, useState, type DragEvent } from 'react';

type Status = 'idle' | 'parsing' | 'done' | 'error';

const ACCEPT = '.pdf,.pptx,.docx,.txt';
const ACCEPT_PRETTY = 'PDF / PPTX / DOCX / TXT';

export function FileUpload() {
  const [status, setStatus] = useState<Status>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [extractedCount, setExtractedCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setFileName(file.name);
    setStatus('parsing');
    // MVP: mock parsing — pretend we extracted 5 keywords.
    setTimeout(() => {
      setExtractedCount(5);
      setStatus('done');
    }, 1800);
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const reset = () => {
    setStatus('idle');
    setFileName(null);
    setExtractedCount(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <label
        htmlFor="upload-input"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={() => setDragOver(false)}
        className={`block rounded-3xl border-2 border-dashed cursor-pointer p-10 text-center transition ${
          dragOver
            ? 'border-amber-400 bg-amber-500/10'
            : 'border-border-soft bg-surface-1/60 hover:border-amber-500/60 hover:bg-surface-2/60'
        }`}
      >
        <div className="text-4xl mb-3" aria-hidden>📄</div>
        <div className="font-display tracking-widest uppercase text-sm text-amber-200 mb-1">
          資料をアップロード
        </div>
        <div className="text-xs text-amber-100/60 mb-2">
          ドラッグ＆ドロップ または クリックして選択
        </div>
        <div className="text-[10px] text-amber-200/40">対応: {ACCEPT_PRETTY}</div>
        <input
          id="upload-input"
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
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
              <span className="text-sm text-amber-200">解析中…</span>
            </div>
          )}
          {status === 'done' && (
            <div className="space-y-3">
              <div className="text-sm text-emerald-300">
                ✓ {extractedCount} 個のキーワードを抽出しました
              </div>
              <p className="text-[11px] text-amber-100/60">
                MVP版: 解析処理はモックです。本番では資料からあなた専用の業界キーワードを抽出します。
              </p>
              <button
                type="button"
                onClick={reset}
                className="text-[11px] font-display tracking-wider uppercase text-amber-200/70 hover:text-amber-200"
              >
                ↻ 別のファイルをアップロード
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
