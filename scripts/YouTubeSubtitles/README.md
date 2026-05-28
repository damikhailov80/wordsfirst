# YouTube Subtitles Scripts

Download YouTube auto-generated subtitles and transform them into:
- **Plain text** — full transcript as a clean `.txt` file
- **Word timecodes** — per-word `[startMs, endMs]` pairs as a `.json` file

Then manually format the transcript into a readable `.ftxt` file and verify it with `verify.ts`.

## Requirements

- [yt-dlp](https://github.com/yt-dlp/yt-dlp): `brew install yt-dlp`
- Node.js + [tsx](https://github.com/privatenumber/tsx): `npm install -g tsx`

## Usage

### 1. Download subtitles

```bash
chmod +x download.sh
./download.sh "https://www.youtube.com/watch?v=VIDEO_ID" ./output
```

Produces a `.en.json3` file in `./output/`.

### 2. Transform to text + timecodes

```bash
npx tsx transform.ts "./output/Video Title [VIDEO_ID].en.json3" ./output
```

Produces:
- `[VIDEO_ID].txt` — raw transcript, words joined with spaces
- `[VIDEO_ID].json` — per-word `[startMs, endMs]` timecodes (index-aligned with `.txt` words)
- `[VIDEO_ID].json3` — copy of the source file

### 3. Format the transcript

Manually edit a copy of the `.txt` file, adding paragraphs, sentences, and punctuation. Save it as `[VIDEO_ID].ftxt`.

### 4. Verify the formatted transcript

```bash
npx tsx verify.ts output/[VIDEO_ID].txt output/[VIDEO_ID].ftxt
```

Checks that the `.ftxt` preserves the exact word sequence of the original (ignoring punctuation and letter case). Uses LCS diff to report only real differences — substitutions, deletions, and insertions — with surrounding context.

### One-liner (download + transform)

```bash
./download.sh "https://www.youtube.com/watch?v=VIDEO_ID" ./output && \
  npx tsx transform.ts ./output/*.en.json3 ./output
```

## Output formats

### `.txt`

Raw transcript, all words joined with spaces, no punctuation:

```
when I was 6ye old I received my gift my first grade teacher had this brilliant idea...
```

### `.json`

Array of `[startMs, endMs]` pairs, one entry per word (index-aligned with `.txt`):

```json
[[12759,12880],[12880,13000],[13000,13200],...]
```

### `.ftxt`

Manually formatted transcript with paragraphs, sentences, and punctuation:

```
When I was 6 years old, I received my gift. My first grade teacher had this
brilliant idea — she wanted us to experience receiving gifts...
```

## Output directory

```
output/
  [VIDEO_ID].txt       raw transcript
  [VIDEO_ID].json      per-word timecodes
  [VIDEO_ID].json3     source subtitle file
  [VIDEO_ID].ftxt      formatted transcript (created manually)
```
