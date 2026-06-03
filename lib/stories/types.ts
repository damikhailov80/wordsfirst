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

export interface Idiom {
  surface: string;
  lemma: string;
  sense: string;
  contextual_sense: string;
}

export interface PhrasalVerb {
  surface: string;
  lemma: string;
  sense: string;
  contextual_sense: string;
}

export interface StoryDetail extends Omit<StorySummary, "chaptersAmount"> {
  chapters: Chapter[];
  properNames?: Entity[];
  idioms?: Idiom[];
  phrasalVerbs?: PhrasalVerb[];
}
