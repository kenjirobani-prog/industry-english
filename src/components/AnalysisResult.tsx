'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AnalysisResult, AnalysisQuiz, ExtractedKeyword } from '@/types';
import { speak, cancelSpeech, isTTSAvailable } from '@/lib/tts';
import { addUserKeywords } from '@/lib/storage';

type Props = {
  result: AnalysisResult;
};

function FrequencyDots({ value }: { value: number }) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`頻度 ${value}/5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`block h-1.5 w-1.5 rounded-full ${
            i <= value ? 'bg-[var(--accent)]' : 'bg-apple-line'
          }`}
        />
      ))}
    </div>
  );
}

function KeywordRow({ kw }: { kw: ExtractedKeyword }) {
  const [open, setOpen] = useState(false);
  const ttsReady = isTTSAvailable();

  return (
    <article className="rounded-xl border border-apple-line bg-apple-white p-6">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="min-w-0">
          <div className="t-subtitle text-apple-fg">{kw.term}</div>
          <div className="t-small text-apple-fg-2 mt-0.5">{kw.meaning_ja}</div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <FrequencyDots value={kw.frequency} />
          <button
            type="button"
            onClick={() => speak(kw.term, { rate: 0.95 })}
            onMouseLeave={cancelSpeech}
            disabled={!ttsReady}
            aria-label={`${kw.term} を発音`}
            className="t-caption text-apple-fg-2 hover:text-apple-fg transition-colors"
          >
            🔊
          </button>
        </div>
      </div>

      <p className="t-body text-apple-fg mt-4">{kw.meaning_industry}</p>
      {kw.meaning_general && (
        <p className="t-small text-apple-fg-2 mt-2">
          他業界では: {kw.meaning_general}
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="link-chev mt-4"
      >
        {open ? '例文を閉じる' : `例文を見る (${kw.examples.length})`}
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {kw.examples.map((ex, i) => (
            <div key={i} className="rounded-xl bg-apple-gray p-4">
              <p className="t-body text-apple-fg">{ex.sentence}</p>
              <p className="t-small text-apple-fg-2 mt-1">{ex.translation}</p>
              <button
                type="button"
                onClick={() => speak(ex.sentence, { rate: 0.95 })}
                onMouseLeave={cancelSpeech}
                disabled={!ttsReady}
                className="link-chev mt-3 text-[12px]"
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
    <article className="rounded-xl border border-apple-line bg-apple-white p-6">
      <div className="t-eyebrow text-[var(--accent-strong)] mb-3">
        Quiz {index + 1}
      </div>
      <p className="t-body text-apple-fg mb-4">{quiz.question}</p>
      <ul className="space-y-2 mb-4">
        {quiz.choices.map((c, i) => {
          const isSelected = selected === i;
          const isCorrect = i === quiz.correctIndex;
          let cls =
            'border-apple-line bg-apple-white text-apple-fg hover:bg-apple-gray';
          if (submitted) {
            if (isCorrect) {
              cls = 'border-emerald-600 bg-emerald-50 text-emerald-900';
            } else if (isSelected) {
              cls = 'border-red-500 bg-red-50 text-red-900';
            } else {
              cls = 'border-apple-line bg-apple-white text-apple-fg-2';
            }
          } else if (isSelected) {
            cls = 'border-[var(--accent)] bg-accent-soft text-apple-fg';
          }
          return (
            <li key={i}>
              <button
                type="button"
                disabled={submitted}
                onClick={() => setSelected(i)}
                className={`w-full text-left rounded-xl border px-4 py-3 t-body transition-colors ${cls}`}
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
          className="btn btn-primary w-full"
        >
          回答する
        </button>
      ) : (
        <div
          className={`rounded-xl border px-4 py-3 t-small ${
            selected === quiz.correctIndex
              ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
              : 'border-red-500 bg-red-50 text-red-900'
          }`}
        >
          <div className="font-medium mb-1">
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
    <div className="space-y-12 fade-up">
      <header>
        <div className="t-eyebrow text-[var(--accent-strong)] mb-2">
          Analysis Result
        </div>
        <h2 className="t-section-title text-apple-fg">
          {result.keywords.length} 個のキーワードを抽出しました
        </h2>
        <p className="t-small text-apple-fg-2 mt-2 truncate">
          source: {result.source.ref}
        </p>
      </header>

      <section>
        <h3 className="t-subtitle text-apple-fg mb-4">キーワード</h3>
        <div className="space-y-3">
          {result.keywords.map((kw) => (
            <KeywordRow key={kw.term} kw={kw} />
          ))}
        </div>
      </section>

      {result.quizzes.length > 0 && (
        <section>
          <h3 className="t-subtitle text-apple-fg mb-4">理解度クイズ</h3>
          <div className="space-y-3">
            {result.quizzes.map((q, i) => (
              <QuizItem key={i} quiz={q} index={i} />
            ))}
          </div>
        </section>
      )}

      <div>
        {savedCount === null ? (
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary w-full"
          >
            ★ キーワードを保存
          </button>
        ) : (
          <div className="rounded-xl bg-apple-gray p-6 text-center">
            <p className="t-body text-apple-fg">
              ✓ {savedCount} 個のキーワードをライブラリに保存しました
              {savedCount < result.keywords.length && (
                <span className="block t-small text-apple-fg-2 mt-1">
                  （{result.keywords.length - savedCount} 個は重複していたためスキップ）
                </span>
              )}
            </p>
            <Link href="/library" className="link-chev mt-3 inline-flex">
              ライブラリで確認
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
