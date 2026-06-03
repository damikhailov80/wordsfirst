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

## find-idioms.mts

Detects idioms and fixed idiomatic expressions (figurative, non-literal meaning; phrasal verbs are excluded) and saves them to `out/<name>.idioms.json`.

Each entry:
```json
{
  "surface": "exact form from the text",
  "lemma": "canonical idiom form",
  "sense": "общий перевод на русский",
  "contextual_sense": "контекстуальный перевод на русский",
  "full_contextual_translation": "Short snippet (whole sentence if ≤7 words, else clause with the expression). — Краткий перевод."
}
```

```bash
node --env-file=.env --experimental-strip-types scripts/vocabulary/find-idioms.mts in/painting-the-fence.txt
```

## find-phrasal-verbs.mts

Verifies a candidate list (from `find-phrasal-verb-candidates.mts`) against the source text via the API: keeps only candidates genuinely used as phrasal verbs and drops accidental matches. Takes two arguments — the source text and the candidates JSON — and saves the result to `out/<text-name>.phrasal-verbs.json`.

Each entry:
```json
{
  "surface": "exact form from the text",
  "lemma": "canonical base form",
  "sense": "общий перевод на русский",
  "contextual_sense": "контекстуальный перевод на русский",
  "full_contextual_translation": "Short snippet (whole sentence if ≤7 words, else clause with the expression). — Краткий перевод."
}
```

```bash
node --env-file=.env --experimental-strip-types scripts/vocabulary/find-phrasal-verbs.mts in/painting-the-fence.txt out/painting-the-fence.lemma.phrasal-verb-candidates.json
```

## find-phrasal-verb-candidates.mts

Matches a lemma-form text against `resources/phrasal-verbs.json` without calling an LLM. Saves candidates to `out/<name>.phrasal-verb-candidates.json`.

Each entry:
```json
{
  "phrasal_verb": "dictionary form from resources",
  "context": "sentence containing the match"
}
```

```bash
node --experimental-strip-types scripts/vocabulary/find-phrasal-verb-candidates.mts in/painting-the-fence.lemma.txt
```

## to-lemma-forms.mts

Converts a story to learner-oriented lemma forms with the same layout as the input (paragraph breaks, line breaks, punctuation) and saves it to `out/<name>.lemma.txt`.

Example: `He was looking forward to seeing her again.` → `He be look forward to see she again.`

```bash
node --env-file=.env --experimental-strip-types scripts/vocabulary/to-lemma-forms.mts in/painting-the-fence.txt
```
