import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname, basename, extname } from "path";
import { fileURLToPath } from "url";

const MODEL = "claude-haiku-4-5-20251001";
const url = "https://api.anthropic.com/v1/messages";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: node --env-file=.env --experimental-strip-types scripts/vocabulary/to-lemma-forms.mts <path-to-text-file>");
  process.exit(1);
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const absoluteInputPath = resolve(scriptDir, inputPath);
const inputText = readFileSync(absoluteInputPath, "utf-8");

const SYSTEM_PROMPT = `You convert English text into lemma (dictionary-base) forms for language learners.

Return ONLY the converted text. No markdown fences, no commentary, no labels, no JSON.

The output must mirror the input exactly in structure:
- same paragraph breaks and line breaks
- same number of sentences
- same punctuation in the same places
- same spacing between words (do not add or remove blank lines)

Lemma rules:
1. Verbs → bare infinitive without "to": was/were/am/is/are → be; looked → look; seeing → see; had → have; went → go; painted → paint.
2. Keep multi-word verb phrases intact but lemmatize each verbal part: "was looking forward to seeing" → "be look forward to see"; "had pulled" → "have pull".
3. Pronouns → nominative base: me → I; him → he; her → she; us → we; them → they; my/mine → I; your/yours → you; his → he; hers → she; our/ours → we; their/theirs → they.
4. Nouns → singular lemma where applicable: children → child; men → man; people → person; stories → story.
5. Adjectives/adverbs → positive base where applicable: better → good; best → good; more quickly → more quick.
6. Contractions → expanded lemmas: don't → do not; I'm → I be; we've → we have; it's → it be (when copula) or it have (when auxiliary) — use context.
7. Proper nouns, numbers, and fixed names stay unchanged (Tom Sawyer, New York, Betsy).
8. Function words unchanged when already base: the, a, to (preposition), forward, again, and, but, if, when.
9. Preserve original capitalization on the first word of each sentence; other words lowercase unless proper nouns.`;

async function lemmatizeChunk(chunk: string): Promise<string> {
  const body = {
    model: MODEL,
    max_tokens: 8192,
    temperature: 0,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: chunk }],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Error:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  const text = data.content?.[0]?.text ?? "";
  if (!text.trim()) {
    console.warn("Empty response for a chunk — keeping original text.");
    return chunk;
  }

  return text.trimEnd();
}

const parts = inputText.split(/(\n\n+)/);
const outputParts: string[] = [];

for (const part of parts) {
  if (/^\n\n+$/.test(part)) {
    outputParts.push(part);
    continue;
  }
  if (!part.trim()) {
    outputParts.push(part);
    continue;
  }
  outputParts.push(await lemmatizeChunk(part));
}

const lemmaText = outputParts.join("");

const nameWithoutExt = basename(absoluteInputPath, extname(absoluteInputPath));
const outDir = resolve(scriptDir, "in");
mkdirSync(outDir, { recursive: true });
const outputPath = resolve(outDir, `${nameWithoutExt}.lemma.txt`);

writeFileSync(outputPath, lemmaText, "utf-8");
console.log(`Saved lemma text to ${outputPath}`);
