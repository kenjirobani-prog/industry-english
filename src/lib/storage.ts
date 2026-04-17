// localStorage wrapper. SSR-safe.
// Abstracted so we can swap to Supabase later without changing call sites.

import type { LessonProgress, QuizResult, UserPreferences } from '@/types';

const KEYS = {
  prefs: 'ie:preferences',
  bookmarks: 'ie:bookmarks',
  quizResults: 'ie:quiz-results',
  lessonProgress: 'ie:lesson-progress',
  shadowingCounts: 'ie:shadowing-counts',
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
