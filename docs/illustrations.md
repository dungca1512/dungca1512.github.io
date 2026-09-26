# Illustrations — seven generated scenes, twenty-one files, 40 KB each

Seven names — `hero`, `expertise`, `work`, `experience`, `capabilities`,
`writing`, `contact` — each shipped in three formats under
`public/images/illustrations/`. `src/components/site/illustration.tsx` emits the
`<picture>` that offers avif, then webp, then the jpg.

A visitor on a modern browser downloads the avif set: **146 KB for all seven**.
The avif and webp files carry alpha — the generated ground is keyed out, so
the art sits on the page in either theme with no plate behind it (see
[The ground is keyed out](#the-ground-is-keyed-out)). The alpha plane is what
took the set from 113 KB to this.

| Name           | avif KB | webp KB | jpg KB |
| -------------- | ------- | ------- | ------ |
| `hero`         | 28.9    | 38.1    | 34.3   |
| `expertise`    | 13.1    | 15.1    | 22.0   |
| `work`         | 16.3    | 17.6    | 21.4   |
| `experience`   | 22.6    | 25.6    | 25.3   |
| `capabilities` | 30.0    | 36.6    | 37.1   |
| `writing`      | 17.5    | 23.1    | 24.9   |
| `contact`      | 17.5    | 20.2    | 20.4   |

---

## Regenerating them

```bash
node scripts/generate-illustrations.mjs            # every name, into raw/
node scripts/generate-illustrations.mjs hero work  # or just these
./scripts/compress-illustrations.sh
npx vitest run tests/illustrations.test.ts tests/budget.test.ts
```

`scripts/illustration-prompts.mjs` holds the prompts the generator sends — it,
not this document, is what runs. This document explains why each clause is
there. The generator needs `GEMINI_API_KEY` in `.env` (gitignored, never
committed); it sends the key to Google's `generativelanguage` endpoint and
nowhere else, and never prints it, not even in an error.

`tests/illustrations.test.ts` is what keeps the three lists — prompts, files on
disk, names rendered in `src/` — from drifting apart.

## The palette, which every prompt locks

These are the site's tokens. A generated image that drifts off them will read as
a sticker on the page rather than part of it.

| Role           | Hex       |
| -------------- | --------- |
| Background     | `#f5f5f5` |
| Primary (blue) | `#2b7fd4` |
| Accent (teal)  | `#40a69f` |
| Ink            | `#1f1f1f` |
| Warm highlight | `#ffb319` |
| Dark band      | `#0b0b0b` |

## The style

The first set of four was drawn as flat geometric shapes: sparse, correct, and
lifeless — large plain rectangles with nothing in them. The brief was that the
art should look hand-inked, like the reference portfolio's, and carry some
evidence of what the work actually is. The current `SHARED` clause is the
redraw:

> Hand-drawn editorial line illustration in a modern flat style. Confident
> black outlines of even weight, slightly loose and organic, as if inked by
> hand. Objects float free on the page with generous space between them, joined
> by thin lines, with small scattered accents: dots, tiny hollow circles, short
> dashes. Flat colour only — no gradients, no shading, no drop shadows, no
> texture, no photorealism. Most shapes stay unfilled or pale grey; fill
> sparingly with #2b7fd4 blue, #40a69f teal and #ffb319 amber. The background is
> solid #f5f5f5 and fills the entire canvas edge to edge: no frame, no border,
> no inset panel, no vignette. No text, no letters, no numbers, no logos, no
> watermark, no labels of any kind. Nothing is cropped by the canvas edge; keep
> a wide empty margin on all four sides. Square composition, 2048x2048.

`contact` uses the same clause with `#0b0b0b` for the background and "unfilled
with white outlines" in place of "unfilled or pale grey", because it sits on the
dark band. `tests/illustrations.test.ts` asserts that split.

Two clauses are scar tissue rather than taste:

- **"no frame, no border, no inset panel, no vignette."** A take of `contact`
  put the dark scene on a white page as an inset panel, which on the dark band
  would have shown as a white frame around the picture.
- **"Nothing is cropped by the canvas edge."** "Two figures at opposite edges of
  the frame" — the wording an earlier draft of this document used — was read
  literally and produced two figures sliced in half by the border.

Both failures are cheap to check without looking: sample the border pixels and
assert none of them contradicts the background.

## What the pipeline does

`scripts/compress-illustrations.sh`, per name:

| Output  | Width                   | Encoder                                          |
| ------- | ----------------------- | ------------------------------------------------ |
| `.avif` | 832, or 1280 for `hero` | `avifenc -q 54 --qalpha <alpha q> --speed 4`     |
| `.webp` | 832, or 1280 for `hero` | `cwebp -q <quality> -alpha_q <alpha q> -m 6`     |
| `.jpg`  | 640, or 832 for `hero`  | Pillow, quality from table, ground kept (opaque) |

Both modern formats encode from a keyed RGBA PNG that
`scripts/key-ground.py` writes; the jpg is resized straight from the source.

### The ground is keyed out

The art is generated on a flat ground and used to ship with it, so every
picture was a plate: a pale square on the light page and — after the dark
theme's `invert(1) hue-rotate(180deg)` — a dark square on the navy one.
`scripts/key-ground.py` turns that ground into transparency:

- **Grey pixels** — ink, its anti-aliasing, the pale fills — become the ink
  colour (black on a light ground, white on `contact`'s dark one) at the alpha
  that reproduces their lightness over the ground. The colour plane is one
  flat value under all the line work. An exact per-pixel unmix of every grey
  was tried first: it amplifies the generator's noise into the colour plane
  and measured 3–5× over the ceiling.
- **Coloured pixels** — the blue, teal and amber fills — are unmixed exactly
  and pushed towards solid by their chroma, so a fill stays a fill.
- **Within a few levels of the ground** is fully transparent. The ground
  wanders over about five levels, and that wander must not ship as a haze.

Over the ground it was drawn on, the keyed art composites back to the source
within a few levels. That is the check to repeat after changing the script.

Alpha is quantised (`ALPHA_Q=50`, `hero` at 40 via `alpha_q_for`). Lossless
alpha cost 5–10 KB more per file and put `hero` over the ceiling. `hero`'s webp
is nearly all alpha — its colour plane is one flat ink — so the alpha, not
`quality_for`, is its lever: at 50 it measured 206 bytes under the ceiling.

The jpg cannot carry alpha and keeps its ground. It is reached only by a
browser with neither AVIF nor WebP (below), for whom the plate is the old look.
`tests/illustrations.test.ts` reads the avif and webp containers and fails if
either loses its alpha.

### Why those widths

The pipeline used to encode everything at 1600px, on the stated belief that
1600 was "the widest any illustration is ever displayed at on a 2× screen".
That was never measured. Measured in Chrome against the built site at a 1920px
viewport, the rendered CSS widths are:

| Name        | CSS px | needs at 2× |
| ----------- | ------ | ----------- |
| `hero`      | 497    | 994         |
| `expertise` | 352    | 704         |
| `work`      | 320    | 640         |
| `contact`   | 320    | 640         |

So every section illustration was shipping roughly **2.3× the pixels a visitor
can see**. That surplus is what made the redrawn, denser art blow the 40 KB
ceiling: `capabilities` measured 95 KB jpg / 79 KB webp / 49 KB avif at the old
settings. At 832px — which still clears the widest 2× requirement with room —
the same file, at the same quality, is 37 / 34 / 24 KB.

This matters as a rule, not just as a fix. **When an image will not fit, check
what width it is actually displayed at before you touch the quality, and touch
the ceiling last of all.** The previous version of this document said "if an
image will not fit, the image is too busy" — that advice cost this site a set of
illustrations, because the real answer was that the image was too wide.

`hero` is the exception. It is used twice: as the portrait in the hero band at
497 CSS px, and full-bleed in the intro curtain
(`src/styles/layout/intro-curtain.css`), where it covers the viewport. 1280 is
0.67× of a 1920px screen, so the curtain is mildly soft for the two seconds it
is on screen — and comfortably over the 994 device px the lasting view needs.

`quality_for` carries two entries, `hero` at 62 and `capabilities` at 65. Both
measured over the ceiling at the default 72 after the width change, and lowering
a name's quality is the sanctioned lever. Raising `CEILING`, or the 40 KB in
`tests/budget.test.ts`, is not — and this round did not need to.

### Why the jpg is narrower again

It is reached only by a browser that supports neither AVIF nor WebP — pre-2020
Safari, IE — and JPEG is the worst of the three formats at exactly what these
images are made of: thin dark lines on a near-white field. The `<img>` carries
explicit `width`/`height` and the CSS sizes the box, so the only consequence of
the smaller fallback is mild softness, for a share of visitors near zero.

### Why Pillow

The resize, key and jpg steps run through Python + Pillow (and numpy, for the
key), not ImageMagick: the machine these were made on has no `magick`, and both
are a `pip install pillow numpy` away on any platform. The script checks for `python3`,
`cwebp` and `avifenc` up front and fails by name if one is missing.

## Where each one is placed

| Name           | Section              | Placement                            |
| -------------- | -------------------- | ------------------------------------ |
| `hero`         | Hero + intro curtain | portrait, and the full-bleed curtain |
| `expertise`    | Expertise            | side rail beside the areas grid      |
| `work`         | Work                 | case-study art                       |
| `experience`   | Experience           | sticky side rail beside the timeline |
| `capabilities` | Capabilities         | beside the section heading           |
| `writing`      | Writing              | beside the section heading           |
| `contact`      | Contact (dark band)  | beside the call to action            |

The Proof bar is deliberately left without art: it is a thin band of four
numbers, and a picture in it would compete with the only thing it says.

## The page's own background

Separate from these files, and deliberately not an image:
`src/styles/layout/tech-backdrop.css` draws a faint circuit board under the
whole page in CSS gradients — traces, a diagonal, vias, a dot matrix — from
`--base-border`, `--base-info` and `--base-accent`. A raster would have cost a
slice of this budget for something nobody is meant to look at, and would not
flip with the theme.

## Provenance

Generated with Google's `gemini-3-pro-image` at `imageSize: 2K`, from
`scripts/illustration-prompts.mjs` verbatim. The 2048px originals stay in
`raw/`, which is gitignored — the twenty-one compressed files are the only
images in the repository.

These are machine-generated images and carry Google's SynthID watermark. Nothing
on the page claims otherwise; all seven are decorative, `alt=""`, and restate
something the adjacent text already says.
