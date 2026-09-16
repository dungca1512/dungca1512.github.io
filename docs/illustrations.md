# Illustrations — three drawn scenes, no image files

The page has three illustrations. None of them is a file. Each is inline SVG in
`index.html`, painted in `currentColor` through the tokens in `style.css`.

This replaces an earlier version of this document, which specified generated
raster images for the same three slots — prompts, `cwebp`/`avifenc` commands, a
40 KB-per-image budget and `<picture>` markup. That route was abandoned once the
reference turned out to contain the better answer. Keeping the old plan here
would describe a page that does not exist.

---

## Why drawn and not generated

The hands portfolio you sent me does both. Its hero is a generated raster, and
the C2PA manifest says so: `c2pa.created` → "Created by Google Generative AI",
`digitalSourceType` → `trainedAlgorithmicMedia`, plus a SynthID watermark. But
`src/components/work/project-art.tsx` is 7.5 KB of hand-written SVG, and its own
doc comment gives the reason:

> Dựng bằng SVG + token nên không có file ảnh nào, không có CLS, tự đúng ở cả
> hai theme.

That is the technique used here, for four reasons that a raster cannot match:

- **Weight.** All three scenes together are about a kilobyte gzipped. The
  reference's hero is a single 6,135,247-byte JPEG, and its seven images total
  26.5 MB — roughly 150× this entire site, which is 35.9 KB.
- **No layout shift.** The `viewBox` carries the aspect ratio, so the box is
  correct before anything loads. A raster needs `width`/`height` to avoid
  reflowing the page on arrival.
- **Both themes for free.** Faces are `currentColor` mixed into `--art-ground`.
  Drop a scene on the dark section and it re-inks itself; a raster would need a
  second file.
- **No licence.** Nothing was downloaded, so nothing has terms. (For reference,
  had we gone the pack route: unDraw is free with no attribution but forbids
  compiling its assets into a competing service and forbids AI training;
  Humaaans is CC0; Storyset *requires* attribution and restricts commercial use
  unless you pay for Flaticon Premium.)

---

## The three scenes

Three, not seven. The page is mostly text with real numbers in it, and an
illustration every two sections would argue with the content instead of framing
it. Each scene says something different — repeating one composition three times
is what makes a page look templated.

| Where | Size | What it draws |
| --- | --- | --- |
| Hero, `.hero-figure` | 320×320 in a 24rem blob | An isometric three-slab stack with the top slab lit, a voice entering as six bars, two cubes drifting. The platform, and what runs on it. |
| Case study, `.case-band` | 720×160 | The gateway end to end: speech in → one router → three providers → one answer back. The only picture on the page that states an architecture. |
| Expertise, `.section-head-art` | 200×180 | A field of nine cubes with one lifted out of its dashed socket. |

## How they are built

**One cube, defined once.** `<defs><g id="art-cube">` lives in the hero, because
the hero is the first scene on the page. The other two scenes reference it with
`<use href="#art-cube">`, which resolves across SVG boundaries because IDs are
document-wide. Each reused cube costs about 40 bytes.

**Move the hero and the other two lose their cubes.** That is the one fragile
thing here, and it is why the `<defs>` block carries a comment saying so.

**A solid is three faces of one colour at three weights**, never three colours:
`--art-top: 24%`, `--art-left: 14%`, `--art-right: 8%`. That is what lets the
same cube re-ink itself on paper and on the dark band and still read as one
object lit from one side.

**Faces are opaque, via `color-mix`, not `fill-opacity`.** This is not a style
preference — translucent faces let every solid behind them show through, and
three stacked slabs read as one piece of dirty glass. Each face is mixed *into*
`--art-ground`, so every surface that is not plain paper re-declares that token:

```css
.case-band       { --art-ground: var(--bg-muted); }
.section-head-art{ --art-ground: var(--bg-muted); }
.section--dark   { --art-ground: var(--bg-dark); }
.hero-figure-art { --art-ground: var(--art-blob); }
```

Forget one and the scene dropped there will mix paper-white into a near-black
band.

**`.art-lit` uses custom properties, not descendant selectors.** This cost a
debugging round: `.art-lit .art-top` does **not** match, because a descendant
selector cannot cross into the shadow tree that `<use>` builds, and every cube is
a `<use>`. Custom properties *do* inherit across that boundary. So `.art-lit`
sets `--art-top: 100%` and friends rather than restyling `.art-top`. Do not
"simplify" it back.

**Exactly one object per scene carries the accent**, and it is the one the scene
is about — the model on the stack, the router between callers and providers, the
node doing the work.

## Accessibility and motion

All three are `aria-hidden="true" focusable="false"` with no title. They are
decorative: each restates something the adjacent text already says, so announcing
them would make a screen reader say the same fact twice.

Every keyframe returns to its start frame (`0%, 100%` identical), so the sheet's
global `animation-duration: 1ms` reset under `prefers-reduced-motion` parks each
one at rest rather than mid-pose.

## Adding a fourth

1. Draw it with the existing primitives — `.art-top/.art-left/.art-right` for
   faces, `.art-line` and `.art-dashed` for connections, `.art-wave` for a voice,
   `.art-drift-a/-b` to float something. New primitives only if the scene truly
   needs one.
2. Give its container an `--art-ground` matching whatever it sits on.
3. `aria-hidden="true" focusable="false"`, and no colour literals — `check-tokens`
   will catch those.
4. Decide what it does on a phone. Two of the three shrink; the expertise spot
   sets `display: none`, because a 168px drawing squeezed into a phone gutter is
   a smudge nobody can read.
5. `npm run build && npm run verify`.
