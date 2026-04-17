import { NextResponse } from 'next/server';
import { analyzeText } from '@/lib/analyzer';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB

function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i === -1 ? '' : name.slice(i + 1).toLowerCase();
}

async function extractText(file: File): Promise<string> {
  const ext = extOf(file.name);
  const arrayBuffer = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);

  if (ext === 'txt' || file.type === 'text/plain') {
    return new TextDecoder('utf-8').decode(arrayBuffer);
  }
  if (ext === 'pdf' || file.type === 'application/pdf') {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: new Uint8Array(buf) });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  }
  if (ext === 'pptx' || ext === 'docx') {
    throw new Error('NOT_SUPPORTED_YET');
  }
  throw new Error('Unsupported file type');
}

export async function POST(request: Request) {
  let file: File | null = null;
  try {
    const form = await request.formData();
    const f = form.get('file');
    if (f instanceof File) file = f;
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: 'File is too large (max 8MB)' },
      { status: 413 },
    );
  }

  let text: string;
  try {
    text = await extractText(file);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Extraction failed';
    if (msg === 'NOT_SUPPORTED_YET') {
      return NextResponse.json(
        {
          error:
            'PPTX/DOCX はMVPでは未対応です。TXTまたはPDFをご利用ください。',
        },
        { status: 415 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  text = text.trim();
  if (text.length < 80) {
    return NextResponse.json(
      { error: 'File content is too short to analyze' },
      { status: 422 },
    );
  }

  try {
    const result = await analyzeText(text, { type: 'file', ref: file.name });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
