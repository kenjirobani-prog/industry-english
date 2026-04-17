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
        <section className="section bg-apple-white pb-10">
          <div className="section-narrow text-center fade-in">
            <p className="t-eyebrow text-apple-fg-2 mb-3">Personalize</p>
            <h1 className="t-headline text-apple-fg">
              あなたの資料・URLから
              <br />
              キーワードを抽出。
            </h1>
            <p className="t-body-lg text-apple-fg-2 mt-5 max-w-[560px] mx-auto">
              ピッチ資料、業界ニュース、契約書—
              あなたが日常で触れるコンテンツから業界固有の英語を学ぶ。
            </p>
          </div>
        </section>

        <section className="section bg-apple-gray pt-12 pb-12">
          <div className="max-w-[560px] mx-auto px-5 sm:px-6">
            {/* Tabs */}
            <div
              role="tablist"
              aria-label="入力方法を選択"
              className="flex p-1 rounded-full bg-apple-white border border-apple-line mb-8"
            >
              <button
                role="tab"
                aria-selected={tab === 'url'}
                onClick={() => setTab('url')}
                className={`flex-1 rounded-full py-2 t-small transition-colors ${
                  tab === 'url'
                    ? 'bg-apple-fg text-white'
                    : 'text-apple-fg hover:bg-apple-gray'
                }`}
              >
                URL
              </button>
              <button
                role="tab"
                aria-selected={tab === 'file'}
                onClick={() => setTab('file')}
                className={`flex-1 rounded-full py-2 t-small transition-colors ${
                  tab === 'file'
                    ? 'bg-apple-fg text-white'
                    : 'text-apple-fg hover:bg-apple-gray'
                }`}
              >
                ファイル
              </button>
            </div>

            <div className="bg-apple-white rounded-xl p-6">
              {tab === 'url' ? (
                <UrlAnalyzer onResult={handleResult} />
              ) : (
                <FileUpload onResult={handleResult} />
              )}
            </div>
          </div>
        </section>

        {result && (
          <section
            id="analysis-result"
            className="section bg-apple-white scroll-mt-16"
          >
            <div className="max-w-[692px] mx-auto px-5 sm:px-6">
              <AnalysisResultView result={result} />
            </div>
          </section>
        )}

        <section className="bg-apple-gray border-t border-apple-line">
          <div className="section-narrow px-5 sm:px-6 py-10 text-center">
            <div className="t-eyebrow text-apple-fg-2 mb-2">対応形式</div>
            <p className="t-small text-apple-fg-2">
              URL: 一般的な記事・ブログ・レポートページ。<br />
              ファイル: PDF / TXT（PPTX・DOCX は近日対応）。<br />
              分析には Claude AI を使用しています。
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
