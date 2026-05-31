import type { ReactNode } from "react";
import type { ReaderSegment } from "./StoryReader";
import SegmentRow from "./SegmentRow";

interface Props {
  segments: ReaderSegment[];
  currentIndex: number;
  onPlay: (idx: number) => void;
  onRef: (idx: number, el: HTMLDivElement | null) => void;
  renderWords: (text: string) => ReactNode;
}

export default function ParagraphList({
  segments,
  currentIndex,
  onPlay,
  onRef,
  renderWords,
}: Props) {
  return (
    <div className="space-y-5">
      {segments.slice(1).map((segment, i) => {
        const idx = i + 1;
        return (
          <SegmentRow
            key={idx}
            isActive={currentIndex === idx}
            onPlay={() => onPlay(idx)}
            segmentRef={(el) => onRef(idx, el)}
            ariaLabel={`Play segment ${idx}`}
          >
            <p className="text-base leading-relaxed text-stone-800">
              {renderWords(segment.text)}
            </p>
          </SegmentRow>
        );
      })}
    </div>
  );
}
