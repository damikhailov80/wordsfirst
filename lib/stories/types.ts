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

export interface StoryDetail extends Omit<StorySummary, "chaptersAmount"> {
  chapters: Chapter[];
}
