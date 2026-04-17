'use client';

import Link from 'next/link';
import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { ProgressBar } from '@/components/ProgressBar';
import { KeywordCard } from '@/components/KeywordCard';
import { ExampleCard } from '@/components/ExampleCard';
import { PhraseCard } from '@/components/PhraseCard';
import { PassageSelector } from '@/components/PassageSelector';
import { ShadowingPlayer } from '@/components/ShadowingPlayer';
import { QuizCard } from '@/components/QuizCard';
import { ReadingCard } from '@/components/ReadingCard';
import {
  getKeywordsByIndustry,
  getKeywordsByScene,
  getPassagesByScene,
  getPhrasesByScene,
  getReadingsByScene,
  getScene,
} from '@/lib/data';
import { recordLessonComplete } from '@/lib/storage';
import { warmupVoices } from '@/lib/tts';

const STEP_LABELS = ['キーワード', '例文', 'シャドウイング', 'クイズ', 'Reading'];

type Step = 1 | 2 | 3 | 4 | 5;

type Params = Promise<{ sceneId: string }>;

export default function LessonPage({ params }: { params: Params }) {
  const { sceneId } = use(params);
  const router = useRouter();
  const scene = getScene(sceneId);
  const sceneKeywords = useMemo(
    () => (scene ? getKeywordsByScene(scene.id) : []),
    [scene],
  );
  const industryKeywords = useMemo(
    () => (scene ? getKeywordsByIndustry(scene.industryId) : []),
    [scene],
  );
  const scenePhrases = useMemo(
    () => (scene ? getPhrasesByScene(scene.id) : []),
    [scene],
  );
  const scenePassages = useMemo(
    () => (scene ? getPassagesByScene(scene.id) : []),
    [scene],
  );
  const sceneReadings = useMemo(
    () => (scene ? getReadingsByScene(scene.id) : []),
    [scene],
  );

  const [kwIndex, setKwIndex] = useState(0);
  const [step, setStep] = useState<Step>(1);
  const [done, setDone] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [readingsCompleted, setReadingsCompleted] = useState(0);
  const [selectedSourceKey, setSelectedSourceKey] = useState<string>('short');
  const [shadowText, setShadowText] = useState<{
    text: string;
    translation: string;
  } | null>(null);

  useEffect(() => {
    warmupVoices();
  }, []);

  if (!scene) {
    return (
      <>
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center bg-apple-white px-6">
          <div className="text-center">
            <p className="t-subtitle text-apple-fg mb-3">
              シーンが見つかりません
            </p>
            <Link href="/dashboard" className="link-chev">
              ダッシュボードへ
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (sceneKeywords.length === 0) {
    return (
      <>
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center bg-apple-white text-apple-fg-2 t-body">
          このシーンにはキーワードが登録されていません。
        </main>
      </>
    );
  }

  const currentKw = sceneKeywords[kwIndex];
  const example = currentKw.examples[0];
  const distractors = industryKeywords.filter((k) => k.id !== currentKw.id);

  // Pick the phrase that best matches the current keyword (term mention),
  // else round-robin across phrases for the scene.
  const currentPhrase = (() => {
    if (scenePhrases.length === 0) return null;
    const lower = currentKw.term.toLowerCase();
    const match = scenePhrases.find(
      (p) =>
        p.phrase.toLowerCase().includes(lower) ||
        p.examples.some((e) =>
          e.sentence.toLowerCase().includes(lower),
        ),
    );
    return match ?? scenePhrases[kwIndex % scenePhrases.length];
  })();

  // Default the shadowing source to the short example when the user enters Step 3.
  useEffect(() => {
    if (step !== 3) return;
    if (shadowText !== null && selectedSourceKey !== 'short') return;
    if (example) {
      setShadowText({
        text: example.sentence,
        translation: example.translation,
      });
      setSelectedSourceKey('short');
    }
  }, [step, example, shadowText, selectedSourceKey]);

  // Reset shadowing selection when keyword changes.
  useEffect(() => {
    setShadowText(null);
    setSelectedSourceKey('short');
  }, [kwIndex]);

  const advanceToNextKeyword = () => {
    if (kwIndex < sceneKeywords.length - 1) {
      setKwIndex((i) => i + 1);
      setStep(1);
    } else {
      recordLessonComplete({
        sceneId: scene.id,
        completedAt: new Date().toISOString(),
        keywordIds: sceneKeywords.map((k) => k.id),
      });
      setDone(true);
    }
  };

  const handleNext = () => {
    if (step < 4) setStep((s) => (s + 1) as Step);
  };

  const handleQuizComplete = (allCorrect: boolean) => {
    if (allCorrect) setCorrectCount((c) => c + 1);
    if (sceneReadings.length > 0) {
      setStep(5);
    } else {
      advanceToNextKeyword();
    }
  };

  const handleReadingComplete = () => {
    setReadingsCompleted((n) => n + 1);
    advanceToNextKeyword();
  };

  const currentReading =
    sceneReadings.length > 0
      ? sceneReadings[kwIndex % sceneReadings.length]
      : null;

  if (done) {
    const accuracy =
      sceneKeywords.length === 0
        ? 0
        : Math.round((correctCount / sceneKeywords.length) * 100);
    return (
      <>
        <SiteHeader />
        <main className="flex-1 bg-apple-white">
          <section className="section">
            <div className="section-narrow text-center fade-in">
              <p className="t-eyebrow text-[var(--accent-strong)] mb-3">
                Lesson Complete
              </p>
              <h1 className="t-headline text-apple-fg mb-3">
                お疲れさまでした
              </h1>
              <p className="t-body text-apple-fg-2 mb-10">{scene.name_ja}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10 text-left">
                <div className="rounded-xl bg-apple-gray p-5">
                  <div className="t-caption text-apple-fg-2">習得キーワード</div>
                  <div className="t-section-title text-apple-fg mt-1">
                    {sceneKeywords.length}
                  </div>
                </div>
                <div className="rounded-xl bg-apple-gray p-5">
                  <div className="t-caption text-apple-fg-2">クイズ正答率</div>
                  <div className="t-section-title text-apple-fg mt-1">
                    {accuracy}
                    <span className="t-body text-apple-fg-2">%</span>
                  </div>
                </div>
                <div className="rounded-xl bg-apple-gray p-5">
                  <div className="t-caption text-apple-fg-2">シャドウイング</div>
                  <div className="t-section-title text-apple-fg mt-1">
                    {sceneKeywords.length}
                    <span className="t-body text-apple-fg-2"> ステップ</span>
                  </div>
                </div>
                <div className="rounded-xl bg-apple-gray p-5">
                  <div className="t-caption text-apple-fg-2">Reading</div>
                  <div className="t-section-title text-apple-fg mt-1">
                    {readingsCompleted > 0 ? '✓' : '—'}
                    <span className="t-body text-apple-fg-2 ml-2">
                      {readingsCompleted} 本
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/dashboard" className="btn btn-primary">
                  ダッシュボードへ
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setKwIndex(0);
                    setStep(1);
                    setDone(false);
                    setCorrectCount(0);
                    setReadingsCompleted(0);
                  }}
                  className="btn btn-ghost"
                >
                  もう一度
                </button>
              </div>
            </div>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-apple-white">
        <div className="max-w-[692px] mx-auto px-5 sm:px-6 py-10 space-y-8">
          {/* Header */}
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="t-eyebrow text-apple-fg-2">
                {scene.emoji} {scene.name_en}
              </p>
              <h1 className="t-subtitle text-apple-fg mt-1">{scene.name_ja}</h1>
            </div>
            <div className="t-caption text-apple-fg-2">
              {kwIndex + 1} / {sceneKeywords.length}
            </div>
          </div>

          <ProgressBar current={step} total={5} labels={STEP_LABELS} />

          <div className="pt-2 space-y-4">
            {step === 1 && <KeywordCard keyword={currentKw} />}
            {step === 2 && (
              <>
                {example && (
                  <ExampleCard
                    example={example}
                    highlightTerm={currentKw.term}
                  />
                )}
                {currentPhrase && <PhraseCard phrase={currentPhrase} />}
              </>
            )}
            {step === 3 && example && (
              <>
                <PassageSelector
                  selectedKey={selectedSourceKey}
                  shortExample={{
                    sentence: example.sentence,
                    translation: example.translation,
                  }}
                  passages={scenePassages}
                  onSelect={(s) => {
                    setSelectedSourceKey(s.key);
                    setShadowText({
                      text: s.text,
                      translation: s.translation,
                    });
                  }}
                />
                {shadowText && (
                  <ShadowingPlayer
                    key={`${currentKw.id}-${selectedSourceKey}`}
                    keywordId={currentKw.id}
                    sentence={shadowText.text}
                    translation={shadowText.translation}
                  />
                )}
              </>
            )}
            {step === 4 && (
              <QuizCard
                keyword={currentKw}
                distractors={distractors}
                onComplete={handleQuizComplete}
              />
            )}
            {step === 5 && currentReading && (
              <ReadingCard reading={currentReading} />
            )}
          </div>

          {step < 4 && (
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="link-chev t-small"
              >
                中断
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="btn btn-primary"
              >
                続ける
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="link-chev t-small"
              >
                中断
              </button>
              <button
                type="button"
                onClick={handleReadingComplete}
                className="btn btn-primary"
              >
                {kwIndex < sceneKeywords.length - 1
                  ? '次のキーワードへ'
                  : 'レッスン完了'}
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
