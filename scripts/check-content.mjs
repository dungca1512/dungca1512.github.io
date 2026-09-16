/* The test checks the content modules. This checks the HTML they produced.
   They are not the same thing: a component can hold correct bilingual data and
   still render the wrong half of it, or none.

   It is also, structurally, the ONLY coverage possible for most of the page:
   every section (Hero, and the ones Tasks 9-12 add — ProofBar, Expertise,
   Work, Experience, Capabilities, Writing, Contact) is an async Server
   Component that calls `getLocale()`/`getDictionary()` directly, which read
   `next/root-params`. That module is a compiler placeholder outside a real
   Next build — `await Hero()` throws under vitest — so none of these
   components can carry a render test. This script, run over what `next build`
   actually emitted, is what stands in for that missing layer. A version of it
   that only rules out two specific strings proves almost nothing: swap both
   built pages for an empty shell (`<!DOCTYPE html><html lang="vi"><body>
   </body></html>`) and the two checks below both still pass, silently. The
   three checks added after them exist to close exactly that hole. */
import { readFileSync, existsSync } from 'node:fs';

const PAGES = [{ path: 'out/vi/index.html' }, { path: 'out/en/index.html' }];

let failed = false;

function check(condition, okMessage, failMessage) {
  if (condition) {
    console.log(`OK    ${okMessage}`);
  } else {
    console.error(`FAIL  ${failMessage}`);
    failed = true;
  }
}

// Guards the empty-glob failure mode this repo keeps hitting (check-export.mjs
// carries the same guard, for the same reason): a page list that resolves to
// nothing must fail loudly, not silently report "OK 0 pages" and exit 0.
check(
  PAGES.length > 0,
  `found ${PAGES.length} pages to inspect`,
  'the page list is empty - nothing was inspected',
);

/* Strips script/style contents (their text is never page copy) and every tag,
   then collapses whitespace. Used both for the text-floor check below and,
   incidentally, gives a stable string to measure. */
function renderedText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Measured on this build (Hero + menu bar + footer, no other sections yet):
// vi 772 chars, en 782 chars. Set well under half of that, so the ~700 chars
// of copy Tasks 9-12 keep adding has headroom and this never needs bumping —
// but nowhere near the ~0 chars an empty `<body></body>` shell produces (the
// exact failure this check exists to catch). It pins a floor, not the copy.
const MIN_TEXT_LENGTH = 300;

/* A same-page fragment link: `href="#name"`, matched only where the value
   itself opens with `#` (not `/vi/#name` — see the note below). `href="#"`
   with nothing after the hash is the conventional "no real destination yet"
   placeholder and is excluded on purpose: it is not a broken link to a
   missing target, it is a link that was never pointed at one, and flagging it
   would not tell anyone anything actionable. The skip link (`href="#main"`)
   is the one real instance of this pattern today, and it is a genuine
   same-page anchor: its target is exactly the `id="main"` the layout renders,
   so this check is real coverage for it, not a no-op.

   `/vi/#name` and `/en/#name` (what the menu bar's nav links and Hero's own
   "Hire Me" button use, via `localeAnchorHref`) are deliberately NOT matched
   here. Both already point at sections Tasks 9-12 have not written yet
   (`#expertise`, `#projects`, `#experience`, `#writing`, `#contact`) - that is
   not a bug to catch, it is the current, honest state of a site under
   construction, and a check that flagged it would be red on every commit
   until Task 12 lands. Once those sections exist with matching ids, widening
   this pattern to also cover the locale-prefixed form is the natural next
   step - and worth doing then, precisely because at that point a dangling one
   really would be a mistake. */
function danglingFragmentHrefs(html) {
  const hrefs = [...html.matchAll(/href="(#[^"]*)"/g)].map((m) => m[1]);
  const ids = new Set([...html.matchAll(/\bid="([^"]*)"/g)].map((m) => m[1]));
  const fragments = new Set(hrefs.map((h) => h.slice(1)).filter((fragment) => fragment !== ''));
  const missing = [...fragments].filter((fragment) => !ids.has(fragment));
  return { fragments, missing };
}

for (const { path } of PAGES) {
  if (!existsSync(path)) {
    console.error(`FAIL  ${path} is missing`);
    failed = true;
    continue;
  }

  const html = readFileSync(path, 'utf8');

  // An unresolved Localized<T> stringifies to this. If it reaches the HTML, a
  // component rendered the wrapper instead of picking a language out of it.
  check(
    !html.includes('[object Object]'),
    `${path} carries no raw Localized<T> object`,
    `${path} contains [object Object] — a Localized<T> was rendered raw.`,
  );
  check(
    !html.includes('undefined<'),
    `${path} carries no rendered \`undefined\``,
    `${path} contains a rendered \`undefined\`.`,
  );

  const text = renderedText(html);
  check(
    text.length >= MIN_TEXT_LENGTH,
    `${path} carries ${text.length} chars of rendered text (>= ${MIN_TEXT_LENGTH})`,
    `${path} carries only ${text.length} chars of rendered text — looks blank or near-blank (need >= ${MIN_TEXT_LENGTH})`,
  );

  const { fragments, missing } = danglingFragmentHrefs(html);
  check(
    missing.length === 0,
    `${path}: ${fragments.size} same-page anchor(s) checked, all resolve to a real id`,
    `${path}: dead anchor(s) — href points at a fragment with no matching id: ${missing.join(', ')}`,
  );
}

if (failed) process.exit(1);
console.log(
  `OK    ${PAGES.length} pages carry no unresolved content, no dead same-page anchors, and pass the text floor`,
);
