'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getIndustries, getScenes } from '@/lib/data';
import { getPreferences, setPreferences } from '@/lib/storage';
import type { EnglishLevel } from '@/types';

const LEVELS: { value: EnglishLevel; label: string; sub: string }[] = [
  { value: 'beginner', label: '初級', sub: 'TOEIC ~ 600' },
  { value: 'intermediate', label: '中級', sub: 'TOEIC 600 ~ 800' },
  { value: 'advanced', label: '上級', sub: 'TOEIC 800+' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [industryId, setIndustryId] = useState<string | null>(null);
  const [sceneIds, setSceneIds] = useState<string[]>([]);
  const [level, setLevel] = useState<EnglishLevel>('intermediate');

  useEffect(() => {
    if (getPreferences()) router.replace('/dashboard');
  }, [router]);

  const industries = getIndustries();
  const scenes = industryId ? getScenes(industryId) : [];

  const toggleScene = (id: string) =>
    setSceneIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  const finish = () => {
    if (!industryId || sceneIds.length === 0) return;
    setPreferences({
      industryId,
      sceneIds,
      level,
      onboardedAt: new Date().toISOString(),
    });
    router.push('/dashboard');
  };

  return (
    <main className="flex-1 flex flex-col">
      <div className="max-w-2xl mx-auto px-5 py-12 w-full flex-1 flex flex-col">
        <div className="text-center mb-10">
          <div className="font-display tracking-[0.4em] text-xs text-gold mb-3 uppercase">
            Industry English
          </div>
          <h1 className="font-display text-3xl sm:text-5xl text-amber-100 leading-tight">
            業界の英語を、<br />
            <span className="text-amber-400">あなたの言葉に。</span>
          </h1>
          <p className="text-sm text-amber-100/70 mt-4">
            教科書英語ではなく、業界固有の語彙・言い回し・ニュアンスをレッスン形式で学ぶ。
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-1.5 rounded-full transition-all ${
                step === n
                  ? 'w-10 bg-amber-400'
                  : n < step
                    ? 'w-6 bg-gold'
                    : 'w-6 bg-surface-3'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <section>
            <h2 className="font-display text-xl text-amber-200 mb-5 tracking-wider uppercase">
              Step 1 — 業界を選ぶ
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {industries.map((ind) => {
                const selected = industryId === ind.id;
                return (
                  <button
                    key={ind.id}
                    type="button"
                    disabled={!ind.available}
                    onClick={() => setIndustryId(ind.id)}
                    className={`text-left rounded-2xl border p-4 transition relative ${
                      selected
                        ? 'border-amber-400 bg-amber-500/10'
                        : 'border-border-soft bg-surface-1 hover:border-amber-500/40'
                    } ${!ind.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="font-display text-lg text-amber-100 mb-1">
                      {ind.name_ja}
                    </div>
                    <div className="text-xs text-amber-100/60">
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
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                disabled={!industryId}
                onClick={() => setStep(2)}
                className="rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-black font-semibold px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed font-display tracking-wider uppercase text-sm"
              >
                次へ →
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <h2 className="font-display text-xl text-amber-200 mb-5 tracking-wider uppercase">
              Step 2 — シーンを選ぶ（複数可）
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
            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-amber-100/60 hover:text-amber-200 font-display tracking-wider uppercase"
              >
                ← 戻る
              </button>
              <button
                type="button"
                disabled={sceneIds.length === 0}
                onClick={() => setStep(3)}
                className="rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-black font-semibold px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed font-display tracking-wider uppercase text-sm"
              >
                次へ →
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <h2 className="font-display text-xl text-amber-200 mb-5 tracking-wider uppercase">
              Step 3 — 英語レベル
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
            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-sm text-amber-100/60 hover:text-amber-200 font-display tracking-wider uppercase"
              >
                ← 戻る
              </button>
              <button
                type="button"
                onClick={finish}
                className="rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-black font-semibold px-6 py-3 font-display tracking-wider uppercase text-sm hover:brightness-110 transition"
              >
                はじめる ▸
              </button>
            </div>
          </section>
        )}
      </div>

      <footer className="text-center text-[10px] text-amber-100/30 py-4 font-display tracking-widest">
        MVP · F&amp;B EDITION
      </footer>
    </main>
  );
}
