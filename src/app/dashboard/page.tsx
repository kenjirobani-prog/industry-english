'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import {
  getIndustry,
  getKeywords,
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
    setIndustryName(industry?.name_ja ?? null);
    setActiveSceneIds(prefs.sceneIds);
    setMasteredCount(getMasteredKeywordIds().length);
    setBookmarkCount(getBookmarks().length);
    setHydrated(true);
  }, [router]);

  if (!hydrated) {
    return (
      <main className="flex-1 flex items-center justify-center text-amber-200/60 font-display tracking-widest text-sm">
        Loading…
      </main>
    );
  }

  const totalKeywords = getKeywords().length;
  const allScenes = getScenes('fnb');
  const todayScenes = allScenes.filter((s) => activeSceneIds.includes(s.id));

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <div className="font-display tracking-[0.3em] text-[11px] text-gold uppercase mb-1">
              Today
            </div>
            <h1 className="font-display text-3xl text-amber-100">
              おかえりなさい
            </h1>
            {industryName && (
              <p className="text-sm text-amber-100/60 mt-1">
                業界: <span className="text-amber-200">{industryName}</span>
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
            <div className="rounded-2xl border border-border-soft bg-surface-1 p-4">
              <div className="text-[10px] font-display uppercase tracking-widest text-amber-200/60">
                習得キーワード
              </div>
              <div className="font-display text-3xl text-amber-200 mt-1">
                {masteredCount}
                <span className="text-sm text-amber-100/40"> / {totalKeywords}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-border-soft bg-surface-1 p-4">
              <div className="text-[10px] font-display uppercase tracking-widest text-amber-200/60">
                ブックマーク
              </div>
              <div className="font-display text-3xl text-amber-200 mt-1">
                {bookmarkCount}
              </div>
            </div>
            <div className="rounded-2xl border border-border-soft bg-surface-1 p-4 col-span-2 sm:col-span-1">
              <div className="text-[10px] font-display uppercase tracking-widest text-amber-200/60">
                対象シーン
              </div>
              <div className="font-display text-3xl text-amber-200 mt-1">
                {activeSceneIds.length}
              </div>
            </div>
          </div>

          {/* Today's lessons */}
          <section className="mb-12">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-lg text-amber-200 tracking-wider uppercase">
                今日のレッスン
              </h2>
              <Link
                href="/library"
                className="text-xs text-amber-100/60 hover:text-amber-200 font-display tracking-wider uppercase"
              >
                Library →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {todayScenes.map((scene) => {
                const kws = getKeywordsByScene(scene.id);
                return (
                  <Link
                    key={scene.id}
                    href={`/lesson/${scene.id}`}
                    className="group rounded-3xl border border-border-soft bg-gradient-to-br from-surface-1 to-surface-2 p-5 hover:border-amber-400/60 hover:from-surface-2 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl">{scene.emoji}</span>
                      <span className="text-[10px] font-display uppercase tracking-widest text-amber-200/50">
                        {kws.length} keywords
                      </span>
                    </div>
                    <div className="font-display text-lg text-amber-100 mb-1 group-hover:text-amber-200 transition">
                      {scene.name_ja}
                    </div>
                    <div className="text-[11px] text-amber-100/60 leading-relaxed mb-4">
                      {scene.description_ja}
                    </div>
                    <div className="text-xs text-amber-400 font-display tracking-wider uppercase">
                      Start lesson ▸
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Other scenes */}
          {allScenes.length > activeSceneIds.length && (
            <section className="mb-12">
              <h2 className="font-display text-base text-amber-200/70 tracking-wider uppercase mb-3">
                その他のシーン
              </h2>
              <div className="flex flex-wrap gap-2">
                {allScenes
                  .filter((s) => !activeSceneIds.includes(s.id))
                  .map((s) => (
                    <Link
                      key={s.id}
                      href={`/lesson/${s.id}`}
                      className="text-xs rounded-full border border-border-soft bg-surface-1 hover:border-amber-500/50 hover:bg-surface-2 px-3 py-1.5 text-amber-100/70 transition"
                    >
                      {s.emoji} {getScene(s.id)?.name_ja}
                    </Link>
                  ))}
              </div>
            </section>
          )}

          {/* CTA: Upload */}
          <Link
            href="/upload"
            className="block rounded-3xl border border-dashed border-amber-500/40 bg-amber-500/5 p-6 text-center hover:bg-amber-500/10 transition"
          >
            <div className="text-2xl mb-1">📄</div>
            <div className="font-display text-amber-200 tracking-wider uppercase text-sm">
              あなたの資料からキーワードを抽出
            </div>
            <div className="text-[11px] text-amber-100/60 mt-1">
              PDF / PPTX / DOCX / TXT
            </div>
          </Link>
        </div>
      </main>
    </>
  );
}
