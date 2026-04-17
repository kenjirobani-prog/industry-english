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
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-amber-200 font-display mb-3">シーンが見つかりません</p>
            <Link
              href="/dashboard"
              className="text-sm text-amber-400 underline"
            >
              ← ダッシュボードへ
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
        <main className="flex-1 flex items-center justify-center text-amber-200/60">
          このシーンにはキーワードが登録されていません。
        </main>
      </>
    );
  }

  const currentKw = sceneKeywords[kwIndex];
  const example = currentKw.examples[0];
  const distractors = industryKeywords.filter((k) => k.id !== currentKw.id);

  const handleNext = () => {
    if (step < 4) {
      setStep((s) => (s + 1) as 1 | 2 | 3 | 4);
      return;
    }
    // step === 4 cannot reach here directly (QuizCard manages onComplete)
  };

  const handleQuizComplete = (allCorrect: boolean) => {
    if (allCorrect) setCorrectCount((c) => c + 1);
    if (kwIndex < sceneKeywords.length - 1) {
      setKwIndex((i) => i + 1);
      setStep(1);
    } else {
      // Lesson finished
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
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="text-5xl mb-3">🥃</div>
          <div className="font-display tracking-[0.4em] text-xs text-gold uppercase mb-2">
            Lesson Complete
          </div>
          <h1 className="font-display text-3xl text-amber-200 mb-3">
            お疲れさまでした
          </h1>
          <p className="text-sm text-amber-100/70 mb-1">
            {scene.name_ja}
          </p>
          <p className="text-xs text-amber-100/50 mb-8">
            完答 {correctCount} / {sceneKeywords.length} キーワード
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard"
              className="rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-black font-semibold px-6 py-3 font-display tracking-wider uppercase text-sm hover:brightness-110 transition"
            >
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
              className="rounded-full bg-surface-2 border border-border-soft text-amber-100 px-6 py-3 font-display tracking-wider uppercase text-sm hover:bg-surface-3 transition"
            >
              もう一度
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <div className="text-[10px] font-display uppercase tracking-widest text-gold">
                {scene.emoji} {scene.name_en}
              </div>
              <h1 className="font-display text-xl text-amber-200">
                {scene.name_ja}
              </h1>
            </div>
            <div className="text-[11px] text-amber-100/50 font-display tracking-wider uppercase">
              {kwIndex + 1} / {sceneKeywords.length}
            </div>
          </div>

          {/* Progress */}
          <ProgressBar current={step} total={4} labels={STEP_LABELS} />

          {/* Step content */}
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

          {/* Step navigation (Steps 1-3 only; step 4 has its own controls) */}
          {step < 4 && (
            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="text-xs text-amber-100/50 hover:text-amber-200 font-display tracking-wider uppercase"
              >
                ✕ 中断
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-black font-semibold px-6 py-3 font-display tracking-wider uppercase text-sm hover:brightness-110 transition"
              >
                次へ →
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
