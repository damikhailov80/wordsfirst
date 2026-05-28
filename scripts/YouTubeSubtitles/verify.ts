#!/usr/bin/env tsx
/**
 * Verify that a formatted text file preserves the exact word sequence of the
 * original, ignoring punctuation and letter case.
 *
 * Usage:
 *   tsx verify.ts <original.txt> <formatted.ftxt>
 */
import fs from "node:fs";
import path from "node:path";

// ── Helpers ──────────────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

// ── Myers / LCS diff ─────────────────────────────────────────────────────────
// Returns a list of "hunks": equal | insert | delete segments.

type Hunk =
  | { type: "equal"; words: string[] }
  | { type: "delete"; words: string[] }   // in original, missing from formatted
  | { type: "insert"; words: string[] };  // in formatted, not in original

function diff(a: string[], b: string[]): Hunk[] {
  const n = a.length;
  const m = b.length;

  // Build LCS table
  const dp: Uint16Array[] = Array.from({ length: n + 1 }, () =>
    new Uint16Array(m + 1)
  );

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (a[i] === b[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Trace back
  const hunks: Hunk[] = [];
  let i = 0;
  let j = 0;

  const push = (type: Hunk["type"], word: string) => {
    const last = hunks[hunks.length - 1];
    if (last?.type === type) {
      last.words.push(word);
    } else {
      hunks.push({ type, words: [word] } as Hunk);
    }
  };

  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) {
      push("equal", a[i]);
      i++;
      j++;
    } else if (j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j])) {
      push("insert", b[j]);
      j++;
    } else {
      push("delete", a[i]);
      i++;
    }
  }

  return hunks;
}

// ── CLI ──────────────────────────────────────────────────────────────────────

const [, , originalArg, formattedArg] = process.argv;

if (!originalArg || !formattedArg) {
  console.error("Usage: tsx verify.ts <original.txt> <formatted.ftxt>");
  process.exit(1);
}

const originalPath = path.resolve(originalArg);
const formattedPath = path.resolve(formattedArg);

const originalText = fs.readFileSync(originalPath, "utf-8");
const formattedText = fs.readFileSync(formattedPath, "utf-8");

const originalWords = tokenize(originalText);
const formattedWords = tokenize(formattedText);

console.log(`Original : ${originalPath}`);
console.log(`Formatted: ${formattedPath}`);
console.log(`─────────────────────────────────────────`);
console.log(`Original word count : ${originalWords.length}`);
console.log(`Formatted word count: ${formattedWords.length}`);
console.log(`─────────────────────────────────────────`);

// ── Compare ───────────────────────────────────────────────────────────────────

const hunks = diff(originalWords, formattedWords);
const problems = hunks.filter((h) => h.type !== "equal");

if (problems.length === 0) {
  console.log("✓ Word sequences match exactly.");
  process.exit(0);
}

// ── Report ────────────────────────────────────────────────────────────────────

const CONTEXT = 4; // equal words shown on each side of a change

console.log(`✗ ${problems.length} difference(s) found:\n`);

// Walk hunks, printing context + changes
let origPos = 0; // word index in original
let fmtPos = 0;  // word index in formatted
let diffNum = 0;

for (let h = 0; h < hunks.length; h++) {
  const hunk = hunks[h];

  if (hunk.type === "equal") {
    origPos += hunk.words.length;
    fmtPos += hunk.words.length;
    continue;
  }

  diffNum++;

  // Gather context from the nearest preceding equal hunk
  let beforeCtx: string[] = [];
  if (h > 0 && hunks[h - 1].type === "equal") {
    beforeCtx = hunks[h - 1].words.slice(-CONTEXT);
  }

  // Collect all consecutive non-equal hunks
  const changeHunks: Hunk[] = [];
  let k = h;
  while (k < hunks.length && hunks[k].type !== "equal") {
    changeHunks.push(hunks[k]);
    k++;
  }

  let afterCtx: string[] = [];
  if (k < hunks.length && hunks[k].type === "equal") {
    afterCtx = hunks[k].words.slice(0, CONTEXT);
  }

  const deleted = changeHunks
    .filter((x) => x.type === "delete")
    .flatMap((x) => x.words);
  const inserted = changeHunks
    .filter((x) => x.type === "insert")
    .flatMap((x) => x.words);

  const label =
    deleted.length && inserted.length
      ? "substitution"
      : deleted.length
      ? "deleted from original"
      : "added in formatted";

  console.log(`  #${diffNum} — ${label}  (original word ~${origPos + 1})`);

  if (deleted.length) {
    const line = [
      ...beforeCtx,
      `[${deleted.join(" ")}]`,
      ...afterCtx,
    ].join(" ");
    console.log(`    original : … ${line} …`);
  }

  if (inserted.length) {
    const line = [
      ...beforeCtx,
      `[${inserted.join(" ")}]`,
      ...afterCtx,
    ].join(" ");
    console.log(`    formatted: … ${line} …`);
  }

  if (deleted.length === 0 && inserted.length > 0) {
    const line = [...beforeCtx, ...afterCtx].join(" ");
    console.log(`    original : … ${line} …  (nothing here)`);
  }

  console.log();

  // Advance positions past all change hunks
  for (const ch of changeHunks) {
    if (ch.type === "delete") origPos += ch.words.length;
    if (ch.type === "insert") fmtPos += ch.words.length;
  }

  // Skip to the end of the run we already processed
  h = k - 1;
}

process.exit(1);
