import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname, basename, extname } from "path";
import { fileURLToPath } from "url";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: tsx find-phrasal-verb-candidates.mts <path-to-lemma-text-file>");
  process.exit(1);
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const absoluteInputPath = resolve(scriptDir, inputPath);
const inputText = readFileSync(absoluteInputPath, "utf-8");

const resourcePath = resolve(scriptDir, "resources/phrasal-verbs.json");
const phrasalVerbs: string[] = JSON.parse(readFileSync(resourcePath, "utf-8"));

function expandSlashAlternatives(pv: string): string[] {
  if (!pv.includes(" / ")) return [pv];

  const parts = pv.split(" / ").map((s) => s.trim());
  const firstWords = parts[0].split(/\s+/);

  if (firstWords.length === 1 && parts.slice(1).some((p) => p.split(/\s+/).length > 1)) {
    const longest = parts.reduce((a, b) =>
      a.split(/\s+/).length >= b.split(/\s+/).length ? a : b
    );
    const sharedTail = longest.split(/\s+/).slice(1).join(" ");
    return parts.map((p) =>
      p.split(/\s+/).length === 1 && sharedTail ? `${p} ${sharedTail}` : p
    );
  }

  const baseVerb = firstWords.slice(0, -1).join(" ") || firstWords[0];
  return parts.map((p) => {
    if (p === parts[0]) return p;
    return p.split(/\s+/)[0] !== firstWords[0] ? `${baseVerb} ${p}` : p;
  });
}

function toSearchPatterns(pv: string): string[] {
  const stripped = pv.replace(/\s*\([^)]+\)/g, "").replace(/\s+/g, " ").trim();
  const withContent = pv.replace(/[()]/g, "").replace(/\s+/g, " ").trim();
  const baseVersions = stripped === withContent ? [stripped] : [withContent, stripped];

  const result = new Set<string>();

  for (const base of baseVersions) {
    for (const variant of expandSlashAlternatives(base)) {
      const clean = variant
        .replace(/\bsb\/sth\b/gi, "")
        .replace(/\bsb\b/gi, "")
        .replace(/\bsth\b/gi, "")
        .replace(/\bone's\b/gi, "")
        .replace(/\boneself\b/gi, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      if (clean && clean !== "it" && clean !== "one" && clean !== "them") {
        result.add(clean);
      }
    }
  }

  return [...result];
}

function extractContext(text: string, matchIndex: number, matchLength: number): string {
  const sentenceStart = text.lastIndexOf(".", matchIndex - 1);
  const contextStart = sentenceStart === -1 ? 0 : sentenceStart + 1;
  const sentenceEnd = text.indexOf(".", matchIndex + matchLength);
  const contextEnd = sentenceEnd === -1 ? text.length : sentenceEnd + 1;
  return text.slice(contextStart, contextEnd).replace(/\s+/g, " ").trim();
}

interface Candidate {
  phrasal_verb: string;
  context: string;
}

const candidates: Candidate[] = [];
const seenKeys = new Set<string>();

for (const pv of phrasalVerbs) {
  const patterns = toSearchPatterns(pv);

  for (const pattern of patterns) {
    const escapedWords = pattern
      .split(/\s+/)
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`\\b${escapedWords.join("\\s+")}\\b`, "gi");

    let match: RegExpExecArray | null;
    while ((match = regex.exec(inputText)) !== null) {
      const key = `${match.index}::${match[0].toLowerCase()}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      candidates.push({
        phrasal_verb: pv,
        context: extractContext(inputText, match.index, match[0].length),
      });
    }
  }
}

const nameWithoutExt = basename(absoluteInputPath, extname(absoluteInputPath));
const outDir = resolve(scriptDir, "out");
mkdirSync(outDir, { recursive: true });
const outputPath = resolve(outDir, `${nameWithoutExt}.phrasal-verb-candidates.json`);

writeFileSync(outputPath, JSON.stringify(candidates, null, 2), "utf-8");
console.log(`Found ${candidates.length} phrasal verb candidates → ${outputPath}`);
