import type { StoryDetail, StorySummary } from "./types";

export interface StoryRepository {
  listStories(): Promise<StorySummary[]>;
  getStory(id: string): Promise<StoryDetail | null>;
}
