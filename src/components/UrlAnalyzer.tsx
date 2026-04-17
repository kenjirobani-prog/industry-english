'use client';

import { useState } from 'react';
import type { AnalysisResult } from '@/types';
import { getPreferences } from '@/lib/storage';

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
      const industryId = getPreferences()?.industryId;
      const res = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed, industryId }),
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
    <form onSubmit={handleAnalyze} className="space-y-5">
      <div>
        <label
          htmlFor="url-input"
          className="block t-small text-apple-fg-2 mb-2"
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
          className="input"
        />
      </div>

      <button
        type="submit"
        disabled={status === 'analyzing' || url.trim().length === 0}
        className="btn btn-primary w-full"
      >
        {status === 'analyzing' ? '分析中…' : '分析する'}
      </button>

      {status === 'analyzing' && (
        <div className="p-4 bg-apple-gray rounded-xl flex items-center gap-3">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)] rec-blink" />
          <div>
            <div className="t-body text-apple-fg">URL を取得して分析中…</div>
            <div className="t-small text-apple-fg-2">
              通常 10〜30 秒ほどかかります
            </div>
          </div>
        </div>
      )}

      {status === 'error' && errorMsg && (
        <div className="p-4 bg-apple-gray rounded-xl space-y-2">
          <div className="t-body text-apple-fg">⚠ {errorMsg}</div>
          <button type="button" onClick={reset} className="link-chev">
            もう一度試す
          </button>
        </div>
      )}

      {status === 'done' && (
        <div className="p-4 bg-apple-gray rounded-xl t-body text-apple-fg">
          ✓ 分析完了。下に結果を表示しました。
        </div>
      )}
    </form>
  );
}
