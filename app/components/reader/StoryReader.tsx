"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Chapter, Entity } from "@/lib/stories/types";
import pronounsData from "@/data/vocabulary/pronouns.json";

export type PronounSense = {
  translation: string;
  context: string;
  context_translation: string;
};

export type PronounEntry = {
  lemma: string;
  type?: string;
  gender?: string;
  senses: PronounSense[];
  forms?: { form: string; relation: string }[];
};

type SpanSource =
  | { kind: "properName"; data: Entity }
  | { kind: "pronoun"; entry: PronounEntry };

type EntitySpan = { text: string; source: SpanSource | null };

function buildEntitySpans(text: string, properNames: Entity[], pronounEntries: PronounEntry[]): EntitySpan[] {
  type Candidate = { surface: string; source: SpanSource; caseInsensitive?: boolean };

  const properNameCandidates: Candidate[] = properNames.map((p) => ({
    surface: p.surface,
    source: { kind: "properName" as const, data: p },
  }));

  const pronounCandidates: Candidate[] = pronounEntries.flatMap((entry) => {
    const surfaces = [entry.lemma, ...(entry.forms?.map((f) => f.form) ?? [])];
    return surfaces.map((surface) => ({
      surface,
      source: { kind: "pronoun" as const, entry },
      caseInsensitive: true,
    }));
  });

  const candidates: Candidate[] = [...properNameCandidates, ...pronounCandidates];
  const sorted = [...candidates].sort((a, b) => b.surface.length - a.surface.length);

  const isWordChar = (ch: string) => /[A-Za-z0-9]/.test(ch);
  const lowerText = text.toLowerCase();

  const matches: { start: number; end: number; source: SpanSource }[] = [];
  for (const candidate of sorted) {
    const searchText = candidate.caseInsensitive ? lowerText : text;
    const searchSurface = candidate.caseInsensitive ? candidate.surface.toLowerCase() : candidate.surface;
    let idx = 0;
    while (idx < text.length) {
      const pos = searchText.indexOf(searchSurface, idx);
      if (pos === -1) break;
      const end = pos + candidate.surface.length;
      const before = pos === 0 ? "" : text[pos - 1];
      const after = end >= text.length ? "" : text[end];
      const atWordBoundary = !isWordChar(before) && !isWordChar(after);
      const overlaps = matches.some((m) => pos < m.end && end > m.start);
      if (atWordBoundary && !overlaps) {
        matches.push({ start: pos, end, source: candidate.source });
      }
      idx = pos + 1;
    }
  }
  matches.sort((a, b) => a.start - b.start);

  const spans: EntitySpan[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (cursor < match.start) {
      spans.push({ text: text.slice(cursor, match.start), source: null });
    }
    spans.push({ text: text.slice(match.start, match.end), source: match.source });
    cursor = match.end;
  }
  if (cursor < text.length) {
    spans.push({ text: text.slice(cursor), source: null });
  }
  return spans;
}

const pronouns = pronounsData as PronounEntry[];
import KeyboardHint from "@/app/components/KeyboardHint";
import AudioPlayerBar from "@/app/components/AudioPlayerBar";
import TitleBlock from "./TitleBlock";
import ParagraphList from "./ParagraphList";
import WordTooltip, { type TooltipState } from "./WordTooltip";

export interface ReaderSegment {
  isTitle: boolean;
  text: string;
  audioSrc: string;
}

interface Props {
  title: string;
  author: string;
  audioBasePath: string;
  chapters: Chapter[];
  properNames?: Entity[];
}

