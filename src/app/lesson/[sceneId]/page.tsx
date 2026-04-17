'use client';

import Link from 'next/link';
import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { ProgressBar } from '@/components/ProgressBar';
import { KeywordCard } from '@/components/KeywordCard';
import { ExampleCard } from '@/components/ExampleCard';
import { ShadowingPlayer } from '@/components/ShadowingPlayer';
import { QuizCard } from '@/components/QuizCard';
import {
  getKeywordsByIndustry,
  getKeywordsByScene,
  getScene,
} from '@/lib/data';
import { recordLessonComplete } from '@/lib/storage';
import { warmupVoices } from '@/lib/tts';

const STEP_LABELS = ['キーワード', '例文', 'シャドウイング', 'クイズ'];

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

  const [kwIndex, setKwIndex] = useState(0);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [done, setDone] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

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

  const handleNext = () => {
    if (step < 4) setStep((s) => (s + 1) as 1 | 2 | 3 | 4);
  };

  const handleQuizComplete = (allCorrect: boolean) => {
    if (allCorrect) setCorrectCount((c) => c + 1);
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

  if (done) {
    return (
      <>
        <SiteHeader />
        <main className="flex-1 bg-apple-white">
          <section className="section">
            <div className="section-narrow text-center fade-in">
              <p className="t-eyebrow text-[var(--accent-strong)] mb-3">
                Lesson Complete
              </p>
              <h1 className="t-headline text-apple-fg mb-4">
                お疲れさまでした
              </h1>
              <p className="t-body text-apple-fg-2 mb-1">{scene.name_ja}</p>
              <p className="t-small text-apple-fg-2 mb-10">
                完答 {correctCount} / {sceneKeywords.length} キーワード
              </p>
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

          <ProgressBar current={step} total={4} labels={STEP_LABELS} />

          <div className="pt-2">
            {step === 1 && <KeywordCard keyword={currentKw} />}
            {step === 2 && example && (
              <ExampleCard example={example} highlightTerm={currentKw.term} />
            )}
            {step === 3 && example && (
              <ShadowingPlayer
                keywordId={currentKw.id}
                sentence={example.sentence}
                translation={example.translation}
              />
            )}
            {step === 4 && (
              <QuizCard
                keyword={currentKw}
                distractors={distractors}
                onComplete={handleQuizComplete}
              />
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
        </div>
      </main>
    </>
  );
}
