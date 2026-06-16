import type { DeckState } from "@/lib/desks/types";

interface SessionDoneBadgeProps {
  deckState: DeckState;
}

export default function SessionDoneBadge({ deckState }: SessionDoneBadgeProps) {
  if (deckState.kind !== "done" && deckState.kind !== "done-with-more") return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
      ✓ Сессия выполнена
    </span>
  );
}
