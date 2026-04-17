'use client';

import { useEffect, useState } from 'react';
import type { Keyword } from '@/types';
import { speak, cancelSpeech, isTTSAvailable } from '@/lib/tts';
import { isBookmarked, toggleBookmark } from '@/lib/storage';

type Props = {
  keyword: Keyword;
};

function FrequencyDots({ value }: { value: number }) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`使用頻度 ${value}/5`}
    >
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

export function KeywordCard({ keyword }: Props) {
  const [bookmarked, setBookmarked] = useState(false);
  const [ttsReady, setTtsReady] = useState(false);

  useEffect(() => {
    setBookmarked(isBookmarked(keyword.id));
    setTtsReady(isTTSAvailable());
  }, [keyword.id]);

  const handleSpeak = () => speak(keyword.term, { rate: 0.95 });
  const handleBookmark = () => setBookmarked(toggleBookmark(keyword.id));

  return (
    <article className="w-full rounded-[18px] bg-apple-black text-apple-fg-on-dark px-7 sm:px-10 py-10 sm:py-12 fade-up">
      <div className="flex items-start justify-between gap-4 mb-8">
        <FrequencyDots value={keyword.frequency} />
        <button
          type="button"
          onClick={handleBookmark}
          aria-pressed={bookmarked}
          aria-label={bookmarked ? 'ブックマーク解除' : 'ブックマーク'}
          className="t-small text-apple-fg-on-dark-2 hover:text-white transition-colors"
        >
          {bookmarked ? '★ Saved' : '☆ Save'}
        </button>
      </div>

      <h2 className="t-headline mb-3">{keyword.term}</h2>
      <p className="t-body-lg text-apple-fg-on-dark-2 mb-10">
        {keyword.meaning_ja}
      </p>

      <div className="space-y-6 mb-10">
        <div>
          <div className="t-eyebrow text-[var(--accent-on-dark)] mb-2">
            業界での意味
          </div>
          <p className="t-body-lg leading-snug text-white">
            {keyword.meaning_industry}
          </p>
        </div>
        {keyword.meaning_general && (
          <div>
            <div className="t-eyebrow text-apple-fg-on-dark-2 mb-2">
              他業界では
            </div>
            <p className="t-body text-apple-fg-on-dark-2">
              {keyword.meaning_general}
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleSpeak}
        onMouseLeave={cancelSpeech}
        disabled={!ttsReady}
        className="btn btn-on-dark-secondary"
      >
        🔊 発音を聴く
      </button>
    </article>
  );
}
