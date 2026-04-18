'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, Settings as SettingsIcon } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import {
  getIndustry,
  getKeywordsByIndustry,
  getKeywordsByScene,
  getReadingsByScene,
  getScene,
  getScenes,
} from '@/lib/data';
import {
  getDailyProgress,
  getLessonProgress,
  getReadArticleIds,
  getRecentActivity,
  getSeenPhraseIds,
  getSeenWordIds,
  getStreak,
  getPreferences,
  type DailyProgress,
} from '@/lib/storage';

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function GoalRing({
  progress,
  goal,
  size = 96,
  stroke = 8,
}: {
  progress: number;
  goal: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = goal === 0 ? 0 : Math.min(1, progress / goal);
  const offset = c * (1 - ratio);
  const reached = progress >= goal && goal > 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Daily goal progress ${progress} of ${goal}`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--apple-gray-2)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={reached ? 'var(--accent)' : 'var(--accent)'}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 360ms ease-out' }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="22"
        fontWeight="600"
        fill="var(--apple-fg)"
        letterSpacing="-0.02em"
      >
        {progress}/{goal}
      </text>
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [industryId, setIndustryId] = useState<string | null>(null);
  const [industryName, setIndustryName] = useState<string | null>(null);
  const [activeSceneIds, setActiveSceneIds] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [progress, setProgress] = useState<DailyProgress>({
    date: todayKey(),
    count: 0,
    goal: 5,
  });
  const [completedTodayIds, setCompletedTodayIds] = useState<string[]>([]);
  const [lastStudiedMap, setLastStudiedMap] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({
    words: 0,
    expressions: 0,
    lessons: 0,
    articles: 0,
  });
  const [activity, setActivity] = useState<
    { date: string; dayLabel: string; active: boolean; isToday: boolean }[]
  >([]);

  useEffect(() => {
    const prefs = getPreferences();
    if (!prefs) {
      router.replace('/');
      return;
    }
    const industry = getIndustry(prefs.industryId);
    setIndustryId(prefs.industryId);
    setIndustryName(industry?.name_ja ?? null);
    setActiveSceneIds(prefs.sceneIds);
    setStreak(getStreak().count);
    setProgress(getDailyProgress());
    const lp = getLessonProgress();
    const today = todayKey();
    setCompletedTodayIds(
      lp.filter((p) => p.completedAt.startsWith(today)).map((p) => p.sceneId),
    );
    const last: Record<string, string> = {};
    for (const p of lp) {
      const cur = last[p.sceneId];
      if (!cur || cur < p.completedAt) last[p.sceneId] = p.completedAt;
    }
    setLastStudiedMap(last);
    setStats({
      words: getSeenWordIds().length,
      expressions: getSeenPhraseIds().length,
      lessons: lp.length,
      articles: getReadArticleIds().length,
    });
    setActivity(getRecentActivity(7));
    setHydrated(true);
  }, [router]);

  const activeScenes = useMemo(() => {
    if (!industryId) return [];
    const all = getScenes(industryId);
    return all.filter((s) => activeSceneIds.includes(s.id));
  }, [industryId, activeSceneIds]);

  const undoneActiveScenes = useMemo(
    () => activeScenes.filter((s) => !completedTodayIds.includes(s.id)),
    [activeScenes, completedTodayIds],
  );

  if (!hydrated || !industryId) {
    return (
      <main className="flex-1 flex items-center justify-center text-apple-fg-2 t-small">
        Loading…
      </main>
    );
  }

  const goalReached = progress.goal > 0 && progress.count >= progress.goal;
  const noScenes = activeScenes.length === 0;
  const hasUndone = undoneActiveScenes.length > 0;
  const startedToday = completedTodayIds.length > 0;

  // CTA state machine
  let ctaState: 'no-scenes' | 'goal-reached' | 'continue' | 'start';
  if (noScenes) ctaState = 'no-scenes';
  else if (goalReached) ctaState = 'goal-reached';
  else if (startedToday && hasUndone) ctaState = 'continue';
  else ctaState = 'start';

  const nextScene = undoneActiveScenes[0] ?? activeScenes[0] ?? null;
  const nextSceneKwCount = nextScene
    ? getKeywordsByScene(nextScene.id).length
    : 0;
  const otherScenes = activeScenes.filter((s) => s.id !== nextScene?.id);
  const weekActiveDays = activity.filter((d) => d.active).length;

  const formatLastStudied = (iso: string | undefined): string => {
    if (!iso) return 'Not studied yet';
    const today = todayKey();
    if (iso.startsWith(today)) return 'Studied today';
    const yesterday = (() => {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      return `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
    })();
    if (iso.startsWith(yesterday)) return 'Studied yesterday';
    try {
      return `Last studied ${new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } catch {
      return 'Studied recently';
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Section 1: Hero — streak + daily goal ring */}
        <section className="section bg-apple-white pb-10">
          <div className="section-wide fade-in">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 t-caption text-apple-fg-2 hover:text-apple-fg transition-colors mb-8"
            >
              <SettingsIcon size={14} strokeWidth={1.6} aria-hidden="true" />
              <span>
                {industryName ?? '—'}
                <span className="mx-2 text-apple-line">·</span>
                {activeSceneIds.length} シーン選択中
              </span>
              <span className="text-apple-fg-2">›</span>
            </Link>

            <div className="grid grid-cols-2 items-center gap-6">
              <div>
                {streak > 0 ? (
                  <>
                    <div
                      className="font-semibold text-apple-fg leading-none"
                      style={{
                        fontSize: 'clamp(56px, 12vw, 88px)',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {streak}
                    </div>
                    <div className="t-body-lg text-apple-fg-2 mt-2">
                      day streak
                    </div>
                  </>
                ) : (
                  <>
                    <div className="t-section-title text-apple-fg leading-tight">
                      Start your streak
                    </div>
                    <div className="t-small text-apple-fg-2 mt-2">
                      今日のレッスンで連続記録を開始
                    </div>
                  </>
                )}
              </div>
              <div className="flex flex-col items-center sm:items-end justify-self-end">
                <GoalRing
                  progress={progress.count}
                  goal={progress.goal}
                  size={112}
                  stroke={9}
                />
                <div className="t-small text-apple-fg-2 mt-3">
                  {goalReached ? 'Goal reached!' : 'words today'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Main CTA */}
        <section className="bg-apple-gray border-y border-apple-line">
          <div className="section-wide px-5 sm:px-6 py-12 sm:py-16">
            {ctaState === 'no-scenes' && (
              <div className="text-center fade-up">
                <div className="t-eyebrow text-apple-fg-2 mb-3">Setup</div>
                <h2 className="t-section-title text-apple-fg mb-3">
                  Set up your lessons
                </h2>
                <p className="t-body text-apple-fg-2 mb-6">
                  シーンを1つ以上選んで、今日のレッスンを開始しましょう。
                </p>
                <Link href="/settings" className="btn btn-primary">
                  シーンを選ぶ
                </Link>
              </div>
            )}

            {ctaState === 'start' && nextScene && (
              <div className="text-center fade-up">
                <div className="t-eyebrow text-apple-fg-2 mb-3">Today</div>
                <Link
                  href={`/lesson/${nextScene.id}`}
                  className="btn btn-primary"
                  style={{ padding: '18px 36px', fontSize: '17px' }}
                >
                  Start today&rsquo;s lesson
                  <ArrowRight size={18} strokeWidth={1.6} aria-hidden="true" />
                </Link>
                <div className="t-small text-apple-fg-2 mt-5">
                  {nextScene.name_ja}
                  <span className="mx-2 text-apple-line">·</span>
                  {nextSceneKwCount} words to learn
                </div>
              </div>
            )}

            {ctaState === 'continue' && nextScene && (
              <div className="text-center fade-up">
                <div className="t-eyebrow text-apple-fg-2 mb-3">Continue</div>
                <Link
                  href={`/lesson/${nextScene.id}`}
                  className="btn btn-primary"
                  style={{ padding: '18px 36px', fontSize: '17px' }}
                >
                  Continue: {nextScene.name_ja}
                  <ArrowRight size={18} strokeWidth={1.6} aria-hidden="true" />
                </Link>
                <div className="t-small text-apple-fg-2 mt-5">
                  あと {undoneActiveScenes.length} シーン残っています
                </div>
              </div>
            )}

            {ctaState === 'goal-reached' && (
              <div className="text-center fade-up">
                <div className="t-eyebrow text-[var(--accent-strong)] mb-3">
                  Today
                </div>
                <h2 className="t-section-title text-apple-fg mb-3">
                  Today&rsquo;s goal reached!
                </h2>
                <p className="t-body text-apple-fg-2 mb-6">
                  {streak > 0 ? `${streak} day streak — ` : ''}
                  この勢いを保ちましょう。
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {nextScene && (
                    <Link
                      href={`/lesson/${nextScene.id}`}
                      className="btn btn-primary"
                    >
                      Keep going
                      <ArrowRight size={16} strokeWidth={1.6} aria-hidden="true" />
                    </Link>
                  )}
                  <Link href="/library" className="btn btn-ghost bg-white">
                    Review past words
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Other scenes */}
        {otherScenes.length > 0 && (
          <section className="section bg-apple-white">
            <div className="section-wide">
              <h3 className="t-subtitle text-apple-fg mb-5">Other lessons</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {otherScenes.map((scene) => {
                  const kws = getKeywordsByScene(scene.id);
                  const readings = getReadingsByScene(scene.id);
                  const lastStudied = formatLastStudied(lastStudiedMap[scene.id]);
                  return (
                    <Link
                      key={scene.id}
                      href={`/lesson/${scene.id}`}
                      className="rounded-xl border border-apple-line bg-apple-white hover:bg-apple-gray transition-colors p-5"
                    >
                      <div className="t-eyebrow text-apple-fg-2 mb-1">
                        {scene.name_en}
                      </div>
                      <div className="t-body font-medium text-apple-fg mb-1">
                        {scene.name_ja}
                      </div>
                      <div className="t-caption text-apple-fg-2 flex items-center gap-2 flex-wrap">
                        <span>{kws.length} words</span>
                        {readings.length > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <BookOpen
                              size={11}
                              strokeWidth={1.6}
                              aria-hidden="true"
                            />
                            {readings.length} articles
                          </span>
                        )}
                        <span aria-hidden>·</span>
                        <span>{lastStudied}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Section 4: Week activity */}
        <section className="section bg-apple-gray pt-12 pb-12">
          <div className="section-wide">
            <div className="flex items-baseline justify-between mb-5">
              <h3 className="t-subtitle text-apple-fg">This week</h3>
              <span className="t-small text-apple-fg-2">
                今週 {weekActiveDays} 日学習
              </span>
            </div>
            <div className="grid grid-cols-7 gap-2 max-w-[420px]">
              {activity.map((d) => (
                <div key={d.date} className="flex flex-col items-center gap-2">
                  <div
                    className={`h-12 w-full rounded-lg ${
                      d.active
                        ? 'bg-[var(--accent)]'
                        : 'bg-apple-gray-2'
                    } ${d.isToday ? 'ring-2 ring-apple-fg ring-offset-2 ring-offset-apple-gray' : ''}`}
                    aria-label={`${d.dayLabel} ${d.active ? 'studied' : 'no study'}`}
                  />
                  <span className="t-caption text-apple-fg-2">{d.dayLabel}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 5: Stats */}
        <section className="section bg-apple-white">
          <div className="section-wide">
            <h3 className="t-subtitle text-apple-fg mb-5">Stats</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-apple-line p-5">
                <div className="t-caption text-apple-fg-2">
                  Total words learned
                </div>
                <div className="t-section-title text-apple-fg mt-1">
                  {stats.words}
                  {industryId && (
                    <span className="t-body text-apple-fg-2">
                      {' '}
                      / {getKeywordsByIndustry(industryId).length}
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-apple-line p-5">
                <div className="t-caption text-apple-fg-2">
                  Expressions learned
                </div>
                <div className="t-section-title text-apple-fg mt-1">
                  {stats.expressions}
                </div>
              </div>
              <div className="rounded-xl border border-apple-line p-5">
                <div className="t-caption text-apple-fg-2">
                  Lessons completed
                </div>
                <div className="t-section-title text-apple-fg mt-1">
                  {stats.lessons}
                </div>
              </div>
              <div className="rounded-xl border border-apple-line p-5">
                <div className="t-caption text-apple-fg-2">Articles read</div>
                <div className="t-section-title text-apple-fg mt-1">
                  {stats.articles}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Upload CTA — keep as immersive footer */}
        <section className="section bg-apple-black">
          <div className="section-wide text-center fade-up">
            <p className="t-eyebrow text-[var(--accent-on-dark)] mb-3">
              Personalize
            </p>
            <h2 className="t-section-title text-white">
              あなたの資料・URLから
              <br className="sm:hidden" />
              キーワードを抽出。
            </h2>
            <p className="t-body-lg text-apple-fg-on-dark-2 mt-5 mb-8 max-w-[560px] mx-auto">
              ピッチ資料、業界ニュース、契約書—
              あなた専用のレッスンを生成します。
            </p>
            <Link href="/upload" className="btn btn-on-dark-primary">
              Upload を開く
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
