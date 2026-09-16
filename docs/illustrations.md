# Illustrations — four generated scenes, twelve files, 40 KB each

Four names — `hero`, `expertise`, `work`, `contact` — each shipped in three
formats under `public/images/illustrations/`. `src/components/site/illustration.tsx`
emits the `<picture>` that offers avif, then webp, then the jpg.

This replaces an earlier version of this document, which described three inline
SVG scenes drawn by hand into `index.html`. That page no longer exists: the site
was rebuilt on Next.js, `index.html` and `style.css` went with it, and the
`<picture>` route is what the components now ask for.

The reference portfolio ships its generator's raw output — seven files, 26.5 MB,
at 5504×3072, for pictures never displayed above 1600px. This ships the same
four-format-per-image idea at 40 KB a file, enforced by `tests/budget.test.ts`
rather than by intent. A visitor on a modern browser downloads the avif set:
43 KB for all four.

---

## Regenerating them

```bash
# 1. put a 2048×2048 png per name in raw/   (raw/ is gitignored)
# 2.
./scripts/compress-illustrations.sh
npx vitest run tests/budget.test.ts
```

The script prints twelve sizes and exits non-zero if any is over 40 KB. If one
comes out over, lower that name's number in the script's `quality_for` table —
never the ceiling.

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

## Shared style clause — append to every prompt

> Flat vector illustration, clean geometric line work, generous white space,
> limited palette of exactly #2b7fd4 blue, #40a69f teal, #1f1f1f near-black and
> #ffb319 amber on a #f5f5f5 background. No gradients, no drop shadows, no
> textures, no photorealism. No text, no letters, no numbers, no logos, no
> watermark. Centred composition with wide margins. Square, 2048×2048.

## 1. `hero` — the portrait circle

> A single figure at a standing desk seen three-quarter from behind, working on
> a system diagram made of connected nodes floating in front of them. The nodes
> are simple circles joined by straight lines. Calm and deliberate, not
> frantic. [+ shared style clause]

## 2. `expertise` — the stack

> Four horizontal layers stacked like a cross-section of infrastructure, seen
> straight on. Each layer is ONE row of three or four large, plain, flat shapes:
> wide rectangles for servers at the bottom, rounded rectangles for containers
> above, a small ring of six circles joined by straight lines for the model in
> the middle, and one plain rectangle for the interface on top. Thin vertical
> lines connect the layers. No inner detail inside any shape — no hatching, no
> slots, no grids, no dots, no tiny rules. Very sparse, mostly empty background,
> a wide empty margin on all four sides, nothing cropped by the canvas edge.
> [+ shared style clause]

The sparseness clauses are not decoration. The first take of this one drew three
browser windows, four node diagrams, hatched containers and dotted server racks:
97 KB as a 1600px jpg, against a 40 KB ceiling, and no quality setting saves it —
JPEG is at its worst on exactly that, thin dark lines on a near-white field. The
sparse redraw is 27 KB. **If an image will not fit, the image is too busy; the
ceiling is not too low.**

## 3. `work` — shipped

> A pipeline running left to right: a rough sketch enters on the left, passes
> through three processing stages drawn as simple geometric gates, and exits on
> the right as a finished rectangular panel. [+ shared style clause]

## 4. `contact` — the signal

> Two simple standing figures, one on the left third of the canvas and one on
> the right third, both drawn whole with a wide empty margin between them and
> the canvas edge — neither figure is cropped or touches the border. A single
> clean line arcs between them, made of evenly spaced amber dots. Open and
> uncluttered. The background is solid #0b0b0b and fills the entire canvas edge
> to edge: no white border, no frame, no inset panel. [+ shared style clause,
> with `#0b0b0b` in place of the `#f5f5f5` background]

This one sits on the dark band, hence `#0b0b0b`. The framing clauses are also
load-bearing: "two figures at opposite edges of the frame" — the wording the
first draft of this document used — was read literally, and produced two figures
sliced in half by the canvas border. A separate take put the dark scene on a
white page as an inset panel, which on the dark band would have shown as a white
frame around the picture. Both failures are cheap to check without looking:
sample the border pixels and assert none of them is light.

## What the pipeline does

`scripts/compress-illustrations.sh`, per name:

| Output  | Width | Encoder                    |
| ------- | ----- | -------------------------- |
| `.avif` | 1600  | `avifenc -q 54 --speed 4`  |
| `.webp` | 1600  | `cwebp -q <quality> -m 6`  |
| `.jpg`  | 1200  | Pillow, quality from table |

1600 is the widest any illustration is displayed at on a 2× screen, so the
generator's native 2048 buys nothing a visitor can see.

The jpg is narrower on purpose. It is reached only by a browser that supports
neither AVIF nor WebP — pre-2020 Safari, IE — and at 1600 the hero does not fit
under the ceiling at any quality worth shipping (42.9 KB at quality 30). The
`<img>` carries explicit `width`/`height` and the CSS sizes the box, so the only
consequence of the smaller fallback is mild softness, for a share of visitors
near zero. That is the trade this repo takes over moving a budget.

The resize-and-encode-to-jpg step runs through Python + Pillow, not ImageMagick:
the machine these four were made on has no `magick`, and Pillow is a
`pip install pillow` away on any platform. The script checks for `python3`,
`cwebp` and `avifenc` up front and fails by name if one is missing.

## Provenance

Generated with Google's `gemini-3-pro-image` at `imageSize: 2K`, via
`generativelanguage.googleapis.com`, from the prompts above verbatim. The API key
lives in `.env`, which `.gitignore` covers and which has never been committed.
The 2048px originals stay in `raw/`, also gitignored — the twelve compressed
files are the only images in the repository.

These are machine-generated images and carry Google's SynthID watermark. Nothing
on the page claims otherwise; all four are decorative, `alt=""`, and restate
something the adjacent text already says.
