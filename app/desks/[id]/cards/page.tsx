"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Desk, ProgressMap } from "@/lib/desks/types";
import {
  countDueCards,
  formatLastReview,
  formatNextReview,
  getCardProgress,
  loadProgress,
  statusLabel,
} from "@/lib/desks/progress";
import { useDeskState } from "@/lib/desks/useDeskState";
import SessionDoneBadge from "@/app/components/desk/SessionDoneBadge";
import SessionActiveLabel from "@/app/components/desk/SessionActiveLabel";
import DeskStudyButton from "@/app/components/desk/DeskStudyButton";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-zinc-100 text-zinc-600",
  learning: "bg-amber-100 text-amber-700",
  learned: "bg-emerald-100 text-emerald-700",
};

export default function CardsTablePage() {
  const { id } = useParams<{ id: string }>();
  const [desk, setDesk] = useState<Desk | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/desks/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json() as Promise<Desk>;
      })
      .then((d) => {
        setDesk(d);
        setProgress(loadProgress(d.id));
      })
      .catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50">
        <p className="text-zinc-400 text-sm">Колода не найдена.</p>
      </div>
    );
  }

  if (!desk) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50">
        <p className="text-zinc-400 text-sm">Загрузка...</p>
      </div>
    );
  }

  return <CardsTableContent desk={desk} progress={progress} />;
}

function CardsTableContent({ desk, progress }: { desk: Desk; progress: ProgressMap }) {
  const { deckState } = useDeskState(desk.id, desk.cards);
  const dueCount = countDueCards(desk.cards, progress);

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 min-h-screen">
      <div className="w-full max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/desks"
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              ← К колодам
            </Link>
            <div className="flex items-center gap-2 mt-2">
              <h1 className="text-2xl font-semibold text-zinc-900">{desk.title}</h1>
              <SessionDoneBadge deckState={deckState} />
            </div>
            <SessionActiveLabel deckState={deckState} />
          </div>
          <DeskStudyButton deskId={desk.id} deckState={deckState} className="px-4 py-2" />
        </div>

        <div className="flex gap-6 mb-6">
          <div className="flex flex-col">
            <span className="text-2xl font-semibold text-zinc-900">{desk.cards.length}</span>
            <span className="text-xs text-zinc-400 mt-0.5">всего слов</span>
          </div>
          <div className="w-px bg-zinc-200" />
          <div className="flex flex-col">
            <span className="text-2xl font-semibold text-amber-500">{dueCount}</span>
            <span className="text-xs text-zinc-400 mt-0.5">к повторению сегодня</span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Слово</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Статус</th>
                <th className="text-right px-5 py-3 text-zinc-500 font-medium">Повторений</th>
                <th className="text-right px-5 py-3 text-zinc-500 font-medium">Последний раз</th>
                <th className="text-right px-5 py-3 text-zinc-500 font-medium">Следующее</th>
              </tr>
            </thead>
            <tbody>
              {desk.cards.map((card, i) => {
                const p = getCardProgress(card.id, progress);
                return (
                  <tr
                    key={card.id}
                    className={i < desk.cards.length - 1 ? "border-b border-zinc-50" : ""}
                  >
                    <td className="px-5 py-3 font-medium text-zinc-900">{card.lemma}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}
                      >
                        {statusLabel(p.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-zinc-500">{p.repetitions}</td>
                    <td className="px-5 py-3 text-right text-zinc-500">
                      {formatLastReview(p.lastReview)}
                    </td>
                    <td className="px-5 py-3 text-right text-zinc-500">
                      {p.status === "learned" ? "—" : formatNextReview(p.nextReview)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
