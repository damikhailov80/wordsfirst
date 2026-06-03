import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname, basename, extname } from "path";
import { fileURLToPath } from "url";

const MODEL = "claude-haiku-4-5-20251001";
const url = "https://api.anthropic.com/v1/messages";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: tsx find-proper-names.mts <path-to-text-file>");
  process.exit(1);
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const absoluteInputPath = resolve(scriptDir, inputPath);
const inputText = readFileSync(absoluteInputPath, "utf-8");

const SYSTEM_PROMPT = `You are a named entity recognition (NER) specialist. Your task is to identify ALL proper nouns in a given text — across every entity type — and return structured JSON.

Entity types to detect:
- PERSON — real or fictional people, characters (e.g. Tom Sawyer, Napoleon, Sherlock Holmes)
- LOCATION/GEO — cities, countries, regions, continents, streets, buildings (e.g. Paris, the Amazon, Siberia, Baker Street)
- WATER — rivers, lakes, seas, oceans, bays (e.g. the Nile, Lake Baikal, the Pacific)
- LANDFORM — mountains, volcanoes, deserts, islands (e.g. Everest, the Sahara, Hawaii)
- ORG — companies, institutions, political parties, sports teams (e.g. NASA, the Kremlin, Manchester United)
- EVENT — historical events, wars, treaties, disasters (e.g. World War II, the French Revolution, Chernobyl)
- WORK — books, films, artworks, songs (e.g. Hamlet, Mona Lisa, The Beatles)
- LANGUAGE/PEOPLE — languages, nationalities, ethnic groups (e.g. Latin, the Slavs, the Ottomans)
- OTHER — any other proper noun not covered above (holidays, awards, brand names, etc.)

Rules:
1. Detect every proper noun that falls into one of the entity types above.
2. \`surface\` — copy the token verbatim from the input text, preserving original spelling and spacing.
3. \`lemma\` — canonical / most recognized form. Resolve shortened or ambiguous mentions using context (e.g. "the River" in a text about the Thames → lemma "Thames"; "Tom" in a Twain context → "Tom Sawyer").
4. \`entity_type\` — one of: PERSON, LOCATION, WATER, LANDFORM, ORG, EVENT, WORK, LANGUAGE_PEOPLE, OTHER.
5. \`translation\` — Russian translation or transliteration of the \`surface\` form. If already Russian, keep as is.
6. \`description\` — up to 6 words in Russian: a standalone definition of what/who the entity is, independent of the input text. Do not reference the story, narrator, or other characters.
7. Use surrounding context to resolve ambiguous references. If ambiguity cannot be resolved, pick the most famous referent and note it in \`description\`.
8. Return ONLY a valid JSON array. No markdown fences, no commentary, no preamble. Empty array [] if no proper nouns found.

Output schema (strict):
[
  {
    "surface": "exact string from the text",
    "lemma": "canonical form",
    "entity_type": "PERSON | LOCATION | WATER | LANDFORM | ORG | EVENT | WORK | LANGUAGE_PEOPLE | OTHER",
    "translation": "Russian translation/transliteration of surface",
    "description": "краткое описание на русском"
  }
]`;

const body = {
  model: MODEL,
  max_tokens: 4096,
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

const responseText = "[" + (data.content?.[0]?.text ?? "]");
const entities = JSON.parse(responseText);

const nameWithoutExt = basename(absoluteInputPath, extname(absoluteInputPath));
const outDir = resolve(scriptDir, "out");
mkdirSync(outDir, { recursive: true });
const outputPath = resolve(outDir, `${nameWithoutExt}.proper-names.json`);

writeFileSync(outputPath, JSON.stringify(entities, null, 2), "utf-8");
console.log(`Saved ${entities.length} entities to ${outputPath}`);
