"""Lift an illustration off its generated ground: RGB in, RGBA out.

The art is generated on a flat ground (docs/illustrations.md) and used to ship
with it, so every picture was a plate: a pale square on the light page, and -
after the dark theme's invert - a near-black one on the navy page. This turns
the ground into transparency, so the lines sit on whatever the page is.

Usage: python3 scripts/key-ground.py SRC.png DST.png WIDTH

How, in three parts, all measured against the ground colour (the median of an
8px border, which the prompts keep empty):

- Grey pixels - the ink, its anti-aliasing, and the pale fills - become the
  ink colour (black on a light ground, white on a dark one) at whatever
  alpha reproduces their lightness over the ground. The colour plane is then
  one flat value across all line work, which is what keeps the file inside
  the 40KB ceiling: an honest per-pixel unmix of every grey amplifies the
  generator's noise into the colour plane and measured 3-5x over.
- Coloured pixels (blue, teal, amber fills) are unmixed exactly and pushed
  towards solid by their chroma, so a fill stays a fill rather than turning
  into a tint of the page behind it.
- Anything within a few levels of the ground is fully transparent. The
  ground itself is not one colour - it wanders over about five levels - and
  that wander must not come out as a haze.

Over the ground it was drawn on, the output composites back to the input
within a few levels; that is the test to apply after changing anything here.
"""

import sys

import numpy as np
from PIL import Image, ImageFilter

# Alpha at which a grey reaches solid ink. Below 1 so the drawn line - which
# is dark grey, not black - lands fully opaque.
INK_AT = 0.85
# Distance from the ground (max channel, 0-255) over which alpha fades in.
NOISE_FROM, NOISE_TO = 5, 10
# Chroma over which a pixel is treated as a colour fill rather than a grey.
CHROMA_FROM, CHROMA_TO = 14, 54


def key(im: Image.Image) -> Image.Image:
    a = np.asarray(im.convert('RGB')).astype(np.float64)
    edge = np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3),
                           a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)])
    ground = np.median(edge, axis=0)
    ink = 255.0 if ground.mean() < 128 else 0.0
    diff = a - ground

    dist = np.abs(diff).max(-1)
    t = np.clip((dist - NOISE_FROM) / (NOISE_TO - NOISE_FROM), 0, 1)
    fade_in = t * t * (3 - 2 * t)

    # A pale fill is one flat grey with generator noise on it, and that noise
    # carried into alpha costs more bytes than the line work. Flatten it where
    # the pixel is faint; the lines, far from the ground, are left alone.
    lum = a.mean(-1)
    ground_lum = ground.mean()
    smooth = np.asarray(
        Image.fromarray(lum.round().astype(np.uint8)).filter(ImageFilter.MedianFilter(5))
    ).astype(np.float64)
    faint = np.abs(lum - ground_lum) < 0.25 * abs(ink - ground_lum)
    lum = np.where(faint, smooth, lum)
    grey_alpha = np.clip(np.abs(lum - ground_lum) / abs(ink - ground_lum) / INK_AT, 0, 1) * fade_in

    # The least alpha that reproduces the pixel over the ground, per channel.
    per = np.where(diff > 0, diff / np.maximum(255 - ground, 1), -diff / np.maximum(ground, 1))
    colour = np.clip((a.max(-1) - a.min(-1) - CHROMA_FROM) / (CHROMA_TO - CHROMA_FROM), 0, 1)
    colour_alpha = np.maximum(per.max(-1), colour)

    alpha = np.maximum(grey_alpha, colour * colour_alpha)
    safe = np.where(alpha > 0, alpha, 1)[..., None]
    unmixed = np.clip(ground + diff / safe, 0, 255)
    rgb = colour[..., None] * unmixed + (1 - colour[..., None]) * ink
    return Image.fromarray(np.dstack([rgb, alpha * 255]).round().astype(np.uint8), 'RGBA')


if __name__ == '__main__':
    src, dst, width = sys.argv[1], sys.argv[2], int(sys.argv[3])
    im = Image.open(src).convert('RGB')
    if im.width != width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    # No exif=, no icc_profile=: dropping them is the point.
    key(im).save(dst, 'PNG')
