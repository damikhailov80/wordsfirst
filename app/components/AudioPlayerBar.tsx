"use client";

import { type RefObject } from "react";

interface Props {
  audioRef: RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  currentIndex: number;
  totalSegments: number;
  currentText?: string;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function AudioPlayerBar({
  audioRef,
  isPlaying,
  currentIndex,
  totalSegments,
  currentText,
  onPlayPause,
  onPrev,
  onNext,
}: Props) {
  return (
    <>
    <audio ref={audioRef} />
    <div className="fixed bottom-0 inset-x-0 bg-white border-t border-stone-200 shadow-lg">
      <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
        <button
          onClick={onPrev}
          disabled={currentIndex <= 0}
          aria-label="Previous"
          className="rounded-full p-2 text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
          </svg>
        </button>

        <button
          onClick={onPlayPause}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="rounded-full bg-amber-400 p-3 text-white hover:bg-amber-500 transition-colors shadow"
        >
          {isPlaying ? (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          onClick={onNext}
          disabled={currentIndex >= totalSegments - 1}
          aria-label="Next"
          className="rounded-full p-2 text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 3.9V8.1L8.5 12zM16 6h2v12h-2z" />
          </svg>
        </button>

        <span className="ml-auto text-sm text-stone-400">
          {currentIndex >= 0
            ? `${currentIndex + 1} / ${totalSegments}`
            : `${totalSegments} segments`}
        </span>

        {currentIndex >= 0 && currentText && (
          <span className="hidden sm:block max-w-xs truncate text-sm text-stone-500">
            {currentText}
          </span>
        )}
      </div>
    </div>
    </>
  );
}
