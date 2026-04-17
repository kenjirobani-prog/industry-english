'use client';

import { useEffect, useMemo, useState } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { KeywordCard } from '@/components/KeywordCard';
import { PhraseCard } from '@/components/PhraseCard';
import {
  getIndustries,
  getKeywords,
  getPassages,
  getPhrases,
  getScenes,
} from '@/lib/data';
import { getBookmarks, getPreferences, getUserKeywords } from '@/lib/storage';
import type { Keyword, UserKeyword } from '@/types';

type TypeFilter = 'keyword' | 'phrase' | 'passage';

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
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('keyword');
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [userOnly, setUserOnly] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [userKeywords, setUserKeywords] = useState<UserKeyword[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [openPhraseId, setOpenPhraseId] = useState<string | null>(null);
  const [openPassageId, setOpenPassageId] = useState<string | null>(null);
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

  const phrases = useMemo(() => {
    let list = getPhrases();
    if (industryFilter !== 'all') {
      list = list.filter((p) => p.industryId === industryFilter);
    }
    if (sceneFilter !== 'all') {
      list = list.filter((p) => p.sceneIds.includes(sceneFilter));
    }
    return list;
  }, [industryFilter, sceneFilter]);

  const passages = useMemo(() => {
    let list = getPassages();
    if (industryFilter !== 'all') {
      list = list.filter((p) => p.industryId === industryFilter);
    }
    if (sceneFilter !== 'all') {
      list = list.filter((p) => p.sceneIds.includes(sceneFilter));
    }
    return list;
  }, [industryFilter, sceneFilter]);

  const totalCount =
    typeFilter === 'keyword'
      ? keywords.length
      : typeFilter === 'phrase'
        ? phrases.length
        : passages.length;

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
              {totalCount} 件
              {typeFilter === 'keyword'
                ? 'のキーワード'
                : typeFilter === 'phrase'
                  ? 'のフレーズ'
                  : 'のパッセージ'}
            </p>
          </div>
        </section>

        <section className="bg-apple-gray border-y border-apple-line">
          <div className="section-wide px-5 sm:px-6 py-6 space-y-4">
            <div>
              <div className="t-caption text-apple-fg-2 mb-2">タイプ</div>
              <div className="flex flex-wrap items-center gap-2">
                <Chip
                  active={typeFilter === 'keyword'}
                  onClick={() => setTypeFilter('keyword')}
                >
                  キーワード
                </Chip>
                <Chip
                  active={typeFilter === 'phrase'}
                  onClick={() => setTypeFilter('phrase')}
                >
                  フレーズ
                </Chip>
                <Chip
                  active={typeFilter === 'passage'}
                  onClick={() => setTypeFilter('passage')}
                >
                  パッセージ
                </Chip>
              </div>
            </div>

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

            {typeFilter === 'keyword' && (
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
            )}
          </div>
        </section>

        <section className="section bg-apple-white">
          <div className="section-wide">
            {totalCount === 0 ? (
              <p className="text-center text-apple-fg-2 t-body py-16">
                該当する項目がありません
              </p>
            ) : typeFilter === 'phrase' ? (
              <ul className="grid sm:grid-cols-2 gap-3">
                {phrases.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setOpenPhraseId(p.id)}
                      className="w-full text-left rounded-xl border border-apple-line bg-apple-white hover:bg-apple-gray transition-colors p-5"
                    >
                      <div className="t-body font-medium text-apple-fg leading-snug">
                        {p.phrase}
                      </div>
                      <div className="t-small text-apple-fg-2 mt-2">
                        {p.meaning_ja}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {p.sceneIds.map((sid) => {
                          const sc = scenes.find((s) => s.id === sid);
                          if (!sc) return null;
                          return (
                            <span key={sid} className="t-caption text-apple-fg-2">
                              {sc.emoji} {sc.name_ja}
                            </span>
                          );
                        })}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : typeFilter === 'passage' ? (
              <ul className="space-y-3">
                {passages.map((p) => {
                  const sc = scenes.find((s) => s.id === p.scene);
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => setOpenPassageId(p.id)}
                        className="w-full text-left rounded-xl border border-apple-line bg-apple-white hover:bg-apple-gray transition-colors p-5"
                      >
                        <div className="flex items-center justify-between mb-2 gap-3">
                          <div className="t-eyebrow text-apple-fg-2">
                            {sc ? `${sc.emoji} ${sc.name_ja}` : p.scene}
                          </div>
                          <span className="t-caption text-apple-fg-2">
                            難易度: {p.shadowing_difficulty}
                          </span>
                        </div>
                        <p className="t-body text-apple-fg leading-snug line-clamp-2">
                          {p.text}
                        </p>
                        <div className="t-caption text-apple-fg-2 mt-2 truncate">
                          出典: {p.source}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
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

        {openPhraseId && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 overflow-y-auto fade-in"
            onClick={() => setOpenPhraseId(null)}
          >
            <div
              className="w-full max-w-[640px]"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const ph = phrases.find((p) => p.id === openPhraseId);
                if (!ph) return null;
                return (
                  <div className="space-y-3">
                    <PhraseCard phrase={ph} />
                    <button
                      type="button"
                      onClick={() => setOpenPhraseId(null)}
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

        {openPassageId && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 overflow-y-auto fade-in"
            onClick={() => setOpenPassageId(null)}
          >
            <div
              className="w-full max-w-[640px]"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const ps = passages.find((p) => p.id === openPassageId);
                if (!ps) return null;
                return (
                  <div className="space-y-3">
                    <article className="rounded-[18px] bg-apple-black text-apple-fg-on-dark px-7 sm:px-10 py-10 fade-up">
                      <div className="t-eyebrow text-[var(--accent-on-dark)] mb-3">
                        Passage · {ps.shadowing_difficulty}
                      </div>
                      <p className="t-body-lg text-white leading-relaxed mb-5">
                        {ps.text}
                      </p>
                      <p className="t-small text-apple-fg-on-dark-2 leading-relaxed mb-4">
                        {ps.translation_ja}
                      </p>
                      <p className="t-caption text-apple-fg-on-dark-2 mb-4">
                        出典: {ps.source}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {ps.key_terms.map((t) => (
                          <span
                            key={t}
                            className="t-caption text-apple-fg-on-dark-2 border border-white/15 rounded-full px-2 py-0.5"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </article>
                    <button
                      type="button"
                      onClick={() => setOpenPassageId(null)}
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
