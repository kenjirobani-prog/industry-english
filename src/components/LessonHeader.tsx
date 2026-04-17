'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type Props = {
  sceneName: string;
  step: number;
  totalSteps: number;
};

export function LessonHeader({ sceneName, step, totalSteps }: Props) {
  return (
    <header className="sticky top-0 z-30 glass-nav-light">
      <div className="max-w-[980px] mx-auto px-5 sm:px-6 h-12 grid grid-cols-3 items-center gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-[13px] text-apple-fg hover:opacity-70 transition-opacity"
        >
          <ArrowLeft size={16} strokeWidth={1.6} aria-hidden="true" />
          <span>Learn</span>
        </Link>
        <div className="text-center text-[13px] font-medium text-apple-fg truncate">
          {sceneName}
        </div>
        <div className="text-right text-[12px] text-apple-fg-2">
          Step {step} of {totalSteps}
        </div>
      </div>
    </header>
  );
}
