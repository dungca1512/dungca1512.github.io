/* This gate reads `out/`, so it only means anything after a build. It is the
   reason `verify` cannot pass having quietly skipped every deployment-shaped
   requirement in the spec: unlike a vitest file that `describe.skipIf`s away
   when `out/` is missing, this script fails loudly when the directory it
   needs to inspect does not exist. It runs immediately after `build` in the
   verify chain, so a missing `out/` here means the build step itself is
   broken, not that this gate has nothing to check.

   It asserts exactly the five things the brief's original vitest suite
   asserted: both locale pages exist; .nojekyll exists; CNAME carries the
   custom domain; root index.html redirects to /vi/; and every URL that was
   live before the rebuild is still live after it. */
import { existsSync, readFileSync, globSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'out');

if (!existsSync(out)) {
  console.error('FAIL  out/ does not exist - run `npm run build` before `check:export`');
  process.exit(1);
}

const has = (p) => existsSync(join(out, p));

let failed = false;

function check(condition, okMessage, failMessage) {
  if (condition) {
    console.log(`OK    ${okMessage}`);
  } else {
    console.error(`FAIL  ${failMessage}`);
    failed = true;
  }
}

// Emits a page per locale.
check(has('vi/index.html'), 'vi/index.html exists', 'vi/index.html is missing');
check(has('en/index.html'), 'en/index.html exists', 'en/index.html is missing');

// Keeps .nojekyll, or Pages serves the site with no CSS.
check(has('.nojekyll'), '.nojekyll exists', '.nojekyll is missing - Pages will drop _next/');

// Keeps the custom domain attached.
const cnamePath = join(out, 'CNAME');
const cname = existsSync(cnamePath) ? readFileSync(cnamePath, 'utf8').trim() : null;
check(
  cname === 'portfolio-dungca.ai-innovation-homelab.org',
  'CNAME carries the custom domain',
  `CNAME is ${cname === null ? 'missing' : `"${cname}"`}, expected "portfolio-dungca.ai-innovation-homelab.org"`,
);

// Redirects / to /vi/, since Pages cannot.
const rootIndexPath = join(out, 'index.html');
const rootIndex = existsSync(rootIndexPath) ? readFileSync(rootIndexPath, 'utf8') : '';
check(
  rootIndex.includes('url=/vi/'),
  'root index.html redirects to /vi/',
  'root index.html does not redirect to /vi/',
);

// Keeps every URL that is live today.
for (const file of [
  'CV_CongAnhDung.pdf',
  'github-data.json',
  'profile.webp',
  'favicon.ico',
  'apple-touch-icon.png',
  'about.html',
  'blog.html',
  'projects.html',
]) {
  check(
    has(file),
    `${file} survives the rebuild`,
    `${file} is a live URL and must survive the rebuild`,
  );
}

// Every page must have at most one visible <main> landmark — the HTML spec
// permits only one — and the pages that carry the site's content must have
// exactly one, because the skip link points at it. `<= 1` alone would let a
// later task delete the landmark outright and stay green, which is the
// mistake this check was written to stop, only inverted. The 404 is excluded
// deliberately: it renders its own standalone document with no skip link, so
// it has no landmark to point at. Also asserted: no `id` value appearing
// twice in the same document. A duplicate id is not cosmetic: `#main` (what the skip link
// targets) resolving to whichever element happens to come first is exactly
// how a second <main id="main"> stayed invisible here. Tasks 8-12 each
// rewrite page.tsx, and any one of them is a chance to reintroduce either
// mistake, so this walks every page the build actually emits — not just the
// two locale roots — the same way check:colors reports how many files it
// looked at, so a glob that matched nothing cannot pass silently.
/* The pages that must carry a <main>: one per locale, the same two this file
   already asserts exist above. Everything else the build emits — the root
   redirect stub, the 404 — is chrome around the content, not content. */
const CONTENT_PAGES = ['vi/index.html', 'en/index.html'];

const pages = globSync('**/*.html', { cwd: out });

check(
  pages.length > 0,
  `found ${pages.length} pages to inspect for landmark/id integrity`,
  'no HTML pages found under out/ - the glob matched nothing, so this check verified nothing',
);

for (const page of pages) {
  const html = readFileSync(join(out, page), 'utf8');

  const mainCount = (html.match(/<main[\s>]/gi) ?? []).length;
  const needsLandmark = CONTENT_PAGES.includes(page);
  check(
    needsLandmark ? mainCount === 1 : mainCount <= 1,
    needsLandmark
      ? `${page} has exactly one <main> landmark`
      : `${page} has at most one <main> element (found ${mainCount})`,
    needsLandmark
      ? `${page} has ${mainCount} <main> elements - a content page needs exactly one, and the skip link targets it`
      : `${page} has ${mainCount} <main> elements - the HTML spec allows at most one`,
  );

  const ids = Array.from(html.matchAll(/\bid="([^"]*)"/g)).map((m) => m[1]);
  const counts = new Map();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  const duplicates = [...counts.entries()].filter(([, n]) => n > 1).map(([id]) => id);
  check(
    duplicates.length === 0,
    `${page} has no duplicate ids`,
    `${page} has duplicate id(s): ${duplicates.join(', ')}`,
  );

  /* An aria-labelledby that points at nothing is worse than none at all: the
     element keeps claiming a name and a screen reader announces an empty one.
     `Section` derives its reference from its own `id` (`<id>-title`) while the
     matching `<h2 id>` comes from `SectionHeading`'s `titleId` prop - two
     halves in two files, so half of it is exactly the kind of thing that gets
     forgotten. This is the gate that notices. Same for aria-describedby. */
  const idSet = new Set(ids);
  const dangling = [...html.matchAll(/\baria-(?:labelledby|describedby)="([^"]*)"/g)].flatMap((m) =>
    m[1].split(/\s+/).filter((token) => token && !idSet.has(token)),
  );
  check(
    dangling.length === 0,
    `${page} has no aria-labelledby/describedby pointing at a missing id`,
    `${page} references id(s) that do not exist: ${[...new Set(dangling)].join(', ')}`,
  );

  if (needsLandmark) {
    /* Every band is a <section id> the nav links to. One without a name is not
       a landmark at all - it is a generic container the rotor cannot list. */
    const sections = [...html.matchAll(/<section\b[^>]*>/g)].map((m) => m[0]);
    const named = sections.filter((tag) => /\bid="/.test(tag)).length;
    const labelled = sections.filter(
      (tag) => /\bid="/.test(tag) && /\baria-label(?:ledby)?="/.test(tag),
    ).length;
    check(
      named >= 6 && labelled === named,
      `${page} names all ${named} of its <section id> landmarks`,
      `${page} has ${named} <section id> element(s) but only ${labelled} carry an accessible name` +
        (named < 6 ? ` - and ${named} is below the six the page is built from` : ''),
    );
  }
}

if (failed) {
  process.exit(1);
}

console.log('OK    export tree satisfies every deployment invariant');
