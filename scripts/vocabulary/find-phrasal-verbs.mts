import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname, basename, extname } from "path";
import { fileURLToPath } from "url";

const MODEL = "claude-haiku-4-5-20251001";
const url = "https://api.anthropic.com/v1/messages";

const textPath = process.argv[2];
const candidatesPath = process.argv[3];
if (!textPath || !candidatesPath) {
  console.error(
    "Usage: tsx find-phrasal-verbs.mts <path-to-text-file> <path-to-phrasal-verb-candidates.json>"
  );
  process.exit(1);
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const absoluteTextPath = resolve(scriptDir, textPath);
const absoluteCandidatesPath = resolve(scriptDir, candidatesPath);

const inputText = readFileSync(absoluteTextPath, "utf-8");

interface Candidate {
  phrasal_verb: string;
  context?: string;
}

const rawCandidates: Candidate[] = JSON.parse(
  readFileSync(absoluteCandidatesPath, "utf-8")
);

const candidateLemmas = [...new Set(rawCandidates.map((c) => c.phrasal_verb))];

const SYSTEM_PROMPT = `
You are a phrasal verb match verifier.

You are given:
1. A source text.
2. A list of CANDIDATE phrasal-verb lemmas. Every candidate is a real dictionary phrasal verb — it was taken from a curated phrasal-verb dictionary. DO NOT question whether a candidate "counts" as a phrasal verb. It always does.

The candidates were produced by string-matching the lemma list against a lemmatized version of the text, so some matches are FALSE POSITIVES: the same words appear in the text but NOT as that phrasal verb.

Your ONLY task:
For each candidate, check whether the source text actually contains a real occurrence of THAT phrasal verb (the lexical verb used as a verb, together with its particle). Keep every candidate whose phrasal-verb use is genuinely present. Reject ONLY false matches.

You MUST keep a candidate when its verb is actually used with its particle in the text, EVEN IF the meaning is literal. Phrasal verbs like "look at", "come in", "go into", "hold up", "call out" are valid and must be kept whenever they truly occur.

Reject a candidate ONLY when the match is not a real use of that phrasal verb, for example:
* the matched word is a different part of speech (e.g. "bear with a brush" — "bear" is the noun animal, not the verb; reject "bear with").
* the verb and the particle are not actually connected — the particle belongs to another phrase (e.g. "come to our place" — "to" introduces the destination, this is not the phrasal verb "come to" = regain consciousness).
* the words only coincide across a clause or sentence boundary.

When unsure whether the words really form the phrasal verb, prefer KEEPING the candidate.

For every KEPT candidate, find its real occurrence in the SOURCE TEXT (original inflected forms, not the lemma list) and fill the output object. If the same phrasal verb occurs several times, output one object per distinct occurrence.

Return ONLY a valid JSON array.

If none of the candidates genuinely occur in the text, return:

[]

and nothing else.

Output schema:

[
{
"surface": "exact form from the text",
"lemma": "dictionary form",
"sense": "общий перевод на русский",
"contextual_sense": "контекстуальный перевод на русский",
"full_contextual_translation": "English clip (≤10 words). — Краткий перевод на русский."
}
]

Field rules:

* "surface" = exact inflected span as it appears in the SOURCE TEXT.
* "lemma" = the candidate dictionary form you confirmed.
* "sense" = concise general Russian meaning, in neutral infinitive form (no specific tense).
* "contextual_sense" = meaning in this specific context. It MUST preserve the exact grammatical time and form of the "surface" occurrence:
  * if the phrasal verb is in the past tense in the text, the Russian translation MUST be in the past tense;
  * if it is in the present, use the present; if in the future, use the future.
  * preserve person, number and polarity (negation) exactly as in the text.
  * Example: surface "came into" (past tense) → contextual_sense "вошёл в сад" (past tense), NOT "войти в сад" (infinitive).
  * Example: surface "went on" (past tense) → contextual_sense "продолжил работу" (past tense), NOT "продолжать работу".
* "full_contextual_translation" = "<short English fragment from the source text, max 10 words> — <natural Russian translation>".

Output rules:

* Return a JSON array only.
* No markdown.
* No code fences.
* No explanations.
* No comments.
* Do not include false-match candidates.
* Do not create placeholder or negative objects.
* Do not invent phrasal verbs that are not in the candidate list.

Candidate phrasal-verb lemmas:

{{CANDIDATES}}
`;

const systemPrompt = SYSTEM_PROMPT.replace(
  "{{CANDIDATES}}",
  candidateLemmas.map((l) => `* ${l}`).join("\n")
);

const body = {
  model: MODEL,
  max_tokens: 8192,
  temperature: 0,
  system: systemPrompt,
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

let phrasalVerbs: unknown[];
try {
  phrasalVerbs = JSON.parse(raw);
} catch {
  const lastComma = raw.lastIndexOf("},");
  const truncated = lastComma !== -1 ? raw.slice(0, lastComma + 1) + "]" : "[]";
  phrasalVerbs = JSON.parse(truncated);
  console.warn("Response was truncated — partial results saved.");
}

const nameWithoutExt = basename(absoluteTextPath, extname(absoluteTextPath));
const outDir = resolve(scriptDir, "out");
mkdirSync(outDir, { recursive: true });
const outputPath = resolve(outDir, `${nameWithoutExt}.phrasal-verbs.json`);

writeFileSync(outputPath, JSON.stringify(phrasalVerbs, null, 2), "utf-8");
console.log(`Saved ${phrasalVerbs.length} phrasal verbs to ${outputPath}`);
