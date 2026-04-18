// localStorage wrapper. SSR-safe.
// Abstracted so we can swap to Supabase later without changing call sites.

import type {
  ExtractedKeyword,
  LessonProgress,
  QuizResult,
  UserKeyword,
  UserPreferences,
} from '@/types';

const KEYS = {
  prefs: 'ie:preferences',
  bookmarks: 'ie:bookmarks',
  quizResults: 'ie:quiz-results',
  lessonProgress: 'ie:lesson-progress',
  shadowingCounts: 'ie:shadowing-counts',
  userKeywords: 'ie:user-keywords',
  streak: 'ie:streak',
  dailyGoal: 'ie:daily-goal',
  dailyProgress: 'ie:daily-progress',
  activityLog: 'ie:activity-log',
  articlesRead: 'ie:articles-read',
  seenWords: 'ie:seen-words',
  seenPhrases: 'ie:seen-phrases',
  sceneProgress: 'ie:scene-progress',
} as const;

function isAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const k = '__ie_test__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function read<T>(key: string, fallback: T): T {
  if (!isAvailable()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (!isAvailable()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded — silently no-op for MVP
  }
}

// ---------- Preferences ----------

export function getPreferences(): UserPreferences | null {
  return read<UserPreferences | null>(KEYS.prefs, null);
}

export function setPreferences(prefs: UserPreferences): void {
  write(KEYS.prefs, prefs);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('ie:preferences-changed'));
  }
}

export function clearPreferences(): void {
  if (!isAvailable()) return;
  window.localStorage.removeItem(KEYS.prefs);
}

// ---------- Bookmarks ----------

export function getBookmarks(): string[] {
  return read<string[]>(KEYS.bookmarks, []);
}

export function isBookmarked(keywordId: string): boolean {
  return getBookmarks().includes(keywordId);
}

export function toggleBookmark(keywordId: string): boolean {
  const current = getBookmarks();
  const next = current.includes(keywordId)
    ? current.filter((id) => id !== keywordId)
    : [...current, keywordId];
  write(KEYS.bookmarks, next);
  return next.includes(keywordId);
}

// ---------- Quiz results ----------

export function getQuizResults(): QuizResult[] {
  return read<QuizResult[]>(KEYS.quizResults, []);
}

export function recordQuizResult(result: QuizResult): void {
  const current = getQuizResults();
  write(KEYS.quizResults, [...current, result]);
}

// ---------- Lesson progress ----------

export function getLessonProgress(): LessonProgress[] {
  return read<LessonProgress[]>(KEYS.lessonProgress, []);
}

export function recordLessonComplete(progress: LessonProgress): void {
  const current = getLessonProgress();
  const filtered = current.filter((p) => p.sceneId !== progress.sceneId);
  write(KEYS.lessonProgress, [...filtered, progress]);
}

export function getMasteredKeywordIds(): string[] {
  const progress = getLessonProgress();
  const set = new Set<string>();
  for (const p of progress) for (const kw of p.keywordIds) set.add(kw);
  return Array.from(set);
}

// ---------- Shadowing counts ----------

export function getShadowingCounts(): Record<string, number> {
  return read<Record<string, number>>(KEYS.shadowingCounts, {});
}

export function incrementShadowingCount(keywordId: string): number {
  const counts = getShadowingCounts();
  const next = (counts[keywordId] ?? 0) + 1;
  counts[keywordId] = next;
  write(KEYS.shadowingCounts, counts);
  return next;
}

// ---------- User-extracted keywords (from URL/file analysis) ----------

export function getUserKeywords(): UserKeyword[] {
  return read<UserKeyword[]>(KEYS.userKeywords, []);
}

// ---------- Streak / Daily Goal ----------

export type Streak = {
  count: number;
  lastCompletedDate: string | null;
};

type DailyProgressRaw = {
  date: string;
  viewedIds: string[];
};

export type DailyProgress = {
  date: string;
  count: number;
  goal: number;
};

export const DAILY_GOAL_OPTIONS = [3, 5, 10] as const;
export const DEFAULT_DAILY_GOAL = 5;

function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function shiftDate(days: number, base: Date = new Date()): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

export function getStreak(): Streak {
  return read<Streak>(KEYS.streak, { count: 0, lastCompletedDate: null });
}

