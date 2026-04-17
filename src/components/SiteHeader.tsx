import Link from 'next/link';

type Props = {
  showNav?: boolean;
};

export function SiteHeader({ showNav = true }: Props) {
  return (
    <header className="sticky top-0 z-30 glass-nav-light">
      <div className="max-w-[980px] mx-auto px-5 sm:px-6 h-12 flex items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="text-[14px] tracking-tight font-medium text-apple-fg hover:opacity-80 transition-opacity"
        >
          Industry English
        </Link>
        {showNav && (
          <nav className="flex items-center gap-1 sm:gap-4 text-[12px] text-apple-fg">
            <Link
              href="/dashboard"
              className="px-2 py-1 hover:opacity-70 transition-opacity"
            >
              Home
            </Link>
            <Link
              href="/library"
              className="px-2 py-1 hover:opacity-70 transition-opacity"
            >
              Library
            </Link>
            <Link
              href="/upload"
              className="px-2 py-1 hover:opacity-70 transition-opacity"
            >
              Upload
            </Link>
            <Link
              href="/settings"
              aria-label="設定"
              title="設定"
              className="ml-1 inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-apple-gray transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
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
