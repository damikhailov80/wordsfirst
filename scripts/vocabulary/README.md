# scripts/vocabulary

Scripts for extracting linguistic data from plain-text stories using the Anthropic API.

Each script reads a `.txt` file and writes a `.json` file to `scripts/vocabulary/out/`. Run them from the project root. Add `API_KEY=sk-...` to `.env` — it is loaded automatically via `--env-file`.

## find-proper-names.mts

Detects all proper nouns in the text (people, locations, organisations, events, works, etc.) and saves them to `out/<name>.proper-names.json`.

Each entry:
```json
{
  "surface": "exact string from the text",
  "lemma": "canonical form",
  "entity_type": "PERSON | LOCATION | WATER | LANDFORM | ORG | EVENT | WORK | LANGUAGE_PEOPLE | OTHER",
  "translation": "Russian translation/transliteration of surface",
  "description": "краткое описание на русском"
}
```

```bash
node --env-file=.env --experimental-strip-types scripts/vocabulary/find-proper-names.mts painting-the-fence.txt
```

## to-lemma-forms.mts

Converts a story to learner-oriented lemma forms with the same layout as the input (paragraph breaks, line breaks, punctuation) and saves it to `out/<name>.lemma.txt`.

Example: `He was looking forward to seeing her again.` → `He be look forward to see she again.`

```bash
node --env-file=.env --experimental-strip-types scripts/vocabulary/to-lemma-forms.mts in/painting-the-fence.txt
```
