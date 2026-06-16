import Link from "next/link";
import type { DeckState } from "@/lib/desks/types";

interface DeskStudyButtonProps {
  deskId: string;
  deckState: DeckState;
  className?: string;
}

const LABELS: Partial<Record<DeckState["kind"], string>> = {
  available: "Учить",
  loading: "Учить",
  "done-with-more": "Учить ещё",
  active: "Продолжить",
};

export default function DeskStudyButton({ deskId, deckState, className }: DeskStudyButtonProps) {
  const label = LABELS[deckState.kind];
  if (!label) return null;

  return (
    <Link
      href={`/desks/${deskId}`}
      className={`text-center rounded-xl bg-amber-400 text-white font-semibold text-sm hover:bg-amber-500 transition-colors ${className ?? ""}`}
    >
      {label}
    </Link>
  );
}
