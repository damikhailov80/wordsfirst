export interface StorySummary {
  id: string;
  title: string;
  author: string;
  chaptersAmount: number;
  audioBasePath: string;
}

export interface Chapter {
  text: string;
}

export interface Entity {
  surface: string;
  lemma: string;
  entity_type: string;
  translation: string;
  description: string;
}

export interface VocabularyEntry {
  surface: string;
  translation: string;
  context: string;
  context_translation: string;
  lemma: string;
  type: string;
  sense: string;
  lemma_translation: string | null;
}

export interface StoryDetail extends Omit<StorySummary, "chaptersAmount"> {
  chapters: Chapter[];
  properNames?: Entity[];
  vocabulary?: VocabularyEntry[];
}
