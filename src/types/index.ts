// Core domain types — generic enough to support any industry/scene.

export type Industry = {
  id: string;
  name_ja: string;
  name_en: string;
  description_ja: string;
  available: boolean;
};

export type Scene = {
  id: string;
  industryId: string;
  name_ja: string;
  name_en: string;
  description_ja: string;
  /** Legacy decorative emoji — no longer rendered in the Apple-styled UI. */
  emoji?: string;
  phrases?: Phrase[];
  passages?: Passage[];
  readings?: Reading[];
};

export type Reading = {
  id: string;
  industryId: string;
  sceneIds: string[];
  title: string;
  source: string;
  date: string; // ISO date e.g. "2026-04-14"
  body_en: string;
  body_ja: string;
  highlighted_terms: string[];
  reading_time_minutes: number;
};

export type Phrase = {
  id: string;
  industryId: string;
  sceneIds: string[];
  phrase: string;
  meaning_ja: string;
  usage_context: string;
  examples: Example[];
};

export type ShadowingDifficulty = 'easy' | 'medium' | 'hard';

export type Passage = {
  id: string;
  industryId: string;
  sceneIds: string[];
  text: string;
  translation_ja: string;
  source: string;
  scene: string;
  key_terms: string[];
  shadowing_difficulty: ShadowingDifficulty;
};

export type Example = {
  sentence: string;
  translation: string;
  source: string;
  scene: string;
};

export type Keyword = {
  id: string;
  industryId: string;
  sceneIds: string[];
  term: string;
  meaning_ja: string;
  meaning_industry: string;
  meaning_general?: string;
  frequency: 1 | 2 | 3 | 4 | 5;
  examples: Example[];
};

export type SeedData = {
  industries: Industry[];
  scenes: Scene[];
  keywords: Keyword[];
  phrases: Phrase[];
  passages: Passage[];
  readings: Reading[];
};

export type EnglishLevel = 'beginner' | 'intermediate' | 'advanced';

export type UserPreferences = {
  industryId: string;
  sceneIds: string[];
  level: EnglishLevel;
  onboardedAt: string;
};

export type QuizResult = {
  keywordId: string;
  correct: boolean;
  answeredAt: string;
};

export type LessonProgress = {
  sceneId: string;
  completedAt: string;
  keywordIds: string[];
};

// ---------- Analysis (URL / file → Claude) ----------

export type ExtractedKeyword = {
  term: string;
  meaning_ja: string;
  meaning_industry: string;
  meaning_general?: string;
  frequency: 1 | 2 | 3 | 4 | 5;
  examples: Example[];
};

export type AnalysisQuiz = {
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
};

export type AnalysisSource = {
  type: 'url' | 'file';
  ref: string; // URL or filename
};

export type AnalysisResult = {
  source: AnalysisSource;
  keywords: ExtractedKeyword[];
  quizzes: AnalysisQuiz[];
};

export type UserKeyword = Keyword & {
  sourceType: 'url' | 'file';
  sourceRef: string;
  extractedAt: string;
};
