import Link from 'next/link';

type Props = {
  showNav?: boolean;
};

export function SiteHeader({ showNav = true }: Props) {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-background/70 border-b border-border-soft">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <span className="font-display text-xl text-amber-200 group-hover:text-gold transition tracking-widest">
            INDUSTRY · ENGLISH
          </span>
        </Link>
        {showNav && (
          <nav className="flex items-center gap-1 sm:gap-3 text-xs">
            <Link
              href="/dashboard"
              className="px-2 py-1 rounded-full text-amber-100/70 hover:text-amber-200 hover:bg-surface-2 transition font-display tracking-wider uppercase"
            >
              Home
            </Link>
            <Link
              href="/library"
              className="px-2 py-1 rounded-full text-amber-100/70 hover:text-amber-200 hover:bg-surface-2 transition font-display tracking-wider uppercase"
            >
              Library
            </Link>
            <Link
              href="/upload"
              className="px-2 py-1 rounded-full text-amber-100/70 hover:text-amber-200 hover:bg-surface-2 transition font-display tracking-wider uppercase"
            >
              Upload
            </Link>
            <Link
              href="/settings"
              aria-label="設定"
              title="設定"
              className="ml-1 inline-flex items-center justify-center w-8 h-8 rounded-full text-amber-100/70 hover:text-amber-200 hover:bg-surface-2 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
              </svg>
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
