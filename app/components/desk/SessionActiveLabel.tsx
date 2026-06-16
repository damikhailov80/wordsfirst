import type { DeckState } from "@/lib/desks/types";

interface SessionActiveLabelProps {
  deckState: DeckState;
}

export default function SessionActiveLabel({ deckState }: SessionActiveLabelProps) {
  if (deckState.kind !== "active") return null;

  return (
    <p className="text-xs text-amber-600 font-medium mt-1.5">
      Сессия в процессе · {deckState.done} / {deckState.total}
    </p>
  );
}
