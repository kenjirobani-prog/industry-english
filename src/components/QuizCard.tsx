'use client';

import { useMemo, useState } from 'react';
import type { Keyword } from '@/types';
import { recordQuizResult } from '@/lib/storage';

type QuizMode = 'meaning' | 'fill-blank';

type Props = {
  keyword: Keyword;
  distractors: Keyword[]; // other keywords to use as wrong choices
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
    <section className="w-full max-w-xl mx-auto rounded-3xl border border-border-soft bg-surface-1/80 backdrop-blur p-6 sm:p-8">
      <div className="text-[10px] font-display tracking-widest uppercase text-gold mb-3">
        {mode === 'meaning' ? 'クイズ 1/2 — 業界での意味' : 'クイズ 2/2 — 穴埋め'}
      </div>

      {mode === 'meaning' ? (
        <h3 className="font-display text-2xl text-amber-200 mb-5">
          “{keyword.term}” のF&B業界における意味は?
        </h3>
      ) : (
        <p className="text-lg text-amber-50 leading-relaxed mb-5">
          {blankedSentence}
        </p>
      )}

      <div className="space-y-2 mb-5">
        {choices.map((choice) => {
          const isSelected = selected === choice;
          const isCorrect = choice === correctValue;
          let stateClass =
            'bg-surface-2 border-border-soft hover:bg-surface-3 text-amber-50';
          if (submitted) {
            if (isCorrect) {
              stateClass = 'bg-emerald-700/30 border-emerald-500/60 text-emerald-100';
            } else if (isSelected) {
              stateClass = 'bg-red-700/30 border-red-500/60 text-red-100';
            } else {
              stateClass = 'bg-surface-2/50 border-border-soft text-amber-100/40';
            }
          } else if (isSelected) {
            stateClass = 'bg-amber-500/20 border-amber-400 text-amber-100';
          }
          return (
            <button
              key={choice}
              type="button"
              disabled={submitted}
              onClick={() => setSelected(choice)}
              className={`w-full text-left rounded-2xl border px-4 py-3 text-sm leading-relaxed transition ${stateClass}`}
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
          className="w-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-black font-semibold py-3 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition font-display tracking-wider uppercase text-sm"
        >
          回答する
        </button>
      ) : (
        <div className="space-y-3">
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              selected === correctValue
                ? 'border-emerald-500/40 bg-emerald-700/20 text-emerald-100'
                : 'border-red-500/40 bg-red-700/20 text-red-100'
            }`}
          >
            {selected === correctValue ? '正解！' : '不正解。正解を確認しましょう。'}
          </div>
          <button
            type="button"
            onClick={handleNext}
            className="w-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-black font-semibold py-3 hover:brightness-110 transition font-display tracking-wider uppercase text-sm"
          >
            {mode === 'meaning' ? '穴埋めへ' : 'レッスン完了'}
          </button>
        </div>
      )}
    </section>
  );
}
