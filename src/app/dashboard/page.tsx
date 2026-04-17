'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import {
  getIndustry,
  getKeywordsByIndustry,
  getKeywordsByScene,
  getScene,
  getScenes,
} from '@/lib/data';
import {
  getBookmarks,
  getMasteredKeywordIds,
  getPreferences,
} from '@/lib/storage';

export default function DashboardPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [industryId, setIndustryId] = useState<string | null>(null);
  const [industryName, setIndustryName] = useState<string | null>(null);
  const [activeSceneIds, setActiveSceneIds] = useState<string[]>([]);
  const [masteredCount, setMasteredCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);

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
    setMasteredCount(getMasteredKeywordIds().length);
    setBookmarkCount(getBookmarks().length);
    setHydrated(true);
  }, [router]);

  if (!hydrated || !industryId) {
    return (
      <main className="flex-1 flex items-center justify-center text-apple-fg-2 t-small">
        Loading…
      </main>
    );
  }

  const industryKeywords = getKeywordsByIndustry(industryId);
  const totalKeywords = industryKeywords.length;
  const allScenes = getScenes(industryId);
  const todayScenes = allScenes.filter((s) => activeSceneIds.includes(s.id));

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="section bg-apple-white">
          <div className="section-wide fade-in">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 t-caption text-apple-fg-2 hover:text-apple-fg transition-colors mb-6"
            >
              <span aria-hidden>⚙</span>
              <span>
                {industryName ?? '—'}
                <span className="mx-2 text-apple-line">·</span>
                {activeSceneIds.length} シーン選択中
              </span>
              <span className="text-apple-fg-2">›</span>
            </Link>
            <p className="t-eyebrow text-apple-fg-2 mb-3">Today</p>
            <h1 className="t-headline text-apple-fg">
              おかえりなさい。<br />
              続きから学びましょう。
            </h1>
          </div>
        </section>

        {/* Stats */}
        <section className="section bg-apple-gray pt-12 pb-12">
          <div className="section-wide grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <div className="t-caption text-apple-fg-2">習得キーワード</div>
              <div className="t-section-title text-apple-fg mt-1">
                {masteredCount}
                <span className="t-body text-apple-fg-2"> / {totalKeywords}</span>
              </div>
            </div>
            <div>
              <div className="t-caption text-apple-fg-2">ブックマーク</div>
              <div className="t-section-title text-apple-fg mt-1">
                {bookmarkCount}
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="t-caption text-apple-fg-2">対象シーン</div>
              <div className="t-section-title text-apple-fg mt-1">
                {activeSceneIds.length}
              </div>
            </div>
          </div>
        </section>

        {/* Today's lessons */}
        <section className="section bg-apple-white">
          <div className="section-wide">
            <div className="flex items-baseline justify-between mb-8">
              <h2 className="t-section-title text-apple-fg">今日のレッスン</h2>
              <Link href="/library" className="link-chev">
                Library
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {todayScenes.map((scene) => {
                const kws = getKeywordsByScene(scene.id);
                return (
                  <Link
                    key={scene.id}
                    href={`/lesson/${scene.id}`}
                    className="group rounded-xl border border-apple-line bg-apple-white hover:bg-apple-gray transition-colors p-7"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-3xl" aria-hidden>
                        {scene.emoji}
                      </span>
                      <span className="t-caption text-apple-fg-2">
                        {kws.length} keywords
                      </span>
                    </div>
                    <div className="t-subtitle text-apple-fg mb-1">
                      {scene.name_ja}
                    </div>
                    <div className="t-small text-apple-fg-2 mb-5 leading-snug">
                      {scene.description_ja}
                    </div>
                    <span className="link-chev t-small">Start lesson</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Other scenes */}
        {allScenes.length > activeSceneIds.length && (
          <section className="section bg-apple-gray pt-16 pb-16">
            <div className="section-wide">
              <h2 className="t-subtitle text-apple-fg mb-5">その他のシーン</h2>
              <div className="flex flex-wrap gap-2">
                {allScenes
                  .filter((s) => !activeSceneIds.includes(s.id))
                  .map((s) => (
                    <Link
                      key={s.id}
                      href={`/lesson/${s.id}`}
                      className="t-small rounded-full border border-apple-line bg-apple-white hover:bg-apple-gray-2 px-4 py-2 text-apple-fg transition-colors"
                    >
                      {s.emoji} {getScene(s.id)?.name_ja}
                    </Link>
                  ))}
              </div>
            </div>
          </section>
        )}

        {/* Upload CTA — immersive black */}
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
