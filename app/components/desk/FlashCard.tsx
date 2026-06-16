"use client";

import type { DeskCard } from "@/lib/desks/types";
import CardActions from "./CardActions";

interface FlashCardProps {
  card: DeskCard;
  revealed: boolean;
  onReveal: () => void;
  onGood: () => void;
  onAgain: () => void;
  onLearned: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  noun: "существительное",
  verb: "глагол",
  adjective: "прилагательное",
  adverb: "наречие",
  pronoun: "местоимение",
  preposition: "предлог",
  conjunction: "союз",
};

export default function FlashCard({
  card,
  revealed,
  onReveal,
  onGood,
  onAgain,
  onLearned,
}: FlashCardProps) {
  const typeLabel = TYPE_LABELS[card.type] ?? card.type;

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="w-full min-h-[220px] flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white px-8 py-10 shadow-sm">
        <p className="text-xs uppercase tracking-widest text-zinc-400 mb-4">
          {typeLabel}
        </p>
        <p className="text-4xl font-semibold text-zinc-900 text-center">
          {card.lemma}
        </p>
        {revealed && (
          <p className="mt-6 text-2xl text-zinc-600 text-center font-medium">
            {card.translation}
          </p>
        )}
      </div>

      {revealed ? (
        <CardActions onGood={onGood} onAgain={onAgain} onLearned={onLearned} />
      ) : (
        <button
          onClick={onReveal}
          className="w-full max-w-xs py-3 rounded-xl bg-zinc-900 text-white font-semibold text-sm hover:bg-zinc-700 transition-colors"
        >
          Показать перевод
        </button>
      )}
    </div>
  );
}
