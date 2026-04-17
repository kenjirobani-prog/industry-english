'use client';

import { useEffect, useMemo, useState } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { KeywordCard } from '@/components/KeywordCard';
import { getIndustries, getKeywords, getScenes } from '@/lib/data';
import { getBookmarks, getPreferences, getUserKeywords } from '@/lib/storage';
import type { Keyword, UserKeyword } from '@/types';

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`t-small rounded-full border px-4 py-1.5 transition-colors ${
        active
          ? 'border-apple-fg bg-apple-fg text-white'
          : 'border-apple-line bg-apple-white text-apple-fg hover:bg-apple-gray'
      }`}
    >
      {children}
    </button>
  );
}

export default function LibraryPage() {
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [sceneFilter, setSceneFilter] = useState<string>('all');
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [userOnly, setUserOnly] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [userKeywords, setUserKeywords] = useState<UserKeyword[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setBookmarks(getBookmarks());
    setUserKeywords(getUserKeywords());
    if (!hydrated) {
      const prefs = getPreferences();
      if (prefs?.industryId) setIndustryFilter(prefs.industryId);
      setHydrated(true);
    }
  }, [openId, hydrated]);

  const availableIndustries = useMemo(
    () => getIndustries().filter((i) => i.available),
    [],
  );
  const scenes = useMemo(() => {
    if (industryFilter === 'all') return getScenes();
    return getScenes(industryFilter);
  }, [industryFilter]);
  const userIdSet = useMemo(
    () => new Set(userKeywords.map((k) => k.id)),
    [userKeywords],
  );
  const allKeywords = useMemo<Keyword[]>(
    () => [...getKeywords(), ...userKeywords],
    [userKeywords],
  );
  const keywords = useMemo(() => {
    let list = allKeywords;
    if (industryFilter !== 'all') {
      list = list.filter((k) => k.industryId === industryFilter);
    }
    if (sceneFilter !== 'all') {
      list = list.filter((k) => k.sceneIds.includes(sceneFilter));
    }
    if (bookmarksOnly) {
      const set = new Set(bookmarks);
      list = list.filter((k) => set.has(k.id));
    }
    if (userOnly) {
      list = list.filter((k) => userIdSet.has(k.id));
    }
    return list;
  }, [
    allKeywords,
    industryFilter,
    sceneFilter,
    bookmarksOnly,
    userOnly,
    bookmarks,
    userIdSet,
  ]);

  useEffect(() => {
    if (sceneFilter === 'all') return;
    const ok = scenes.some((s) => s.id === sceneFilter);
    if (!ok) setSceneFilter('all');
  }, [scenes, sceneFilter]);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="section bg-apple-white pb-10">
          <div className="section-wide fade-in">
            <p className="t-eyebrow text-apple-fg-2 mb-3">Library</p>
            <h1 className="t-headline text-apple-fg">キーワード一覧</h1>
            <p className="t-body text-apple-fg-2 mt-3">
              {keywords.length} 件のキーワード
            </p>
          </div>
        </section>

        <section className="bg-apple-gray border-y border-apple-line">
          <div className="section-wide px-5 sm:px-6 py-6 space-y-4">
            <div>
              <div className="t-caption text-apple-fg-2 mb-2">業界</div>
              <div className="flex flex-wrap items-center gap-2">
                <Chip
                  active={industryFilter === 'all'}
                  onClick={() => setIndustryFilter('all')}
                >
                  全業界
                </Chip>
                {availableIndustries.map((ind) => (
                  <Chip
                    key={ind.id}
                    active={industryFilter === ind.id}
                    onClick={() => setIndustryFilter(ind.id)}
                  >
                    {ind.name_ja}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <div className="t-caption text-apple-fg-2 mb-2">シーン</div>
              <div className="flex flex-wrap items-center gap-2">
                <Chip
                  active={sceneFilter === 'all'}
                  onClick={() => setSceneFilter('all')}
                >
                  すべて
                </Chip>
                {scenes.map((s) => (
                  <Chip
                    key={s.id}
                    active={sceneFilter === s.id}
                    onClick={() => setSceneFilter(s.id)}
                  >
                    {s.emoji} {s.name_ja}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Chip
                active={userOnly}
                onClick={() => setUserOnly((v) => !v)}
              >
                抽出済みのみ
              </Chip>
              <Chip
                active={bookmarksOnly}
                onClick={() => setBookmarksOnly((v) => !v)}
              >
                ★ ブックマークのみ
              </Chip>
            </div>
          </div>
        </section>

        <section className="section bg-apple-white">
          <div className="section-wide">
            {keywords.length === 0 ? (
              <p className="text-center text-apple-fg-2 t-body py-16">
                該当するキーワードがありません
              </p>
            ) : (
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {keywords.map((kw) => {
                  const isBookmarked = bookmarks.includes(kw.id);
                  const isUserExtracted = userIdSet.has(kw.id);
                  return (
                    <li key={kw.id}>
                      <button
                        type="button"
                        onClick={() => setOpenId(kw.id)}
                        className="w-full text-left rounded-xl border border-apple-line bg-apple-white hover:bg-apple-gray transition-colors p-5"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="t-body font-medium text-apple-fg">
                            {kw.term}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {isUserExtracted && (
                              <span className="t-caption text-apple-fg-2 border border-apple-line rounded-full px-2 py-0.5">
                                抽出
                              </span>
                            )}
                            {isBookmarked && (
                              <span className="text-[var(--accent)] t-small">
                                ★
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="t-small text-apple-fg-2 mb-3">
                          {kw.meaning_ja}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {kw.sceneIds.map((sid) => {
                            const sc = scenes.find((s) => s.id === sid);
                            if (!sc) return null;
                            return (
                              <span
                                key={sid}
                                className="t-caption text-apple-fg-2"
                              >
                                {sc.emoji} {sc.name_ja}
                              </span>
                            );
                          })}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {openId && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 overflow-y-auto fade-in"
            onClick={() => setOpenId(null)}
          >
            <div
              className="w-full max-w-[640px]"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const kw = allKeywords.find((k) => k.id === openId);
                if (!kw) return null;
                return (
                  <div className="space-y-3">
                    <KeywordCard keyword={kw} />
                    <button
                      type="button"
                      onClick={() => setOpenId(null)}
                      className="btn btn-ghost w-full bg-white"
                    >
                      閉じる
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
