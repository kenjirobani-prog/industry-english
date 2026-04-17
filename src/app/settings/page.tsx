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
    // Reset scene selection when industry changes — old scene IDs may not apply.
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
      <main className="flex-1 flex items-center justify-center text-amber-200/60 font-display tracking-widest text-sm">
        Loading…
      </main>
    );
  }

  const canSave = Boolean(industryId) && sceneIds.length > 0;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <div className="text-[10px] font-display uppercase tracking-widest text-gold">
              Settings
            </div>
            <h1 className="font-display text-2xl text-amber-200">学習設定</h1>
            <p className="text-xs text-amber-100/60 mt-1">
              業界・シーン・英語レベルを変更できます。
            </p>
          </div>

          {/* Industry */}
          <section className="mb-8">
            <h2 className="font-display text-sm text-amber-200/80 mb-3 tracking-wider uppercase">
              業界
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {industries.map((ind) => {
                const selected = industryId === ind.id;
                return (
                  <button
                    key={ind.id}
                    type="button"
                    disabled={!ind.available}
                    onClick={() => handleIndustryChange(ind.id)}
                    className={`text-left rounded-2xl border p-4 transition relative ${
                      selected
                        ? 'border-amber-400 bg-amber-500/10'
                        : 'border-border-soft bg-surface-1 hover:border-amber-500/40'
                    } ${!ind.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="font-display text-base text-amber-100 mb-1">
                      {ind.name_ja}
                    </div>
                    <div className="text-[11px] text-amber-100/60">
                      {ind.description_ja}
                    </div>
                    {!ind.available && (
                      <span className="absolute top-2 right-3 text-[10px] tracking-widest text-amber-200/60 font-display">
                        COMING SOON
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Scenes */}
          <section className="mb-8">
            <h2 className="font-display text-sm text-amber-200/80 mb-3 tracking-wider uppercase">
              シーン（複数可）
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {scenes.map((s) => {
                const selected = sceneIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleScene(s.id)}
                    className={`text-left rounded-2xl border p-4 transition cursor-pointer ${
                      selected
                        ? 'border-amber-400 bg-amber-500/10'
                        : 'border-border-soft bg-surface-1 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="text-2xl mb-2">{s.emoji}</div>
                    <div className="font-display text-base text-amber-100 mb-1">
                      {s.name_ja}
                    </div>
                    <div className="text-[11px] text-amber-100/60 leading-relaxed">
                      {s.description_ja}
                    </div>
                  </button>
                );
              })}
            </div>
            {sceneIds.length === 0 && (
              <p className="text-[11px] text-amber-300/70 mt-3">
                少なくとも1つのシーンを選んでください。
              </p>
            )}
          </section>

          {/* Level */}
          <section className="mb-10">
            <h2 className="font-display text-sm text-amber-200/80 mb-3 tracking-wider uppercase">
              英語レベル
            </h2>
            <div className="space-y-2">
              {LEVELS.map((l) => {
                const selected = level === l.value;
                return (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLevel(l.value)}
                    className={`w-full flex items-center justify-between rounded-2xl border p-4 transition ${
                      selected
                        ? 'border-amber-400 bg-amber-500/10'
                        : 'border-border-soft bg-surface-1 hover:border-amber-500/40'
                    }`}
                  >
                    <div>
                      <div className="font-display text-base text-amber-100">
                        {l.label}
                      </div>
                      <div className="text-[11px] text-amber-100/60">
                        {l.sub}
                      </div>
                    </div>
                    {selected && <span className="text-amber-400">✓</span>}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={!canSave || saved}
              onClick={handleSave}
              className="flex-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-black font-semibold py-3 disabled:opacity-40 disabled:cursor-not-allowed font-display tracking-wider uppercase text-sm hover:brightness-110 transition"
            >
              {saved ? '✓ 保存しました' : '変更を保存'}
            </button>
            <Link
              href="/dashboard"
              className="rounded-full bg-surface-2 border border-border-soft text-amber-100 px-6 py-3 font-display tracking-wider uppercase text-sm hover:bg-surface-3 transition text-center"
            >
              キャンセル
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
