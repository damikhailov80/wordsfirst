"use client";

import { useEffect, useRef, useState } from "react";

export interface TooltipState {
  word: string;
  x: number;
  y: number;
  translation?: string;
  description?: string;
  lemma?: string;
  lemma_type?: string;
  lemma_translation?: string | null;
  sense?: string;
  context?: string;
  context_translation?: string;
}

interface Props {
  tooltip: TooltipState;
  onDismiss: () => void;
}

export default function WordTooltip({ tooltip, onDismiss }: Props) {
  const [contextVisible, setContextVisible] = useState(false);
  const [added, setAdded] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelReveal = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  useEffect(() => {
    setContextVisible(false);
    setAdded(false);
    cancelReveal();
  }, [tooltip.word, tooltip.x, tooltip.y]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasContext = !!(tooltip.context || tooltip.context_translation);
  const hasLemmaInfo = !!(tooltip.lemma && tooltip.lemma_translation);

  const startReveal = () => {
    if (contextVisible) return;
    hoverTimer.current = setTimeout(() => setContextVisible(true), 1000);
  };

  return (
    <div
      data-tooltip
      style={{
        position: "fixed",
        left: Math.min(tooltip.x + 8, window.innerWidth - 256),
        top: tooltip.y + 16,
        width: 240,
      }}
      className="z-50 rounded-xl bg-white shadow-lg ring-1 ring-stone-200 px-4 py-3 text-sm text-stone-700"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="font-semibold text-stone-900 mb-2">{tooltip.word}</p>

      {tooltip.translation ? (
        <>
          <p className="text-amber-700 font-medium">{tooltip.translation}</p>
          {tooltip.description && (
            <p className="text-stone-400 text-xs mt-1">{tooltip.description}</p>
          )}

          {hasLemmaInfo && (
            <div className="mt-2 pt-2 border-t border-stone-100">
              <p className="text-xs text-stone-500">
                <span className="text-stone-400">
                  lemma{tooltip.lemma_type ? ` (${tooltip.lemma_type})` : ""}
                </span>
                {" — "}
                <span className="font-medium">{tooltip.lemma}</span>
                {" — "}
                <span className="text-stone-400">{tooltip.lemma_translation}</span>
              </p>
            </div>
          )}

          {hasContext && (
            <div className="mt-2 pt-2 border-t border-stone-100">
              {contextVisible ? (
                <div className="space-y-1">
                  <p className="text-stone-500 text-xs italic">{tooltip.context}</p>
                  <p className="text-stone-400 text-xs">{tooltip.context_translation}</p>
                </div>
              ) : (
                <button
                  onMouseEnter={startReveal}
                  onMouseLeave={cancelReveal}
                  onClick={() => { cancelReveal(); setContextVisible(true); }}
                  className="text-xs text-stone-400 hover:text-sky-600 transition-colors cursor-pointer"
                >
                  показать в контексте →
                </button>
              )}
            </div>
          )}

          <div className="mt-3 pt-2 border-t border-stone-100">
            <button
              onClick={() => setAdded(true)}
              disabled={added}
              className={`w-full text-xs rounded-lg py-1.5 transition-colors ${
                added
                  ? "bg-stone-100 text-stone-400 cursor-default"
                  : "bg-sky-50 text-sky-700 hover:bg-sky-100 cursor-pointer"
              }`}
            >
              {added ? "добавлено ✓" : "добавить в словарь"}
            </button>
          </div>
        </>
      ) : (
        <p className="text-stone-400 italic">definition coming soon</p>
      )}
    </div>
  );
}
