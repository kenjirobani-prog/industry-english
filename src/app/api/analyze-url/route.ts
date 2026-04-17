import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { analyzeText, type IndustryProfile } from '@/lib/analyzer';
import { getIndustry, getScenes } from '@/lib/data';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_HTML_BYTES = 5 * 1024 * 1024; // 5MB cap
const REMOVE_SELECTORS = [
  'script',
  'style',
  'noscript',
  'template',
  'iframe',
  'nav',
  'header',
  'footer',
  'aside',
  'form',
  'svg',
  '[aria-hidden="true"]',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
  '.nav',
  '.menu',
  '.sidebar',
  '.header',
  '.footer',
  '.breadcrumb',
  '.cookie',
  '.advert',
];

function resolveIndustry(industryId: unknown): IndustryProfile {
  const id = typeof industryId === 'string' && industryId ? industryId : 'fnb';
  const industry = getIndustry(id) ?? getIndustry('fnb');
  if (!industry) throw new Error('No industry data available');
  const scenes = getScenes(industry.id).map((s) => ({
    id: s.id,
    name_en: s.name_en,
    name_ja: s.name_ja,
  }));
  return {
    id: industry.id,
    name_en: industry.name_en,
    name_ja: industry.name_ja,
    description_ja: industry.description_ja,
    scenes,
  };
}

function cleanUrl(input: unknown): string {
  if (typeof input !== 'string') throw new Error('URL is required');
  const trimmed = input.trim();
  if (!trimmed) throw new Error('URL is required');
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error('Invalid URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http(s) URLs are supported');
  }
  // Block localhost / private ranges (basic SSRF guard).
  const host = url.hostname;
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host.endsWith('.local') ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  ) {
    throw new Error('URL host not allowed');
  }
  return url.toString();
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; IndustryEnglishBot/1.0; +https://industry-english.vercel.app)',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch URL (status ${res.status})`);
    }
    const contentType = res.headers.get('content-type') ?? '';
    if (!/text\/html|application\/xhtml\+xml|text\/plain/i.test(contentType)) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_HTML_BYTES) {
      throw new Error('Fetched content is too large');
    }
    return new TextDecoder('utf-8').decode(buf);
  } finally {
    clearTimeout(timeout);
  }
}

function htmlToText(html: string): { title: string; text: string } {
  const $ = cheerio.load(html);
  $(REMOVE_SELECTORS.join(',')).remove();

  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('title').first().text().trim() ||
    '';

  // Prefer <article> / <main> if present, else body.
  const root =
    $('article').first().length > 0
      ? $('article').first()
      : $('main').first().length > 0
        ? $('main').first()
        : $('body');

  const rawText = root.text();
  const text = rawText
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

  return { title: title.trim(), text };
}

export async function POST(request: Request) {
  let url: string;
  let industry: IndustryProfile;
  try {
    const body = (await request.json()) as {
      url?: unknown;
      industryId?: unknown;
    };
    url = cleanUrl(body?.url);
    industry = resolveIndustry(body?.industryId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    const html = await fetchHtml(url);
    const { title, text } = htmlToText(html);
    if (text.length < 80) {
      return NextResponse.json(
        { error: 'Page content is too short to analyze' },
        { status: 422 },
      );
    }
    const sourceLabel = title ? `${title} (${url})` : url;
    const result = await analyzeText(
      text,
      { type: 'url', ref: sourceLabel },
      industry,
    );
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
