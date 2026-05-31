import SegmentRow from "./SegmentRow";

interface Props {
  titleLine: string;
  authorLine: string;
  isActive: boolean;
  isPlaying?: boolean;
  onPlay: () => void;
  segmentRef: (el: HTMLDivElement | null) => void;
}

export default function TitleBlock({
  titleLine,
  authorLine,
  isActive,
  isPlaying,
  onPlay,
  segmentRef,
}: Props) {
  return (
    <SegmentRow
      variant="title"
      isActive={isActive}
      isPlaying={isPlaying}
      onPlay={onPlay}
      segmentRef={segmentRef}
      ariaLabel="Play title"
      className="mb-10"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">
          {titleLine}
        </h1>
        <p className="mt-1 text-base text-stone-500">{authorLine}</p>
      </div>
    </SegmentRow>
  );
}
