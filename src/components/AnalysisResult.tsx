'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AnalysisResult, AnalysisQuiz, ExtractedKeyword } from '@/types';
import { speak, cancelSpeech, isTTSAvailable } from '@/lib/tts';
import { addUserKeywords } from '@/lib/storage';

type Props = {
  result: AnalysisResult;
};

function FrequencyStars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`頻度 ${value}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`text-xs ${i <= value ? 'text-amber-400' : 'text-surface-3'}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function KeywordRow({ kw }: { kw: ExtractedKeyword }) {
  const [open, setOpen] = useState(false);
  const ttsReady = isTTSAvailable();

  return (
    <article className="rounded-2xl border border-border-soft bg-surface-1 p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="font-display text-lg text-amber-200 truncate">
            {kw.term}
          </div>
          <div className="text-xs text-amber-100/70 mt-0.5">
            {kw.meaning_ja}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <FrequencyStars value={kw.frequency} />
          <button
            type="button"
            onClick={() => speak(kw.term, { rate: 0.95 })}
            onMouseLeave={cancelSpeech}
            disabled={!ttsReady}
            aria-label={`${kw.term} を発音`}
            className="text-amber-300/80 hover:text-amber-200 disabled:opacity-30 text-base"
          >
            🔊
          </button>
        </div>
      </div>

      <p className="text-[12px] text-amber-50/80 leading-relaxed border-l-2 border-amber-400/40 pl-2 mb-2">
        {kw.meaning_industry}
      </p>
      {kw.meaning_general && (
        <p className="text-[11px] text-amber-100/55 leading-relaxed border-l border-amber-200/20 pl-2 mb-2">
          他業界では: {kw.meaning_general}
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[11px] text-amber-300/70 hover:text-amber-200 mt-1 font-display tracking-wider uppercase"
      >
        {open ? '例文を閉じる ▴' : `例文を見る (${kw.examples.length}) ▾`}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {kw.examples.map((ex, i) => (
            <div
              key={i}
              className="rounded-xl bg-surface-2 border border-border-soft p-3"
            >
              <p className="text-sm text-amber-50 leading-relaxed">
                {ex.sentence}
              </p>
              <p className="text-[11px] text-amber-100/60 leading-relaxed mt-1">
                {ex.translation}
              </p>
              <button
                type="button"
                onClick={() => speak(ex.sentence, { rate: 0.95 })}
                onMouseLeave={cancelSpeech}
                disabled={!ttsReady}
                className="text-[10px] text-amber-300/70 hover:text-amber-200 mt-2 font-display tracking-wider uppercase"
              >
                🔊 再生
              </button>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function QuizItem({ quiz, index }: { quiz: AnalysisQuiz; index: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  return (
    <article className="rounded-2xl border border-border-soft bg-surface-1 p-4">
      <div className="text-[10px] font-display tracking-widest uppercase text-gold mb-2">
        Quiz {index + 1}
      </div>
      <p className="text-sm text-amber-50 leading-relaxed mb-3">
        {quiz.question}
      </p>
      <ul className="space-y-2 mb-3">
        {quiz.choices.map((c, i) => {
          const isSelected = selected === i;
          const isCorrect = i === quiz.correctIndex;
          let cls =
            'bg-surface-2 border-border-soft text-amber-50 hover:bg-surface-3';
          if (submitted) {
            if (isCorrect) {
              cls = 'bg-emerald-700/30 border-emerald-500/60 text-emerald-100';
            } else if (isSelected) {
              cls = 'bg-red-700/30 border-red-500/60 text-red-100';
            } else {
              cls = 'bg-surface-2/40 border-border-soft text-amber-100/40';
            }
          } else if (isSelected) {
            cls = 'bg-amber-500/15 border-amber-400 text-amber-100';
          }
          return (
            <li key={i}>
              <button
                type="button"
                disabled={submitted}
                onClick={() => setSelected(i)}
                className={`w-full text-left rounded-xl border px-3 py-2 text-sm transition ${cls}`}
              >
                {c}
              </button>
            </li>
          );
        })}
      </ul>
      {!submitted ? (
        <button
          type="button"
          disabled={selected === null}
          onClick={() => setSubmitted(true)}
          className="w-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-black font-semibold py-2 text-xs disabled:opacity-40 hover:brightness-110 transition font-display tracking-wider uppercase"
        >
          回答する
        </button>
      ) : (
        <div
          className={`rounded-xl border px-3 py-2 text-[12px] leading-relaxed ${
            selected === quiz.correctIndex
              ? 'border-emerald-500/40 bg-emerald-700/20 text-emerald-100'
              : 'border-red-500/40 bg-red-700/20 text-red-100'
          }`}
        >
          <div className="font-semibold mb-1">
            {selected === quiz.correctIndex ? '✓ 正解' : '✗ 不正解'}
          </div>
          {quiz.explanation && <div>{quiz.explanation}</div>}
        </div>
      )}
    </article>
  );
}

export function AnalysisResultView({ result }: Props) {
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const handleSave = () => {
    const added = addUserKeywords(result.keywords, result.source);
    setSavedCount(added.length);
  };

  return (
    <div className="space-y-6">
      <header className="text-center">
        <div className="text-[10px] font-display tracking-widest uppercase text-gold">
          Analysis Result
        </div>
        <h2 className="font-display text-xl text-amber-200 mt-1">
          {result.keywords.length} 個のキーワードを抽出
        </h2>
        <p className="text-[11px] text-amber-100/50 mt-1 truncate">
          source: {result.source.ref}
        </p>
      </header>

      <section>
        <h3 className="font-display text-sm text-amber-200/80 tracking-wider uppercase mb-3">
          キーワード
        </h3>
        <div className="space-y-2">
          {result.keywords.map((kw) => (
            <KeywordRow key={kw.term} kw={kw} />
          ))}
        </div>
      </section>

      {result.quizzes.length > 0 && (
        <section>
          <h3 className="font-display text-sm text-amber-200/80 tracking-wider uppercase mb-3">
            理解度クイズ
          </h3>
          <div className="space-y-2">
            {result.quizzes.map((q, i) => (
              <QuizItem key={i} quiz={q} index={i} />
            ))}
          </div>
        </section>
      )}

      <div className="pt-2">
        {savedCount === null ? (
          <button
            type="button"
            onClick={handleSave}
            className="w-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-black font-semibold py-3 hover:brightness-110 transition font-display tracking-wider uppercase text-sm"
          >
            ★ キーワードを保存
          </button>
        ) : (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-700/15 p-4 text-center">
            <p className="text-sm text-emerald-100">
              ✓ {savedCount} 個のキーワードをライブラリに保存しました
              {savedCount < result.keywords.length && (
                <span className="block text-[11px] text-emerald-200/70 mt-1">
                  （{result.keywords.length - savedCount} 個は重複していたためスキップ）
                </span>
              )}
            </p>
            <Link
              href="/library"
              className="inline-block mt-3 text-xs font-display tracking-wider uppercase text-amber-200 hover:text-amber-100"
            >
              ライブラリで確認 →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
