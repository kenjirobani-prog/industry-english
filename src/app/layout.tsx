import type { Metadata } from 'next';
import { IndustryThemeProvider } from '@/components/IndustryThemeProvider';
import { MobileTabBar } from '@/components/MobileTabBar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Industry English — 業界英語をあなたの言葉に',
  description:
    '業界固有の語彙・言い回し・ニュアンスを学ぶ、パーソナライズ型ビジネス英語アプリ。',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col bg-apple-white text-apple-fg pb-[64px] md:pb-0">
        <IndustryThemeProvider />
        {children}
        <MobileTabBar />
      </body>
    </html>
  );
}
