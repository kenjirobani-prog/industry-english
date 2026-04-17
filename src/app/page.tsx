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
      {/* Hero */}
      <section className="section bg-apple-white">
        <div className="section-narrow text-center fade-in">
          <p className="t-eyebrow text-apple-fg-2 mb-4">Industry English</p>
          <h1 className="t-headline text-apple-fg">
            業界の英語を、
            <br />
            あなたの言葉に。
          </h1>
          <p className="t-body-lg text-apple-fg-2 mt-6 max-w-[560px] mx-auto">
            教科書英語ではなく、業界固有の語彙・言い回し・ニュアンスを
            レッスン形式で学ぶ。
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="section bg-apple-gray">
        <div className="section-wide">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-12">
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={`h-1 rounded-full transition-all duration-300 ${
                  step === n
                    ? 'w-10 bg-apple-fg'
                    : n < step
                      ? 'w-6 bg-apple-fg-2'
                      : 'w-6 bg-apple-line'
                }`}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="fade-up">
              <h2 className="t-section-title text-apple-fg text-center mb-10">
                業界を選ぶ
              </h2>
              <div className="grid sm:grid-cols-2 gap-3 max-w-[692px] mx-auto">
                {industries.map((ind) => {
                  const selected = industryId === ind.id;
                  return (
                    <button
                      key={ind.id}
                      type="button"
                      disabled={!ind.available}
                      onClick={() => setIndustryId(ind.id)}
                      className={`text-left rounded-xl border p-6 transition-colors relative ${
                        selected
                          ? 'border-[var(--accent)] bg-accent-soft'
                          : 'border-apple-line bg-apple-white hover:bg-apple-gray-2'
                      } ${!ind.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="t-subtitle text-apple-fg mb-1">
                        {ind.name_ja}
                      </div>
                      <div className="t-small text-apple-fg-2">
                        {ind.description_ja}
                      </div>
                      {!ind.available && (
                        <span className="absolute top-3 right-4 t-eyebrow text-apple-fg-2">
                          Coming Soon
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-12 flex justify-center">
                <button
                  type="button"
                  disabled={!industryId}
                  onClick={() => setStep(2)}
                  className="btn btn-primary"
                >
                  続ける
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="fade-up">
              <h2 className="t-section-title text-apple-fg text-center mb-2">
                シーンを選ぶ
              </h2>
              <p className="t-small text-apple-fg-2 text-center mb-10">
                複数選択できます
              </p>
              <div className="grid sm:grid-cols-2 gap-3 max-w-[692px] mx-auto">
                {scenes.map((s) => {
                  const selected = sceneIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleScene(s.id)}
                      className={`text-left rounded-xl border p-6 transition-colors cursor-pointer ${
                        selected
                          ? 'border-[var(--accent)] bg-accent-soft'
                          : 'border-apple-line bg-apple-white hover:bg-apple-gray-2'
                      }`}
                    >
                      <div className="text-2xl mb-2" aria-hidden>
                        {s.emoji}
                      </div>
                      <div className="t-subtitle text-apple-fg mb-1">
                        {s.name_ja}
                      </div>
                      <div className="t-small text-apple-fg-2 leading-snug">
                        {s.description_ja}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-12 flex items-center justify-between max-w-[692px] mx-auto">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="link-chev"
                >
                  戻る
                </button>
                <button
                  type="button"
                  disabled={sceneIds.length === 0}
                  onClick={() => setStep(3)}
                  className="btn btn-primary"
                >
                  続ける
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="fade-up max-w-[560px] mx-auto">
              <h2 className="t-section-title text-apple-fg text-center mb-10">
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
              <div className="mt-12 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="link-chev"
                >
                  戻る
                </button>
                <button
                  type="button"
                  onClick={finish}
                  className="btn btn-primary"
                >
                  はじめる
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="bg-apple-white py-8 text-center t-caption text-apple-fg-2">
        MVP · F&amp;B + Digital Marketing Edition
      </footer>
    </main>
  );
}
