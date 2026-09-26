#!/usr/bin/env python3
"""Draws public/og.jpg, the 1200x630 card a link to this site unfurls into
on LinkedIn, Facebook, Slack, Zalo and X. Without it those previews are a
bare title, or whatever image the crawler guesses at.

    python3 scripts/build-og-image.py

The card is the dark theme, since that is the site's default: the navy
ground, the name, the role, the photo, and the hero line art on the right.
Colours are read out of src/app/globals.css rather than restated, so the card
follows the palette if the palette moves. The line art is the keyed hero
(scripts/key-ground.py) put through the same invert + hue-rotate(180deg) the
page applies to it in the dark theme (src/styles/site/illustration.css).

JPEG, not PNG: a flat ground with thin lines and one photo, under the 40 KB
per-image ceiling in scripts/check-budget.mjs, and every unfurler reads it.
The font is a system face - Pillow cannot draw a variable woff2 by weight,
and this runs on a developer machine, not in CI; the output is committed.
"""
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'og.jpg'
W, H = 1200, 630
CEILING = 40 * 1024

css = (ROOT / 'src' / 'app' / 'globals.css').read_text()


def token(name):
    m = re.search(rf'--{re.escape(name)}:\s*(#[0-9a-fA-F]{{6}})', css)
    if not m:
        sys.exit(f'token --{name} not found in globals.css')
    h = m.group(1)
    return tuple(int(h[i : i + 2], 16) for i in (1, 3, 5))


GROUND = token('base-palette-navy-950')
SURFACE = token('base-palette-navy-900')
BLUE = token('base-palette-blue-600')
CYAN = token('base-palette-cyan-500')
INK = (238, 242, 247)  # --base-foreground, dark theme (a literal there too)
MUTED = (154, 167, 184)  # --base-muted-foreground, dark theme

FONT_DIRS = ['/System/Library/Fonts', '/System/Library/Fonts/Supplemental', '/Library/Fonts']


def font(names, size):
    for d in FONT_DIRS:
        for n in names:
            p = Path(d) / n
            if p.exists():
                return ImageFont.truetype(str(p), size)
    sys.exit(f'none of {names} found; install one or add a path to FONT_DIRS')


BOLD = ['Arial Bold.ttf', 'DejaVuSans-Bold.ttf']
REGULAR = ['Arial.ttf', 'DejaVuSans.ttf']


def hue_rotate_180(rgb):
    """The CSS filter matrix for hue-rotate(180deg), from the Filter Effects
    spec. Paired with an invert it flips lightness and keeps the hue."""
    c, s = -1.0, 0.0
    m = np.array(
        [
            [0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928],
            [0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.140, 0.072 - c * 0.072 - s * 0.283],
            [0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072],
        ]
    )
    return np.clip(rgb @ m.T, 0, 255)


# Ground: flat navy with the page's blue glow in the top right.
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
glow = np.exp(-(((xx - 930) / 520) ** 2 + ((yy - 120) / 420) ** 2))
ground = np.array(GROUND, np.float32)[None, None, :] * (1 - 0.22 * glow[..., None]) + np.array(
    BLUE, np.float32
)[None, None, :] * (0.22 * glow[..., None])
card = Image.fromarray(ground.astype(np.uint8), 'RGB')

# The hero art, dark-theme version, on the right.
art = Image.open(ROOT / 'public' / 'images' / 'illustrations' / 'hero.webp').convert('RGBA')
a = np.asarray(art).astype(np.float32)
rgb = hue_rotate_180(255 - a[..., :3])
art = Image.fromarray(np.dstack([rgb, a[..., 3]]).astype(np.uint8), 'RGBA').resize((560, 560), Image.LANCZOS)
card.paste(art, (W - 560 - 30, (H - 560) // 2), art)

draw = ImageDraw.Draw(card)
x = 72

# Photo, round, with a cyan ring - the live dot's colour.
photo = Image.open(ROOT / 'public' / 'profile.webp').convert('RGB').resize((112, 112), Image.LANCZOS)
mask = Image.new('L', (448, 448), 0)
ImageDraw.Draw(mask).ellipse((0, 0, 447, 447), fill=255)
mask = mask.resize((112, 112), Image.LANCZOS)
draw.ellipse((x - 4, 118 - 4, x + 112 + 3, 118 + 112 + 3), fill=CYAN)
card.paste(photo, (x, 118), mask)

draw.text((x, 262), 'Công Anh Dũng', font=font(BOLD, 68), fill=INK)
draw.text((x, 352), 'AI/ML Systems Architect', font=font(BOLD, 34), fill=CYAN)
draw.text((x, 402), 'Infrastructure & MLOps · Speech & LLM services', font=font(REGULAR, 26), fill=MUTED)
draw.text((x, 440), 'Hanoi, Vietnam', font=font(REGULAR, 26), fill=MUTED)

# The address, in a pill at the foot, so a screenshot of the card still says
# where the site is.
url = 'portfolio-dungca.ai-innovation-homelab.org'
f = font(REGULAR, 22)
tw = draw.textlength(url, font=f)
draw.rounded_rectangle((x, 520, x + tw + 36, 520 + 44), radius=22, fill=SURFACE, outline=(40, 52, 70))
draw.text((x + 18, 530), url, font=f, fill=INK)

for q in range(88, 50, -4):
    card.save(OUT, 'JPEG', quality=q, optimize=True, progressive=True, subsampling=0 if q >= 80 else 2)
    if OUT.stat().st_size <= CEILING:
        break
size = OUT.stat().st_size
print(f'{OUT.relative_to(ROOT)}  {W}x{H}  q{q}  {size / 1024:.1f} KB')
if size > CEILING:
    sys.exit('over the 40 KB ceiling')
