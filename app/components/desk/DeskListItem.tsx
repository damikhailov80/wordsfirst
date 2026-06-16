"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Desk } from "@/lib/desks/types";
import { buildSessionQueue, countDueCards, loadProgress, loadSession } from "@/lib/desks/progress";

type DeckState =
  | { kind: "loading" }
  | { kind: "active"; done: number; total: number }
  | { kind: "done" }
  | { kind: "done-with-more" }
  | { kind: "available" }
  | { kind: "unavailable" };

export default function DeskListItem({ desk }: { desk: Desk }) {
  const [state, setState] = useState<DeckState>({ kind: "loading" });
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    const session = loadSession(desk.id);
    const progress = loadProgress(desk.id);
    const due = buildSessionQueue(desk.cards, progress);
    setDueCount(countDueCards(desk.cards, progress));

    if (session && !session.finished) {
      const total = session.remainingCardIds.length + session.doneCount;
      setState({ kind: "active", done: session.doneCount, total });
      return;
    }

    if (session?.finished) {
      setState(due.length > 0 ? { kind: "done-with-more" } : { kind: "done" });
      return;
    }

    setState(due.length > 0 ? { kind: "available" } : { kind: "unavailable" });
  }, [desk.id, desk.cards]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-900">{desk.title}</h2>
            {(state.kind === "done" || state.kind === "done-with-more") && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                ✓ Сессия выполнена
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 mt-0.5">
            {desk.cards.length} слов
            {state.kind !== "loading" && dueCount > 0 && (
              <span className="ml-2 text-amber-600">· {dueCount} к повторению</span>
            )}
          </p>
          {state.kind === "active" && (
            <p className="text-xs text-amber-600 font-medium mt-1.5">
              Сессия в процессе · {state.done} / {state.total}
            </p>
          )}
          {state.kind === "unavailable" && (
            <p className="text-xs text-zinc-400 mt-1.5">
              Нет слов для повторения
            </p>
          )}
        </div>

        <div className="flex gap-2 shrink-0 items-center">
          <Link
            href={`/desks/${desk.id}/cards`}
            className="w-28 py-2 text-center rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Все слова
          </Link>
          {(state.kind === "available" || state.kind === "loading") && (
            <Link
              href={`/desks/${desk.id}`}
              className="w-28 py-2 text-center rounded-lg bg-amber-400 text-white text-sm font-semibold hover:bg-amber-500 transition-colors"
            >
              Учить
            </Link>
          )}
          {state.kind === "done-with-more" && (
            <Link
              href={`/desks/${desk.id}`}
              className="w-28 py-2 text-center rounded-lg bg-amber-400 text-white text-sm font-semibold hover:bg-amber-500 transition-colors"
            >
              Учить ещё
            </Link>
          )}
          {state.kind === "active" && (
            <Link
              href={`/desks/${desk.id}`}
              className="w-28 py-2 text-center rounded-lg bg-amber-400 text-white text-sm font-semibold hover:bg-amber-500 transition-colors"
            >
              Продолжить
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
