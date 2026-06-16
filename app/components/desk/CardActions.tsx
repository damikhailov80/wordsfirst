"use client";

interface CardActionsProps {
  onGood: () => void;
  onAgain: () => void;
  onLearned: () => void;
}

export default function CardActions({
  onGood,
  onAgain,
  onLearned,
}: CardActionsProps) {
  return (
    <div className="flex gap-3 w-full justify-center">
      <button
        onClick={onAgain}
        className="flex-1 max-w-[140px] py-3 rounded-xl border border-zinc-200 text-zinc-700 font-medium text-sm hover:bg-zinc-50 transition-colors"
      >
        Сначала
      </button>
      <button
        onClick={onGood}
        className="flex-1 max-w-[140px] py-3 rounded-xl bg-amber-400 text-white font-semibold text-sm hover:bg-amber-500 transition-colors"
      >
        Хорошо
      </button>
      <button
        onClick={onLearned}
        className="flex-1 max-w-[140px] py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors"
      >
        В изученные
      </button>
    </div>
  );
}
