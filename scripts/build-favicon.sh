#!/usr/bin/env bash
# Turns one generated concept in raw/icon/ into the shipped tab icon.
#
#   scripts/build-favicon.sh            # the chosen concept, "node"
#   scripts/build-favicon.sh orbit      # try another one
#
# It does NOT simply resize the 2048px PNG. The generated image antialiases its
# own edges at 2048px and its "blue" comes back as #2f7ccc rather than the
# brand #2b7fd4 - a model matches a colour by eye, not by value. Resizing that
# straight down carries both problems into a 16px grid, where there is no room
# for either.
#
# So the mark is separated from the ground at full resolution as a 1-bit mask,
# the MASK is what gets resized, and the colours are applied afterwards from
# constants. The antialiasing is then computed for the size being shipped
# instead of being inherited from a size 128x larger, and the blue is the token
# value rather than an approximation of it.
#
# FILL is 0.86, not the 0.65 the prompt asked for. Compared 0.76 and 0.86 side
# by side at 16px, blown up 14x: the bigger mark holds its three nodes and the
# smaller one starts to close up. A tab icon has no use for breathing room.
set -euo pipefail

NAME="${1:-node}"
SRC="raw/icon/$NAME.png"
[ -f "$SRC" ] || { echo "no $SRC - run: node scripts/generate-favicon.mjs $NAME" >&2; exit 1; }

command -v python3 >/dev/null || { echo "missing required tool: python3" >&2; exit 1; }

python3 - "$SRC" <<'PY'
import sys
from PIL import Image

SRC = sys.argv[1]
BLUE = (43, 127, 212)        # #2b7fd4, the blue-500 token in globals.css
WHITE = (255, 255, 255)
FILL = 0.86                  # share of the tile the mark spans on its long side
THRESHOLD = 170              # blue ground is luma ~112, the mark is 255

mask_hi = Image.open(SRC).convert('L').point(lambda p: 255 if p > THRESHOLD else 0)
box = mask_hi.getbbox()
if box is None:
    sys.exit('build-favicon: the source has no mark on its ground')
mark = mask_hi.crop(box)

def tile(size):
    scale = (size * FILL) / max(mark.size)
    w, h = max(1, round(mark.width * scale)), max(1, round(mark.height * scale))
    mask = Image.new('L', (size, size), 0)
    mask.paste(mark.resize((w, h), Image.LANCZOS), ((size - w) // 2, (size - h) // 2))
    out = Image.new('RGB', (size, size), BLUE)
    out.paste(Image.new('RGB', (size, size), WHITE), (0, 0), mask)
    return out

# One .ico carrying four sizes rather than four <link> tags. Browsers pick the
# one they want, and a bare /favicon.ico is also what anything that never reads
# the HTML - a feed reader, a link unfurler, an older browser - goes looking
# for. 64 is there for the 2x display that draws a 32px tab slot.
sizes = [16, 32, 48, 64]
tile(64).save('public/favicon.ico', format='ICO', sizes=[(s, s) for s in sizes])

# iOS home screen. It rounds the corners itself, so this ships square; it also
# composites onto white if given transparency, which is why there is none.
tile(180).save('public/apple-touch-icon.png', format='PNG', optimize=True)

for path in ('public/favicon.ico', 'public/apple-touch-icon.png'):
    import os
    print(f'{path:<32}{os.path.getsize(path) / 1024:6.1f} KB')
PY
