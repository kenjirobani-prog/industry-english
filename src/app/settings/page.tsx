'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { getIndustries, getScenes } from '@/lib/data';
import { getPreferences, setPreferences } from '@/lib/storage';
import type { EnglishLevel } from '@/types';

const LEVELS: { value: EnglishLevel; label: string; sub: string }[] = [
  { value: 'beginner', label: '初級', sub: 'TOEIC ~ 600' },
  { value: 'intermediate', label: '中級', sub: 'TOEIC 600 ~ 800' },
  { value: 'advanced', label: '上級', sub: 'TOEIC 800+' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [industryId, setIndustryId] = useState<string | null>(null);
  const [sceneIds, setSceneIds] = useState<string[]>([]);
  const [level, setLevel] = useState<EnglishLevel>('intermediate');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const prefs = getPreferences();
    if (!prefs) {
      router.replace('/');
      return;
    }
    setIndustryId(prefs.industryId);
    setSceneIds(prefs.sceneIds);
    setLevel(prefs.level);
    setHydrated(true);
  }, [router]);

  const industries = getIndustries();
  const scenes = industryId ? getScenes(industryId) : [];

  const toggleScene = (id: string) =>
    setSceneIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  const handleIndustryChange = (newId: string) => {
    if (newId === industryId) return;
    setIndustryId(newId);
    setSceneIds([]);
  };

  const handleSave = () => {
    if (!industryId || sceneIds.length === 0) return;
    setPreferences({
      industryId,
      sceneIds,
      level,
      onboardedAt: new Date().toISOString(),
    });
    setSaved(true);
    setTimeout(() => router.push('/dashboard'), 700);
  };

  if (!hydrated) {
    return (
      <main className="flex-1 flex items-center justify-center text-apple-fg-2 t-small">
        Loading…
      </main>
    );
  }

  const canSave = Boolean(industryId) && sceneIds.length > 0;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="section bg-apple-white pb-10">
          <div className="section-narrow fade-in">
            <p className="t-eyebrow text-apple-fg-2 mb-3">Settings</p>
            <h1 className="t-headline text-apple-fg">学習設定</h1>
            <p className="t-body text-apple-fg-2 mt-3">
              業界・シーン・英語レベルを変更できます。
            </p>
          </div>
        </section>

        <section className="section bg-apple-gray pt-12">
          <div className="section-narrow space-y-12">
            {/* Industry */}
            <div>
              <h2 className="t-subtitle text-apple-fg mb-5">業界</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {industries.map((ind) => {
                  const selected = industryId === ind.id;
                  return (
                    <button
                      key={ind.id}
                      type="button"
                      disabled={!ind.available}
                      onClick={() => handleIndustryChange(ind.id)}
                      className={`text-left rounded-xl border p-5 transition-colors relative ${
                        selected
                          ? 'border-[var(--accent)] bg-accent-soft'
                          : 'border-apple-line bg-apple-white hover:bg-apple-gray-2'
                      } ${!ind.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="t-body text-apple-fg font-medium mb-1">
                        {ind.name_ja}
                      </div>
                      <div className="t-small text-apple-fg-2">
                        {ind.description_ja}
                      </div>
                      {!ind.available && (
                        <span className="absolute top-3 right-4 t-caption text-apple-fg-2">
                          Coming Soon
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scenes */}
            <div>
              <h2 className="t-subtitle text-apple-fg mb-5">
                シーン<span className="t-small text-apple-fg-2 ml-2">複数可</span>
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {scenes.map((s) => {
                  const selected = sceneIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleScene(s.id)}
                      className={`text-left rounded-xl border p-5 transition-colors cursor-pointer ${
                        selected
                          ? 'border-[var(--accent)] bg-accent-soft'
                          : 'border-apple-line bg-apple-white hover:bg-apple-gray-2'
                      }`}
                    >
                      <div className="text-2xl mb-2" aria-hidden>
                        {s.emoji}
                      </div>
                      <div className="t-body text-apple-fg font-medium mb-1">
                        {s.name_ja}
                      </div>
                      <div className="t-small text-apple-fg-2 leading-snug">
                        {s.description_ja}
                      </div>
                    </button>
                  );
                })}
              </div>
              {sceneIds.length === 0 && (
                <p className="t-small text-red-700 mt-3">
                  少なくとも1つのシーンを選んでください。
                </p>
              )}
            </div>

            {/* Level */}
            <div>
              <h2 className="t-subtitle text-apple-fg mb-5">英語レベル</h2>
              <div className="space-y-2">
                {LEVELS.map((l) => {
                  const selected = level === l.value;
                  return (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => setLevel(l.value)}
                      className={`w-full flex items-center justify-between rounded-xl border p-5 transition-colors cursor-pointer ${
                        selected
                          ? 'border-[var(--accent)] bg-accent-soft'
                          : 'border-apple-line bg-apple-white hover:bg-apple-gray-2'
                      }`}
                    >
                      <div className="text-left">
                        <div className="t-body text-apple-fg font-medium">
                          {l.label}
                        </div>
                        <div className="t-small text-apple-fg-2">{l.sub}</div>
                      </div>
                      {selected && (
                        <span className="text-[var(--accent)]">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                disabled={!canSave || saved}
                onClick={handleSave}
                className="btn btn-primary flex-1"
              >
                {saved ? '✓ 保存しました' : '変更を保存'}
              </button>
              <Link href="/dashboard" className="btn btn-ghost text-center">
                キャンセル
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
