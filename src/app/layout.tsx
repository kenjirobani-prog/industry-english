import type { Metadata } from 'next';
import { Cinzel, Outfit } from 'next/font/google';
import './globals.css';

const display = Cinzel({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const body = Outfit({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Industry English — 業界英語をあなたの言葉に',
  description:
    '業界固有の語彙・言い回し・ニュアンスを学ぶ、パーソナライズ型ビジネス英語アプリ。',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ja"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
