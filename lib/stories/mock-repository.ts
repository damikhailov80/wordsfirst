import fs from "fs/promises";
import path from "path";
import type { StoryRepository } from "./repository";
import type { StoryDetail, StorySummary, VocabularyEntry } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "stories");
const VOCAB_DIR = path.join(process.cwd(), "data", "vocabulary");

async function readVocabularyFile(id: string): Promise<VocabularyEntry[] | undefined> {
  try {
    const raw = await fs.readFile(path.join(VOCAB_DIR, `${id}.json`), "utf-8");
    return JSON.parse(raw) as VocabularyEntry[];
  } catch {
    return undefined;
  }
}

async function readStoryFile(id: string): Promise<StoryDetail | null> {
  if (!/^[a-z0-9-]+$/.test(id)) return null;
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${id}.json`), "utf-8");
    const story = JSON.parse(raw) as StoryDetail;
    const vocabulary = await readVocabularyFile(id);
    return vocabulary ? { ...story, vocabulary } : story;
  } catch {
    return null;
  }
}

function toSummary(story: StoryDetail): StorySummary {
  return {
    id: story.id,
    title: story.title,
    author: story.author,
    chaptersAmount: story.chapters.length,
    audioBasePath: story.audioBasePath,
  };
}

export class MockStoryRepository implements StoryRepository {
  async listStories(): Promise<StorySummary[]> {
    let entries: string[];
    try {
      entries = await fs.readdir(DATA_DIR);
    } catch {
      return [];
    }

    const ids = entries
      .filter((name) => name.endsWith(".json"))
      .map((name) => name.replace(/\.json$/, ""));

    const stories = await Promise.all(ids.map(readStoryFile));
    return stories
      .filter((s): s is StoryDetail => s !== null)
      .map(toSummary);
  }

  getStory(id: string): Promise<StoryDetail | null> {
    return readStoryFile(id);
  }
}
