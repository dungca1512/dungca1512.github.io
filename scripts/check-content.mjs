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
   checks added after them exist to close exactly that hole.

   Fix round 2: the dead-anchor check below originally matched only bare
   `href="#name"` values, deliberately excluding the locale-prefixed
   `href="/vi/#name"` / `href="/en/#name"` form that the menu bar's nav links
   and Hero's own CTA actually use — on the reasoning that those already
   pointed at sections Tasks 9-12 had not written yet, and widening the match
   would turn the gate red on every commit until Task 12 landed. That
   deferral was overruled: five of the six real same-page anchors on the site
   were going unchecked, and "the code comment says to widen it later" is not
   a mechanism, it is a hope. The check now resolves the locale-prefixed form
   too, and the still-unbuilt sections are named explicitly in
   `PENDING_ANCHORS` below rather than silently skipped by a narrower regex. */
import { readFileSync, existsSync } from 'node:fs';

const PAGES = [
  { path: 'out/vi/index.html', locale: 'vi' },
  { path: 'out/en/index.html', locale: 'en' },
];

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

/* Anchors whose target section does not exist YET. Each entry names the task
   that lands it. This set MUST shrink to empty by Task 12 — it is checked
   both ways below: an anchor listed here that has NOT gained a matching id
   is excused (expected — the section is still unbuilt); an anchor listed
   here that HAS gained a matching id is a hard failure, because the entry
   should have been deleted the moment its section landed. A stale allowlist
   that silently keeps excusing a case that now passes is just a slower
   version of the vacuous-gate bug this file exists to fix. When a task below
   lands its section, delete its line — that is what turns this check from
   "5 anchors excused" into full, live coverage by Task 12, with nobody
   needing to remember to widen anything. */
const PENDING_ANCHORS = new Map([
  ['expertise', 'Task 10'],
  ['projects', 'Task 10'],
  ['experience', 'Task 11'],
  ['writing', 'Task 12'],
  ['contact', 'Task 12'],
]);

/* Collects every same-page fragment link on a page: a bare `href="#name"`
   (same-page on any page — e.g. the skip link's `#main`) and, now, the
   locale-prefixed `href="/{locale}/#name"` form `localeAnchorHref()`
   actually emits for the menu bar's nav and Hero's CTA, matched only against
   THIS page's own locale (a vi page's nav never points at `/en/#foo` — the
   language switcher carries no fragment — so cross-locale hrefs are not a
   same-page anchor on this page and are correctly left unmatched). `href="#"`
   with nothing after the hash is excluded on purpose: it is the conventional
   "no real destination yet" placeholder, not a link that was pointed at a
   missing target, and flagging it would not tell anyone anything
   actionable. None exist in the codebase today, but the exclusion is
   deliberate. */
function samePageFragments(html, locale) {
  const barePattern = /href="#([^"]*)"/g;
  const localePattern = new RegExp(`href="/${locale}/#([^"]*)"`, 'g');
  const names = [
    ...[...html.matchAll(barePattern)].map((m) => m[1]),
    ...[...html.matchAll(localePattern)].map((m) => m[1]),
  ].filter((name) => name !== '');
  return new Set(names);
}

for (const { path, locale } of PAGES) {
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

  const ids = new Set([...html.matchAll(/\bid="([^"]*)"/g)].map((m) => m[1]));
  const fragments = samePageFragments(html, locale);

  const deadUnexcused = [];
  const stalePending = [];
  let liveCount = 0;
  for (const fragment of fragments) {
    const resolves = ids.has(fragment);
    const pending = PENDING_ANCHORS.has(fragment);
    if (resolves && pending) {
      // The section landed but the allowlist entry was never removed.
      stalePending.push(fragment);
    } else if (!resolves && !pending) {
      deadUnexcused.push(fragment);
    } else if (resolves) {
      liveCount += 1;
    }
    // (!resolves && pending): excused — the section is still unbuilt, per plan.
  }
  const pendingCount = [...fragments].filter((f) => PENDING_ANCHORS.has(f)).length;

  check(
    deadUnexcused.length === 0,
    `${path}: ${fragments.size} same-page anchor(s) checked — ${liveCount} resolve, ${pendingCount} pending`,
    `${path}: dead anchor(s) — href points at a fragment with no matching id and no PENDING_ANCHORS excuse: ${deadUnexcused.join(', ')}`,
  );
  check(
    stalePending.length === 0,
    `${path}: no stale PENDING_ANCHORS entries`,
    `${path}: PENDING_ANCHORS still lists ${stalePending.join(', ')}, but its target id now exists — delete the entry, its task has landed`,
  );
}

if (failed) process.exit(1);
console.log(
  `OK    ${PAGES.length} pages carry no unresolved content, no dead same-page anchors, and pass the text floor`,
);