export function updateStreak(): Streak {
  const today = todayKey();
  const cur = getStreak();
  if (cur.lastCompletedDate === today) {
    appendActivityDate(today);
    return cur;
  }
  const yesterday = todayKey(shiftDate(-1));
  const nextCount = cur.lastCompletedDate === yesterday ? cur.count + 1 : 1;
  const next: Streak = { count: nextCount, lastCompletedDate: today };
  write(KEYS.streak, next);
  appendActivityDate(today);
  return next;
}

export function getDailyGoal(): number {
  const v = read<number>(KEYS.dailyGoal, DEFAULT_DAILY_GOAL);
  return DAILY_GOAL_OPTIONS.includes(v as 3 | 5 | 10) ? v : DEFAULT_DAILY_GOAL;
}

export function setDailyGoal(n: number): void {
  if (!DAILY_GOAL_OPTIONS.includes(n as 3 | 5 | 10)) return;
  write(KEYS.dailyGoal, n);
}

export function getDailyProgress(): DailyProgress {
  const today = todayKey();
  const raw = read<DailyProgressRaw | null>(KEYS.dailyProgress, null);
  const goal = getDailyGoal();
  if (!raw || raw.date !== today) {
    return { date: today, count: 0, goal };
  }
  return { date: raw.date, count: raw.viewedIds.length, goal };
}

export function incrementDailyProgress(keywordId: string): DailyProgress {
  const today = todayKey();
  const raw = read<DailyProgressRaw | null>(KEYS.dailyProgress, null);
  const cur: DailyProgressRaw =
    raw && raw.date === today ? raw : { date: today, viewedIds: [] };
  if (!cur.viewedIds.includes(keywordId)) {
    cur.viewedIds = [...cur.viewedIds, keywordId];
    write(KEYS.dailyProgress, cur);
  }
  return {
    date: cur.date,
    count: cur.viewedIds.length,
    goal: getDailyGoal(),
  };
}

export function isTodayGoalCompleted(): boolean {
  const p = getDailyProgress();
  return p.count >= p.goal;
}

// ---------- Activity log (week strip) ----------

export function getActivityDates(): string[] {
  return read<string[]>(KEYS.activityLog, []);
}

function appendActivityDate(date: string): void {
  const arr = getActivityDates();
  if (arr.includes(date)) return;
  arr.push(date);
  write(KEYS.activityLog, arr);
}

export function getRecentActivity(days = 7): {
  date: string;
  dayLabel: string;
  active: boolean;
  isToday: boolean;
}[] {
  const set = new Set(getActivityDates());
  const today = new Date();
  const todayStr = todayKey(today);
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const out: { date: string; dayLabel: string; active: boolean; isToday: boolean }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = shiftDate(-i, today);
    const ds = todayKey(d);
    out.push({
      date: ds,
      dayLabel: labels[d.getDay()],
      active: set.has(ds),
      isToday: ds === todayStr,
    });
  }
  return out;
}

// ---------- Articles read / seen words / seen phrases ----------

export function getReadArticleIds(): string[] {
  return read<string[]>(KEYS.articlesRead, []);
}

export function addArticleRead(id: string): void {
  const cur = getReadArticleIds();
  if (cur.includes(id)) return;
  write(KEYS.articlesRead, [...cur, id]);
}

export function getSeenWordIds(): string[] {
  return read<string[]>(KEYS.seenWords, []);
}

export function addSeenWord(id: string): void {
  const cur = getSeenWordIds();
  if (cur.includes(id)) return;
  write(KEYS.seenWords, [...cur, id]);
}

export function getSeenPhraseIds(): string[] {
  return read<string[]>(KEYS.seenPhrases, []);
}

export function addSeenPhrase(id: string): void {
  const cur = getSeenPhraseIds();
  if (cur.includes(id)) return;
  write(KEYS.seenPhrases, [...cur, id]);
}

// ---------- Scene progress (per-keyword timestamps) ----------

type SceneProgressMap = Record<
  string,
  { keywordTimestamps: Record<string, string> }
>;

export type SceneCompletion = {
  studied: number;
  total: number;
  isCompleted: boolean;
  lastStudiedAt: string | null;
  oldestStudiedAt: string | null;
};

