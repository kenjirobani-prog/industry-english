import seed from '@/data/seed.json';
import type {
  Industry,
  Keyword,
  Passage,
  Phrase,
  Reading,
  Scene,
  SeedData,
} from '@/types';

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

export function getPhrases(): Phrase[] {
  return data.phrases ?? [];
}

export function getPhrasesByScene(sceneId: string): Phrase[] {
  return (data.phrases ?? []).filter((p) => p.sceneIds.includes(sceneId));
}

export function getPhrasesByIndustry(industryId: string): Phrase[] {
  return (data.phrases ?? []).filter((p) => p.industryId === industryId);
}

export function getPassages(): Passage[] {
  return data.passages ?? [];
}

export function getPassagesByScene(sceneId: string): Passage[] {
  return (data.passages ?? []).filter((p) => p.sceneIds.includes(sceneId));
}

export function getPassagesByIndustry(industryId: string): Passage[] {
  return (data.passages ?? []).filter((p) => p.industryId === industryId);
}

export function getReadings(): Reading[] {
  return data.readings ?? [];
}

export function getReadingsByScene(sceneId: string): Reading[] {
  return (data.readings ?? []).filter((r) => r.sceneIds.includes(sceneId));
}

export function getReadingsByIndustry(industryId: string): Reading[] {
  return (data.readings ?? []).filter((r) => r.industryId === industryId);
}

export function getKeywordByTerm(
  term: string,
  industryId?: string,
): Keyword | undefined {
  const lower = term.toLowerCase();
  const list = industryId
    ? data.keywords.filter((k) => k.industryId === industryId)
    : data.keywords;
  return list.find((k) => k.term.toLowerCase() === lower);
}

export function getPhraseByText(
  phrase: string,
  industryId?: string,
): Phrase | undefined {
  const lower = phrase.toLowerCase();
  const list = industryId
    ? (data.phrases ?? []).filter((p) => p.industryId === industryId)
    : data.phrases ?? [];
  return list.find((p) => p.phrase.toLowerCase() === lower);
}
