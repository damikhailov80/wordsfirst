#!/usr/bin/env bash
set -euo pipefail

URL="${1:?Usage: ./download.sh <YouTube URL> [output_dir]}"
OUTPUT_DIR="${2:-.}"

mkdir -p "$OUTPUT_DIR"

yt-dlp \
  --write-auto-subs \
  --sub-lang en \
  --skip-download \
  --sub-format json3 \
  --output "$OUTPUT_DIR/%(title)s [%(id)s]" \
  "$URL"

echo "Done. Files saved to: $OUTPUT_DIR"
