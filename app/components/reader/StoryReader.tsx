"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Chapter } from "@/lib/stories/types";
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
}

export default function StoryReader({ title, author, audioBasePath, chapters }: Props) {
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

  const openTooltip = (word: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const clean = word.replace(/[^a-zA-Zа-яА-ЯёЁ'-]/g, "");
    if (!clean) return;
    setTooltip({ word: clean, x: e.clientX, y: e.clientY });
  };

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

  const renderWords = (text: string) =>
    text.split(/(\s+)/).map((token, i) => {
      if (/^\s+$/.test(token)) return token;
      return (
        <span
          key={i}
          onClick={(e) => openTooltip(token, e)}
          className="cursor-pointer hover:underline hover:decoration-dotted hover:text-amber-700 transition-colors"
        >
          {token}
        </span>
      );
    });

  return (
    <div className="min-h-screen bg-stone-50 pb-28" onClick={() => setTooltip(null)}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <TitleBlock
          titleLine={title}
          authorLine={author}
          isActive={currentIndex === 0}
          onPlay={() => loadAndPlay(0)}
          segmentRef={(el) => { segmentRefs.current[0] = el; }}
        />

        <ParagraphList
          segments={segments}
          currentIndex={currentIndex}
          onPlay={loadAndPlay}
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
