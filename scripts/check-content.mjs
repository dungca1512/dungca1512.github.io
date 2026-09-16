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
   `href="/vi/#name"` / `href="/en/#name"` form the menu bar's nav and Hero's
   own CTA actually use. Widened to resolve the locale-prefixed form too, with
   the still-unbuilt sections named explicitly in `PENDING_ANCHORS`.

   Fix round 3: two checks below turned out to iterate the evidence (whatever
   hrefs/entries happened to exist) instead of the expectation (what must
   exist), which is the same failure shape in two places:
     - the dead-anchor check looped over hrefs found on the page. Rewrite
       every same-page href to something harmless and the loop body never
       runs — zero anchors checked, zero failures, exit 0. `REQUIRED_ANCHORS`
       below closes this: it is asserted independently of what the page
       happens to still link to.
     - the "PENDING_ANCHORS is self-cleaning" check looped over hrefs too, so
       an entry was only ever caught as stale if something still linked to
       it. Drop the nav link and inject the id and the old code missed it.
       The check below now iterates `PENDING_ANCHORS` itself against the
       page's ids, which is what makes it self-cleaning unconditionally.
   Also: the text floor moved from "whole document" to "inside <main> only"
   (see MIN_MAIN_TEXT_LENGTH), because a floor over the whole document erodes
   as chrome (nav, footer) grows and eventually stops catching an emptied
   <main> at all; and the OK-line miscount when a stale entry was present is
   fixed by counting "resolves" and "stale" independently instead of as
   mutually exclusive branches of one loop. */
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
   then collapses whitespace. */
function renderedText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Fix round 3, G4: measures only the text inside `<main>…</main>`, not the
   whole document. The original whole-document floor (300, at a measured
   772/782) was real coverage today — M10 in the round-3 review emptied
   `<main>` and left menu bar + footer, which measured 260, so 300 did catch
   it — but the margin was 40 chars against a moving target: chrome (the
   footer, the nav) grows independently of `<main>`, and the day chrome alone
   crosses 300 this floor stops detecting an emptied `<main>` forever, while
   silently never rising to match the ~700 chars Tasks 9-12 keep adding
   *inside* `<main>`. Scoping the measurement to `<main>` fixes both: the
   number now means "the content is there", chrome cannot inflate it, and the
   margin stays wide as content grows instead of shrinking as chrome grows.
   Returns `null` (not 0) when no `<main>` exists at all, so that failure mode
   reads distinctly from "a very short but present `<main>`". */
function mainText(html) {
  const match = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  return match ? renderedText(match[1]) : null;
}

// Measured on this build's <main> (Hero only, no other sections yet): vi 511
// chars, en 518. Set well under half of that, so the ~700 chars Tasks 9-12
// keep adding to <main> has headroom and this should not need bumping — but
// nowhere near the ~0 chars an emptied <main> produces (the exact failure
// this exists to catch, per the review's M10).
const MIN_MAIN_TEXT_LENGTH = 200;

/* Every same-page anchor the site is expected to always link to somewhere on
   the page, independent of PENDING_ANCHORS below: the skip link's `#main`
   (permanent — it targets the layout's landmark) and the five nav anchors
   `MenuBar` renders from its own `ANCHORS` constant (src/components/layout/
   menu-bar.tsx). Duplicated here rather than imported, because this script
   runs under plain Node with no TypeScript/JSX transpilation, so it cannot
   `import` a `.tsx` file — the same tradeoff `PENDING_ANCHORS`'s hardcoded
   task names already accept. If `MenuBar`'s anchor list ever changes, this
   list needs the matching edit.

   Fix round 3, G1: this is the "iterate the expectation, not the evidence"
   fix. The dead-anchor check below iterates the hrefs a page happens to
   still carry, which is vacuously true when there are none — rewrite every
   same-page href on the page to something harmless and the old check
   reported "0 same-page anchor(s) checked", exit 0. Checking each of these
   six names is present in `fragments`, independent of what the loop below
   finds, is what makes losing a nav link (or the skip link, or all of them)
   a hard failure instead of an empty, passing loop. */
const REQUIRED_ANCHORS = ['main', 'expertise', 'projects', 'experience', 'writing', 'contact'];

/* Same guard `PAGES` carries, for the same reason and against a sharper
   temptation: `requiredMissing.length === 0` is vacuously true on an empty
   list, so the cheapest way to green this gate after a section rename is to
   delete the entry that failed — which restores G1 exactly, and silently. If a
   nav link is genuinely dropped, RENAME the entry to the anchor that replaced
   it. The list is not allowed to shrink. */
check(
  REQUIRED_ANCHORS.length > 0,
  `${REQUIRED_ANCHORS.length} anchor(s) are required to stay linked`,
  'REQUIRED_ANCHORS is empty - the anchor gate would pass without checking anything',
);

