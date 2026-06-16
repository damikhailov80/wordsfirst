import type {
  CardProgress,
  CardStatus,
  DeskCard,
  ProgressMap,
  SessionState,
} from "./types";

const SESSION_SIZE = 5;

const FIBONACCI_INTERVALS = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

function storageKey(deckId: string): string {
  return `desk-progress-${deckId}`;
}

function sessionKey(deckId: string): string {
  return `desk-session-${deckId}`;
}

export function loadSession(deckId: string): SessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(sessionKey(deckId));
    return raw ? (JSON.parse(raw) as SessionState) : null;
  } catch {
    return null;
  }
}

export function saveSession(deckId: string, session: SessionState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(sessionKey(deckId), JSON.stringify(session));
}

export function clearSession(deckId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(sessionKey(deckId));
}

export function loadProgress(deckId: string): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(storageKey(deckId));
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

export function saveProgress(deckId: string, progress: ProgressMap): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(deckId), JSON.stringify(progress));
}

export function getCardProgress(
  cardId: string,
  progress: ProgressMap
): CardProgress {
  return (
    progress[cardId] ?? {
      status: "new" as CardStatus,
      interval: 0,
      repetitions: 0,
      nextReview: 0,
    }
  );
}

function nextInterval(repetitions: number): number {
  const index = Math.min(repetitions, FIBONACCI_INTERVALS.length - 1);
  return FIBONACCI_INTERVALS[index];
}

export function applyGood(
  cardId: string,
  progress: ProgressMap
): ProgressMap {
  const current = getCardProgress(cardId, progress);
  const interval = nextInterval(current.repetitions);
  return {
    ...progress,
    [cardId]: {
      status: "learning",
      interval,
      repetitions: current.repetitions + 1,
      nextReview: Date.now() + interval * 86_400_000,
    },
  };
}

export function applyLearned(
  cardId: string,
  progress: ProgressMap
): ProgressMap {
  return {
    ...progress,
    [cardId]: {
      status: "learned",
      interval: 0,
      repetitions: getCardProgress(cardId, progress).repetitions,
      nextReview: 0,
    },
  };
}

export function buildSessionQueue(
  cards: DeskCard[],
  progress: ProgressMap
): DeskCard[] {
  const now = Date.now();
  const due = cards.filter((card) => {
    const p = getCardProgress(card.id, progress);
    return p.status !== "learned" && p.nextReview <= now;
  });
  return due.slice(0, SESSION_SIZE);
}

export function formatNextReview(nextReview: number): string {
  if (nextReview === 0) return "Сейчас";
  const diff = nextReview - Date.now();
  if (diff <= 0) return "Готово к повторению";
  const hours = diff / 3_600_000;
  if (hours < 24) return `через ${Math.ceil(hours)} ч`;
  const days = Math.ceil(diff / 86_400_000);
  return `через ${days} ${dayWord(days)}`;
}

function dayWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "дней";
  if (mod10 === 1) return "день";
  if (mod10 >= 2 && mod10 <= 4) return "дня";
  return "дней";
}

export function statusLabel(status: CardStatus): string {
  if (status === "new") return "Новое";
  if (status === "learning") return "Изучается";
  return "Изучено";
}
