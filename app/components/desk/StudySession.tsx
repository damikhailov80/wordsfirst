"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Desk, DeskCard, ProgressMap } from "@/lib/desks/types";
import {
  applyGood,
  applyLearned,
  buildSessionQueue,
  clearSession,
  loadProgress,
  loadSession,
  saveProgress,
  saveSession,
} from "@/lib/desks/progress";
import FlashCard from "./FlashCard";
import SessionProgress from "./SessionProgress";

interface StudySessionProps {
  desk: Desk;
}

export default function StudySession({ desk }: StudySessionProps) {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressMap>({});
  const [queue, setQueue] = useState<DeskCard[]>([]);
  const [doneCount, setDoneCount] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [hasMoreCards, setHasMoreCards] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    const savedProgress = loadProgress(desk.id);
    const cardById = Object.fromEntries(desk.cards.map((c) => [c.id, c]));

    const existingSession = loadSession(desk.id);

    if (existingSession && !existingSession.finished) {
      const restoredQueue = existingSession.remainingCardIds
        .map((id) => cardById[id])
        .filter((c): c is DeskCard => Boolean(c));
      const total = restoredQueue.length + existingSession.doneCount;
      setQueue(restoredQueue);
      setDoneCount(existingSession.doneCount);
      setSessionTotal(total);
    } else {
      const initialQueue = buildSessionQueue(desk.cards, savedProgress);
      const total = initialQueue.length;
      setQueue(initialQueue);
      setSessionTotal(total);
      const isFinished = total === 0;
      setFinished(isFinished);
      if (isFinished) setHasMoreCards(false);
      saveSession(desk.id, {
        remainingCardIds: initialQueue.map((c) => c.id),
        doneCount: 0,
        finished: isFinished,
      });
    }

    setProgress(savedProgress);
    setLoaded(true);
  }, [desk.id, desk.cards]);

  const currentCard = queue[0] ?? null;

  const handleReveal = useCallback(() => setRevealed(true), []);

  const advance = useCallback(
    (updatedProgress: ProgressMap, newQueue: DeskCard[], newDone: number) => {
      saveProgress(desk.id, updatedProgress);
      const isFinished = newQueue.length === 0;
      saveSession(desk.id, {
        remainingCardIds: newQueue.map((c) => c.id),
        doneCount: newDone,
        finished: isFinished,
      });
      setProgress(updatedProgress);
      setRevealed(false);
      setQueue(newQueue);
      setDoneCount(newDone);
      if (isFinished) {
        setFinished(true);
        setHasMoreCards(buildSessionQueue(desk.cards, updatedProgress).length > 0);
      }
    },
    [desk.id]
  );

  const handleGood = useCallback(() => {
    if (!currentCard) return;
    const updatedProgress = applyGood(currentCard.id, progress);
    const newQueue = queue.slice(1);
    advance(updatedProgress, newQueue, doneCount + 1);
  }, [currentCard, progress, queue, doneCount, advance]);

  const handleLearned = useCallback(() => {
    if (!currentCard) return;
    const updatedProgress = applyLearned(currentCard.id, progress);
    const newQueue = queue.slice(1);
    advance(updatedProgress, newQueue, doneCount + 1);
  }, [currentCard, progress, queue, doneCount, advance]);

  const handleAgain = useCallback(() => {
    if (!currentCard) return;
    setRevealed(false);
    setQueue((prev) => {
      const [first, ...rest] = prev;
      const newQueue = [...rest, first];
      saveSession(desk.id, {
        remainingCardIds: newQueue.map((c) => c.id),
        doneCount,
        finished: false,
      });
      return newQueue;
    });
  }, [currentCard, desk.id, doneCount]);

  const handleExitRequest = useCallback(() => {
    if (doneCount === 0) {
      router.push("/desks");
    } else {
      setShowExitConfirm(true);
    }
  }, [doneCount, router]);

  const handleExitConfirm = useCallback(() => {
    router.push("/desks");
  }, [router]);

  const handleExitCancel = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  const handleStudyMore = useCallback(() => {
    clearSession(desk.id);
    router.refresh();
    const savedProgress = loadProgress(desk.id);
    const cardById = Object.fromEntries(desk.cards.map((c) => [c.id, c]));
    const newQueue = buildSessionQueue(desk.cards, savedProgress);
    const total = newQueue.length;
    saveSession(desk.id, {
      remainingCardIds: newQueue.map((c) => c.id),
      doneCount: 0,
      finished: total === 0,
    });
    setQueue(newQueue);
    setDoneCount(0);
    setSessionTotal(total);
    setFinished(total === 0);
    setRevealed(false);
    void cardById;
  }, [desk.id, desk.cards, router]);

  if (!loaded) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50">
        <p className="text-zinc-400 text-sm">Загрузка...</p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col flex-1 bg-zinc-50 min-h-screen">
        <div className="w-full max-w-md mx-auto px-6 py-12 flex flex-col items-center gap-8">
          <div className="text-center">
            <p className="text-5xl mb-4">🎉</p>
            <h2 className="text-2xl font-semibold text-zinc-900 mb-2">
              Сессия завершена
            </h2>
            <p className="text-zinc-500 text-sm">
              Пройдено {doneCount} {cardWord(doneCount)} в этой сессии
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            {hasMoreCards && (
              <button
                onClick={handleStudyMore}
                className="w-full py-3 text-center rounded-xl bg-amber-400 text-white font-semibold text-sm hover:bg-amber-500 transition-colors"
              >
                Учить ещё
              </button>
            )}
            <Link
              href={`/desks/${desk.id}/cards`}
              className="w-full py-3 text-center rounded-xl border border-zinc-200 text-zinc-700 font-medium text-sm hover:bg-zinc-50 transition-colors"
            >
              Все слова колоды
            </Link>
            <Link
              href="/desks"
              className="w-full py-3 text-center rounded-xl border border-zinc-200 text-zinc-700 font-medium text-sm hover:bg-zinc-50 transition-colors"
            >
              К списку колод
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 min-h-screen">
      <div className="w-full max-w-md mx-auto px-6 py-12 flex flex-col gap-8">
        <div className="flex items-center justify-between min-h-[28px]">
          {showExitConfirm ? (
            <>
              <p className="text-sm text-zinc-500">Прогресс сохранён. Выйти?</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExitCancel}
                  className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  Остаться
                </button>
                <button
                  onClick={handleExitConfirm}
                  className="text-sm font-medium text-rose-500 hover:text-rose-700 transition-colors"
                >
                  Выйти
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-zinc-700">{desk.title}</p>
              <button
                onClick={handleExitRequest}
                className="text-sm text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                Завершить
              </button>
            </>
          )}
        </div>

        <SessionProgress done={doneCount} total={sessionTotal} />

        {currentCard && (
          <FlashCard
            card={currentCard}
            revealed={revealed}
            onReveal={handleReveal}
            onGood={handleGood}
            onAgain={handleAgain}
            onLearned={handleLearned}
          />
        )}
      </div>
    </div>
  );
}

function cardWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "карточек";
  if (mod10 === 1) return "карточку";
  if (mod10 >= 2 && mod10 <= 4) return "карточки";
  return "карточек";
}
