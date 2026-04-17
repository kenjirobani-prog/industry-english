'use client';

import { useMemo, useState } from 'react';
import { Volume2, X } from 'lucide-react';
import type { Reading } from '@/types';
import { speak, cancelSpeech, isTTSAvailable } from '@/lib/tts';
import { getKeywordByTerm, getPhraseByText } from '@/lib/data';

type Props = {
  reading: Reading;
  onOpen?: () => void;
};

type TermInfo = {
  term: string;
  meaning_ja: string;
  kind: 'keyword' | 'phrase';
};

function lookupTerm(term: string, industryId: string): TermInfo | null {
  const kw = getKeywordByTerm(term, industryId);
  if (kw) return { term: kw.term, meaning_ja: kw.meaning_ja, kind: 'keyword' };
  const ph = getPhraseByText(term, industryId);
  if (ph) return { term: ph.phrase, meaning_ja: ph.meaning_ja, kind: 'phrase' };
  const kwAny = getKeywordByTerm(term);
  if (kwAny)
    return { term: kwAny.term, meaning_ja: kwAny.meaning_ja, kind: 'keyword' };
  const phAny = getPhraseByText(term);
  if (phAny)
    return { term: phAny.phrase, meaning_ja: phAny.meaning_ja, kind: 'phrase' };
  return null;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function ReadingCard({ reading, onOpen }: Props) {
  const ttsReady = isTTSAvailable();
  const [showTranslation, setShowTranslation] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<TermInfo | null>(null);
  const [opened, setOpened] = useState(false);

  const matcher = useMemo(() => {
    if (reading.highlighted_terms.length === 0) return null;
    const sorted = [...reading.highlighted_terms].sort(
      (a, b) => b.length - a.length,
    );
    const pattern = sorted.map(escapeRegex).join('|');
    return new RegExp(`(${pattern})`, 'gi');
  }, [reading.highlighted_terms]);

  const handleTermClick = (raw: string) => {
    const info = lookupTerm(raw, reading.industryId);
    if (info) setSelectedTerm(info);
    else
      setSelectedTerm({
        term: raw,
        meaning_ja: '（語義データなし）',
        kind: 'keyword',
      });
  };

  const renderBody = () => {
    if (!matcher) return reading.body_en;
    const parts = reading.body_en.split(matcher);
    return parts.map((part, i) => {
      if (!part) return null;
      const isMatch = reading.highlighted_terms.some(
        (t) => t.toLowerCase() === part.toLowerCase(),
      );
      if (!isMatch) return <span key={i}>{part}</span>;
      return (
        <button
          key={i}
          type="button"
          onClick={() => handleTermClick(part)}
          className="text-[var(--accent-strong)] underline decoration-[var(--accent)]/40 decoration-1 underline-offset-4 hover:bg-[var(--accent-soft)] rounded px-0.5 transition-colors"
        >
          {part}
        </button>
      );
    });
  };

  const handleSpeakAll = () => {
    speak(reading.body_en, { rate: 0.95 });
    if (!opened) {
      setOpened(true);
      onOpen?.();
    }
  };

  const handleToggleTranslation = () => {
    setShowTranslation((v) => !v);
    if (!opened) {
      setOpened(true);
      onOpen?.();
    }
  };

  return (
    <article className="w-full rounded-[18px] bg-apple-gray text-apple-fg px-7 sm:px-10 py-10 sm:py-12 fade-up">
      <div className="flex items-center gap-3 t-caption text-apple-fg-2 mb-3">
        <span className="t-eyebrow text-[var(--accent-strong)]">Reading</span>
        <span aria-hidden>·</span>
        <span>{reading.source}</span>
        <span aria-hidden>·</span>
        <span>{formatDate(reading.date)}</span>
        <span aria-hidden>·</span>
        <span>~{reading.reading_time_minutes} min read</span>
      </div>

      <h3 className="t-section-title text-apple-fg leading-tight mb-7">
        {reading.title}
      </h3>

      <div
        className="text-apple-fg leading-[1.7] mb-6"
        style={{ fontSize: '18px', letterSpacing: '-0.01em' }}
      >
        {renderBody()}
      </div>

      {selectedTerm && (
        <div className="mb-6 rounded-xl bg-apple-white border border-apple-line p-5 fade-up">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="t-eyebrow text-[var(--accent-strong)] mb-1">
                {selectedTerm.kind === 'phrase' ? 'Expression' : 'Word'}
              </div>
              <div className="t-subtitle font-semibold text-apple-fg leading-snug">
                {selectedTerm.term}
              </div>
              <div className="t-body text-apple-fg-2 mt-2">
                {selectedTerm.meaning_ja}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTerm(null)}
              aria-label="閉じる"
              className="text-apple-fg-2 hover:text-apple-fg"
            >
              <X size={16} strokeWidth={1.6} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <button
          type="button"
          onClick={handleSpeakAll}
          onMouseLeave={cancelSpeech}
          disabled={!ttsReady}
          className="btn btn-primary"
        >
          <Volume2 size={16} strokeWidth={1.6} aria-hidden="true" />
          全文を読み上げ
        </button>
        <button
          type="button"
          onClick={handleToggleTranslation}
          className="btn btn-ghost bg-white"
        >
          {showTranslation ? '日本語訳を隠す' : '日本語訳を見る'}
        </button>
      </div>

      {showTranslation && (
        <div className="rounded-xl bg-apple-white border border-apple-line p-6 fade-up">
          <div className="t-eyebrow text-apple-fg-2 mb-3">日本語訳</div>
          <p
            className="text-apple-fg leading-[1.8]"
            style={{ fontSize: '16px', letterSpacing: '-0.01em' }}
          >
            {reading.body_ja}
          </p>
        </div>
      )}
    </article>
  );
}