/* Anchors whose target section does not exist YET. Each entry names the task
   that lands it. This set MUST shrink to empty by Task 12 — checked both
   ways: an anchor listed here that has NOT gained a matching id is excused
   (expected — the section is still unbuilt); an anchor listed here that HAS
   gained a matching id is a hard failure (see the stale-entry check below),
   because the entry should have been deleted the moment its section landed.
   When a task below lands its section, delete its line. */
const PENDING_ANCHORS = new Map([
  ['experience', 'Task 11'],
  ['writing', 'Task 12'],
  ['contact', 'Task 12'],
]);

/* Collects every same-page fragment link on a page: a bare `href="#name"`
   (same-page on any page — e.g. the skip link's `#main`) and the
   locale-prefixed `href="/{locale}/#name"` form `localeAnchorHref()` emits
   for the menu bar's nav and Hero's CTA, matched only against THIS page's
   own locale (a vi page's nav never points at `/en/#foo` — the language
   switcher carries no fragment — so cross-locale hrefs are not a same-page
   anchor on this page). `href="#"` with nothing after the hash is excluded
   on purpose: it is the conventional "no real destination yet" placeholder,
   not a link that was pointed at a missing target. None exist in the
   codebase today, but the exclusion is deliberate.

   NOTE (review G3, confirmed both ways, fails safe): this and the `id="…"`
   collection below scan raw HTML with a regex, not a parser. An id inside an
   HTML comment or a `<script>` string counts as a real id; nothing this
   build emits produces either shape today (React/Next escape script string
   quotes), so this has not bitten in practice. Left as-is deliberately —
   fixing it means this file parsing HTML instead of scanning it, which is
   more than the current failure modes justify. */
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

  const main = mainText(html);
  const mainLength = main === null ? 0 : main.length;
  check(
    main !== null && mainLength >= MIN_MAIN_TEXT_LENGTH,
    `${path} carries ${mainLength} chars of rendered text inside <main> (>= ${MIN_MAIN_TEXT_LENGTH})`,
    main === null
      ? `${path} has no <main> element to measure text inside of`
      : `${path}'s <main> carries only ${mainLength} chars of rendered text — looks blank or near-blank (need >= ${MIN_MAIN_TEXT_LENGTH})`,
  );

  const ids = new Set([...html.matchAll(/\bid="([^"]*)"/g)].map((m) => m[1]));
  const fragments = samePageFragments(html, locale);

  // G1 fix: asserts the expected anchors are present, rather than only
  // checking whatever happens to be found — see REQUIRED_ANCHORS above.
  const requiredMissing = REQUIRED_ANCHORS.filter((anchor) => !fragments.has(anchor));
  check(
    requiredMissing.length === 0,
    `${path}: all ${REQUIRED_ANCHORS.length} required same-page anchor(s) are still linked`,
    `${path}: required same-page anchor(s) are no longer linked anywhere on the page: ${requiredMissing.join(', ')}`,
  );

  // Any linked fragment — required or not — that resolves to no id and has
  // no PENDING_ANCHORS excuse is a dead link.
  const deadUnexcused = [...fragments].filter(
    (fragment) => !ids.has(fragment) && !PENDING_ANCHORS.has(fragment),
  );
  // G5 fix: counted independently of the stale-entry check below, so an
  // anchor that resolves is always counted as resolved — previously an
  // anchor that both resolved and was still (wrongly) listed as pending was
  // silently excluded from this count, so the OK line undercounted "resolve"
  // by exactly the number of stale entries.
  const liveResolved = [...fragments].filter((fragment) => ids.has(fragment)).length;
  const pendingExcused = [...fragments].filter(
    (fragment) => !ids.has(fragment) && PENDING_ANCHORS.has(fragment),
  ).length;
  check(
    deadUnexcused.length === 0,
    `${path}: ${fragments.size} same-page anchor(s) checked — ${liveResolved} resolve, ${pendingExcused} pending`,
    `${path}: dead anchor(s) — href points at a fragment with no matching id and no PENDING_ANCHORS excuse: ${deadUnexcused.join(', ')}`,
  );

  // G2 fix: iterates PENDING_ANCHORS itself against this page's ids, not the
  // fragments found above — so an entry is caught as stale even if the href
  // that used to point at it was also removed in the same change.
  const stalePending = [...PENDING_ANCHORS.entries()].filter(([anchor]) => ids.has(anchor));
  check(
    stalePending.length === 0,
    `${path}: no stale PENDING_ANCHORS entries`,
    `${path}: PENDING_ANCHORS still lists ${stalePending.map(([anchor, task]) => `${anchor} (${task})`).join(', ')}, but its target id now exists — delete the entry, its task has landed`,
  );
}

if (failed) process.exit(1);
console.log(
  `OK    ${PAGES.length} pages carry no unresolved content, no dead same-page anchors, and pass the <main> text floor`,
);
