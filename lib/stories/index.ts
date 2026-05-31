import { MockStoryRepository } from "./mock-repository";
import type { StoryRepository } from "./repository";

let repository: StoryRepository | null = null;

export function getStoryRepository(): StoryRepository {
  if (!repository) {
    repository = new MockStoryRepository();
  }
  return repository;
}

export type { StoryRepository } from "./repository";
export type { Chapter, StoryDetail, StorySummary } from "./types";
