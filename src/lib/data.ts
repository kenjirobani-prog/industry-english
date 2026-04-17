import seed from '@/data/seed.json';
import type { Industry, Keyword, Scene, SeedData } from '@/types';

const data = seed as unknown as SeedData;

export function getIndustries(): Industry[] {
  return data.industries;
}

export function getIndustry(id: string): Industry | undefined {
  return data.industries.find((i) => i.id === id);
}

export function getScenes(industryId?: string): Scene[] {
  return industryId
    ? data.scenes.filter((s) => s.industryId === industryId)
    : data.scenes;
}

export function getScene(id: string): Scene | undefined {
  return data.scenes.find((s) => s.id === id);
}

export function getKeywords(): Keyword[] {
  return data.keywords;
}

export function getKeywordsByScene(sceneId: string): Keyword[] {
  return data.keywords.filter((k) => k.sceneIds.includes(sceneId));
}

export function getKeywordsByIndustry(industryId: string): Keyword[] {
  return data.keywords.filter((k) => k.industryId === industryId);
}

export function getKeyword(id: string): Keyword | undefined {
  return data.keywords.find((k) => k.id === id);
}
