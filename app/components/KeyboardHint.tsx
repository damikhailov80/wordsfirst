"use client";

import { useEffect, useRef, useState } from "react";

export default function KeyboardHint() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  return (
    <div ref={ref} className="fixed bottom-24 right-4 hidden sm:flex flex-col items-end gap-2">
      {open && (
        <div className="flex flex-col gap-1 text-xs text-stone-500 text-right select-none bg-white rounded-xl shadow-lg ring-1 ring-stone-200 px-4 py-3">
          <span>Space — play/pause</span>
          <span>↑ ↓ — prev/next</span>
          <span>← → — −5s / +5s</span>
          <span>Shift+← / Home — restart</span>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts"
        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors shadow ${
          open
            ? "bg-amber-400 text-white"
            : "bg-white ring-1 ring-stone-200 text-stone-400 hover:bg-stone-100"
        }`}
      >
        ?
      </button>
    </div>
  );
}