export function getSceneProgress(sceneId: string): {
  keywordTimestamps: Record<string, string>;
} {
  const all = read<SceneProgressMap>(KEYS.sceneProgress, {});
  return all[sceneId] ?? { keywordTimestamps: {} };
}

export function recordKeywordsStudied(
  sceneId: string,
  keywordIds: string[],
  when: string = new Date().toISOString(),
): void {
  if (keywordIds.length === 0) return;
  const all = read<SceneProgressMap>(KEYS.sceneProgress, {});
  const cur = all[sceneId] ?? { keywordTimestamps: {} };
  for (const id of keywordIds) cur.keywordTimestamps[id] = when;
  all[sceneId] = cur;
  write(KEYS.sceneProgress, all);
}

export function getSceneCompletion(
  sceneId: string,
  totalKeywordIds: string[],
): SceneCompletion {
  const { keywordTimestamps } = getSceneProgress(sceneId);
  const studiedSet = new Set(Object.keys(keywordTimestamps));
  const studied = totalKeywordIds.filter((id) => studiedSet.has(id)).length;
  const timestamps = Object.values(keywordTimestamps);
  const lastStudiedAt =
    timestamps.length === 0
      ? null
      : timestamps.reduce((a, b) => (a > b ? a : b));
  const oldestStudiedAt =
    timestamps.length === 0
      ? null
      : timestamps.reduce((a, b) => (a < b ? a : b));
  return {
    studied,
    total: totalKeywordIds.length,
    isCompleted: totalKeywordIds.length > 0 && studied >= totalKeywordIds.length,
    lastStudiedAt,
    oldestStudiedAt,
  };
}

/**
 * Pick `goal` keywords for a daily lesson:
 *  - Unstudied keywords first (in their original order).
 *  - If not enough, pad with previously-studied ones, oldest-studied first
 *    (so review surfaces forgotten material).
 */
export function pickLessonKeywords<T extends { id: string }>(
  sceneId: string,
  allKeywords: T[],
  goal: number,
): T[] {
  if (goal <= 0 || allKeywords.length === 0) return [];
  const { keywordTimestamps } = getSceneProgress(sceneId);
  const unstudied = allKeywords.filter((k) => !(k.id in keywordTimestamps));
  if (unstudied.length >= goal) return unstudied.slice(0, goal);
  const studied = allKeywords
    .filter((k) => k.id in keywordTimestamps)
    .sort((a, b) =>
      keywordTimestamps[a.id].localeCompare(keywordTimestamps[b.id]),
    );
  const need = goal - unstudied.length;
  return [...unstudied, ...studied.slice(0, need)];
}

/** Estimated lesson duration in minutes for a given daily goal. */
export function estimateLessonMinutes(goal: number): number {
  if (goal <= 3) return 8;
  if (goal <= 5) return 12;
  return 20;
}

// ---------- User keywords (existing) ----------

export function addUserKeywords(
  extracted: ExtractedKeyword[],
  source: { type: 'url' | 'file'; ref: string },
): UserKeyword[] {
  const existing = getUserKeywords();
  const existingTerms = new Set(
    existing.map((k) => k.term.toLowerCase()),
  );
  const prefs = getPreferences();
  const industryId = prefs?.industryId ?? 'fnb';
  const fallbackScene = prefs?.sceneIds?.[0] ?? 'brand-strategy';
  const now = new Date().toISOString();
  const newOnes: UserKeyword[] = extracted
    .filter((k) => !existingTerms.has(k.term.toLowerCase()))
    .map((k, i) => {
      const sceneIds = Array.from(
        new Set(k.examples.map((e) => e.scene).filter(Boolean)),
      );
      return {
        id: `user-${Date.now()}-${i}-${k.term.replace(/\W+/g, '-').toLowerCase()}`,
        industryId,
        sceneIds: sceneIds.length > 0 ? sceneIds : [fallbackScene],
        term: k.term,
        meaning_ja: k.meaning_ja,
        meaning_industry: k.meaning_industry,
        meaning_general: k.meaning_general,
        frequency: k.frequency,
        examples: k.examples,
        sourceType: source.type,
        sourceRef: source.ref,
        extractedAt: now,
      };
    });
  const next = [...existing, ...newOnes];
  write(KEYS.userKeywords, next);
  return newOnes;
}
