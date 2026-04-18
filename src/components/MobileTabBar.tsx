'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Library, Upload, Settings, type LucideIcon } from 'lucide-react';

type Item = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (p: string) => boolean;
};

const ITEMS: Item[] = [
  {
    href: '/dashboard',
    label: 'Learn',
    icon: BookOpen,
    match: (p) => p === '/dashboard' || p.startsWith('/lesson'),
  },
  { href: '/library', label: 'Library', icon: Library, match: (p) => p.startsWith('/library') },
  { href: '/upload', label: 'Upload', icon: Upload, match: (p) => p.startsWith('/upload') },
  { href: '/settings', label: 'Settings', icon: Settings, match: (p) => p.startsWith('/settings') },
];

export function MobileTabBar() {
  const pathname = usePathname() ?? '';
  // Always render — header + bottom nav are persistent across every screen.

  return (
    <nav
      aria-label="ナビゲーション"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 glass-nav-light"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <ul className="grid grid-cols-4 max-w-[480px] mx-auto">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 ${
                  active ? 'text-[var(--accent)]' : 'text-apple-fg-2'
                }`}
              >
                <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
