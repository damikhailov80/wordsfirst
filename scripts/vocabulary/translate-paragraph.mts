import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname, basename, extname } from "path";
import { fileURLToPath } from "url";

const MODEL = "claude-opus-4-5";
const url = "https://api.anthropic.com/v1/messages";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: tsx translate-paragraph.mts <path-to-text-file>");
  process.exit(1);
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const absoluteInputPath = resolve(scriptDir, inputPath);
const inputText = readFileSync(absoluteInputPath, "utf-8");

const firstParagraph = inputText.split("\n")[0].trim();
if (!firstParagraph) {
  console.error("Error: file is empty or first line is blank");
  process.exit(1);
}

const SYSTEM_PROMPT = `You are a vocabulary extraction specialist for English language learners (native language: Russian).

Given an English sentence or paragraph, analyse every word token and return a single JSON object with three top-level arrays: "context", "senses", and "lemmas".

━━━ ARRAY SCHEMAS ━━━

"context" — one entry per word token (skip proper nouns):
{
  "surface":             exact word as it appears in the text,
  "translation":         Russian translation of that surface form,
  "context":             short clause or phrase (5–10 words) from the input that contains this word,
  "context_translation": Russian translation of that clause,
  "lemma":               dictionary base form (bare infinitive for verbs; singular for nouns; positive for adj/adv),
  "type":                one of: verb | noun | adjective | adverb | pronoun | preposition | conjunction | article | numeral | interjection | other,
  "sense":               sense ID, e.g. "run_verb_1" — must match an entry in the "senses" array
}

"senses" — one entry per unique (lemma, type) pair (deduplicated; if the same lemma appears in two distinct meanings or as different parts of speech, add two entries with different sense IDs):
{
  "lemma":               dictionary base form,
  "type":                part of speech (same values as in context),
  "sense":               sense ID matching context entries, e.g. "run_verb_1",
  "translation":         Russian translation of this sense of the lemma,
  "context":             short illustrative clause taken from the input (5–10 words),
  "context_translation": Russian translation of that clause
}

"lemmas" — one entry per unique lemma (deduplicated):
{
  "lemma": dictionary base form,
  "type":  one of: verb | noun | adjective | adverb | pronoun | preposition | conjunction | article | numeral | interjection | other,
  "forms": array of inflected forms with their grammatical relation — list ALL standard forms of the word (not only those present in the input):
           for verbs:      first_person_singular_present, second_person_present, third_person_singular_present, past_tense, past_participle, present_participle
           for nouns:      plural (and irregular forms if any)
           for adjectives: comparative, superlative (if applicable)
           for other types: empty array []
  each form object: { "form": "inflected string", "relation": "grammatical label" }
}

━━━ RULES ━━━
1. Skip proper nouns (names, cities, ships, etc.) in all three arrays.
2. Every sense ID referenced in "context[].sense" must have a matching entry in "senses[].sense".
3. Sense IDs are formatted as <lemma>_<type>_<number>, starting from 1 (e.g. "run_verb_1", "run_noun_1", "run_verb_2").
4. "forms" must cover the full standard paradigm even if only one form appeared in the text.
5. Function words (articles, prepositions, conjunctions) are included in "context" and "senses" but have empty "forms" in "lemmas".
6. Return ONLY a valid JSON object. No markdown fences, no commentary, no preamble.

Output skeleton:
{
  "context": [ ...context entries... ],
  "senses":  [ ...senses entries...  ],
  "lemmas":  [ ...lemmas entries...  ]
}`;

const body = {
  model: MODEL,
  max_tokens: 32000,
  temperature: 0,
  system: SYSTEM_PROMPT,
  messages: [
    {
      role: "user",
      content: firstParagraph,
    },
    {
      role: "assistant",
      content: "{",
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

const responseText = "{" + (data.content?.[0]?.text ?? "}");
const result = JSON.parse(responseText);

const nameWithoutExt = basename(absoluteInputPath, extname(absoluteInputPath));
const outDir = resolve(scriptDir, "out");
mkdirSync(outDir, { recursive: true });
const outputPath = resolve(outDir, `${nameWithoutExt}.vocabulary.json`);

writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf-8");
console.log(`Saved vocabulary (${result.context?.length ?? 0} tokens) to ${outputPath}`);