export default function StoryReader({ title, author, audioBasePath, chapters, properNames }: Props) {
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const segmentRefs = useRef<(HTMLElement | null)[]>([]);

  const segments = useMemo<ReaderSegment[]>(() => {
    const titleSegment: ReaderSegment = {
      isTitle: true,
      text: title,
      audioSrc: `${audioBasePath}/0.mp3`,
    };
    const chapterSegments = chapters.map<ReaderSegment>((chapter, i) => ({
      isTitle: false,
      text: chapter.text,
      audioSrc: `${audioBasePath}/${i + 1}.mp3`,
    }));
    return [titleSegment, ...chapterSegments];
  }, [title, audioBasePath, chapters]);

  const loadAndPlay = useCallback(
    (index: number) => {
      const audio = audioRef.current;
      if (!audio || index < 0 || index >= segments.length) return;
      audio.src = segments[index].audioSrc;
      audio.load();
      audio.play().catch(() => {});
      setCurrentIndex(index);
      setIsPlaying(true);
    },
    [segments]
  );

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentIndex === -1) {
      loadAndPlay(0);
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [currentIndex, isPlaying, loadAndPlay]);

  const handlePrev = useCallback(() => {
    const target = Math.max(0, currentIndex <= 0 ? 0 : currentIndex - 1);
    loadAndPlay(target);
  }, [currentIndex, loadAndPlay]);

  const handleNext = useCallback(() => {
    const target = currentIndex + 1;
    if (target < segments.length) {
      loadAndPlay(target);
    }
  }, [currentIndex, segments.length, loadAndPlay]);

  const handleRestart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || currentIndex < 0) return;
    audio.currentTime = 0;
    if (!isPlaying) {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [currentIndex, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      const next = currentIndex + 1;
      if (next < segments.length) {
        loadAndPlay(next);
      } else {
        setIsPlaying(false);
        setCurrentIndex(-1);
      }
    };

    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [currentIndex, segments.length, loadAndPlay]);

  useEffect(() => {
    if (currentIndex >= 0) {
      segmentRefs.current[currentIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentIndex]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const audio = audioRef.current;

      switch (e.key) {
        case " ":
          e.preventDefault();
          handlePlayPause();
          break;
        case "ArrowDown":
          e.preventDefault();
          handleNext();
          break;
        case "ArrowUp":
          e.preventDefault();
          handlePrev();
          break;
        case "ArrowRight":
          e.preventDefault();
          if (audio && !isNaN(audio.duration)) {
            audio.currentTime = Math.min(audio.currentTime + 5, audio.duration);
          }
          break;
        case "ArrowLeft":
          if (e.shiftKey) {
            e.preventDefault();
            handleRestart();
          } else {
            e.preventDefault();
            if (audio && !isNaN(audio.duration)) {
              audio.currentTime = Math.max(audio.currentTime - 5, 0);
            }
          }
          break;
        case "Home":
          e.preventDefault();
          handleRestart();
          break;
        case "Escape":
          setTooltip(null);
          break;
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handlePlayPause, handleNext, handlePrev, handleRestart]);

  useEffect(() => {
    if (!tooltip) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-tooltip]")) {
        setTooltip(null);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [tooltip]);

  const renderWords = (text: string) => {
    const spans = buildEntitySpans(text, properNames ?? [], pronouns);
    const nodes: React.ReactNode[] = [];
    let key = 0;

    for (const span of spans) {
      if (span.source?.kind === "properName") {
        const entity = span.source.data;
        nodes.push(
          <span
            key={key++}
            onClick={(e) => {
              e.stopPropagation();
              setTooltip({
                word: entity.surface,
                x: e.clientX,
                y: e.clientY,
                translation: entity.translation,
                description: entity.description,
              });
            }}
            className="cursor-pointer underline decoration-dotted decoration-amber-500 text-amber-700 hover:text-amber-800 transition-colors"
          >
            {span.text}
          </span>
        );
      } else if (span.source?.kind === "pronoun") {
        const entry = span.source.entry;
        const isInflected = span.text.toLowerCase() !== entry.lemma.toLowerCase();
        nodes.push(
          <span
            key={key++}
            onClick={(e) => {
              e.stopPropagation();
              setTooltip({
                word: span.text,
                x: e.clientX,
                y: e.clientY,
                lemma: isInflected ? entry.lemma : undefined,
                pronounSenses: entry.senses,
              });
            }}
            className="cursor-pointer underline decoration-dotted decoration-sky-400 text-sky-700 hover:text-sky-800 transition-colors"
          >
            {span.text}
          </span>
        );
      } else {
        for (const token of span.text.split(/(\s+)/)) {
          if (/^\s+$/.test(token)) {
            nodes.push(token);
            key++;
          } else {
            nodes.push(
              <span
                key={key++}
                onClick={(e) => {
                  e.stopPropagation();
                  const clean = token.replace(/[^a-zA-Zа-яА-ЯёЁ'.-]/g, "");
                  if (clean) setTooltip({ word: clean, x: e.clientX, y: e.clientY });
                }}
                className="cursor-pointer hover:underline hover:decoration-dotted hover:text-amber-700 transition-colors"
              >
                {token}
              </span>
            );
          }
        }
      }
    }

    return nodes;
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-28" onClick={() => setTooltip(null)}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <TitleBlock
          titleLine={title}
          authorLine={author}
          isActive={currentIndex === 0}
          isPlaying={currentIndex === 0 && isPlaying}
          onPlay={() => (currentIndex === 0 ? handlePlayPause() : loadAndPlay(0))}
          segmentRef={(el) => { segmentRefs.current[0] = el; }}
        />

        <ParagraphList
          segments={segments}
          currentIndex={currentIndex}
          isPlaying={isPlaying}
          onPlay={loadAndPlay}
          onPlayPause={handlePlayPause}
          onRef={(idx, el) => { segmentRefs.current[idx] = el; }}
          renderWords={renderWords}
        />
      </div>

      {tooltip && (
        <WordTooltip tooltip={tooltip} onDismiss={() => setTooltip(null)} />
      )}

      <KeyboardHint />

      <AudioPlayerBar
        audioRef={audioRef}
        isPlaying={isPlaying}
        currentIndex={currentIndex}
        totalSegments={segments.length}
        currentText={
          currentIndex >= 0
            ? segments[currentIndex].isTitle
              ? title
              : segments[currentIndex].text.slice(0, 60) + "…"
            : undefined
        }
        onPlayPause={handlePlayPause}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  );
}
