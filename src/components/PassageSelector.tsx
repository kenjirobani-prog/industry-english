'use client';

import type { Passage, ShadowingDifficulty } from '@/types';

type Source = {
  key: string;
  label: string;
  text: string;
  translation: string;
  difficulty?: ShadowingDifficulty;
  sourceLabel?: string;
};

type Props = {
  selectedKey: string;
  onSelect: (s: Source) => void;
  shortExample: { sentence: string; translation: string } | null;
  passages: Passage[];
};

const DIFFICULTY_LABEL: Record<ShadowingDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const DIFFICULTY_DOTS: Record<ShadowingDifficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

function DifficultyBadge({ d }: { d: ShadowingDifficulty }) {
  const dots = DIFFICULTY_DOTS[d];
  return (
    <span className="inline-flex items-center gap-1.5 t-caption text-apple-fg-on-dark-2">
      <span className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`block h-1 w-1 rounded-full ${
              i <= dots
                ? 'bg-[var(--accent-on-dark)]'
                : 'bg-white/15'
            }`}
          />
        ))}
      </span>
      {DIFFICULTY_LABEL[d]}
    </span>
  );
}

export function PassageSelector({
  selectedKey,
  onSelect,
  shortExample,
  passages,
}: Props) {
  if (!shortExample && passages.length === 0) return null;

  return (
    <div className="w-full rounded-[18px] bg-apple-black text-apple-fg-on-dark px-7 sm:px-10 py-8 fade-up space-y-2">
      <div className="t-eyebrow text-[var(--accent-on-dark)] mb-3">
        練習する素材を選ぶ
      </div>
      {shortExample && (
        <button
          type="button"
          onClick={() =>
            onSelect({
              key: 'short',
              label: '短い例文',
              text: shortExample.sentence,
              translation: shortExample.translation,
              sourceLabel: '例文',
            })
          }
          className={`w-full text-left rounded-xl px-4 py-3 transition-colors ${
            selectedKey === 'short'
              ? 'bg-white/10 border border-[var(--accent-on-dark)]'
              : 'bg-transparent border border-white/10 hover:bg-white/5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="t-small text-white">短い例文</span>
            <span className="t-caption text-apple-fg-on-dark-2">
              ~{shortExample.sentence.split(/\s+/).length} words
            </span>
          </div>
        </button>
      )}
      {passages.map((p, i) => {
        const key = `passage-${p.id}`;
        const wordCount = p.text.split(/\s+/).length;
        return (
          <button
            key={key}
            type="button"
            onClick={() =>
              onSelect({
                key,
                label: `パッセージ ${i + 1}`,
                text: p.text,
                translation: p.translation_ja,
                difficulty: p.shadowing_difficulty,
                sourceLabel: p.source,
              })
            }
            className={`w-full text-left rounded-xl px-4 py-3 transition-colors ${
              selectedKey === key
                ? 'bg-white/10 border border-[var(--accent-on-dark)]'
                : 'bg-transparent border border-white/10 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="t-small text-white">
                パッセージ {i + 1}
                <span className="text-apple-fg-on-dark-2 ml-2">· {p.source}</span>
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <DifficultyBadge d={p.shadowing_difficulty} />
                <span className="t-caption text-apple-fg-on-dark-2">
                  ~{wordCount} words
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
