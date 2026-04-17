'use client';

import { useEffect, useMemo, useState } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { KeywordCard } from '@/components/KeywordCard';
import { getKeywords, getScenes } from '@/lib/data';
import { getBookmarks, getUserKeywords } from '@/lib/storage';
import type { Keyword, UserKeyword } from '@/types';

export default function LibraryPage() {
  const [sceneFilter, setSceneFilter] = useState<string>('all');
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [userOnly, setUserOnly] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [userKeywords, setUserKeywords] = useState<UserKeyword[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setBookmarks(getBookmarks());
    setUserKeywords(getUserKeywords());
  }, [openId]);

  const scenes = useMemo(() => getScenes('fnb'), []);
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
  }, [allKeywords, sceneFilter, bookmarksOnly, userOnly, bookmarks, userIdSet]);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-6">
            <div className="text-[10px] font-display uppercase tracking-widest text-gold">
              Library
            </div>
            <h1 className="font-display text-2xl text-amber-200">キーワード一覧</h1>
            <p className="text-xs text-amber-100/60 mt-1">
              {keywords.length} 件のキーワード
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => setSceneFilter('all')}
              className={`text-xs rounded-full px-3 py-1.5 border transition ${
                sceneFilter === 'all'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-100'
                  : 'bg-surface-1 border-border-soft text-amber-100/60 hover:border-amber-500/40'
              }`}
            >
              すべて
            </button>
            {scenes.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSceneFilter(s.id)}
                className={`text-xs rounded-full px-3 py-1.5 border transition ${
                  sceneFilter === s.id
                    ? 'bg-amber-500/20 border-amber-400 text-amber-100'
                    : 'bg-surface-1 border-border-soft text-amber-100/60 hover:border-amber-500/40'
                }`}
              >
                {s.emoji} {s.name_ja}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setUserOnly((v) => !v)}
              className={`text-xs rounded-full px-3 py-1.5 border transition ml-auto ${
                userOnly
                  ? 'bg-amber-500/20 border-amber-400 text-amber-100'
                  : 'bg-surface-1 border-border-soft text-amber-100/60 hover:border-amber-500/40'
              }`}
            >
              📥 抽出済みのみ
            </button>
            <button
              type="button"
              onClick={() => setBookmarksOnly((v) => !v)}
              className={`text-xs rounded-full px-3 py-1.5 border transition ${
                bookmarksOnly
                  ? 'bg-gold/20 border-gold text-amber-100'
                  : 'bg-surface-1 border-border-soft text-amber-100/60 hover:border-gold/40'
              }`}
            >
              ★ ブックマークのみ
            </button>
          </div>

          {/* Grid */}
          {keywords.length === 0 ? (
            <p className="text-center text-amber-100/50 py-16">
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
                      className="w-full text-left rounded-2xl border border-border-soft bg-surface-1 hover:border-amber-500/50 hover:bg-surface-2 transition p-4"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="font-display text-base text-amber-100 leading-tight">
                          {kw.term}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isUserExtracted && (
                            <span
                              title="あなたが抽出したキーワード"
                              className="text-[9px] tracking-widest text-emerald-300 border border-emerald-500/40 rounded-full px-1.5 py-0.5"
                            >
                              抽出
                            </span>
                          )}
                          {isBookmarked && (
                            <span className="text-gold text-sm">★</span>
                          )}
                        </div>
                      </div>
                      <div className="text-[11px] text-amber-100/60 mb-2">
                        {kw.meaning_ja}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {kw.sceneIds.map((sid) => {
                          const sc = scenes.find((s) => s.id === sid);
                          if (!sc) return null;
                          return (
                            <span
                              key={sid}
                              className="text-[9px] uppercase tracking-wider text-amber-200/60 bg-surface-3 rounded-full px-2 py-0.5"
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

        {/* Modal: keyword detail */}
        {openId && (
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 overflow-y-auto"
            onClick={() => setOpenId(null)}
          >
            <div
              className="w-full max-w-xl"
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
                      className="w-full rounded-full bg-surface-2 border border-border-soft text-amber-100 py-3 font-display tracking-wider uppercase text-sm hover:bg-surface-3 transition"
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
