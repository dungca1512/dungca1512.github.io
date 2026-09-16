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
  'favicon.svg',
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
// permits only one — and no `id` value that appears twice in the same
// document. A duplicate id is not cosmetic: `#main` (what the skip link
// targets) resolving to whichever element happens to come first is exactly
// how a second <main id="main"> stayed invisible here. Tasks 8-12 each
// rewrite page.tsx, and any one of them is a chance to reintroduce either
// mistake, so this walks every page the build actually emits — not just the
// two locale roots — the same way check:colors reports how many files it
// looked at, so a glob that matched nothing cannot pass silently.
const pages = globSync('**/*.html', { cwd: out });

check(
  pages.length > 0,
  `found ${pages.length} pages to inspect for landmark/id integrity`,
  'no HTML pages found under out/ - the glob matched nothing, so this check verified nothing',
);

for (const page of pages) {
  const html = readFileSync(join(out, page), 'utf8');

  const mainCount = (html.match(/<main[\s>]/gi) ?? []).length;
  check(
    mainCount <= 1,
    `${page} has at most one <main> element (found ${mainCount})`,
    `${page} has ${mainCount} <main> elements - the HTML spec allows at most one`,
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
}

if (failed) {
  process.exit(1);
}

console.log('OK    export tree satisfies every deployment invariant');
