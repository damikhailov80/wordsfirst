"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Desk } from "@/lib/desks/types";
import { loadSession } from "@/lib/desks/progress";

interface DeskListItemProps {
  desk: Desk;
}

export default function DeskListItem({ desk }: DeskListItemProps) {
  const [sessionDone, setSessionDone] = useState<number | null>(null);
  const [sessionTotal, setSessionTotal] = useState<number | null>(null);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  useEffect(() => {
    const session = loadSession(desk.id);
    if (session && !session.finished) {
      const total = session.remainingCardIds.length + session.doneCount;
      setSessionDone(session.doneCount);
      setSessionTotal(total);
      setHasActiveSession(true);
    }
  }, [desk.id]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">{desk.title}</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{desk.cards.length} слов</p>
          {hasActiveSession && sessionDone !== null && sessionTotal !== null && (
            <p className="text-xs text-amber-600 font-medium mt-1.5">
              Сессия в процессе · {sessionDone} / {sessionTotal}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href={`/desks/${desk.id}/cards`}
            className="px-4 py-2 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Все слова
          </Link>
          <Link
            href={`/desks/${desk.id}`}
            className="px-4 py-2 rounded-lg bg-amber-400 text-white text-sm font-semibold hover:bg-amber-500 transition-colors"
          >
            {hasActiveSession ? "Продолжить" : "Учить"}
          </Link>
        </div>
      </div>
    </div>
  );
}
