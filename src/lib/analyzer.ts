import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import type { AnalysisResult, AnalysisSource, ExtractedKeyword, AnalysisQuiz } from '@/types';

const MODEL = 'claude-sonnet-4-6';
const MAX_INPUT_CHARS = 30_000; // ~7-8k tokens, keeps cost predictable

export type IndustryProfile = {
  id: string;
  name_en: string;
  name_ja: string;
  description_ja: string;
  scenes: { id: string; name_en: string; name_ja: string }[];
};

const SYSTEM_PROMPT = `You are an expert business English coach helping non-native learners — typically Japanese professionals — extract industry-specific vocabulary from real-world content (articles, decks, contracts, reports). The user provides an "Industry profile" describing their domain and the scenes (business situations) where they use English.

For each request, do three things:

1. Extract 3 to 7 industry-specific English keywords or short phrases from the input text that would be most valuable for a professional in that industry to learn. Prioritize:
   - Industry jargon and terms-of-art
   - Words whose meaning differs notably inside the industry versus general English or other industries
   - High-frequency commercial / operational terms in that industry
   Avoid generic English vocabulary every business learner already knows.

2. For each keyword produce:
   - term: the English term
   - meaning_ja: Japanese translation/explanation
   - meaning_industry: an English explanation of the meaning within the user's industry
   - meaning_general: OPTIONAL — only include when the term has a notably different meaning outside the industry; otherwise omit the field entirely
   - frequency: integer 1-5 estimating how common the term is in the user's industry contexts (5 = very common)
   - examples: 1 to 2 example sentences. Pull verbatim from the source text when possible; otherwise write a natural example inspired by it. For each example provide:
       sentence (English), translation (Japanese), source (a short label, e.g. the source URL/filename), scene (must be one of the scene IDs supplied in the Industry profile)

3. Generate exactly 3 multiple-choice quiz questions, in Japanese, testing the meaning or correct usage of these keywords. Each must have 4 choices, a correctIndex (0-3), and a brief Japanese explanation.

Return ONLY a single JSON object — no markdown code fences, no preamble, no trailing commentary — matching this schema:

{
  "keywords": [
    {
      "term": "string",
      "meaning_ja": "string (Japanese)",
      "meaning_industry": "string (English)",
      "meaning_general": "string (English, optional)",
      "frequency": 1,
      "examples": [
        {
          "sentence": "string",
          "translation": "string",
          "source": "string",
          "scene": "one of the supplied scene IDs"
        }
      ]
    }
  ],
  "quizzes": [
    {
      "question": "string (Japanese)",
      "choices": ["string", "string", "string", "string"],
      "correctIndex": 0,
      "explanation": "string (Japanese)"
    }
  ]
}

Strict rules:
- Output JSON only. No \`\`\` fences. No prose around the JSON.
- 3 to 7 keywords. Exactly 3 quizzes.
- Each keyword must include at least 1 example.
- The "scene" field must exactly match one of the scene IDs provided in the Industry profile.
- If the input is too short or off-topic to yield industry-relevant keywords, select the closest applicable terms from your knowledge of the supplied industry that connect to the input's broader topic.`;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[...truncated for analysis]`;
}

function extractJson(raw: string): unknown {
  // Strip markdown fences if the model added them despite instructions.
  let s = raw.trim();
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }
  // Find the outer-most braces.
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in model output');
  }
  return JSON.parse(s.slice(start, end + 1));
}

function coerceFrequency(n: unknown): 1 | 2 | 3 | 4 | 5 {
  const v = typeof n === 'number' ? Math.round(n) : 3;
  if (v <= 1) return 1;
  if (v >= 5) return 5;
  return v as 1 | 2 | 3 | 4 | 5;
}

function normalizeAnalysis(
  parsed: unknown,
  source: AnalysisSource,
  industry: IndustryProfile,
): AnalysisResult {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Model output is not an object');
  }
  const obj = parsed as Record<string, unknown>;
  const rawKeywords = Array.isArray(obj.keywords) ? obj.keywords : [];
  const rawQuizzes = Array.isArray(obj.quizzes) ? obj.quizzes : [];
  const validScenes = new Set(industry.scenes.map((s) => s.id));
  const fallbackScene = industry.scenes[0]?.id ?? 'general';

  const keywords: ExtractedKeyword[] = rawKeywords
    .map((k): ExtractedKeyword | null => {
      if (!k || typeof k !== 'object') return null;
      const kw = k as Record<string, unknown>;
      const term = typeof kw.term === 'string' ? kw.term.trim() : '';
      if (!term) return null;
      const examplesRaw = Array.isArray(kw.examples) ? kw.examples : [];
      const examples = examplesRaw
        .map((e) => {
          if (!e || typeof e !== 'object') return null;
          const ex = e as Record<string, unknown>;
          const sentence =
            typeof ex.sentence === 'string' ? ex.sentence.trim() : '';
          const translation =
            typeof ex.translation === 'string' ? ex.translation.trim() : '';
          if (!sentence || !translation) return null;
          const sceneVal =
            typeof ex.scene === 'string' && validScenes.has(ex.scene)
              ? ex.scene
              : fallbackScene;
          return {
            sentence,
            translation,
            source:
              typeof ex.source === 'string' && ex.source.trim()
                ? ex.source.trim()
                : source.ref,
            scene: sceneVal,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);
      if (examples.length === 0) return null;
      return {
        term,
        meaning_ja:
          typeof kw.meaning_ja === 'string' ? kw.meaning_ja.trim() : '',
        meaning_industry:
          typeof kw.meaning_industry === 'string'
            ? kw.meaning_industry.trim()
            : '',
        meaning_general:
          typeof kw.meaning_general === 'string' &&
          kw.meaning_general.trim().length > 0
            ? kw.meaning_general.trim()
            : undefined,
        frequency: coerceFrequency(kw.frequency),
        examples,
      };
    })
    .filter((x): x is ExtractedKeyword => x !== null);

  const quizzes: AnalysisQuiz[] = rawQuizzes
    .map((q): AnalysisQuiz | null => {
      if (!q || typeof q !== 'object') return null;
      const qz = q as Record<string, unknown>;
      const question = typeof qz.question === 'string' ? qz.question : '';
      const choices = Array.isArray(qz.choices)
        ? qz.choices
            .map((c) => (typeof c === 'string' ? c : ''))
            .filter((c) => c.length > 0)
        : [];
      if (!question || choices.length < 2) return null;
      const correctRaw =
        typeof qz.correctIndex === 'number' ? qz.correctIndex : 0;
      const correctIndex = Math.min(
        Math.max(0, Math.round(correctRaw)),
        choices.length - 1,
      );
      return {
        question,
        choices,
        correctIndex,
        explanation:
          typeof qz.explanation === 'string' ? qz.explanation : '',
      };
    })
    .filter((x): x is AnalysisQuiz => x !== null);

  return { source, keywords, quizzes };
}

function formatIndustryProfile(industry: IndustryProfile): string {
  const sceneLines = industry.scenes
    .map((s) => `  - ${s.id}: ${s.name_en} (${s.name_ja})`)
    .join('\n');
  return [
    `Industry profile:`,
    `- ID: ${industry.id}`,
    `- Industry (English): ${industry.name_en}`,
    `- Industry (Japanese): ${industry.name_ja}`,
    `- Description: ${industry.description_ja}`,
    `- Allowed scene IDs (use exactly one of these for each example.scene field):`,
    sceneLines,
  ].join('\n');
}

export async function analyzeText(
  text: string,
  source: AnalysisSource,
  industry: IndustryProfile,
): Promise<AnalysisResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  const cleaned = truncate(text.trim(), MAX_INPUT_CHARS);
  if (cleaned.length < 80) {
    throw new Error('Input text is too short to analyze');
  }

  const client = new Anthropic();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `${formatIndustryProfile(industry)}\n\nSource label: ${source.ref}\n\nSource text:\n"""\n${cleaned}\n"""\n\nReturn JSON only.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Empty response from model');
  }
  const parsed = extractJson(textBlock.text);
  return normalizeAnalysis(parsed, source, industry);
}
