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
  emoji: string;
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
