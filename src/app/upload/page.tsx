'use client';

import { useState } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { FileUpload } from '@/components/FileUpload';
import { UrlAnalyzer } from '@/components/UrlAnalyzer';
import { AnalysisResultView } from '@/components/AnalysisResult';
import type { AnalysisResult } from '@/types';

type Tab = 'file' | 'url';

export default function UploadPage() {
  const [tab, setTab] = useState<Tab>('url');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleResult = (r: AnalysisResult) => {
    setResult(r);
    if (typeof window !== 'undefined') {
      // Scroll the result into view on mobile.
      setTimeout(() => {
        document
          .getElementById('analysis-result')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          <div className="mb-8 text-center">
            <div className="text-[10px] font-display uppercase tracking-widest text-gold">
              Personalize
            </div>
            <h1 className="font-display text-3xl text-amber-200 mb-3">
              あなたの資料・URLから<br />キーワードを抽出
            </h1>
            <p className="text-sm text-amber-100/70 leading-relaxed">
              ピッチ資料、ブランドデッキ、業界ニュース—
              <br className="sm:hidden" />
              あなたが日常で触れるコンテンツから、業界固有の英語を学ぶ。
            </p>
          </div>

          {/* Tabs */}
          <div
            role="tablist"
            aria-label="入力方法を選択"
            className="flex p-1 rounded-full bg-surface-1 border border-border-soft mb-6"
          >
            <button
              role="tab"
              aria-selected={tab === 'url'}
              onClick={() => setTab('url')}
              className={`flex-1 rounded-full py-2.5 text-sm font-display tracking-wider uppercase transition ${
                tab === 'url'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black'
                  : 'text-amber-100/60 hover:text-amber-200'
              }`}
            >
              🔗 URL
            </button>
            <button
              role="tab"
              aria-selected={tab === 'file'}
              onClick={() => setTab('file')}
              className={`flex-1 rounded-full py-2.5 text-sm font-display tracking-wider uppercase transition ${
                tab === 'file'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black'
                  : 'text-amber-100/60 hover:text-amber-200'
              }`}
            >
              📄 ファイル
            </button>
          </div>

          {/* Tab content */}
          <div className="mb-10">
            {tab === 'url' ? (
              <UrlAnalyzer onResult={handleResult} />
            ) : (
              <FileUpload onResult={handleResult} />
            )}
          </div>

          {/* Result */}
          {result && (
            <div
              id="analysis-result"
              className="border-t border-border-soft pt-8 scroll-mt-24"
            >
              <AnalysisResultView result={result} />
            </div>
          )}

          <div className="mt-10 rounded-2xl border border-border-soft bg-surface-1/60 p-5 text-[11px] text-amber-100/60 leading-relaxed">
            <div className="font-display text-amber-200 tracking-wider uppercase text-xs mb-2">
              対応形式
            </div>
            URL: 一般的な記事・ブログ・レポートページ。<br />
            ファイル: PDF / TXT（PPTX・DOCX は近日対応）。<br />
            分析には Claude AI を使用しています。
          </div>
        </div>
      </main>
    </>
  );
}
