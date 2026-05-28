#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";

// ── Types ────────────────────────────────────────────────────────────────────

interface Seg {
  utf8: string;
  tOffsetMs?: number;
  acAsrConf?: number;
}

interface Event {
  tStartMs: number;
  dDurationMs?: number;
  wWinId?: number;
  aAppend?: number;
  segs?: Seg[];
}

interface Json3 {
  events: Event[];
}

// [startMs, endMs]
type WordTiming = [number, number];

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractVideoId(filename: string): string {
  // Match the last [...] before any extension, e.g. "Title [-vZXgApsPCQ].en.json3"
  const match = filename.match(/\[([^\]]+)\](?:\.[^.]+)*$/);
  if (match) return match[1];
  // Fallback: strip known suffixes and use the whole name
  return filename.replace(/(?:\.en)?\.json3$/, "");
}

// ── Core ─────────────────────────────────────────────────────────────────────

function parseJson3(filePath: string): { text: string; timings: WordTiming[] } {
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw) as Json3;

  const rawWords: { word: string; startMs: number; maxEndMs: number }[] = [];

  for (const event of data.events) {
    const segs = event.segs;
    if (!segs?.length) continue;

    const tStart = event.tStartMs;
    const eventEnd = tStart + (event.dDurationMs ?? 0);

    const resolved = segs.map((seg) => ({
      text: seg.utf8 ?? "",
      absStart: tStart + (seg.tOffsetMs ?? 0),
    }));

    for (let i = 0; i < resolved.length; i++) {
      const { text, absStart } = resolved[i];
      const maxEndMs =
        i + 1 < resolved.length ? resolved[i + 1].absStart : eventEnd;

      const word = text.trim();
      if (!word) continue;
      // skip annotation tokens like [Music], [Applause], [Laughter]
      if (/^\[[^\]]+\]$/.test(word)) continue;

      rawWords.push({ word, startMs: absStart, maxEndMs });
    }
  }

  // Sort chronologically — prevents overlaps from interleaved events
  rawWords.sort((a, b) => a.startMs - b.startMs);

  const timings: WordTiming[] = rawWords.map((w, i) => {
    const endMs =
      i + 1 < rawWords.length
        ? Math.min(rawWords[i + 1].startMs, w.maxEndMs)
        : w.maxEndMs;
    return [w.startMs, endMs];
  });

  const text = rawWords.map((w) => w.word).join(" ").replace(/ {2,}/g, " ");
  return { text, timings };
}

// ── CLI ──────────────────────────────────────────────────────────────────────

const [, , inputArg, outputDirArg] = process.argv;

if (!inputArg) {
  console.error("Usage: tsx transform.ts <file.en.json3> [output_dir]");
  process.exit(1);
}

const inputPath = path.resolve(inputArg);
const outputDir = path.resolve(outputDirArg ?? path.dirname(inputPath));
const videoId = extractVideoId(path.basename(inputPath));

fs.mkdirSync(outputDir, { recursive: true });

console.log(`Parsing:         ${inputPath}`);
console.log(`Video ID:        ${videoId}`);
const { text, timings } = parseJson3(inputPath);

const txtPath = path.join(outputDir, `${videoId}.txt`);
fs.writeFileSync(txtPath, text, "utf-8");
console.log(`Text saved:      ${txtPath}  (${text.length} chars)`);

const timingsPath = path.join(outputDir, `${videoId}.json`);
fs.writeFileSync(timingsPath, JSON.stringify(timings), "utf-8");
console.log(`Timings saved:   ${timingsPath}  (${timings.length} words)`);

const json3OutPath = path.join(outputDir, `${videoId}.json3`);
if (path.resolve(json3OutPath) !== inputPath) {
  fs.copyFileSync(inputPath, json3OutPath);
  console.log(`Source copied:   ${json3OutPath}`);
}
