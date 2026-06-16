"use client";

import Link from "next/link";
import type { Desk } from "@/lib/desks/types";
import { useDeskState } from "@/lib/desks/useDeskState";
import SessionDoneBadge from "./SessionDoneBadge";
import SessionActiveLabel from "./SessionActiveLabel";
import DeskStudyButton from "./DeskStudyButton";

export default function DeskListItem({ desk }: { desk: Desk }) {
  const { deckState, dueCount } = useDeskState(desk.id, desk.cards);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-900">{desk.title}</h2>
            <SessionDoneBadge deckState={deckState} />
          </div>
          <p className="text-sm text-zinc-500 mt-0.5">
            {desk.cards.length} слов
            {deckState.kind !== "loading" && dueCount > 0 && (
              <span className="ml-2 text-amber-600">· {dueCount} к повторению</span>
            )}
          </p>
          <SessionActiveLabel deckState={deckState} />
          {deckState.kind === "unavailable" && (
            <p className="text-xs text-zinc-400 mt-1.5">Нет слов для повторения</p>
          )}
        </div>

        <div className="flex gap-2 shrink-0 items-center">
          <Link
            href={`/desks/${desk.id}/cards`}
            className="w-28 py-2 text-center rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Все слова
          </Link>
          <DeskStudyButton deskId={desk.id} deckState={deckState} className="w-28 py-2" />
        </div>
      </div>
    </div>
  );
}
