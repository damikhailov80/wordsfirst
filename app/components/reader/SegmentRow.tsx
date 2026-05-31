import type { ReactNode } from "react";
import PlayIcon from "@/app/components/icons/PlayIcon";
import PauseIcon from "@/app/components/icons/PauseIcon";

interface Props {
  isActive: boolean;
  isPlaying?: boolean;
  onPlay: () => void;
  segmentRef?: (el: HTMLDivElement | null) => void;
  ariaLabel?: string;
  variant?: "title" | "paragraph";
  className?: string;
  children: ReactNode;
}

export default function SegmentRow({
  isActive,
  isPlaying = false,
  onPlay,
  segmentRef,
  ariaLabel = "Play",
  variant = "paragraph",
  className = "",
  children,
}: Props) {
  const isTitle = variant === "title";

  return (
    <div
      ref={segmentRef}
      className={`flex ${isTitle ? "items-center" : "items-start"} gap-3 rounded-xl px-4 py-3 transition-colors duration-300 ${
        isActive ? "bg-amber-100 ring-2 ring-amber-400" : "hover:bg-stone-100"
      } ${className}`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPlay();
        }}
        aria-label={isActive && isPlaying ? "Pause" : ariaLabel}
        className={`shrink-0 flex items-center justify-center rounded-full transition-colors ${
          isTitle ? "w-9 h-9" : "w-8 h-8 mt-0.5"
        } ${
          isActive
            ? "bg-amber-400 text-white"
            : "bg-stone-200 text-stone-500 hover:bg-amber-400 hover:text-white"
        }`}
      >
        {isActive && isPlaying ? (
          <PauseIcon className={isTitle ? "w-5 h-5" : "w-4 h-4"} />
        ) : (
          <PlayIcon className={isTitle ? "w-5 h-5" : "w-4 h-4"} />
        )}
      </button>
      {children}
    </div>
  );
}
