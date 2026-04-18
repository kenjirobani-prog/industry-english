'use client';

import { useEffect, useState } from 'react';
import { Bookmark, ChevronDown, Volume2 } from 'lucide-react';
import type { Example, Keyword, Phrase } from '@/types';
import { speak, cancelSpeech, isTTSAvailable } from '@/lib/tts';
import { isBookmarked, toggleBookmark } from '@/lib/storage';

type Props = {
  keyword: Keyword;
  example?: Example;
  phrase?: Phrase | null;
};

function FrequencyDots({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`使用頻度 ${value}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`block h-1.5 w-1.5 rounded-full ${
            i <= value ? 'bg-[var(--accent-on-dark)]' : 'bg-white/20'
          }`}
        />
      ))}
    </div>
  );
}

function highlightTerm(sentence: string, term: string) {
  if (!term) return sentence;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = sentence.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === term.toLowerCase() ? (
      <span
        key={i}
        className="text-[var(--accent-on-dark)] font-medium underline decoration-[var(--accent-on-dark)]/40 decoration-1 underline-offset-4"
      >
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function CollapsibleSection({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-white/10">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-4 t-eyebrow text-apple-fg-on-dark-2 hover:text-white transition-colors"
      >
        <span>{label}</span>
        <ChevronDown
          size={16}
          strokeWidth={1.6}
          aria-hidden="true"
          className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="pb-5 fade-up">{children}</div>}
    </div>
  );
}

export function LearnUnifiedCard({ keyword, example, phrase }: Props) {
  const ttsReady = isTTSAvailable();
  const [bookmarked, setBookmarked] = useState(false);
  const [exampleOpen, setExampleOpen] = useState(false);
  const [expressionOpen, setExpressionOpen] = useState(false);

  useEffect(() => {
    setBookmarked(isBookmarked(keyword.id));
    // Reset collapsibles when keyword changes (new card swiped in).
    setExampleOpen(false);
    setExpressionOpen(false);
  }, [keyword.id]);

  return (
    <article className="w-full rounded-[18px] bg-apple-black text-apple-fg-on-dark px-7 sm:px-10 py-10 sm:py-12 fade-up">
      {/* Header: eyebrow + frequency */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="t-eyebrow text-[var(--accent-on-dark)]">Word</div>
        <FrequencyDots value={keyword.frequency} />
      </div>

      {/* Term */}
      <h2 className="t-headline mb-3">{keyword.term}</h2>
      <p className="t-body-lg text-apple-fg-on-dark-2 mb-8">
        {keyword.meaning_ja}
      </p>

      {/* Industry meaning */}
      <div className="mb-6">
        <div className="t-eyebrow text-apple-fg-on-dark-2 mb-2">業界での意味</div>
        <p className="t-body-lg leading-snug text-white">
          {keyword.meaning_industry}
        </p>
      </div>

      {/* General meaning (optional) */}
      {keyword.meaning_general && (
        <div className="mb-8">
          <div className="t-eyebrow text-apple-fg-on-dark-2 mb-2">他業界では</div>
          <p className="t-body text-apple-fg-on-dark-2">
            {keyword.meaning_general}
          </p>
        </div>
      )}

      {/* Primary actions */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <button
          type="button"
          onClick={() => speak(keyword.term, { rate: 0.95 })}
          onMouseLeave={cancelSpeech}
          disabled={!ttsReady}
          className="btn btn-on-dark-secondary"
        >
          <Volume2 size={16} strokeWidth={1.6} aria-hidden="true" />
          発音を聴く
        </button>
        <button
          type="button"
          onClick={() => setBookmarked(toggleBookmark(keyword.id))}
          aria-pressed={bookmarked}
          aria-label={bookmarked ? 'ブックマーク解除' : 'ブックマーク'}
          className="btn btn-on-dark-secondary"
        >
          <Bookmark
            size={16}
            strokeWidth={1.6}
            fill={bookmarked ? 'currentColor' : 'none'}
            aria-hidden="true"
          />
          {bookmarked ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* Collapsible: Example */}
      {example && (
        <CollapsibleSection
          label="Example"
          open={exampleOpen}
          onToggle={() => setExampleOpen((v) => !v)}
        >
          <div className="rounded-xl bg-white/5 border border-white/10 p-5">
            <div className="flex items-center gap-2 t-caption text-apple-fg-on-dark-2 mb-3">
              <span className="t-eyebrow">{example.scene}</span>
              <span aria-hidden>·</span>
              <span className="truncate">出典: {example.source}</span>
            </div>
            <p className="t-subtitle leading-snug text-white font-normal mb-3">
              {highlightTerm(example.sentence, keyword.term)}
            </p>
            <p className="t-small text-apple-fg-on-dark-2 border-l border-white/15 pl-3 mb-4">
              {example.translation}
            </p>
            <button
              type="button"
              onClick={() => speak(example.sentence, { rate: 0.95 })}
              onMouseLeave={cancelSpeech}
              disabled={!ttsReady}
              className="btn btn-on-dark-secondary"
            >
              <Volume2 size={16} strokeWidth={1.6} aria-hidden="true" />
              例文を聴く
            </button>
          </div>
        </CollapsibleSection>
      )}

      {/* Collapsible: Expression (only if a related phrase exists) */}
      {phrase && (
        <CollapsibleSection
          label="Expression"
          open={expressionOpen}
          onToggle={() => setExpressionOpen((v) => !v)}
        >
          <div className="rounded-xl bg-white/5 border border-white/10 p-5">
            <p className="t-subtitle font-semibold leading-snug text-white mb-2">
              {phrase.phrase}
            </p>
            <p className="t-body text-apple-fg-on-dark-2 mb-4">
              {phrase.meaning_ja}
            </p>

            <div className="rounded-lg bg-white/5 border border-white/10 p-4 mb-4">
              <div className="t-eyebrow text-apple-fg-on-dark-2 mb-1">使い方</div>
              <p className="t-small text-white leading-relaxed">
                {phrase.usage_context}
              </p>
            </div>

            {phrase.examples[0] && (
              <div className="rounded-lg bg-white/5 border border-white/10 p-4 mb-4">
                <p className="t-body text-white leading-relaxed">
                  {phrase.examples[0].sentence}
                </p>
                <p className="t-small text-apple-fg-on-dark-2 mt-2">
                  {phrase.examples[0].translation}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => speak(phrase.phrase, { rate: 0.95 })}
              onMouseLeave={cancelSpeech}
              disabled={!ttsReady}
              className="btn btn-on-dark-secondary"
            >
              <Volume2 size={16} strokeWidth={1.6} aria-hidden="true" />
              フレーズを聴く
            </button>
          </div>
        </CollapsibleSection>
      )}
    </article>
  );
}
