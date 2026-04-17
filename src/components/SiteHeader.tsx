'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS: { href: string; label: string; match: (p: string) => boolean }[] = [
  { href: '/dashboard', label: 'Learn', match: (p) => p === '/dashboard' || p.startsWith('/lesson') },
  { href: '/library', label: 'Library', match: (p) => p.startsWith('/library') },
  { href: '/upload', label: 'Upload', match: (p) => p.startsWith('/upload') },
  { href: '/settings', label: 'Settings', match: (p) => p.startsWith('/settings') },
];

type Props = {
  /** Hide the center nav (used on mobile where the bottom tab bar is shown). */
  centerNav?: boolean;
};

export function SiteHeader({ centerNav = true }: Props) {
  const pathname = usePathname() ?? '';

  return (
    <header className="sticky top-0 z-30 glass-nav-light">
      <div className="max-w-[980px] mx-auto px-5 sm:px-6 h-12 flex items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="text-[14px] tracking-tight font-medium text-apple-fg hover:opacity-80 transition-opacity"
        >
          Industry English
        </Link>
        {centerNav && (
          <nav
            aria-label="主要ナビゲーション"
            className="hidden md:flex items-center gap-7 text-[12px] text-apple-fg"
          >
            {NAV_ITEMS.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className="relative py-3 hover:opacity-70 transition-opacity"
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 right-0 -bottom-px h-[1.5px] bg-apple-fg transition-opacity ${
                      active ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>
        )}
        <span className="w-[110px] hidden md:block" aria-hidden="true" />
      </div>
    </header>
  );
}
