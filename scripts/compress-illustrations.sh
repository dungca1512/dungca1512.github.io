#!/usr/bin/env bash
# Three formats per image: avif for browsers that take it, webp for the rest,
# jpg as the floor. <picture> picks; see src/components/site/illustration.tsx.
#
# 1600px wide is the largest any illustration is ever displayed at on a 2x
# screen. Shipping the generator's native 2048 buys nothing a visitor can see.
#
# The jpg is encoded at 1200 instead. It is reached only by a browser that
# supports neither AVIF nor WebP - pre-2020 Safari, IE - and JPEG is the worst
# of the three formats at exactly what these images are made of: thin dark
# lines on a near-white field. At 1600 the two densest images do not fit under
# the 40KB ceiling at any quality worth shipping (hero measured 42.9KB at
# quality 30). Rather than raise the ceiling, the fallback gets fewer pixels:
# the <img> carries explicit width/height and the CSS sizes the box, so the
# only consequence is mild softness, for a share of visitors near zero.
#
# The resize-and-encode-to-jpg step runs through Python + Pillow rather than
# ImageMagick. The machine that produced these four files has no ImageMagick
# and Pillow was already there; Pillow is a `pip install pillow` away on any
# platform, which is a softer dependency than a system image toolchain. The
# output is the same: a baseline-progressive JPEG with every metadata chunk
# dropped.
set -euo pipefail

SRC="raw"
OUT="public/images/illustrations"
WIDTH=1600
JPG_WIDTH=1200
QUALITY=72
CEILING=40960

# Per-image quality, for anything that will not fit under the ceiling at the
# default. Lowering a number here is the sanctioned fix; raising CEILING, or
# the 40KB in tests/budget.test.ts, is not. hero is the one that needs it: it
# is the densest of the four in fine line work and lands at 41KB at 72.
quality_for() {
  case "$1" in
    hero) echo 62 ;;
    *) echo "$QUALITY" ;;
  esac
}

for tool in python3 cwebp avifenc; do
  command -v "$tool" >/dev/null || { echo "missing required tool: $tool" >&2; exit 1; }
done

mkdir -p "$OUT"
status=0

for file in "$SRC"/*.png; do
  name=$(basename "$file" .png)
  q=$(quality_for "$name")

  # Two intermediates: the full-width one the modern formats encode from, and
  # the narrower one that becomes the shipped jpg.
  python3 - "$file" "$OUT/$name.full.jpg" "$WIDTH" 95 <<'PY'
import sys
from PIL import Image
src, dst, width, quality = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
im = Image.open(src).convert('RGB')
if im.width != width:
    im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
# No exif=, no icc_profile=: dropping them is the point.
im.save(dst, 'JPEG', quality=quality, optimize=True)
PY

  python3 - "$file" "$OUT/$name.jpg" "$JPG_WIDTH" "$q" <<'PY'
import sys
from PIL import Image
src, dst, width, quality = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
im = Image.open(src).convert('RGB')
if im.width != width:
    im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
im.save(dst, 'JPEG', quality=quality, optimize=True, progressive=True)
PY

  cwebp -quiet -q "$q" -m 6 "$OUT/$name.full.jpg" -o "$OUT/$name.webp"
  avifenc -q 54 --speed 4 "$OUT/$name.full.jpg" "$OUT/$name.avif" >/dev/null
  rm -f "$OUT/$name.full.jpg"

  for ext in jpg webp avif; do
    size=$(wc -c < "$OUT/$name.$ext")
    printf '%-24s %6s KB\n' "$name.$ext" "$((size / 1024))"
    if [ "$size" -gt "$CEILING" ]; then
      echo "  OVER the 40KB ceiling - lower this name's quality_for, not the ceiling." >&2
      status=1
    fi
  done
done

exit "$status"
