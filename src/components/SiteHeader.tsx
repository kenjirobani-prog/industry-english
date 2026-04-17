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
          </nav>
        )}
      </div>
    </header>
  );
}
