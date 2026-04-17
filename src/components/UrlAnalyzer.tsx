'use client';

import { useState } from 'react';
import type { AnalysisResult } from '@/types';

type Status = 'idle' | 'analyzing' | 'done' | 'error';

type Props = {
  onResult: (result: AnalysisResult) => void;
};

export function UrlAnalyzer({ onResult }: Props) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    setStatus('analyzing');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
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

  const reset = () => {
    setStatus('idle');
    setErrorMsg(null);
  };

  return (
    <form onSubmit={handleAnalyze} className="space-y-4">
      <div>
        <label
          htmlFor="url-input"
          className="block text-[10px] font-display tracking-widest uppercase text-amber-200/70 mb-2"
        >
          記事・ブログ・レポートのURL
        </label>
        <input
          id="url-input"
          type="url"
          required
          inputMode="url"
          autoComplete="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.example.com/article"
          disabled={status === 'analyzing'}
          className="w-full rounded-2xl bg-surface-1 border border-border-soft px-4 py-3 text-amber-50 placeholder-amber-100/30 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 transition disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={status === 'analyzing' || url.trim().length === 0}
        className="w-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-black font-semibold py-3 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition font-display tracking-wider uppercase text-sm"
      >
        {status === 'analyzing' ? '分析中...' : '分析する'}
      </button>

      {status === 'analyzing' && (
        <div className="rounded-2xl bg-surface-2/80 border border-border-soft p-4 flex items-center gap-3">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400 pulse-amber" />
          <div className="text-sm text-amber-200">
            URL を取得して Claude AI が分析中...
            <p className="text-[11px] text-amber-100/60 mt-0.5">
              通常 10〜30 秒ほどかかります
            </p>
          </div>
        </div>
      )}

      {status === 'error' && errorMsg && (
        <div className="rounded-2xl border border-red-500/40 bg-red-700/15 p-4 space-y-2">
          <div className="text-sm text-red-200">⚠ {errorMsg}</div>
          <button
            type="button"
            onClick={reset}
            className="text-[11px] font-display tracking-wider uppercase text-amber-200/70 hover:text-amber-200"
          >
            ↻ もう一度試す
          </button>
        </div>
      )}

      {status === 'done' && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-700/15 p-3 text-sm text-emerald-100">
          ✓ 分析完了。下に結果を表示しました。
        </div>
      )}
    </form>
  );
}
