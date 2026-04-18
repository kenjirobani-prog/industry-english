'use client';

import Link from 'next/link';
import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LessonHeader } from '@/components/LessonHeader';
import { ProgressBar } from '@/components/ProgressBar';
import { LearnUnifiedCard } from '@/components/LearnUnifiedCard';
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
import {
  addArticleRead,
  addSeenPhrase,
  addSeenWord,
  estimateLessonMinutes,
  getDailyGoal,
  getSceneProgress,
  incrementDailyProgress,
  pickLessonKeywords,
  recordKeywordsStudied,
  recordLessonComplete,
  updateStreak,
} from '@/lib/storage';
import { warmupVoices } from '@/lib/tts';
import type { Phrase } from '@/types';

const STEP_LABELS = ['Learn', 'Practice', 'Test', 'Read'];

type Step = 1 | 2 | 3 | 4;

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

  // Pick the daily-goal-sized subset for this lesson (deterministic per mount).
  const [dailyGoal, setLocalDailyGoal] = useState<number>(5);
  const [lessonKeywords, setLessonKeywords] = useState<typeof sceneKeywords>([]);
  const [pickedPassage, setPickedPassage] = useState<
    (typeof scenePassages)[number] | null
  >(null);
  const [pickedReading, setPickedReading] = useState<
    (typeof sceneReadings)[number] | null
  >(null);
  const [reviewMode, setReviewMode] = useState(false);

  useEffect(() => {
    if (!scene || sceneKeywords.length === 0) return;
    const goal = getDailyGoal();
    setLocalDailyGoal(goal);
    const picked = pickLessonKeywords(scene.id, sceneKeywords, goal);
    setLessonKeywords(picked);
    const studiedIds = getSceneProgress(scene.id).keywordTimestamps;
    setReviewMode(picked.length > 0 && picked.every((k) => k.id in studiedIds));
    if (scenePassages.length > 0) {
      setPickedPassage(
        scenePassages[Math.floor(Math.random() * scenePassages.length)],
      );
    } else {
      setPickedPassage(null);
    }
    if (sceneReadings.length > 0) {
      setPickedReading(
        sceneReadings[Math.floor(Math.random() * sceneReadings.length)],
      );
    } else {
      setPickedReading(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene?.id]);

  // Map each picked keyword to a related phrase (term match preferred,
  // else round-robin through scene phrases without re-using one twice).
  const phraseByKeywordId = useMemo<Record<string, Phrase | null>>(() => {
    if (!scene || lessonKeywords.length === 0) return {};
    const usedPhraseIds = new Set<string>();
    const out: Record<string, Phrase | null> = {};
    lessonKeywords.forEach((kw, idx) => {
      if (scenePhrases.length === 0) {
        out[kw.id] = null;
        return;
      }
      const lower = kw.term.toLowerCase();
      const match = scenePhrases.find(
        (p) =>
          !usedPhraseIds.has(p.id) &&
          (p.phrase.toLowerCase().includes(lower) ||
            p.examples.some((e) => e.sentence.toLowerCase().includes(lower))),
      );
      if (match) {
        usedPhraseIds.add(match.id);
        out[kw.id] = match;
        return;
      }
      const fallback =
        scenePhrases.find((p) => !usedPhraseIds.has(p.id)) ??
        scenePhrases[idx % scenePhrases.length] ??
        null;
      if (fallback) usedPhraseIds.add(fallback.id);
      out[kw.id] = fallback ?? null;
    });
    return out;
  }, [scene, lessonKeywords, scenePhrases]);

  // Quiz capped at 5 questions max (or fewer if fewer picked keywords).
  const quizKeywords = useMemo(
    () => lessonKeywords.slice(0, Math.min(5, lessonKeywords.length)),
    [lessonKeywords],
  );

  const [step, setStep] = useState<Step>(1);
  const [learnIndex, setLearnIndex] = useState(0);
  const [done, setDone] = useState(false);

  // Step 2 (Practice) state
  const [selectedSourceKey, setSelectedSourceKey] = useState<string>('short');
  const [shadowText, setShadowText] = useState<{
    text: string;
    translation: string;
  } | null>(null);
  const [practiceCount, setPracticeCount] = useState(0);

  // Step 3 (Test) state
  const [quizKeywordIndex, setQuizKeywordIndex] = useState(0);
  const [quizCorrect, setQuizCorrect] = useState(0);

  // Step 4 (Read) state
  const [readingIndex, setReadingIndex] = useState(0);
  const [articlesRead, setArticlesRead] = useState(0);
  const [readArticleIds, setReadArticleIds] = useState<Set<string>>(new Set());

  // Streak / goal results captured at lesson completion
  const [finalStreak, setFinalStreak] = useState(0);
  const [goalReachedNow, setGoalReachedNow] = useState(false);

  useEffect(() => {
    warmupVoices();
  }, []);

  // Track Word/Expression for daily progress + lifetime stats whenever
  // the active Step 1 card changes.
  useEffect(() => {
    if (step !== 1) return;
    const kw = lessonKeywords[learnIndex];
    if (!kw) return;
    addSeenWord(kw.id);
    incrementDailyProgress(kw.id);
    const phrase = phraseByKeywordId[kw.id];
    if (phrase) addSeenPhrase(phrase.id);
  }, [step, learnIndex, lessonKeywords, phraseByKeywordId]);

  const shortExample = lessonKeywords[0]?.examples[0] ?? null;
  const passagesForPractice = pickedPassage ? [pickedPassage] : [];

  // Default the shadowing source on entering Step 2.
  useEffect(() => {
    if (step !== 2) return;
    if (shadowText !== null) return;
    if (shortExample) {
      setShadowText({
        text: shortExample.sentence,
        translation: shortExample.translation,
      });
      setSelectedSourceKey('short');
    } else if (pickedPassage) {
      setShadowText({
        text: pickedPassage.text,
        translation: pickedPassage.translation_ja,
      });
      setSelectedSourceKey(`passage-${pickedPassage.id}`);
    }
  }, [step, shortExample, pickedPassage, shadowText]);

  if (!scene) {
    return (
      <>
        <LessonHeader sceneName="—" step={0} totalSteps={4} />
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
        <LessonHeader sceneName={scene.name_ja} step={0} totalSteps={4} />
        <main className="flex-1 flex items-center justify-center bg-apple-white text-apple-fg-2 t-body">
          このシーンにはキーワードが登録されていません。
        </main>
      </>
    );
  }

  // Step transitions
  const handleNextLearnCard = () => {
    if (learnIndex < lessonKeywords.length - 1) {
      setLearnIndex((i) => i + 1);
    } else {
      setStep(2);
    }
  };

  const handlePrevLearnCard = () => {
    if (learnIndex > 0) setLearnIndex((i) => i - 1);
  };

  const handlePracticeContinue = () => {
    setStep(3);
  };

  const handleQuizComplete = (allCorrect: boolean) => {
    if (allCorrect) setQuizCorrect((c) => c + 1);
    if (quizKeywordIndex < quizKeywords.length - 1) {
      setQuizKeywordIndex((i) => i + 1);
    } else {
      setStep(4);
    }
  };

  const finishLesson = () => {
    const lessonKeywordIds = lessonKeywords.map((k) => k.id);
    recordLessonComplete({
      sceneId: scene.id,
      completedAt: new Date().toISOString(),
      keywordIds: lessonKeywordIds,
    });
    recordKeywordsStudied(scene.id, lessonKeywordIds);
    const next = updateStreak();
    setFinalStreak(next.count);
    setGoalReachedNow(lessonKeywords.length >= dailyGoal);
    setDone(true);
  };

  if (done) {
    const totalQuiz = quizKeywords.length;
    const accuracy =
      totalQuiz === 0 ? 0 : Math.round((quizCorrect / totalQuiz) * 100);
    const expressionCount = Object.values(phraseByKeywordId).filter(
      (p) => p !== null,
    ).length;
    const wordsAndExpressions = lessonKeywords.length + expressionCount;
    return (
      <>
        <LessonHeader sceneName={scene.name_ja} step={4} totalSteps={4} />
        <main className="flex-1 bg-apple-white">
          <section className="section">
            <div className="section-narrow text-center fade-in">
              <p className="t-eyebrow text-[var(--accent-strong)] mb-3">
                Lesson Complete
              </p>
              <h1 className="t-headline text-apple-fg mb-3">
                お疲れさまでした
              </h1>
              <p className="t-body text-apple-fg-2 mb-6">{scene.name_ja}</p>

              {finalStreak > 0 && (
                <div className="inline-flex flex-col items-center gap-2 mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="t-section-title text-[var(--accent-strong)]">
                      {finalStreak}
                    </span>
                    <span className="t-body text-apple-fg-2">day streak</span>
                  </div>
                  {goalReachedNow && (
                    <div className="t-eyebrow text-[var(--accent-strong)]">
                      Daily goal reached!
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10 text-left">
                <div className="rounded-xl bg-apple-gray p-5">
                  <div className="t-caption text-apple-fg-2">
                    Words &amp; Expressions
                  </div>
                  <div className="t-section-title text-apple-fg mt-1">
                    {wordsAndExpressions}
                  </div>
                </div>
                <div className="rounded-xl bg-apple-gray p-5">
                  <div className="t-caption text-apple-fg-2">
                    Practice completed
                  </div>
                  <div className="t-section-title text-apple-fg mt-1">
                    {practiceCount}
                  </div>
                </div>
                <div className="rounded-xl bg-apple-gray p-5">
                  <div className="t-caption text-apple-fg-2">Test score</div>
                  <div className="t-section-title text-apple-fg mt-1">
                    {accuracy}
                    <span className="t-body text-apple-fg-2">%</span>
                  </div>
                </div>
                <div className="rounded-xl bg-apple-gray p-5">
                  <div className="t-caption text-apple-fg-2">Articles read</div>
                  <div className="t-section-title text-apple-fg mt-1">
                    {articlesRead}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/dashboard" className="btn btn-primary">
                  Learn に戻る
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setLearnIndex(0);
                    setShadowText(null);
                    setSelectedSourceKey('short');
                    setPracticeCount(0);
                    setQuizKeywordIndex(0);
                    setQuizCorrect(0);
                    setReadingIndex(0);
                    setArticlesRead(0);
                    setReadArticleIds(new Set());
                    setDone(false);
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

  const currentLearnKeyword = lessonKeywords[learnIndex];
  const currentLearnPhrase = currentLearnKeyword
    ? phraseByKeywordId[currentLearnKeyword.id] ?? null
    : null;
  const currentQuizKw = quizKeywords[quizKeywordIndex];
  const distractors = currentQuizKw
    ? industryKeywords.filter((k) => k.id !== currentQuizKw.id)
    : [];
  const currentReading = pickedReading ?? sceneReadings[readingIndex] ?? null;

  return (
    <>
      <LessonHeader sceneName={scene.name_ja} step={step} totalSteps={4} />
      <main className="flex-1 bg-apple-white">
        <div className="max-w-[692px] mx-auto px-5 sm:px-6 py-8 space-y-6">
          <div className="flex items-center justify-between t-caption text-apple-fg-2">
            <span>
              {reviewMode ? 'Reviewing' : 'Learning'} {lessonKeywords.length}{' '}
              words today
            </span>
            <span>~{estimateLessonMinutes(dailyGoal)} min</span>
          </div>
          <ProgressBar current={step} total={4} labels={STEP_LABELS} />

          {/* Step 1 — Learn (1 word = 1 unified card) */}
          {step === 1 && currentLearnKeyword && (
            <div className="space-y-4">
              <div className="flex items-center justify-between t-caption text-apple-fg-2">
                <span>
                  Card {learnIndex + 1} of {lessonKeywords.length}
                </span>
                <span className="t-eyebrow text-apple-fg-2">Word</span>
              </div>

              <LearnUnifiedCard
                key={currentLearnKeyword.id}
                keyword={currentLearnKeyword}
                example={currentLearnKeyword.examples[0]}
                phrase={currentLearnPhrase}
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handlePrevLearnCard}
                  disabled={learnIndex === 0}
                  className="link-chev t-small disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  onClick={handleNextLearnCard}
                  className="btn btn-primary"
                >
                  {learnIndex === lessonKeywords.length - 1
                    ? 'Practice へ'
                    : 'Next'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Practice */}
          {step === 2 && (
            <div className="space-y-4">
              <PassageSelector
                selectedKey={selectedSourceKey}
                shortExample={
                  shortExample
                    ? {
                        sentence: shortExample.sentence,
                        translation: shortExample.translation,
                        label: 'Short Example',
                      }
                    : null
                }
                passages={passagesForPractice}
                onSelect={(s) => {
                  setSelectedSourceKey(s.key);
                  setShadowText({ text: s.text, translation: s.translation });
                }}
              />
              {shadowText && (
                <ShadowingPlayer
                  key={`${scene.id}-${selectedSourceKey}`}
                  keywordId={`${scene.id}-${selectedSourceKey}`}
                  sentence={shadowText.text}
                  translation={shadowText.translation}
                  onComplete={() => setPracticeCount((n) => n + 1)}
                />
              )}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="link-chev t-small"
                >
                  ← Learn
                </button>
                <button
                  type="button"
                  onClick={handlePracticeContinue}
                  className="btn btn-primary"
                >
                  Test へ
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Test */}
          {step === 3 && currentQuizKw && (
            <div className="space-y-4">
              <div className="flex items-center justify-between t-caption text-apple-fg-2">
                <span>
                  Question {quizKeywordIndex + 1} of {quizKeywords.length}
                </span>
                <span>Score: {quizCorrect}</span>
              </div>
              <QuizCard
                key={`quiz-${currentQuizKw.id}`}
                keyword={currentQuizKw}
                distractors={distractors}
                onComplete={handleQuizComplete}
              />
            </div>
          )}

          {/* Step 4 — Read */}
          {step === 4 && currentReading && (
            <div className="space-y-4">
              <ReadingCard
                key={currentReading.id}
                reading={currentReading}
                onOpen={() => {
                  addArticleRead(currentReading.id);
                  setReadArticleIds((prev) => {
                    if (prev.has(currentReading.id)) return prev;
                    const next = new Set(prev);
                    next.add(currentReading.id);
                    setArticlesRead(next.size);
                    return next;
                  });
                }}
              />
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="link-chev t-small"
                >
                  ← Test
                </button>
                <button
                  type="button"
                  onClick={finishLesson}
                  className="btn btn-primary"
                >
                  レッスン完了
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
