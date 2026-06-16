"use client";

import { useEffect, useState } from "react";
import type { DeskCard, DeckState } from "./types";
import { buildSessionQueue, countDueCards, loadProgress, loadSession } from "./progress";

export function useDeskState(
  deskId: string,
  cards: DeskCard[]
): { deckState: DeckState; dueCount: number } {
  const [deckState, setDeckState] = useState<DeckState>({ kind: "loading" });
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    const progress = loadProgress(deskId);
    const session = loadSession(deskId);
    const due = buildSessionQueue(cards, progress);

    setDueCount(countDueCards(cards, progress));

    if (session && !session.finished) {
      const total = session.remainingCardIds.length + session.doneCount;
      setDeckState({ kind: "active", done: session.doneCount, total });
      return;
    }

    if (session?.finished) {
      setDeckState(due.length > 0 ? { kind: "done-with-more" } : { kind: "done" });
      return;
    }

    setDeckState(due.length > 0 ? { kind: "available" } : { kind: "unavailable" });
  }, [deskId, cards]);

  return { deckState, dueCount };
}
