#!/usr/bin/env bash
# Three formats per image: avif for browsers that take it, webp for the rest,
# jpg as the floor. <picture> picks; see src/components/site/illustration.tsx.
#
# avif and webp carry ALPHA: scripts/key-ground.py lifts the generated ground
# off first, so the art sits on the page - light or dark - with no plate
# behind it. The jpg cannot, and keeps its ground; see below for who gets it.
#
# WIDTH is per name, because the page displays these at wildly different
# sizes. Measured in Chrome at a 1920px viewport, against the built site:
#
#   hero       497 CSS px in the hero band - but ALSO full-bleed in the
#              intro curtain, where it covers the whole viewport
#   expertise  352 CSS px      work   320 CSS px      contact  320 CSS px
#
# So every name except hero needs 704 device px at 2x, and 1024 covers that
# with room to spare. hero keeps the wide encode for the curtain. The old
# pipeline shipped everything at 1600 - roughly 2.3x the pixels anything but
# hero can show - which is what made the denser line art blow the 40KB
# ceiling. Fewer pixels, not worse art, is the fix: see docs/illustrations.md.
#
# The jpg is narrower again. It is reached only by a browser that supports
# neither AVIF nor WebP - pre-2020 Safari, IE - and JPEG is the worst of the
# three formats at exactly what these images are made of: thin dark lines on
# a near-white field. The <img> carries explicit width/height and the CSS
# sizes the box, so the only consequence is mild softness, and the old
# ground showing as a plate, for a share of visitors near zero. That is the
# trade this repo takes over moving a budget.
#
# The resize, key and jpg steps run through Python + Pillow (and numpy, for
# the key) rather than ImageMagick. The machine that produced these files has no ImageMagick and
# Pillow was already there; Pillow is a `pip install pillow` away on any
# platform, which is a softer dependency than a system image toolchain.
set -euo pipefail

SRC="raw"
OUT="public/images/illustrations"
WIDTH=832
JPG_WIDTH=640
QUALITY=72
ALPHA_Q=50
CEILING=40960

# Per-image overrides, for anything the defaults do not suit. Lowering a
# quality here is the sanctioned fix for an image over the ceiling; raising
# CEILING, or the 40KB in tests/budget.test.ts, is not.
width_for() {
  case "$1" in
    # hero is also the intro curtain, which covers the viewport. 1280 is
    # 0.67x of a 1920px screen, so the curtain is mildly soft for the two
    # seconds it is on screen - and comfortably over the 994 device px the
    # hero portrait needs on a 2x display, which is the lasting view.
    hero) echo 1280 ;;
    *) echo "$WIDTH" ;;
  esac
}

jpg_width_for() {
  case "$1" in
    hero) echo 832 ;;
    *) echo "$JPG_WIDTH" ;;
  esac
}

quality_for() {
  case "$1" in
    # The densest two. hero carries a figure, a desk and a floating diagram;
    # capabilities carries eight separate objects. Both measured over the
    # ceiling at the default, and this is the sanctioned lever.
    hero) echo 62 ;;
    capabilities) echo 65 ;;
    *) echo "$QUALITY" ;;
  esac
}

alpha_q_for() {
  case "$1" in
    # hero is the widest encode and the one whose webp is almost all alpha:
    # at the default it measured 206 bytes under the ceiling, which is no
    # margin at all. Its colour plane is one flat ink, so lowering its
    # colour quality buys nothing; the alpha is the lever.
    hero) echo 40 ;;
    *) echo "$ALPHA_Q" ;;
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
  w=$(width_for "$name")
  jw=$(jpg_width_for "$name")
  aq=$(alpha_q_for "$name")

  # Two outputs from the source: the keyed full-width PNG the modern formats
  # encode from (alpha intact - a jpg intermediate would drop it), and the
  # narrower jpg that ships as is.
  python3 scripts/key-ground.py "$file" "$OUT/$name.full.png" "$w"

  python3 - "$file" "$OUT/$name.jpg" "$jw" "$q" <<'PY'
import sys
from PIL import Image
src, dst, width, quality = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
im = Image.open(src).convert('RGB')
if im.width != width:
    im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
im.save(dst, 'JPEG', quality=quality, optimize=True, progressive=True)
PY

  # Alpha is quantised in both (-alpha_q, --qalpha), at the level where the
  # anti-aliased line edges still read clean over both grounds. Lossless
  # alpha measured 5-10KB more per file, and the hero over the ceiling.
  cwebp -quiet -q "$q" -alpha_q "$aq" -m 6 "$OUT/$name.full.png" -o "$OUT/$name.webp"
  avifenc -q 54 --qalpha "$aq" --speed 4 "$OUT/$name.full.png" "$OUT/$name.avif" >/dev/null
  rm -f "$OUT/$name.full.png"

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
