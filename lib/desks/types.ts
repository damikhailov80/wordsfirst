export interface DeskCard {
  id: string;
  lemma: string;
  translation: string;
  type: string;
}

export interface Desk {
  id: string;
  title: string;
  sourceStory?: string;
  cards: DeskCard[];
}

export type CardStatus = "new" | "learning" | "learned";

export interface CardProgress {
  status: CardStatus;
  interval: number;
  repetitions: number;
  nextReview: number;
  lastReview?: number;
}

export type ProgressMap = Record<string, CardProgress>;

export interface SessionState {
  remainingCardIds: string[];
  doneCount: number;
  finished: boolean;
}

export type DeckState =
  | { kind: "loading" }
  | { kind: "active"; done: number; total: number }
  | { kind: "done" }
  | { kind: "done-with-more" }
  | { kind: "available" }
  | { kind: "unavailable" };
