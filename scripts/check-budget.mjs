/* Measures what a visitor downloads, from the HTML they would be served.
   Two ceilings, and they are different kinds of number:

   - JS, 200 KB gzip per page. Transfer size, because that is what crosses the
     wire. The reference sets 120 KB as a target and 330 KB as a ceiling, and
     says the gap exists only because the design system's barrel does not
     tree-shake. This site is smaller than the reference and takes the tighter
     number. If something makes it unreachable, raise it ONCE, in a commit whose
     message carries the measurement - do not nudge it.

   - Images, 40 KB RAW per file. Not gzip: images are already compressed and
     gzip does nothing for them, and next.config has images.unoptimized, so the
     bytes on disk are the bytes served. */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const OUT = 'out';
const PAGES = ['vi/index.html', 'en/index.html'];
const JS_CEILING_KB = 200;
const IMAGE_CEILING_KB = 40;
const IMAGE_RE = /\.(png|jpe?g|webp|avif|gif)$/i;

let failed = false;
const fail = (...lines) => {
  for (const line of lines) console.error(line);
  failed = true;
};

for (const page of PAGES) {
  const html = readFileSync(join(OUT, page), 'utf8');
  // Only the scripts THIS page loads. A flat sum over _next/static would count
  // chunks that no page references.
  const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  const unique = [...new Set(srcs)];

  // A page that loads no script at all is not a page that passed the budget;
  // it is a regex that stopped matching. Next always emits at least its own
  // runtime chunk, so zero here means this loop measured nothing.
  if (unique.length === 0) {
    fail(
      `FAIL  ${page} lists no <script src>, so this gate measured nothing.`,
      `      Either the export is broken or the script regex no longer matches.`,
    );
    continue;
  }

  let total = 0;
  // A page that lost a chunk has already failed. Without this flag it would
  // still print its `OK <size>` line below, because the bytes it could read
  // do fit - an OK next to a FAIL for the same page reads as noise.
  let missing = false;
  for (const src of unique) {
    const path = join(OUT, src.replace(/^\//, ''));
    try {
      total += gzipSync(readFileSync(path)).length;
    } catch {
      fail(`FAIL  ${page} loads ${src}, which is not in the export.`);
      missing = true;
    }
  }

  /* Every local asset the page points at, resolved against the export. The
     script loop above already does this for chunks; nothing did it for images
     or stylesheets, so renaming an <Illustration name> left a page full of
     404s with all four gates green - the files were still on disk, so the
     count passed, and no gate compared the names on disk to the names in the
     HTML. Verified: it does now. */
  const assets = [
    ...html.matchAll(/<img[^>]+src="([^"]+)"/gi),
    ...html.matchAll(/<source[^>]+srcset="([^"]+)"/gi),
    ...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/gi),
  ]
    // A srcSet entry may carry a `1x` / `640w` descriptor after the URL.
    .map((m) => m[1].split(/\s+/)[0])
    .filter((src) => src.startsWith('/'));
  const uniqueAssets = [...new Set(assets)];

  const pictures = uniqueAssets.filter((src) => IMAGE_RE.test(src));
  if (pictures.length === 0) {
    fail(
      `FAIL  ${page} points at no local image, so this check measured nothing.`,
      `      Every locale page renders four illustrations in three formats.`,
    );
  }

  for (const src of uniqueAssets) {
    try {
      statSync(join(OUT, src.replace(/^\//, '')));
    } catch {
      fail(`FAIL  ${page} points at ${src}, which is not in the export.`);
      missing = true;
    }
  }
  if (!missing) {
    console.log(`OK    ${page}  ${uniqueAssets.length} local asset(s), all present`);
  }

  const kb = (total / 1024).toFixed(1);
  if (missing) {
    // already reported
  } else if (total > JS_CEILING_KB * 1024) {
    fail(
      `FAIL  ${page}  ${kb} KB gzip of JS across ${unique.length} scripts`,
      `      Ceiling is ${JS_CEILING_KB} KB. Find what grew before raising it.`,
    );
  } else {
    console.log(`OK    ${page}  ${kb} KB gzip / ${JS_CEILING_KB} KB  (${unique.length} scripts)`);
  }
}

/* `readdirSync(.., { recursive: true })` rather than `fs.globSync`: globSync is
   still flagged experimental, CI runs the Node 22 pinned in .nvmrc, and a brace
   pattern a runtime does not expand matches nothing. A loop over nothing passes
   while measuring nothing - the exact shape of gate this repo keeps shipping.
   The floor below is the second half of that guard. */
const images = readdirSync(OUT, { recursive: true })
  .map((entry) => join(OUT, entry.toString()))
  .filter((file) => IMAGE_RE.test(file));

if (images.length < 12) {
  fail(
    `FAIL  found ${images.length} image(s) under ${OUT}/, expected at least 12.`,
    `      The four illustrations ship in three formats each; fewer means the`,
    `      export dropped them or this walk stopped finding them.`,
  );
} else {
  console.log(`OK    ${images.length} image(s) found under ${OUT}/`);
}

for (const file of images) {
  const size = statSync(file).size;
  if (size > IMAGE_CEILING_KB * 1024) {
    fail(`FAIL  ${file}  ${(size / 1024).toFixed(1)} KB raw, ceiling ${IMAGE_CEILING_KB} KB`);
  }
}

if (failed) process.exit(1);
console.log('OK    every page and image is inside budget');
