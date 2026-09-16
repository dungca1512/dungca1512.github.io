# Illustrations — prompts and how they get onto the page

The hands portfolio you sent me is not using a template and not using an
illustration pack. Its seven images carry a C2PA manifest signed by Google LLC
(`c2pa.created` → "Created by Google Generative AI", `digitalSourceType` →
`trainedAlgorithmicMedia`, plus an applied SynthID watermark). They were
generated, not licensed.

So this is the one part of the redesign I cannot finish for you: I have no image
generation in this session. What follows is everything needed so that generating
them is the only step left.

**Do not copy how hands ships them.** Their `next.config.ts` sets
`output: 'export'` with `images: { unoptimized: true }`, so the raw generator
output goes to the browser: every file is 5504×3072, 3–6 MB, 26.5 MB for the
page. Their hero image alone is about 150× the weight of this entire site.

---

## The three slots

Three, not seven. The page is mostly text with real numbers in it, and an
illustration every two sections would start arguing with the content instead of
framing it.

### 1. Case study — a band above the card

Widest and most visible. Goes directly above `<header class="case-header">` in
`index.html:155`.

> A warm editorial illustration, flat vector style with soft rounded shapes and
> visible hand-drawn line weight. A speech waveform entering from the left
> travels through three simple rounded containers and leaves on the right as a
> neat printed score card with a number on it. Muted palette: warm amber
> (#8f6318), deep charcoal (#14161a), cream background (#f4f4f2), one soft
> sage accent. No text, no letters, no numbers rendered as glyphs. Generous
> empty space. Light, optimistic, unhurried. Wide banner composition, roughly
> 3:1.

### 2. Expertise — a spot illustration beside the section head

Goes in the right-hand space of the expertise `.section-head`.

> A warm editorial spot illustration, flat vector, soft rounded shapes, gentle
> hand-drawn line weight. A small stack of rounded slabs seen at a slight
> angle — the bottom one wide and plain, the top one small with a single glowing
> amber dot on it — suggesting infrastructure holding up a model. Muted palette:
> warm amber (#8f6318), deep charcoal (#14161a), cream (#f4f4f2). No text, no
> glyphs. Lots of air around the subject. Square composition.

### 3. Contact — beside the card

Replaces nothing: it sits where the orbit figure currently drifts, at lower
opacity than the other two so the card stays the loudest thing there.

> A warm editorial illustration, flat vector, soft rounded shapes, hand-drawn
> line quality. Two simple rounded forms leaning slightly toward each other with
> a short amber arc passing between them, reading as a handshake without drawing
> hands. Muted palette: warm amber (#8f6318), deep charcoal (#14161a), cream
> (#f4f4f2). No text, no glyphs. Calm, generous, a lot of empty space. Square
> composition.

Keep the palette line verbatim in all three. It is what stops the set from
looking like three illustrations from three different sites.

---

## What to hand back to me

For each slot, the generator's raw output is fine — I do the conversion. If you
want to do it yourself:

```bash
# from the raw file, e.g. case-study-raw.png
cwebp -q 72 -resize 1440 0 case-study-raw.png -o img/case-study.webp
avifenc --min 24 --max 34 -s 4 case-study-raw.png img/case-study.avif
```

Rules the budget gate already enforces (`npm run check:budget`):

- **40 KB per image, raw bytes.** Images ship uncompressed by the CDN, so the
  file size is exactly what the visitor pays. AVIF at 1440px wide reaches this
  comfortably for flat vector-style art; photographs would not.
- The gate measures every tracked image, anywhere in the repo, so putting them
  in `img/` does not hide them.

If a file genuinely cannot fit 40 KB, tell me and we raise the image ceiling the
same way the code ceiling moved — with the measurement written into the gate,
not by quietly editing the number.

---

## The markup, ready to paste

I have not added these to `index.html`, because markup pointing at files that do
not exist ships a broken image to every visitor. The moment the files land, this
goes in.

```html
<figure class="figure figure--band">
    <picture>
        <source srcset="img/case-study.avif" type="image/avif">
        <img src="img/case-study.webp" width="1440" height="480" alt=""
             loading="lazy" decoding="async">
    </picture>
</figure>
```

`alt=""` is correct here and not laziness: all three are decorative, and each
one restates something the adjacent text already says. An alt string would make
a screen reader announce the same fact twice.

`loading="lazy"` on all three — none are above the fold. Do **not** add it to
anything that ever becomes the LCP element.

`width` and `height` are required, not optional. Without them the image has no
intrinsic size until it downloads, and the page reflows around it on arrival.

The CSS is about six lines and I will add it with the markup:

```css
.figure {
    margin-bottom: 32px;
    border-radius: var(--radius-lg);
    overflow: hidden;
}

.figure img {
    display: block;
    width: 100%;
    height: auto;
}
```
