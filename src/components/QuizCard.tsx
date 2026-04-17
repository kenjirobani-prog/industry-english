'use client';

import { useMemo, useState } from 'react';
import type { Keyword } from '@/types';
import { recordQuizResult } from '@/lib/storage';

type QuizMode = 'meaning' | 'fill-blank';

type Props = {
  keyword: Keyword;
  distractors: Keyword[];
  onComplete: (allCorrect: boolean) => void;
};

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function QuizCard({ keyword, distractors, onComplete }: Props) {
  const [mode, setMode] = useState<QuizMode>('meaning');
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [meaningCorrect, setMeaningCorrect] = useState<boolean | null>(null);

  const meaningChoices = useMemo(() => {
    const wrong = shuffle(distractors).slice(0, 3).map((k) => k.meaning_industry);
    return shuffle([keyword.meaning_industry, ...wrong]);
  }, [keyword, distractors]);

  const fillExample = keyword.examples[0];
  const fillChoices = useMemo(() => {
    const wrong = shuffle(distractors).slice(0, 3).map((k) => k.term);
    return shuffle([keyword.term, ...wrong]);
  }, [keyword, distractors]);

  const blankedSentence = fillExample
    ? fillExample.sentence.replace(
        new RegExp(keyword.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
        '_____',
      )
    : '';

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    const correctValue =
      mode === 'meaning' ? keyword.meaning_industry : keyword.term;
    const isCorrect = selected === correctValue;
    recordQuizResult({
      keywordId: keyword.id,
      correct: isCorrect,
      answeredAt: new Date().toISOString(),
    });
    if (mode === 'meaning') setMeaningCorrect(isCorrect);
  };

  const handleNext = () => {
    if (mode === 'meaning') {
      setMode('fill-blank');
      setSelected(null);
      setSubmitted(false);
    } else {
      const fillCorrect = selected === keyword.term;
      onComplete(Boolean(meaningCorrect) && fillCorrect);
    }
  };

  const choices = mode === 'meaning' ? meaningChoices : fillChoices;
  const correctValue =
    mode === 'meaning' ? keyword.meaning_industry : keyword.term;

  return (
    <section className="w-full rounded-[18px] bg-apple-white border border-apple-line px-7 sm:px-10 py-10 sm:py-12 fade-up">
      <div className="t-eyebrow text-[var(--accent-strong)] mb-3">
        {mode === 'meaning' ? 'Quiz 1 of 2 — 業界での意味' : 'Quiz 2 of 2 — 穴埋め'}
      </div>

      {mode === 'meaning' ? (
        <h3 className="t-section-title font-semibold text-apple-fg mb-8">
          “{keyword.term}” の意味は?
        </h3>
      ) : (
        <p className="t-subtitle text-apple-fg mb-8 font-normal leading-snug">
          {blankedSentence}
        </p>
      )}

      <div className="space-y-2 mb-7">
        {choices.map((choice) => {
          const isSelected = selected === choice;
          const isCorrect = choice === correctValue;
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
            <button
              key={choice}
              type="button"
              disabled={submitted}
              onClick={() => setSelected(choice)}
              className={`w-full text-left rounded-xl border px-5 py-4 t-body transition-colors ${cls}`}
            >
              {choice}
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <button
          type="button"
          disabled={selected === null}
          onClick={handleSubmit}
          className="btn btn-primary w-full"
        >
          回答する
        </button>
      ) : (
        <div className="space-y-4">
          <div
            className={`rounded-xl border px-5 py-4 t-body ${
              selected === correctValue
                ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                : 'border-red-500 bg-red-50 text-red-900'
            }`}
          >
            {selected === correctValue ? '正解' : '不正解。正解を確認しましょう。'}
          </div>
          <button
            type="button"
            onClick={handleNext}
            className="btn btn-primary w-full"
          >
            {mode === 'meaning' ? '穴埋めへ' : 'レッスン完了'}
          </button>
        </div>
      )}
    </section>
  );
}
