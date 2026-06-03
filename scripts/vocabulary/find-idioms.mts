import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname, basename, extname } from "path";
import { fileURLToPath } from "url";

const MODEL = "claude-haiku-4-5-20251001";
const url = "https://api.anthropic.com/v1/messages";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: tsx find-idioms.mts <path-to-text-file>");
  process.exit(1);
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const absoluteInputPath = resolve(scriptDir, inputPath);
const inputText = readFileSync(absoluteInputPath, "utf-8");

const SYSTEM_PROMPT = `
You are an English idiom detection assistant.

Task:
Identify all English idioms appearing in the text.

An idiom is a multi-word expression whose meaning is not fully predictable from the literal meanings of its individual words.

Return ONLY a valid JSON array.

Output format:

[
{
"surface": "exact form from the text",
"lemma": "canonical dictionary form",
"sense": "общий перевод на русский",
"contextual_sense": "контекстуальный перевод на русский",
"full_contextual_translation": "English clip (≤10 words). — Краткий перевод на русский."
}
]

Detection rules:

1. Return ONLY idioms.
2. Do NOT return:

   * phrasal verbs,
   * collocations,
   * fixed expressions,
   * lexical chunks,
   * discourse markers,
   * common word combinations,
   * grammatical constructions,
   * proverbs,
   * clichés,
   * individual words.
3. An idiom may appear in a modified grammatical form. Detect it even when:

   * the verb tense changes,
   * pronouns change,
   * nouns are replaced by context-specific nouns,
   * articles are added or omitted,
   * word forms are inflected.
4. Do NOT require an exact dictionary wording match.
5. Focus on idiomatic meaning rather than exact wording.
6. Normalize every detected idiom to its canonical dictionary form in the "lemma" field.

Examples:

* "pushed my nose into his corner"
  → "push one's nose into something"

* "spilled the beans"
  → "spill the beans"

* "biting off more than she could chew"
  → "bite off more than one can chew"

Field rules:

* "surface" = exact text span from the source text.
* "lemma" = canonical dictionary form of the idiom.
* "sense" = concise general Russian meaning, in neutral infinitive form (no specific tense).
* "contextual_sense" = meaning in the specific context. It MUST preserve the exact grammatical time and form of the "surface" occurrence:
  * if the idiom is in the past tense in the text, the Russian translation MUST be in the past tense;
  * if it is in the present, use the present; if in the future, use the future.
  * preserve person, number and polarity (negation) exactly as in the text.
  * Example: surface "pushed my nose into his corner" (past tense) → contextual_sense "вторгся в его личное пространство" (past tense), NOT "вторгнуться" (infinitive).
  * Example: surface "I didn't lose my mind" (past, negated) → contextual_sense "я не сошёл с ума" (past, negated), NOT "не сойти с ума".
* "full_contextual_translation" =
  "<short English fragment from the source text, max 10 words> — <natural Russian translation>"

Output rules:

* Return a JSON array only.
* No markdown.
* No explanations.
* No comments.
* No code fences.
* If no idioms are found, return:
  []


Text:

{{TEXT}}
`;

const body = {
  model: MODEL,
  max_tokens: 8192,
  temperature: 0,
  system: SYSTEM_PROMPT,
  messages: [
    {
      role: "user",
      content: inputText,
    },
    {
      role: "assistant",
      content: "[",
    },
  ],
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

const raw = "[" + (data.content?.[0]?.text ?? "]");

let idioms: unknown[];
try {
  idioms = JSON.parse(raw);
} catch {
  const lastComma = raw.lastIndexOf("},");
  const truncated = lastComma !== -1 ? raw.slice(0, lastComma + 1) + "]" : "[]";
  idioms = JSON.parse(truncated);
  console.warn("Response was truncated — partial results saved.");
}

const nameWithoutExt = basename(absoluteInputPath, extname(absoluteInputPath));
const outDir = resolve(scriptDir, "out");
mkdirSync(outDir, { recursive: true });
const outputPath = resolve(outDir, `${nameWithoutExt}.idioms.json`);

writeFileSync(outputPath, JSON.stringify(idioms, null, 2), "utf-8");
console.log(`Saved ${idioms.length} idioms to ${outputPath}`);
