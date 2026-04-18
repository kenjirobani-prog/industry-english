'use client';

import Link from 'next/link';
import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LessonHeader } from '@/components/LessonHeader';
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
import {
  addArticleRead,
  addSeenPhrase,
  addSeenWord,
  getDailyGoal,
  incrementDailyProgress,
  recordLessonComplete,
  updateStreak,
} from '@/lib/storage';
import { warmupVoices } from '@/lib/tts';
import type { Keyword, Phrase, Example } from '@/types';

const STEP_LABELS = ['Learn', 'Practice', 'Test', 'Read'];

type Step = 1 | 2 | 3 | 4;

type LearnCard =
  | { type: 'word'; keyword: Keyword }
  | { type: 'example'; keyword: Keyword; example: Example }
  | { type: 'expression'; phrase: Phrase };

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

  // Build the Step 1 deck: word → example → expression for each keyword.
  const learnDeck = useMemo<LearnCard[]>(() => {
    if (!scene) return [];
    const usedPhraseIds = new Set<string>();
    const pickPhraseFor = (kw: Keyword, idx: number): Phrase | null => {
      if (scenePhrases.length === 0) return null;
      const lower = kw.term.toLowerCase();
      const match = scenePhrases.find(
        (p) =>
          !usedPhraseIds.has(p.id) &&
          (p.phrase.toLowerCase().includes(lower) ||
            p.examples.some((e) => e.sentence.toLowerCase().includes(lower))),
      );
      if (match) {
        usedPhraseIds.add(match.id);
        return match;
      }
      const fallback = scenePhrases[idx % scenePhrases.length];
      if (fallback && !usedPhraseIds.has(fallback.id)) {
        usedPhraseIds.add(fallback.id);
        return fallback;
      }
      return scenePhrases[idx % scenePhrases.length] ?? null;
    };
    const out: LearnCard[] = [];
    sceneKeywords.forEach((kw, i) => {
      out.push({ type: 'word', keyword: kw });
      const example = kw.examples[0];
      if (example) out.push({ type: 'example', keyword: kw, example });
      const phrase = pickPhraseFor(kw, i);
      if (phrase) out.push({ type: 'expression', phrase });
    });
    return out;
  }, [scene, sceneKeywords, scenePhrases]);

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

  // Track Word/Expression views for daily progress + lifetime stats.
  useEffect(() => {
    if (step !== 1) return;
    const card = learnDeck[learnIndex];
    if (!card) return;
    if (card.type === 'word') {
      addSeenWord(card.keyword.id);
      incrementDailyProgress(card.keyword.id);
    } else if (card.type === 'expression') {
      addSeenPhrase(card.phrase.id);
    }
  }, [step, learnIndex, learnDeck]);

  const shortExample = sceneKeywords[0]?.examples[0] ?? null;

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
    } else if (scenePassages[0]) {
      const p = scenePassages[0];
      setShadowText({ text: p.text, translation: p.translation_ja });
      setSelectedSourceKey(`passage-${p.id}`);
    }
  }, [step, shortExample, scenePassages, shadowText]);

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
    if (learnIndex < learnDeck.length - 1) {
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
    if (quizKeywordIndex < sceneKeywords.length - 1) {
      setQuizKeywordIndex((i) => i + 1);
    } else {
      setStep(4);
    }
  };

  const finishLesson = () => {
    recordLessonComplete({
      sceneId: scene.id,
      completedAt: new Date().toISOString(),
      keywordIds: sceneKeywords.map((k) => k.id),
    });
    const next = updateStreak();
    setFinalStreak(next.count);
    const goal = getDailyGoal();
    setGoalReachedNow(sceneKeywords.length >= goal);
    setDone(true);
  };

  if (done) {
    const accuracy =
      sceneKeywords.length === 0
        ? 0
        : Math.round((quizCorrect / sceneKeywords.length) * 100);
    const wordsAndExpressions = sceneKeywords.length + scenePhrases.length;
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

  const currentLearnCard = learnDeck[learnIndex];
  const currentQuizKw = sceneKeywords[quizKeywordIndex];
  const distractors = industryKeywords.filter(
    (k) => k.id !== currentQuizKw.id,
  );
  const currentReading = sceneReadings[readingIndex] ?? null;

  return (
    <>
      <LessonHeader sceneName={scene.name_ja} step={step} totalSteps={4} />
      <main className="flex-1 bg-apple-white">
        <div className="max-w-[692px] mx-auto px-5 sm:px-6 py-8 space-y-6">
          <ProgressBar current={step} total={4} labels={STEP_LABELS} />

          {/* Step 1 — Learn */}
          {step === 1 && currentLearnCard && (
            <div className="space-y-4">
              <div className="flex items-center justify-between t-caption text-apple-fg-2">
                <span>
                  Card {learnIndex + 1} of {learnDeck.length}
                </span>
                <span className="t-eyebrow text-apple-fg-2">
                  {currentLearnCard.type === 'word'
                    ? 'Word'
                    : currentLearnCard.type === 'example'
                      ? 'Example'
                      : 'Expression'}
                </span>
              </div>

              {currentLearnCard.type === 'word' && (
                <KeywordCard
                  key={`word-${currentLearnCard.keyword.id}`}
                  keyword={currentLearnCard.keyword}
                />
              )}
              {currentLearnCard.type === 'example' && (
                <ExampleCard
                  key={`ex-${currentLearnCard.keyword.id}`}
                  example={currentLearnCard.example}
                  highlightTerm={currentLearnCard.keyword.term}
                />
              )}
              {currentLearnCard.type === 'expression' && (
                <PhraseCard
                  key={`ph-${currentLearnCard.phrase.id}`}
                  phrase={currentLearnCard.phrase}
                />
              )}

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
                  {learnIndex === learnDeck.length - 1
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
                passages={scenePassages}
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
                  Question {quizKeywordIndex + 1} of {sceneKeywords.length}
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
              {sceneReadings.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {sceneReadings.map((r, i) => {
                    const active = i === readingIndex;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setReadingIndex(i)}
                        className={`t-small rounded-full border px-3 py-1.5 transition-colors ${
                          active
                            ? 'border-apple-fg bg-apple-fg text-white'
                            : 'border-apple-line bg-apple-white text-apple-fg hover:bg-apple-gray'
                        }`}
                      >
                        Article {i + 1}
                      </button>
                    );
                  })}
                </div>
              )}
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
