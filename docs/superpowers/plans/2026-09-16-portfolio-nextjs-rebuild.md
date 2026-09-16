# Portfolio Next.js Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-written static portfolio with a bilingual Next.js 16
static export that reads as the same design family as the reference team site,
deployed to `portfolio-dungca.ai-innovation-homelab.org` via GitHub Pages.

**Architecture:** Next.js App Router with `output: 'export'`. There is no
`app/layout.tsx`; `<html>` lives in `app/[lang]/layout.tsx`, exactly as the
reference does it, with `generateStaticParams` emitting `vi` and `en`. Server
Components read the current locale from `next/root-params` rather than passing
`lang` down by prop. All content lives in typed `Localized<T>` modules ported
from today's `data.js`, so a missing translation is a typecheck error. Styling
is Tailwind 4 plus `@levi-it/design-system` tokens; every colour resolves
through a token, and section CSS lives in per-section files imported in a fixed
cascade order. Motion is scroll-driven CSS (`animation-timeline: view()`) with a
single `IntersectionObserver` fallback.

**Tech Stack:** Next.js 16.3.4, React 19.2.8, TypeScript 5 strict, Tailwind
CSS 4 via `@tailwindcss/postcss`, `@levi-it/design-system#v0.1.3`,
`@fontsource-variable/inter`, Vitest 3 + `@testing-library/react` + jsdom,
ESLint 9 + `eslint-config-next`, Prettier 3.9.6 + `prettier-plugin-tailwindcss`,
Node >= 22.

**Spec:** `docs/superpowers/specs/2026-09-16-portfolio-nextjs-rebuild.md`

## Global Constraints

Every task's requirements implicitly include this section. Values are verbatim
from the spec.

- **Node `>=22`.** Declared in `package.json` `engines`.
- **Pinned versions.** `next@16.3.4`, `react@19.2.8`, `react-dom@19.2.8`,
  `@levi-it/design-system` at `git+ssh://git@github.com/Levi-IT/web_component_design_systerm.git#v0.1.3`.
- **Static export.** `output: 'export'`, `trailingSlash: true`,
  `images: { unoptimized: true }`. No `basePath`. No server-only feature:
  no Route Handlers, no Server Actions, no middleware, no `next/image` loader,
  no ISR, no `cookies()`/`headers()`.
- **Locales.** `LOCALES = ['vi', 'en']`, `DEFAULT_LOCALE = 'vi'`. Every
  user-visible string is `Localized<T> = Record<Locale, T>`. No string literal
  in a component that a visitor can read.
- **No invented content.** Every fact comes from the existing `data.js` or
  `github-data.json`, unchanged. A section with no real content is dropped, not
  filled.
- **No colour literal outside the token layer.** `src/app/globals.css` is the
  only file allowed to contain a hex, `rgb()`, `hsl()` or `oklch()` colour.
  Everywhere else uses a design-system token or a Tailwind class that resolves
  to one. Enforced by `npm run check:colors`.
- **Accent colours are never used raw as text.** They measure 2.68:1–3.78:1,
  below AA. Use the `ink-*` colours, which are `color-mix(in srgb, <token> 68%,
  var(--base-foreground))`, declared under **both** `:root` and
  `[data-theme='dark']`.
- **Every animation ends at its resting frame**, so the
  `prefers-reduced-motion` reset lands on the final state rather than a blank
  first frame.
- **Image ceiling: 40 KB raw per file** under `public/`. Enforced by
  `npm run check:budget`.
- **JS ceiling: 200 KB gzip per page**, measured from the built HTML. Enforced
  by `npm run check:budget`.
- **These URLs must keep working** after deploy: `/CV_CongAnhDung.pdf`,
  `/github-data.json`, `/profile.webp`, `/favicon.svg`, `/about.html`,
  `/blog.html`, `/projects.html`, and `/` (which redirects to `/vi/`).
- **`public/CNAME` must contain** `portfolio-dungca.ai-innovation-homelab.org`.
  Losing it detaches the custom domain.
- **`public/.nojekyll` must exist.** Next emits `_next/`; Jekyll drops
  underscore-prefixed directories and the site loads unstyled without it.
- **Commit messages** end with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- **`npm run verify` must be green** before any task is considered done.

---

## File Structure

```
.github/workflows/
  verify.yml                    CI: npm run verify on push + PR
  deploy.yml                    Build and publish out/ to GitHub Pages  (Task 14)

public/
  .nojekyll                     Stops Jekyll eating _next/
  CNAME                         Custom domain
  index.html                    Static / -> /vi/ redirect (Pages has no _redirects)
  about.html  blog.html  projects.html    Existing redirect stubs, moved as-is
  CV_CongAnhDung.pdf  profile.webp  favicon.svg  github-data.json
  images/illustrations/*.avif|webp|jpg    Owner-supplied art  (Task 13)

src/app/
  globals.css                   Tokens, base layer, the ONLY file with colours
  [lang]/layout.tsx             <html>, metadata, shell; generateStaticParams
  [lang]/page.tsx               The one page: composes all eight sections
  not-found.tsx                 Own <html> — nothing wraps it
  robots.ts  sitemap.ts

src/content/
  locales.ts                    Locale union, Localized<T>, isLocale
  dictionaries.ts               getLocale / getDictionary from next/root-params
  dictionaries/vi.ts  en.ts     UI chrome strings (nav, labels, meta)
  site.ts                       Canonical URL, name, profile, CTA targets
  metrics.ts                    Counted proof-bar figures
  expertise.ts                  Expertise areas + focus list
  projects.ts                   Projects + the case study
  experience.ts                 Roles, education, certification
  capabilities.ts               Skill groups + playbook
  writing.ts                    Articles
  contacts.ts                   Contact channels

src/lib/
  cn.ts                         Class-name joiner
  paths.ts                      localeHref / localeAnchorHref / swapLocale
  github.ts                     Reads public/github-data.json at build time

src/components/site/
  container.tsx  section.tsx  skip-link.tsx  footer.tsx
  theme-script.tsx  theme-toggle.tsx  illustration.tsx
src/components/layout/
  menu-bar.tsx  locale-switch.tsx
src/components/motion/
  use-in-view.ts  reveal-scope.tsx  drawn-underline.tsx  count-up.tsx
src/components/sections/
  hero.tsx  proof-bar.tsx  expertise.tsx  work.tsx
  experience.tsx  capabilities.tsx  writing.tsx  contact.tsx

src/styles/
  motion.css  motion-reduced.css
  layout/menu-bar.css
  sections/hero.css  work.css  contact.css

scripts/
  sync-github.mjs               Kept, unchanged
  check-no-hardcoded-colors.mjs Colour-literal gate
  check-budget.mjs              Per-page JS gzip + per-image raw bytes
  check-content.mjs             Every Localized leaf has both locales

tests/
  paths.test.ts  content.test.ts  contrast.test.ts
  section.test.tsx  menu-bar.test.tsx  theme.test.tsx  sections.test.tsx
  export.test.ts                Asserts the built out/ tree
```

**Deleted in Task 1:** `index.html`, `style.css`, `style.min.css`, `main.js`,
`scripts/build-css.mjs`, `scripts/check-tokens.mjs`, `scripts/run-tests.mjs`,
and all ten files under `tests/`. They are the old site; git keeps them.
`data.js` survives until Task 3 has ported it, then goes.

---

### Task 1: Clear the old site and scaffold the static export

**Files:**
- Delete: `index.html`, `style.css`, `style.min.css`, `main.js`,
  `scripts/build-css.mjs`, `scripts/check-tokens.mjs`, `scripts/run-tests.mjs`,
  `tests/` (all 11 files)
- Move: `CV_CongAnhDung.pdf`, `profile.webp`, `favicon.svg`,
  `github-data.json`, `CNAME`, `about.html`, `blog.html`, `projects.html`
  → `public/`
- Create: `package.json` (replace), `next.config.ts`, `tsconfig.json`,
  `postcss.config.mjs`, `eslint.config.mjs`, `.prettierrc`, `.gitignore`
  (replace), `public/.nojekyll`, `public/index.html`,
  `src/app/globals.css` (stub), `src/app/[lang]/layout.tsx` (stub),
  `src/app/[lang]/page.tsx` (stub), `vitest.config.ts`
- Modify: `.github/workflows/verify.yml`
- Test: `tests/export.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: an `npm run build` that writes `out/`; the path alias `@/*` →
  `src/*`; `npm run verify` = `format:check && lint && typecheck && test &&
  build`; `LOCALES` is not defined yet, so `generateStaticParams` is hardcoded
  in this task and replaced in Task 2.

- [ ] **Step 1: Delete the old site and move the assets that must survive**

```bash
git rm -q index.html style.css style.min.css main.js \
  scripts/build-css.mjs scripts/check-tokens.mjs scripts/run-tests.mjs \
  tests/build-css.test.mjs tests/defects.test.mjs tests/figures.test.mjs \
  tests/grid-drift.test.mjs tests/has-dim.test.mjs tests/header-scroll.test.mjs \
  tests/helpers.mjs tests/hero.test.mjs tests/motion-tokens.test.mjs \
  tests/reduced-motion.test.mjs tests/scroll-driven.test.mjs
mkdir -p public
git mv CV_CongAnhDung.pdf profile.webp favicon.svg github-data.json \
  CNAME about.html blog.html projects.html public/
touch public/.nojekyll
git add public/.nojekyll
```

`data.js` stays at the repo root for now. Task 3 reads it and deletes it.

- [ ] **Step 2: Write the config files**

`package.json` — replaces the existing one entirely:

```json
{
  "name": "portfolio-dungca",
  "version": "2.0.0",
  "private": true,
  "description": "Bilingual portfolio for Công Anh Dũng. Next.js static export on GitHub Pages.",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "sync:github": "node scripts/sync-github.mjs",
    "verify": "npm run format:check && npm run lint && npm run typecheck && npm test && npm run build"
  },
  "dependencies": {
    "@fontsource-variable/inter": "^5.3.0",
    "@levi-it/design-system": "git+ssh://git@github.com/Levi-IT/web_component_design_systerm.git#v0.1.3",
    "next": "16.3.4",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react": "^4.3.4",
    "eslint": "^9",
    "eslint-config-next": "16.3.4",
    "jsdom": "^25.0.1",
    "prettier": "3.9.6",
    "prettier-plugin-tailwindcss": "0.8.1",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vitest": "^3.0.5"
  },
  "engines": { "node": ">=22" }
}
```

`next.config.ts`:

```ts
import type { NextConfig } from 'next';

/* GitHub Pages serves a directory of files and nothing else. `output: 'export'`
   turns every server-only feature into a build error at the moment it is
   written, which is the point of setting it now rather than at deploy time.
   `trailingSlash` makes /vi/ a real directory with an index.html, so Pages can
   serve it without a rewrite rule we have no way to install.

   In dev only, / redirects to /vi/. In production that hop is public/index.html
   instead, because a static host cannot issue a 3xx. */
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  ...(process.env.NODE_ENV === 'development'
    ? { redirects: async () => [{ source: '/', destination: '/vi/', permanent: false }] }
    : {}),
};

export default nextConfig;
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "out"]
}
```

`postcss.config.mjs`:

```js
const config = { plugins: { '@tailwindcss/postcss': {} } };
export default config;
```

`eslint.config.mjs`:

```js
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default [
  { ignores: ['out/**', '.next/**', 'node_modules/**', 'data.js'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
];
```

`.prettierrc`:

```json
{
  "singleQuote": true,
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

`.gitignore` — replaces the existing one:

```
node_modules/
.next/
out/
.playwright-mcp/
.superpowers/
next-env.d.ts
*.tsbuildinfo
.DS_Store
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
  },
});
```

`tests/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Write the root redirect and the page stubs**

`public/index.html` — GitHub Pages has no redirect configuration, so the hop
from `/` to `/vi/` has to be a real file. It carries both a meta refresh (works
with JS off) and a `location.replace` (does not add a history entry, so Back
does not bounce the visitor straight back here), plus a visible link for
anyone both mechanisms fail for:

```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>Công Anh Dũng</title>
    <link rel="canonical" href="https://portfolio-dungca.ai-innovation-homelab.org/vi/" />
    <meta http-equiv="refresh" content="0; url=/vi/" />
    <script>
      location.replace('/vi/');
    </script>
  </head>
  <body>
    <a href="/vi/">Công Anh Dũng — Portfolio</a>
  </body>
</html>
```

`src/app/globals.css` — a stub; Task 4 fills it:

```css
@import 'tailwindcss';
```

`src/app/[lang]/layout.tsx`:

```tsx
import '@fontsource-variable/inter';
import '../globals.css';

export function generateStaticParams() {
  // Replaced in Task 2 with LOCALES.map(...).
  return [{ lang: 'vi' }, { lang: 'en' }];
}

export default function RootLayout({ children }: LayoutProps<'/[lang]'>) {
  return (
    <html lang="vi" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
```

`src/app/[lang]/page.tsx`:

```tsx
export default function Page() {
  return <main id="main">Portfolio</main>;
}
```

- [ ] **Step 4: Install and write the failing export test**

```bash
npm install
```

`tests/export.test.ts` — this test reads `out/`, so it only means anything after
a build. It is the gate on every deployment-shaped requirement in the spec at
once, and it is the reason those requirements cannot quietly rot:

```ts
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const out = join(process.cwd(), 'out');
const has = (p: string) => existsSync(join(out, p));

describe.skipIf(!existsSync(out))('the exported tree', () => {
  it('emits a page per locale', () => {
    expect(has('vi/index.html')).toBe(true);
    expect(has('en/index.html')).toBe(true);
  });

  it('keeps .nojekyll, or Pages serves the site with no CSS', () => {
    expect(has('.nojekyll')).toBe(true);
  });

  it('keeps the custom domain attached', () => {
    expect(readFileSync(join(out, 'CNAME'), 'utf8').trim()).toBe(
      'portfolio-dungca.ai-innovation-homelab.org',
    );
  });

  it('redirects / to /vi/, since Pages cannot', () => {
    const root = readFileSync(join(out, 'index.html'), 'utf8');
    expect(root).toContain('url=/vi/');
  });

  it('keeps every URL that is live today', () => {
    for (const file of [
      'CV_CongAnhDung.pdf',
      'github-data.json',
      'profile.webp',
      'favicon.svg',
      'about.html',
      'blog.html',
      'projects.html',
    ]) {
      expect(has(file), `${file} is a live URL and must survive the rebuild`).toBe(true);
    }
  });
});
```

- [ ] **Step 5: Run it and watch it skip, then build and watch it pass**

```bash
npm test
```
Expected: the suite reports the `export` describe block as **skipped** — `out/`
does not exist yet. That is the correct failure shape here: a test that asserted
against a missing directory would fail for the wrong reason.

```bash
npm run build && npm test
```
Expected: build succeeds and writes `out/`; all five assertions PASS.

- [ ] **Step 6: Point CI at the new verify**

`.github/workflows/verify.yml`:

```yaml
name: verify

on:
  push:
    branches: [main]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # The design system is a private repo pulled over SSH. Without this key the
      # install fails with a permission error that reads like a missing package.
      - uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.DESIGN_SYSTEM_DEPLOY_KEY }}

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci
      - run: npm run verify
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat!: replace the hand-written site with a Next.js static export

The old site is in git history. What survives into public/ is everything
with a URL somebody could already be holding: the CV, the GitHub data dump,
the avatar, the favicon, and the three redirect stubs.

Three things GitHub Pages needs that the reference does not, because the
reference is on Cloudflare: .nojekyll (Jekyll drops _next/), a real
public/index.html for the / -> /vi/ hop (no _redirects support), and a
deploy from Actions rather than from the branch (the tree we publish is
out/, not the repo root). The first two land here; the third is Task 14.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Locale plumbing

**Files:**
- Create: `src/content/locales.ts`, `src/lib/cn.ts`, `src/lib/paths.ts`
- Modify: `src/app/[lang]/layout.tsx`
- Test: `tests/paths.test.ts`

**Interfaces:**
- Consumes: Task 1's `@/*` alias and vitest config.
- Produces:
  - `type Locale = 'vi' | 'en'`; `LOCALES: readonly Locale[]`;
    `DEFAULT_LOCALE: Locale`; `isLocale(v: string): v is Locale`;
    `type Localized<T> = Record<Locale, T>`;
    `LOCALE_LABEL: Localized<string>`; `BCP47: Localized<string>`
  - `cn(...parts: Array<string | false | null | undefined>): string`
  - `localeHref(locale: Locale, path?: string): string`
  - `localeAnchorHref(locale: Locale, anchor: string): string`
  - `swapLocale(pathname: string, next: Locale): string`

- [ ] **Step 1: Write the failing test**

`tests/paths.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { localeHref, localeAnchorHref, swapLocale } from '@/lib/paths';
import { isLocale, LOCALES, DEFAULT_LOCALE } from '@/content/locales';
import { cn } from '@/lib/cn';

describe('locales', () => {
  it('is vi then en, defaulting to vi', () => {
    expect([...LOCALES]).toEqual(['vi', 'en']);
    expect(DEFAULT_LOCALE).toBe('vi');
  });

  it('rejects anything else', () => {
    expect(isLocale('vi')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale('')).toBe(false);
  });
});

describe('localeHref', () => {
  // Every href ends in a slash because next.config sets trailingSlash: true.
  // A link to /vi without it costs the visitor a redirect on every click.
  it('builds a trailing-slash URL', () => {
    expect(localeHref('vi')).toBe('/vi/');
    expect(localeHref('en', '/')).toBe('/en/');
    expect(localeHref('vi', 'work')).toBe('/vi/work/');
    expect(localeHref('vi', '/work/')).toBe('/vi/work/');
  });
});

describe('localeAnchorHref', () => {
  it('accepts an anchor with or without the hash', () => {
    expect(localeAnchorHref('vi', 'work')).toBe('/vi/#work');
    expect(localeAnchorHref('vi', '#work')).toBe('/vi/#work');
  });
});

describe('swapLocale', () => {
  it('replaces the locale segment and keeps the rest of the path', () => {
    expect(swapLocale('/vi/work/', 'en')).toBe('/en/work/');
  });

  it('falls back to the locale root when the path has no locale segment', () => {
    expect(swapLocale('/', 'en')).toBe('/en/');
    expect(swapLocale('/nonsense/', 'en')).toBe('/en/');
  });
});

describe('cn', () => {
  it('drops falsy parts so `cond && "class"` is safe inline', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx vitest run tests/paths.test.ts
```
Expected: FAIL — `Failed to resolve import "@/lib/paths"`.

- [ ] **Step 3: Write the implementation**

`src/content/locales.ts`:

```ts
export const LOCALES = ['vi', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'vi';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Bilingual content. Requiring BOTH keys is the whole point: a missing
 *  translation becomes a typecheck failure instead of a blank on the page. */
export type Localized<T> = Record<Locale, T>;

export const LOCALE_LABEL: Localized<string> = { vi: 'Tiếng Việt', en: 'English' };
export const BCP47: Localized<string> = { vi: 'vi', en: 'en' };
```

`src/lib/cn.ts`:

```ts
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
```

`src/lib/paths.ts`:

```ts
import { LOCALES, type Locale } from '@/content/locales';

/** next.config sets `trailingSlash: true`, so every internal href must end in a
 *  slash. A link to `/vi` instead of `/vi/` still works, but costs the visitor
 *  a redirect on every single click. */
export function localeHref(locale: Locale, path = '/'): string {
  const clean = path === '/' ? '' : `/${path.replace(/^\/|\/$/g, '')}`;
  return `/${locale}${clean}/`;
}

export function localeAnchorHref(locale: Locale, anchor: string): string {
  const clean = anchor.startsWith('#') ? anchor : `#${anchor}`;
  return `${localeHref(locale)}${clean}`;
}

/** Used by the language switch. Swapping the first segment keeps the visitor
 *  where they were; sending them to the locale root would lose their place. */
export function swapLocale(pathname: string, next: Locale): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && (LOCALES as readonly string[]).includes(segments[0])) {
    segments[0] = next;
    return `/${segments.join('/')}/`;
  }
  return `/${next}/`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run tests/paths.test.ts
```
Expected: PASS, 8 tests.

- [ ] **Step 5: Replace the hardcoded params in the layout**

In `src/app/[lang]/layout.tsx`, replace the stub `generateStaticParams`:

```tsx
import { LOCALES } from '@/content/locales';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ lang: locale }));
}
```

- [ ] **Step 6: Commit**

```bash
npm run verify
git add -A
git commit -m "$(cat <<'EOF'
feat: locale union, Localized<T>, and the path helpers

Localized<T> = Record<Locale, T> is the load-bearing piece. It makes a
missing translation a typecheck failure rather than a blank space on the
page, which is the only way bilingual content stays bilingual.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Port the content out of data.js

**Files:**
- Create: `src/content/dictionaries.ts`, `src/content/dictionaries/vi.ts`,
  `src/content/dictionaries/en.ts`, `src/content/site.ts`,
  `src/content/metrics.ts`, `src/content/expertise.ts`,
  `src/content/projects.ts`, `src/content/experience.ts`,
  `src/content/capabilities.ts`, `src/content/writing.ts`,
  `src/content/contacts.ts`, `src/lib/github.ts`,
  `scripts/check-content.mjs`
- Delete: `data.js`
- Modify: `package.json` (add `check:content` to `verify`)
- Test: `tests/content.test.ts`

**Interfaces:**
- Consumes: `Localized<T>`, `Locale`, `LOCALES` from Task 2.
- Produces:
  - `getLocale(): Promise<Locale>` and `getDictionary(): Promise<Dictionary>`
    from `@/content/dictionaries`
  - `SITE: { url: string; name: string; avatar: string; cv: string; location: Localized<string>; status: Localized<string> }`
  - `METRICS: Metric[]` where `Metric = { key: string; value: number; suffix: string; label: Localized<string> }`
  - `EXPERTISE: ExpertiseArea[]`, `FOCUS: Localized<string>[]`
  - `PROJECTS: Project[]`, `CASE_STUDY: CaseStudy`
  - `EXPERIENCE: Role[]`, `EDUCATION: Education`, `CERTIFICATION: Certification`
  - `SKILL_GROUPS: SkillGroup[]`, `PLAYBOOK: PlaybookStep[]`
  - `WRITING: Article[]`, `CONTACTS: Contact[]`

**Porting rule, and it is not negotiable:** every value below is copied out of
`data.js` byte for byte. Do not retranslate, reword, round a number, or "improve"
a title. If a `data.js` entry has no `en`, port the `vi` into both and flag it in
the report — do not invent an English string.

- [ ] **Step 1: Dump the source so the port is mechanical, not remembered**

```bash
node --input-type=module -e "
  const src = await import('./data.js').catch(() => null);
  const text = require('node:fs').readFileSync('data.js','utf8');
  const PORTFOLIO_DATA = eval(text + '; PORTFOLIO_DATA');
  require('node:fs').writeFileSync('/tmp/data.json', JSON.stringify(PORTFOLIO_DATA, null, 2));
  console.log(Object.keys(PORTFOLIO_DATA).join(' '));
"
```
Expected output: `github profile i18n heroTrust focus experience education
certification skillGroups metrics expertise projects caseStudy playbook writing
contacts`

Work from `/tmp/data.json`. Every string in the modules below must appear in
that file.

- [ ] **Step 2: Write the failing test**

`tests/content.test.ts` — this is the gate that makes `Localized<T>` mean
something at runtime as well as at compile time. TypeScript catches a *missing*
key; it cannot catch an *empty* one:

```ts
import { describe, it, expect } from 'vitest';
import { LOCALES } from '@/content/locales';
import { SITE } from '@/content/site';
import { METRICS } from '@/content/metrics';
import { EXPERTISE, FOCUS } from '@/content/expertise';
import { PROJECTS, CASE_STUDY } from '@/content/projects';
import { EXPERIENCE, EDUCATION, CERTIFICATION } from '@/content/experience';
import { SKILL_GROUPS, PLAYBOOK } from '@/content/capabilities';
import { WRITING } from '@/content/writing';
import { CONTACTS } from '@/content/contacts';
import vi from '@/content/dictionaries/vi';
import en from '@/content/dictionaries/en';

/** Walks anything and yields every `{vi, en}`-shaped object it finds, with the
 *  path that led there — so a failure names the field, not just the module. */
function* localized(node: unknown, path = ''): Generator<[string, Record<string, unknown>]> {
  if (node === null || typeof node !== 'object') return;
  const obj = node as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (LOCALES.every((l) => keys.includes(l))) {
    yield [path, obj];
    return;
  }
  for (const [key, value] of Object.entries(obj)) {
    yield* localized(value, path ? `${path}.${key}` : key);
  }
}

const modules: Record<string, unknown> = {
  SITE, METRICS, EXPERTISE, FOCUS, PROJECTS, CASE_STUDY,
  EXPERIENCE, EDUCATION, CERTIFICATION, SKILL_GROUPS, PLAYBOOK, WRITING, CONTACTS,
};

describe('every bilingual field is filled in both languages', () => {
  for (const [name, mod] of Object.entries(modules)) {
    it(name, () => {
      const found = [...localized(mod, name)];
      expect(found.length, `${name} has no bilingual fields — did the port drop them?`)
        .toBeGreaterThan(0);
      for (const [path, value] of found) {
        for (const locale of LOCALES) {
          const text = value[locale];
          expect(typeof text === 'string' || Array.isArray(text), `${path}.${locale}`).toBe(true);
          expect(String(text).trim().length, `${path}.${locale} is empty`).toBeGreaterThan(0);
        }
      }
    });
  }
});

describe('the dictionaries agree on shape', () => {
  it('has the same keys in both languages', () => {
    const flatten = (o: object, p = ''): string[] =>
      Object.entries(o).flatMap(([k, v]) =>
        v && typeof v === 'object' ? flatten(v, `${p}${k}.`) : [`${p}${k}`],
      );
    expect(flatten(en).sort()).toEqual(flatten(vi).sort());
  });
});

describe('the content the page actually needs is present', () => {
  it('carries every project, role, skill group, article and contact', () => {
    expect(PROJECTS.length).toBeGreaterThanOrEqual(9);
    expect(EXPERIENCE.length).toBe(3);
    expect(SKILL_GROUPS.length).toBe(6);
    expect(WRITING.length).toBe(6);
    expect(CONTACTS.length).toBe(5);
    expect(METRICS.length).toBe(4);
    expect(EXPERTISE.length).toBe(4);
    expect(FOCUS.length).toBe(5);
    expect(PLAYBOOK.length).toBe(5);
  });

  it('points at the real CV and avatar files', () => {
    expect(SITE.cv).toBe('/CV_CongAnhDung.pdf');
    expect(SITE.avatar).toBe('/profile.webp');
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

```bash
npx vitest run tests/content.test.ts
```
Expected: FAIL — `Failed to resolve import "@/content/site"`.

- [ ] **Step 4: Write the content modules**

`src/content/site.ts` — the values come from `PORTFOLIO_DATA.profile`:

```ts
import type { Localized } from './locales';

export const SITE = {
  url: 'https://portfolio-dungca.ai-innovation-homelab.org',
  name: 'Công Anh Dũng',
  /** Served straight out of public/. next/image is off (unoptimized), so these
   *  are plain paths, not imports. */
  avatar: '/profile.webp',
  cv: '/CV_CongAnhDung.pdf',
  location: {
    en: 'Hanoi, Vietnam',
    vi: 'Hà Nội, Việt Nam',
  } satisfies Localized<string>,
  status: {
    en: 'AI/ML Systems Architect · Infrastructure & MLOps @ eUp Group',
    vi: 'AI/ML Systems Architect · Hạ tầng & MLOps @ eUp Group',
  } satisfies Localized<string>,
} as const;
```

`src/content/metrics.ts` — `data.js` stores these as
`{ source, fallback, label }` where `source` is a dotted path into the GitHub
dump and `fallback` is the string to show when the dump is missing. The
proof bar counts, so the port resolves each one to a **number** plus a suffix
at build time:

```ts
import type { Localized } from './locales';
import { githubStat } from '@/lib/github';

export type Metric = {
  key: string;
  value: number;
  suffix: string;
  label: Localized<string>;
};

/** `value` is resolved at build time from public/github-data.json, falling back
 *  to the literal in data.js when the dump has no such stat. Splitting the
 *  number from the suffix is what lets CountUp roll the digits: it cannot
 *  animate "3+". */
export const METRICS: Metric[] = [
  // One entry per PORTFOLIO_DATA.metrics[i]. Copy `label` verbatim; read
  // `source` and `fallback` from /tmp/data.json for each.
  {
    key: 'yearsExperience',
    value: githubStat('stats.yearsExperience', 3),
    suffix: '+',
    label: { en: 'Years building systems', vi: 'Năm xây dựng hệ thống' },
  },
  // ... remaining three metrics, ported the same way
];
```

`src/lib/github.ts`:

```ts
import data from '../../public/github-data.json';

/** Reads a dotted path out of the GitHub dump at BUILD time. There is no
 *  runtime fetch: this is a static export, and a fetch would mean the numbers
 *  are blank on first paint and different for every visitor. */
export function githubStat(path: string, fallback: number): number {
  const value = path
    .split('.')
    .reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key], data);
  return typeof value === 'number' ? value : fallback;
}
```

The remaining modules follow the same shape. Each exports a typed array whose
every user-visible field is `Localized<string>`:

```ts
// src/content/expertise.ts
export type ExpertiseArea = {
  key: string;
  title: Localized<string>;
  summary: Localized<string>;
  items: Localized<string[]>;
};
export const EXPERTISE: ExpertiseArea[] = [/* PORTFOLIO_DATA.expertise, verbatim */];
export const FOCUS: Localized<string>[] = [/* PORTFOLIO_DATA.focus, verbatim */];

// src/content/projects.ts
export type Project = {
  slug: string;
  name: string;               // a proper noun — not translated
  summary: Localized<string>;
  stack: string[];            // tool names — not translated
  repo?: string;
  demo?: string;
  highlight?: boolean;
};
export const PROJECTS: Project[] = [/* PORTFOLIO_DATA.projects, all nine */];

export type CaseStudy = {
  title: Localized<string>;
  problem: Localized<string>;
  approach: Localized<string>;
  result: Localized<string>;
  stack: string[];
};
export const CASE_STUDY: CaseStudy = {/* PORTFOLIO_DATA.caseStudy */};

// src/content/experience.ts
export type Role = {
  company: string;
  role: Localized<string>;
  period: Localized<string>;
  current: boolean;
  summary: Localized<string>;
  highlights: Localized<string[]>;
  stack: string[];
};
export const EXPERIENCE: Role[] = [/* all three, most recent first */];
export const EDUCATION = {/* PORTFOLIO_DATA.education */};
export const CERTIFICATION = {/* PORTFOLIO_DATA.certification */};

// src/content/capabilities.ts
export type SkillGroup = { key: string; title: Localized<string>; items: string[] };
export const SKILL_GROUPS: SkillGroup[] = [/* all six */];
export type PlaybookStep = { step: string; title: Localized<string>; body: Localized<string> };
export const PLAYBOOK: PlaybookStep[] = [/* all five */];

// src/content/writing.ts
export type Article = { title: Localized<string>; blurb: Localized<string>; href: string; date: string };
export const WRITING: Article[] = [/* all six */];

// src/content/contacts.ts
export type Contact = { key: string; label: Localized<string>; value: string; href: string };
export const CONTACTS: Contact[] = [/* all five */];
```

`src/content/dictionaries/vi.ts` — the chrome strings, from
`PORTFOLIO_DATA.i18n`. Note `Dictionary` is inferred from the Vietnamese file
and `en.ts` is typed against it, so a key present in one and missing in the
other is a typecheck error:

```ts
const vi = {
  meta: {
    title: 'Công Anh Dũng — AI/ML Systems Architect',
    description:
      'Hạ tầng và MLOps. Xây dựng hệ thống AI chạy được trong sản xuất tại eUp Group.',
  },
  nav: {
    skipToContent: 'Tới nội dung chính',
    expertise: 'Năng lực',
    projects: 'Dự án',
    experience: 'Kinh nghiệm',
    writing: 'Bài viết',
    contact: 'Liên hệ',
    toggleTheme: 'Đổi giao diện sáng/tối',
  },
  common: {
    hireMe: 'Liên hệ hợp tác',
    downloadCv: 'Tải CV',
    repository: 'Mã nguồn',
    demo: 'Bản chạy thử',
    stars: 'Sao',
    present: 'Hiện tại',
  },
  sections: {
    // eyebrow / title / lead for each of the eight sections. The lead is
    // REQUIRED — it fills the right column of the section head, and the page
    // reads thin without it.
  },
  notFound: { title: 'Không tìm thấy trang', back: 'Về trang chủ' },
};

export type Dictionary = typeof vi;
export default vi;
```

`src/content/dictionaries/en.ts`:

```ts
import type { Dictionary } from './vi';

const en: Dictionary = {
  /* same keys, English values */
};

export default en;
```

`src/content/dictionaries.ts`:

```ts
import { lang } from 'next/root-params';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from './locales';
import vi, { type Dictionary } from './dictionaries/vi';
import en from './dictionaries/en';

const dictionaries: Record<Locale, Dictionary> = { vi, en };

/** Reads the locale from the root param. Every Server Component can call this,
 *  which is why no component below takes a `locale` prop it does not use. */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!value || !isLocale(value)) notFound();
  return value;
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()];
}

export type { Dictionary };
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx vitest run tests/content.test.ts
```
Expected: PASS. If a `.en` assertion fails, the port dropped a translation —
go back to `/tmp/data.json` and copy it; do not write a new one.

- [ ] **Step 6: Add the gate and delete data.js**

`scripts/check-content.mjs` — the same walk as the test, but over the built
output, so a page that renders a translation key instead of a translation is
caught:

```js
/* The test checks the content modules. This checks the HTML they produced.
   They are not the same thing: a component can hold correct bilingual data and
   still render the wrong half of it, or none. */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const pages = ['out/vi/index.html', 'out/en/index.html'];
let failed = false;

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  // An unresolved Localized<T> stringifies to this. If it reaches the HTML, a
  // component rendered the wrapper instead of picking a language out of it.
  if (html.includes('[object Object]')) {
    console.error(`FAIL  ${page} contains [object Object] — a Localized<T> was rendered raw.`);
    failed = true;
  }
  if (html.includes('undefined<')) {
    console.error(`FAIL  ${page} contains a rendered \`undefined\`.`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log(`OK    ${pages.length} pages carry no unresolved content`);
```

Add to `package.json`:
```json
"check:content": "node scripts/check-content.mjs",
"verify": "npm run format:check && npm run lint && npm run typecheck && npm test && npm run build && npm run check:content"
```

```bash
git rm data.js
```

- [ ] **Step 7: Commit**

```bash
npm run verify
git add -A
git commit -m "$(cat <<'EOF'
feat: port the content into typed bilingual modules

Every leaf in data.js was already {en, vi}, so this is a shape change and
not a rewrite: nothing was retranslated, reworded or rounded. What changes
is that the shape is now enforced. Localized<T> makes a missing key a
typecheck failure, tests/content.test.ts makes an EMPTY key a test failure
(TypeScript cannot see that one), and check-content.mjs makes a wrapper
rendered instead of a translation a build failure.

data.js is deleted. It is in git history, and /tmp/data.json was the
working copy for the port.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Design tokens and the base stylesheet

**Files:**
- Modify: `src/app/globals.css`
- Create: `scripts/check-no-hardcoded-colors.mjs`
- Modify: `package.json`
- Test: `tests/contrast.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: Tailwind colour utilities `bg-background`, `bg-surface`,
  `bg-surface-muted`, `text-foreground`, `text-muted-foreground`, `bg-primary`,
  `text-primary-foreground`, `border-border`, `shadow-raised`,
  `shadow-overlay`, and the AA-safe ink colours `text-ink-primary`,
  `text-ink-accent`, `text-ink-info`, `text-ink-success`. Also the duration and
  easing tokens `duration-fast|base|slow|hero` and `ease-out-soft|ease-spring`,
  the `wide` breakpoint at 900px, and `max-w-content` / `max-w-prose`.

- [ ] **Step 1: Write the failing contrast test**

`tests/contrast.test.ts` — the accent colours are the one part of this palette
that is actively unsafe, and the mix ratio that fixes them is a number somebody
will eventually "tidy". This test is what stops that:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync('src/app/globals.css', 'utf8');

/** WCAG relative luminance. */
function luminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function ratio(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Mixes `pct`% of `colour` into `base`, the sRGB way color-mix does it. */
function mix(colour: string, base: string, pct: number): string {
  const parse = (h: string) => {
    const n = parseInt(h.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [c, b] = [parse(colour), parse(base)];
  const out = c.map((v, i) => Math.round((v * pct + b[i] * (100 - pct)) / 100));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

const ACCENT = '#40a69f';
const INFO = '#2b7fd4';
const LIGHT_BG = '#f5f5f5';
const DARK_BG = '#0b0b0b';
const MIX = 68;

describe('the accent colours', () => {
  it('fail AA when used raw — which is why the ink layer exists', () => {
    expect(ratio(ACCENT, LIGHT_BG)).toBeLessThan(4.5);
    expect(ratio(INFO, LIGHT_BG)).toBeLessThan(4.5);
  });

  it('pass AA once mixed 68% with the foreground, in BOTH themes', () => {
    expect(ratio(mix(ACCENT, '#000', MIX), LIGHT_BG)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(mix(INFO, '#000', MIX), LIGHT_BG)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(mix(ACCENT, '#fff', MIX), DARK_BG)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(mix(INFO, '#fff', MIX), DARK_BG)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('globals.css', () => {
  it('declares the ink colours under BOTH :root and [data-theme="dark"]', () => {
    // A custom property is substituted where it is DECLARED. Declaring the mix
    // only on :root means the dark theme silently keeps the light foreground,
    // and the text goes unreadable with no error anywhere.
    const block = css.match(/:root,\s*\[data-theme='dark'\]\s*\{[^}]*--site-ink-primary/s);
    expect(block, '--site-ink-primary must be declared for both themes at once').not.toBeNull();
  });

  it('uses @theme inline for the ink colours, not plain @theme', () => {
    // Plain @theme copies the value once at build time, so switching
    // data-theme would do nothing.
    expect(css).toMatch(/@theme inline\s*\{[^}]*--color-ink-primary/s);
  });

  it('redirects the brand hue to blue in both themes', () => {
    expect(css).toMatch(/--base-palette-brand-500:\s*var\(--base-palette-blue-500\)/);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx vitest run tests/contrast.test.ts
```
Expected: the three `globals.css` assertions FAIL — the file is still the
one-line stub from Task 1. The four colour-maths assertions pass immediately;
they are describing the palette, not the code.

- [ ] **Step 3: Write globals.css**

```css
@import 'tailwindcss';
@import '@levi-it/design-system/tokens.css';
@source '../../node_modules/@levi-it/design-system/dist/**/*.{js,cjs,mjs}';

/* ───────────────────────────────────────────────────────────────────────────
 * 1. PALETTE DIRECTION
 *
 * The design system ships indigo as the brand. This site runs blue. Declaring
 * it for :root and [data-theme='dark'] in the same rule is deliberate — see
 * the ink block below for why one selector is not enough.
 * ──────────────────────────────────────────────────────────────────────── */
:root,
[data-theme='dark'] {
  --base-palette-brand-500: var(--base-palette-blue-500);
  --base-primary-subtle: var(--base-info-subtle);
}

/* ───────────────────────────────────────────────────────────────────────────
 * 2. INK — accent colours made safe to set text in.
 *
 * Measured against their own backgrounds: accent 2.69:1, info 3.78:1, and
 * primary on dark 2.68:1. All three fail AA's 4.5:1. They are fine as a fill
 * and unusable as text.
 *
 * Mixing 68% of the accent into the FOREGROUND fixes it in both directions at
 * once, because the foreground itself flips with the theme: black on light,
 * white on dark. Measured after mixing: 4.74:1 to 11.32:1.
 *
 * Both selectors are required. A custom property is substituted at its
 * DECLARATION site, so a single :root declaration bakes in the light
 * foreground and the dark theme quietly keeps unreadable text.
 * ──────────────────────────────────────────────────────────────────────── */
:root,
[data-theme='dark'] {
  --site-ink-primary: color-mix(in srgb, var(--base-primary) 68%, var(--base-foreground));
  --site-ink-accent: color-mix(in srgb, var(--base-accent) 68%, var(--base-foreground));
  --site-ink-info: color-mix(in srgb, var(--base-info) 68%, var(--base-foreground));
  --site-ink-success: color-mix(in srgb, var(--base-success) 68%, var(--base-foreground));
}

/* `inline`, not plain `@theme`: the plain form copies the value into the
 * stylesheet once at build time, and changing data-theme would do nothing. */
@theme inline {
  --color-ink-primary: var(--site-ink-primary);
  --color-ink-accent: var(--site-ink-accent);
  --color-ink-info: var(--site-ink-info);
  --color-ink-success: var(--site-ink-success);
}

@theme {
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 400ms;
  --duration-hero: 700ms;

  --ease-out-soft: cubic-bezier(0.2, 0, 0, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* The section head goes two-column here. Not one of Tailwind's defaults,
   * because the break is set by the headline's measure, not by device width. */
  --breakpoint-wide: 900px;

  --container-content: 100rem;
  --container-prose: 42rem;
}

/* ───────────────────────────────────────────────────────────────────────────
 * 3. BASE
 * ──────────────────────────────────────────────────────────────────────── */
@layer base {
  html {
    scroll-behavior: smooth;
    /* The sticky header is 4rem. Without this, an anchor lands with the
     * heading underneath it. */
    scroll-padding-top: 5rem;
  }

  /* Smooth scrolling is motion, and it is motion aimed at exactly the people
   * who asked for less of it. It carries no information, so it goes. */
  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
  }

  body {
    font-family: 'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif;
    background-color: var(--base-background);
    color: var(--base-foreground);
    text-rendering: optimizeLegibility;
    font-feature-settings:
      'ss01' 1,
      'cv11' 1;
  }

  h1,
  h2,
  h3,
  h4 {
    text-wrap: balance;
  }

  p {
    text-wrap: pretty;
  }

  ::selection {
    background-color: var(--base-primary);
    color: var(--base-primary-foreground);
  }

  :focus-visible {
    outline: var(--base-focus-width) solid var(--base-ring);
    outline-offset: 2px;
  }
}

/* Both theme icons sit in the DOM and CSS picks one. Doing it in React state
 * means the icon is wrong until hydration, which is visible. */
@utility theme-light-only {
  display: block;
  [data-theme='dark'] & {
    display: none;
  }
}

@utility theme-dark-only {
  display: none;
  [data-theme='dark'] & {
    display: block;
  }
}

/* ───────────────────────────────────────────────────────────────────────────
 * 4. THE REST LIVES IN PER-SECTION FILES
 *
 * THE ORDER BELOW IS THE CASCADE ORDER. A new file goes in its own group.
 * ──────────────────────────────────────────────────────────────────────── */
@import '../styles/motion.css';
@import '../styles/motion-reduced.css';
@import '../styles/layout/menu-bar.css';
@import '../styles/sections/hero.css';
@import '../styles/sections/work.css';
@import '../styles/sections/contact.css';
```

Create the six imported files as empty stubs with a one-line comment; Tasks 6
through 12 fill them. An `@import` of a missing file is a build error.

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run tests/contrast.test.ts && npm run build
```
Expected: 7 tests PASS, build succeeds.

- [ ] **Step 5: Write the colour gate**

`scripts/check-no-hardcoded-colors.mjs`:

```js
/* One file owns colour. Everywhere else goes through a token, so that changing
   the palette is one edit and so that dark mode cannot be forgotten in a
   corner — a literal hex does not flip with the theme, and nothing warns you. */
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const ALLOWED = 'src/app/globals.css';
const PATTERN = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch)\(/;

const files = globSync('src/**/*.{ts,tsx,css}').filter((f) => !f.endsWith(ALLOWED));
let failed = false;

for (const file of files) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      // An SVG path's `d` attribute is full of hex-looking noise, and a
      // fragment href is not a colour.
      if (/\bd=|href="#|url\(#/.test(line)) return;
      if (PATTERN.test(line)) {
        console.error(`FAIL  ${file}:${i + 1}  colour literal outside the token layer`);
        console.error(`      ${line.trim()}`);
        failed = true;
      }
    });
}

if (failed) {
  console.error('\n      Use a design-system token or a Tailwind class that resolves to one.');
  console.error(`      Only ${ALLOWED} may contain a colour literal.`);
  process.exit(1);
}

console.log(`OK    ${files.length} files carry no colour literals`);
```

Add to `package.json` and put it in `verify` before `build`:
```json
"check:colors": "node scripts/check-no-hardcoded-colors.mjs",
"verify": "npm run format:check && npm run lint && npm run typecheck && npm test && npm run check:colors && npm run build && npm run check:content"
```

- [ ] **Step 6: Commit**

```bash
npm run verify
git add -A
git commit -m "$(cat <<'EOF'
feat: design tokens, the AA-safe ink layer, and the colour gate

The accent colours are unusable as text at source — accent 2.69:1, info
3.78:1, primary on dark 2.68:1, all under AA's 4.5:1. Mixing 68% of each
into --base-foreground fixes both themes with one formula, because the
foreground flips and the accent does not. Measured after the mix:
4.74:1 to 11.32:1.

Two things about that block are load-bearing and look like redundancy:
it is declared under :root AND [data-theme='dark'] (a custom property is
substituted where it is declared, so one selector bakes in the light
foreground), and it is exposed through `@theme inline` rather than plain
`@theme` (the plain form copies the value once and stops responding to
the theme attribute). tests/contrast.test.ts asserts both.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Theme — no-flash script and the toggle

**Files:**
- Create: `src/components/site/theme-script.tsx`,
  `src/components/site/theme-toggle.tsx`
- Modify: `src/app/[lang]/layout.tsx`
- Test: `tests/theme.test.tsx`

**Interfaces:**
- Consumes: `theme-light-only` / `theme-dark-only` utilities (Task 4),
  `getDictionary` (Task 3), `cn` (Task 2).
- Produces: `<ThemeScript />` (no props) and
  `<ThemeToggle label={string} />`. Storage key is `portfolio-theme`;
  the value is written to `document.documentElement.dataset.theme`.

- [ ] **Step 1: Write the failing test**

`tests/theme.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '@/components/site/theme-toggle';

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('ThemeToggle', () => {
  it('is a labelled button, so a screen reader can announce it', () => {
    render(<ThemeToggle label="Đổi giao diện sáng/tối" />);
    expect(screen.getByRole('button', { name: 'Đổi giao diện sáng/tối' })).toBeInTheDocument();
  });

  it('switches the document to dark and remembers it', async () => {
    render(<ThemeToggle label="toggle" />);
    await userEvent.click(screen.getByRole('button'));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('portfolio-theme')).toBe('dark');
  });

  it('switches back to light, and stores it rather than clearing it', async () => {
    // Storing 'light' explicitly matters: an absent key means "follow the
    // system", and a visitor who chose light on a dark-mode machine would get
    // dark back on the next visit.
    document.documentElement.dataset.theme = 'dark';
    render(<ThemeToggle label="toggle" />);
    await userEvent.click(screen.getByRole('button'));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('portfolio-theme')).toBe('light');
  });

  it('renders both icons, since CSS picks between them', () => {
    const { container } = render(<ThemeToggle label="toggle" />);
    expect(container.querySelector('.theme-light-only')).not.toBeNull();
    expect(container.querySelector('.theme-dark-only')).not.toBeNull();
  });
});
```

Add `@testing-library/user-event` to devDependencies.

- [ ] **Step 2: Run it to verify it fails**

```bash
npx vitest run tests/theme.test.tsx
```
Expected: FAIL — `Failed to resolve import "@/components/site/theme-toggle"`.

- [ ] **Step 3: Write the components**

`src/components/site/theme-script.tsx`:

```tsx
/* This runs BEFORE first paint, which is the only reason it is a string of
   hand-written JS instead of a component. React cannot help here: by the time
   hydration runs, the visitor has already seen the wrong theme flash.

   It also adds `js`. The reveal animations start at opacity 0, so without a
   way to tell that JS is alive, a visitor with JS off would get a page of
   invisible text. */
const script = `(function(){var r=document.documentElement;r.classList.add('js');try{var t=localStorage.getItem('portfolio-theme');if(t==='dark'||t==='light'){r.dataset.theme=t}}catch(e){}})()`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
```

`src/components/site/theme-toggle.tsx`:

```tsx
'use client';

export function ThemeToggle({ label }: { label: string }) {
  /* No React state. The source of truth is the `data-theme` attribute, which
     the pre-paint script already set — mirroring it into state would make the
     first render disagree with the DOM and hydration would warn. */
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try {
      // Store 'light' rather than removing the key. An absent key means
      // "follow the system", so clearing it would override the visitor's
      // explicit choice on their next visit.
      localStorage.setItem('portfolio-theme', next);
    } catch {
      // Private mode, or storage disabled. The theme still switches for this
      // page view; only the memory is lost.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className="duration-fast ease-out-soft grid size-10 place-items-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-surface-muted"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="theme-light-only size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" strokeLinecap="round" />
      </svg>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="theme-dark-only size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
```

- [ ] **Step 4: Wire it into the layout and run the tests**

In `src/app/[lang]/layout.tsx`, add `<head><ThemeScript /></head>` above
`<body>`.

```bash
npx vitest run tests/theme.test.tsx
```
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
npm run verify
git add -A
git commit -m "$(cat <<'EOF'
feat: theme switching with no flash of the wrong one

The pre-paint script is hand-written JS in a dangerouslySetInnerHTML
string because React runs too late to help: by hydration the visitor has
already seen the wrong theme. The same script adds `js`, without which a
JS-less visitor gets a page of text stuck at opacity 0.

The toggle holds no React state. data-theme on <html> is the source of
truth, already set before paint; mirroring it into state would make the
first render disagree with the DOM. It stores 'light' explicitly rather
than clearing the key, because an absent key means "follow the system" and
would overrule a visitor who deliberately chose light.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: The motion system

**Files:**
- Create: `src/components/motion/use-in-view.ts`,
  `src/components/motion/reveal-scope.tsx`,
  `src/components/motion/drawn-underline.tsx`
- Modify: `src/styles/motion.css`, `src/styles/motion-reduced.css`
- Test: `tests/motion.test.ts`

**Interfaces:**
- Consumes: `cn` (Task 2), the duration and easing tokens (Task 4).
- Produces: the utilities `reveal`, `reveal-clip`, `reveal-load`,
  `reveal-clip-load`, `stagger`, `blueprint`, `pop-on-hover`; the components
  `<RevealScope className?>` and `<DrawnUnderline className?>`; and the hook
  `useInView<T extends HTMLElement>(rootMargin?: string): RefObject<T>`.

- [ ] **Step 1: Write the failing test**

`tests/motion.test.ts` — the reduced-motion reset is the thing worth a test.
Getting it wrong does not look like a bug; it looks like an empty page, and
only for the people least able to work around it:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const motion = readFileSync('src/styles/motion.css', 'utf8');
const reduced = readFileSync('src/styles/motion-reduced.css', 'utf8');

describe('reveal', () => {
  it('is scroll-driven, not observer-driven, where the browser supports it', () => {
    expect(motion).toMatch(/animation-timeline:\s*view\(\)/);
  });

  it('keeps the JS fallback behind `@supports not`, so it never double-runs', () => {
    expect(motion).toMatch(/@supports not \(animation-timeline: view\(\)\)/);
  });

  it('gates the fallback on `.js`, so a JS-less visitor is not left at opacity 0', () => {
    const block = motion.match(/@supports not[\s\S]*?\n\}/)?.[0] ?? '';
    expect(block).toMatch(/\.js \.reveal/);
  });
});

describe('prefers-reduced-motion', () => {
  it('resets to the FINAL frame, not to no-animation', () => {
    // `animation: none` on a `both`-filled animation parks the element at its
    // FIRST frame — opacity 0 — and the content vanishes. Every reset here
    // must also restore opacity and clear the transform.
    const block = reduced.match(/@media \(prefers-reduced-motion: reduce\)[\s\S]*/)?.[0] ?? '';
    expect(block).toMatch(/opacity:\s*1\s*!important/);
    expect(block).toMatch(/transform:\s*none\s*!important/);
    expect(block).toMatch(/clip-path:\s*none\s*!important/);
  });

  it('stops the infinite animations rather than shortening them', () => {
    expect(reduced).toMatch(/\.blueprint::before/);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx vitest run tests/motion.test.ts
```
Expected: FAIL — the stub files contain only a comment.

- [ ] **Step 3: Write the CSS**

`src/styles/motion.css`:

```css
/* Reveal runs on `animation-timeline: view()` — the browser drives it from
   scroll position with no JS at all. Where that is missing, ONE
   IntersectionObserver sets data-inview and a transition takes over. The two
   are mutually exclusive by construction (`@supports not`), so they can never
   both be running on the same element. */

@keyframes site-reveal-up {
  from {
    opacity: 0;
    transform: translateY(1.25rem);
  }
}

@keyframes site-reveal-clip {
  from {
    opacity: 0;
    clip-path: inset(0 0 100% 0);
    transform: translateY(0.75rem);
  }
}

@keyframes site-drift {
  to {
    transform: translateY(-6%);
  }
}

@utility reveal {
  animation: site-reveal-up var(--duration-slow) var(--ease-spring) both;
  animation-timeline: view();
  animation-range: entry 10% cover 26%;
}

@utility reveal-clip {
  animation: site-reveal-clip var(--duration-slow) var(--ease-out-soft) both;
  animation-timeline: view();
  animation-range: entry 10% cover 30%;
}

/* For content that is ALREADY in the viewport at load — the hero. A
   scroll-driven animation on it would never play, because it never enters. */
@utility reveal-load {
  animation: site-reveal-up var(--duration-slow) var(--ease-spring) both;
}

@utility reveal-clip-load {
  animation: site-reveal-clip var(--duration-slow) var(--ease-out-soft) both;
}

@supports not (animation-timeline: view()) {
  /* `.js` matters: without JS nothing sets data-inview, and this rule would
     leave every revealing element at opacity 0 forever. */
  .js .reveal,
  .js .reveal-clip {
    animation: none;
    opacity: 0;
    transform: translateY(1.25rem);
    transition:
      opacity var(--duration-slow) var(--ease-out-soft),
      transform var(--duration-slow) var(--ease-out-soft);
  }

  .js .reveal[data-inview='true'],
  .js .reveal-clip[data-inview='true'] {
    opacity: 1;
    transform: none;
  }
}

/* Child n arrives after child n-1. Capped at eight steps: past that the last
   item is still waiting when the reader has moved on. */
@utility stagger {
  & > * {
    animation-delay: calc(var(--stagger-step, 60ms) * var(--i, 0));
    transition-delay: calc(var(--stagger-step, 60ms) * var(--i, 0));
  }
}

/* A very slow drifting grid behind a band. The colour is the border token
   thinned out, so it follows the theme. */
@utility blueprint {
  position: relative;
  isolation: isolate;

  &::before {
    content: '';
    position: absolute;
    inset: -10% 0;
    z-index: -1;
    pointer-events: none;
    background-image:
      linear-gradient(
        to right,
        color-mix(in srgb, var(--base-border) 55%, transparent) 1px,
        transparent 1px
      ),
      linear-gradient(
        to bottom,
        color-mix(in srgb, var(--base-border) 55%, transparent) 1px,
        transparent 1px
      );
    background-size: 3rem 3rem;
    mask-image: linear-gradient(to bottom, transparent, black 18%, black 82%, transparent);
    animation: site-drift linear both;
    animation-timeline: view();
    animation-range: cover;
  }
}

/* 2px of lift on a chip. Enough to read as a response, not enough to shift
   the line of text next to it. */
@utility pop-on-hover {
  transition:
    transform var(--duration-fast) var(--ease-spring),
    box-shadow var(--duration-fast) var(--ease-out-soft);

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-2px) scale(1.04);
    }
  }
}
```

`src/styles/motion-reduced.css`:

```css
/* NOT `animation: none` on its own. These animations are filled `both`, so
   removing the animation parks the element on its FIRST frame — opacity 0 —
   and the content disappears for exactly the people who asked for less motion.
   Every reset below has to land on the LAST frame instead. */

@media (prefers-reduced-motion: reduce) {
  .reveal,
  .reveal-clip,
  .reveal-load,
  .reveal-clip-load,
  .blueprint::before {
    animation: none !important;
    opacity: 1 !important;
    clip-path: none !important;
    transform: none !important;
    transition: none !important;
  }

  /* The drawn underline is an exception: the stroke IS the graphic. Drop the
     animation but hand back the dash values, or the line vanishes. */
  .drawn-line path {
    animation: none !important;
    stroke-dasharray: none;
    stroke-dashoffset: 0;
  }

  .pop-on-hover {
    transition: none !important;
  }
}
```

- [ ] **Step 4: Write the components**

`src/components/motion/use-in-view.ts`:

```ts
'use client';

import { useEffect, useRef } from 'react';

/** The ONLY fallback for scroll-driven animation. On a browser that has
 *  `animation-timeline`, this hook attaches nothing at all — the CSS
 *  `@supports not` branch is the only thing that reads data-inview. */
export function useInView<T extends HTMLElement>(rootMargin = '0px 0px -12% 0px') {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (CSS.supports('animation-timeline: view()')) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute('data-inview', 'true');
          // Reveal is a one-way trip. Leaving it observed would replay the
          // animation every time the visitor scrolled back.
          io.unobserve(entry.target);
        }
      },
      { rootMargin },
    );

    const targets = el.matches('.reveal, .reveal-clip')
      ? [el]
      : Array.from(el.querySelectorAll<HTMLElement>('.reveal, .reveal-clip'));
    targets.forEach((t) => io.observe(t));

    return () => io.disconnect();
  }, [rootMargin]);

  return ref;
}
```

`src/components/motion/reveal-scope.tsx`:

```tsx
'use client';

import type { ReactNode } from 'react';
import { useInView } from './use-in-view';

/** Wraps a region containing many `.reveal` children. One observer per section
 *  rather than one per element, and on a modern browser, none. */
export function RevealScope({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
```

`src/components/motion/drawn-underline.tsx`:

```tsx
import { cn } from '@/lib/cn';

/** The hand-drawn stroke under a headline. `preserveAspectRatio="none"` lets
 *  it stretch to the headline's width at any screen size without measuring
 *  anything in JS. */
export function DrawnUnderline({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 640 24"
      preserveAspectRatio="none"
      fill="none"
      className={cn('drawn-line h-3 w-full text-ink-primary sm:h-4', className)}
    >
      <path
        d="M4 16C88 6 176 4 264 8c88 4 176 12 264 8 36-3 72-8 108-14"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npx vitest run tests/motion.test.ts && npm run build
```
Expected: 5 tests PASS, build succeeds.

- [ ] **Step 6: Commit**

```bash
npm run verify
git add -A
git commit -m "$(cat <<'EOF'
feat: scroll-driven reveal, with one observer as the fallback

Where the browser has animation-timeline: view(), reveal costs zero JS.
Where it does not, `@supports not` swaps in a transition driven by one
IntersectionObserver per section. The two can never both run: the
`@supports not` guard makes them mutually exclusive.

Two guards that look like noise and are not. The fallback is gated on
`.js` — without it, a visitor with JS off gets a page of invisible text,
because nothing would ever set data-inview. And the reduced-motion reset
restores opacity and clears the transform rather than just removing the
animation: these are `both`-filled, so `animation: none` alone parks them
on frame one, opacity 0, and the page goes blank for the people who asked
for less motion.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: The layout shell

**Files:**
- Create: `src/components/site/container.tsx`, `src/components/site/section.tsx`,
  `src/components/site/skip-link.tsx`, `src/components/site/footer.tsx`,
  `src/components/layout/menu-bar.tsx`,
  `src/components/layout/locale-switch.tsx`,
  `src/styles/layout/menu-bar.css`, `src/app/not-found.tsx`,
  `src/app/robots.ts`, `src/app/sitemap.ts`
- Modify: `src/app/[lang]/layout.tsx`
- Test: `tests/section.test.tsx`, `tests/menu-bar.test.tsx`

**Interfaces:**
- Consumes: `cn`, `localeHref`, `localeAnchorHref`, `swapLocale` (Task 2);
  `getLocale`, `getDictionary`, `Dictionary`, `SITE` (Task 3); `RevealScope`
  (Task 6); `ThemeToggle`, `ThemeScript` (Task 5).
- Produces:
  - `<Container className?>{children}</Container>`
  - `<Section id? className? blueprint? dark?>{children}</Section>`
  - `<SectionHeading eyebrow title lead? className? stacked? />`
  - `<MenuBar locale dict />`, `<Footer locale dict />`,
    `<SkipLink label />`, `<LocaleSwitch locale />`

- [ ] **Step 1: Write the failing tests**

`tests/section.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Section, SectionHeading } from '@/components/site/section';

describe('Section', () => {
  it('carries its id, so the nav anchors land', () => {
    const { container } = render(<Section id="work">x</Section>);
    expect(container.querySelector('section#work')).not.toBeNull();
  });

  it('marks a dark band with data-theme, not with a colour class', () => {
    // The tokens flip on an attribute selector, so one attribute turns the
    // whole subtree dark — including anything nested that never heard of it.
    const { container } = render(<Section dark>x</Section>);
    expect(container.querySelector('section')?.dataset.theme).toBe('dark');
  });

  it('leaves data-theme off a normal band, so it inherits the page theme', () => {
    const { container } = render(<Section>x</Section>);
    expect(container.querySelector('section')?.dataset.theme).toBeUndefined();
  });
});

describe('SectionHeading', () => {
  it('renders the eyebrow, an h2, and the lead', () => {
    render(<SectionHeading eyebrow="01" title="Dự án" lead="Những thứ đã chạy thật." />);
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Dự án' })).toBeInTheDocument();
    expect(screen.getByText('Những thứ đã chạy thật.')).toBeInTheDocument();
  });

  it('omits the lead paragraph entirely when there is none', () => {
    const { container } = render(<SectionHeading eyebrow="01" title="Dự án" />);
    expect(container.querySelectorAll('p')).toHaveLength(1); // the eyebrow only
  });
});
```

`tests/menu-bar.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkipLink } from '@/components/site/skip-link';

describe('SkipLink', () => {
  it('points at #main', () => {
    render(<SkipLink label="Tới nội dung chính" />);
    expect(screen.getByRole('link', { name: 'Tới nội dung chính' })).toHaveAttribute(
      'href',
      '#main',
    );
  });

  it('is reachable but off-screen until focused, not display:none', () => {
    // display:none removes it from the tab order, which defeats the entire
    // purpose of a skip link.
    const { container } = render(<SkipLink label="skip" />);
    const link = container.querySelector('a');
    expect(link?.className).toMatch(/sr-only/);
    expect(link?.className).toMatch(/focus:not-sr-only/);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

```bash
npx vitest run tests/section.test.tsx tests/menu-bar.test.tsx
```
Expected: FAIL — `Failed to resolve import "@/components/site/section"`.

- [ ] **Step 3: Write the shell components**

`src/components/site/container.tsx`:

```tsx
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-content px-5 sm:px-8', className)}>{children}</div>;
}
```

`src/components/site/section.tsx`:

```tsx
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Container } from './container';
import { RevealScope } from '@/components/motion/reveal-scope';

type SectionProps = {
  children: ReactNode;
  id?: string;
  className?: string;
  blueprint?: boolean;
  dark?: boolean;
};

/** One band of the page. `dark` sets data-theme rather than a background
 *  class: the tokens flip on that attribute, so everything nested inside goes
 *  dark too, including components that know nothing about being in a dark
 *  band. RevealScope wraps the contents so the section owns its one observer
 *  on browsers that need one. */
export function Section({ children, id, className, blueprint, dark }: SectionProps) {
  return (
    <section
      id={id}
      data-theme={dark ? 'dark' : undefined}
      className={cn(
        'py-20 sm:py-28',
        blueprint && 'blueprint',
        dark && 'bg-background text-foreground',
        className,
      )}
    >
      <RevealScope>
        <Container>{children}</Container>
      </RevealScope>
    </section>
  );
}

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  lead?: string;
  className?: string;
  stacked?: boolean;
};

/** Eyebrow, an oversized headline, and a lead paragraph bottom-aligned in the
 *  right column from 900px up. The lead is what stops a section head reading
 *  as a bare title on a lot of empty space — supply one. */
export function SectionHeading({ eyebrow, title, lead, className, stacked }: SectionHeadingProps) {
  return (
    <div className={className}>
      <p className="reveal text-sm font-semibold tracking-[0.14em] text-ink-primary uppercase">
        {eyebrow}
      </p>
      <div
        className={cn(
          'gap-5',
          stacked
            ? 'block'
            : 'block sm:grid wide:grid-cols-[minmax(0,1.25fr)_minmax(16rem,0.75fr)] wide:items-end',
        )}
      >
        <h2
          className={cn(
            'reveal-clip text-[clamp(2.25rem,4.8vw,4.5rem)] leading-[0.98] font-semibold tracking-tighter text-balance',
            stacked ? 'max-w-96' : 'max-w-2xl',
          )}
        >
          {title}
        </h2>
        {lead ? (
          <p
            className={cn(
              'reveal self-end text-lg text-pretty text-muted-foreground',
              stacked ? 'mt-5 max-w-104' : 'mt-4 max-w-120 sm:mt-0',
            )}
          >
            {lead}
          </p>
        ) : null}
      </div>
    </div>
  );
}
```

`src/components/site/skip-link.tsx`:

```tsx
/** `sr-only` and not `hidden`: a hidden link is out of the tab order, and a
 *  skip link that cannot be tabbed to is decoration. */
export function SkipLink({ label }: { label: string }) {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
    >
      {label}
    </a>
  );
}
```

`src/components/layout/locale-switch.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LOCALES, LOCALE_LABEL, type Locale } from '@/content/locales';
import { swapLocale } from '@/lib/paths';
import { cn } from '@/lib/cn';

/** Client-side only because it needs the current path: swapping the locale
 *  segment keeps the visitor where they are, rather than dropping them at the
 *  top of the other language's home page. */
export function LocaleSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 text-sm">
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={swapLocale(pathname, l)}
          hrefLang={l}
          aria-current={l === locale ? 'true' : undefined}
          aria-label={LOCALE_LABEL[l]}
          className={cn(
            'duration-fast rounded-full px-2 py-1 uppercase transition-colors',
            l === locale ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
```

`src/components/layout/menu-bar.tsx` — the floating pill header:

```tsx
import Link from 'next/link';
import type { Locale } from '@/content/locales';
import type { Dictionary } from '@/content/dictionaries';
import { localeAnchorHref, localeHref } from '@/lib/paths';
import { SITE } from '@/content/site';
import { ThemeToggle } from '@/components/site/theme-toggle';
import { LocaleSwitch } from './locale-switch';

const ANCHORS = ['expertise', 'projects', 'experience', 'writing', 'contact'] as const;

export function MenuBar({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <header className="menu-bar">
      <nav aria-label={SITE.name} className="menu-bar-pill">
        <Link href={localeHref(locale)} className="font-semibold tracking-tight">
          {SITE.name}
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {ANCHORS.map((anchor) => (
            <li key={anchor}>
              <Link
                href={localeAnchorHref(locale, anchor)}
                className="duration-fast rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                {dict.nav[anchor]}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <LocaleSwitch locale={locale} />
          <ThemeToggle label={dict.nav.toggleTheme} />
        </div>
      </nav>
    </header>
  );
}
```

`src/styles/layout/menu-bar.css`:

```css
/* A floating pill rather than a full-width bar. `backdrop-filter` on a
   translucent surface, so the page shows through as it scrolls underneath. */
.menu-bar {
  position: fixed;
  inset: 0.75rem 0 auto;
  z-index: 40;
  display: flex;
  justify-content: center;
  padding-inline: 1rem;
  pointer-events: none;
}

.menu-bar-pill {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 64rem;
  padding: 0.5rem 0.75rem 0.5rem 1.25rem;
  border: 1px solid var(--base-border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--base-surface) 82%, transparent);
  box-shadow: var(--base-shadow-raised);
  backdrop-filter: blur(12px);
  pointer-events: auto;
  justify-content: space-between;
}
```

`src/components/site/footer.tsx`, `src/app/not-found.tsx`, `src/app/robots.ts`
and `src/app/sitemap.ts` follow. `not-found.tsx` renders its **own** `<html>`
and `<body>`: the root layout lives at `app/[lang]/layout.tsx`, so nothing
wraps a 404. Write it bilingually — at that moment there is no way to know
which language the visitor wanted.

```ts
// src/app/sitemap.ts
import type { MetadataRoute } from 'next';
import { LOCALES } from '@/content/locales';
import { SITE } from '@/content/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.map((locale) => ({
    url: `${SITE.url}/${locale}/`,
    lastModified: new Date(),
    alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE.url}/${l}/`])) },
  }));
}
```

- [ ] **Step 4: Assemble the layout**

`src/app/[lang]/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import '@fontsource-variable/inter';
import '../globals.css';
import { LOCALES, BCP47 } from '@/content/locales';
import { getDictionary, getLocale } from '@/content/dictionaries';
import { SITE } from '@/content/site';
import { MenuBar } from '@/components/layout/menu-bar';
import { Footer } from '@/components/site/footer';
import { SkipLink } from '@/components/site/skip-link';
import { ThemeScript } from '@/components/site/theme-script';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ lang: locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const current = await getLocale();
  const dict = await getDictionary();

  return {
    metadataBase: new URL(SITE.url),
    title: { default: dict.meta.title, template: `%s — ${SITE.name}` },
    description: dict.meta.description,
    alternates: {
      canonical: `/${current}/`,
      // Without hreflang, a search engine treats the two languages as
      // duplicate content and picks one for everybody.
      languages: { vi: '/vi/', en: '/en/', 'x-default': '/vi/' },
    },
    openGraph: {
      type: 'website',
      siteName: SITE.name,
      locale: current,
      title: dict.meta.title,
      description: dict.meta.description,
    },
    icons: { icon: '/favicon.svg' },
  };
}

export default async function RootLayout({ children }: LayoutProps<'/[lang]'>) {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    <html lang={BCP47[locale]} className="h-full antialiased" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <SkipLink label={dict.nav.skipToContent} />
        <MenuBar locale={locale} dict={dict} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer locale={locale} dict={dict} />
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npx vitest run tests/section.test.tsx tests/menu-bar.test.tsx && npm run build
```
Expected: 7 tests PASS, build writes `out/vi/` and `out/en/`.

- [ ] **Step 6: Commit**

```bash
npm run verify
git add -A
git commit -m "$(cat <<'EOF'
feat: the page shell — menu bar, sections, footer, skip link

There is no app/layout.tsx. <html> lives in app/[lang]/layout.tsx so it can
carry the right lang attribute, which means not-found.tsx has nothing
wrapping it and renders its own document — and does so bilingually, since a
404 has no locale to read.

Section takes `dark` and turns it into data-theme rather than a background
class. The tokens flip on that attribute, so one attribute darkens the whole
subtree, including components that were never told they might be in a dark
band.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Hero

**Files:**
- Create: `src/components/sections/hero.tsx`,
  `src/components/site/illustration.tsx`
- Modify: `src/styles/sections/hero.css`, `src/app/[lang]/page.tsx`
- Test: `tests/sections.test.tsx`

**Interfaces:**
- Consumes: `Container` (Task 7), `DrawnUnderline` (Task 6), `SITE`, `FOCUS`,
  `getLocale`, `getDictionary` (Task 3), `localeAnchorHref` (Task 2).
- Produces: `<Hero />` (async Server Component, no props);
  `<Illustration name alt width height className? priority? />` where `name` is
  a base filename under `/images/illustrations/`.

- [ ] **Step 1: Write the failing test**

`tests/sections.test.tsx` — this file grows with Tasks 8–12:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Illustration } from '@/components/site/illustration';

describe('Illustration', () => {
  it('serves avif first, then webp, then the jpg', () => {
    const { container } = render(
      <Illustration name="hero" alt="" width={800} height={800} />,
    );
    const types = [...container.querySelectorAll('source')].map((s) => s.type);
    expect(types).toEqual(['image/avif', 'image/webp']);
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      '/images/illustrations/hero.jpg',
    );
  });

  it('always carries width and height, so nothing jumps while it loads', () => {
    const { container } = render(
      <Illustration name="hero" alt="" width={800} height={640} />,
    );
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('width', '800');
    expect(img).toHaveAttribute('height', '640');
  });

  it('is aria-hidden when the alt is empty, so it is not announced as an image', () => {
    const { container } = render(<Illustration name="hero" alt="" width={1} height={1} />);
    expect(container.querySelector('img')).toHaveAttribute('aria-hidden', 'true');
  });

  it('lazy-loads by default and eagerly only when asked', () => {
    const { container, rerender } = render(
      <Illustration name="hero" alt="" width={1} height={1} />,
    );
    expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy');
    rerender(<Illustration name="hero" alt="" width={1} height={1} priority />);
    expect(container.querySelector('img')).toHaveAttribute('loading', 'eager');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx vitest run tests/sections.test.tsx
```
Expected: FAIL — `Failed to resolve import "@/components/site/illustration"`.

- [ ] **Step 3: Write the components**

`src/components/site/illustration.tsx`:

```tsx
import { cn } from '@/lib/cn';

type IllustrationProps = {
  /** Base filename under /images/illustrations/, no extension. */
  name: string;
  /** Empty when the picture restates adjacent text — see below. */
  alt: string;
  width: number;
  height: number;
  className?: string;
  /** Only for art visible without scrolling. Everything else stays lazy. */
  priority?: boolean;
};

/* next/image is off (images.unoptimized), so this is a plain <picture>. It is
   doing three jobs that a bare <img> would not:

   - format negotiation, avif then webp then jpg, so a modern browser gets the
     small file and an old one still gets a picture;
   - width and height on every image, so the page does not reflow as art loads;
   - aria-hidden when alt is empty, so a decorative picture is not announced.

   An empty alt is the normal case here. Every illustration on this site sits
   beside text that already says the same thing, and an alt string would make a
   screen reader read the fact twice. */
export function Illustration({
  name,
  alt,
  width,
  height,
  className,
  priority,
}: IllustrationProps) {
  const base = `/images/illustrations/${name}`;

  return (
    <picture>
      <source srcSet={`${base}.avif`} type="image/avif" />
      <source srcSet={`${base}.webp`} type="image/webp" />
      <img
        src={`${base}.jpg`}
        alt={alt}
        aria-hidden={alt === '' ? 'true' : undefined}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : undefined}
        className={cn('block h-auto w-full', className)}
      />
    </picture>
  );
}
```

`src/components/sections/hero.tsx`:

```tsx
import Link from 'next/link';
import { Container } from '@/components/site/container';
import { DrawnUnderline } from '@/components/motion/drawn-underline';
import { Illustration } from '@/components/site/illustration';
import { getDictionary, getLocale } from '@/content/dictionaries';
import { localeAnchorHref } from '@/lib/paths';
import { SITE } from '@/content/site';

/** The hero is already on screen at load, so its animations are the `-load`
 *  variants. A scroll-driven animation here would never play: the element
 *  never enters the viewport, it starts inside it. */
export async function Hero() {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    <section className="relative flex min-h-[min(48rem,88svh)] items-center pt-28 pb-16 sm:pt-32">
      <Container>
        <div className="grid items-center gap-12 wide:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
          <div>
            <p className="reveal-load text-sm font-semibold tracking-[0.14em] text-ink-primary uppercase">
              {SITE.status[locale]}
            </p>

            <h1 className="mt-5 text-[clamp(2.75rem,7vw,6rem)] leading-[0.95] font-semibold tracking-tighter">
              <span className="reveal-clip-load block">{SITE.name}</span>
            </h1>

            <DrawnUnderline className="mt-2 max-w-xl" />

            <p className="reveal-load mt-6 max-w-prose text-lg text-muted-foreground">
              {dict.sections.hero.lead}
            </p>

            <div className="reveal-load mt-9 flex flex-wrap items-center gap-3">
              <Link
                href={localeAnchorHref(locale, 'contact')}
                className="duration-fast ease-out-soft rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                {dict.common.hireMe}
              </Link>
              <a
                href={SITE.cv}
                className="duration-fast rounded-full border border-border px-6 py-3 font-medium transition-colors hover:bg-surface-muted"
              >
                {dict.common.downloadCv}
              </a>
            </div>

            {/* The index row: a section number, the role, and the language
                pair — the same line the reference runs under its hero. */}
            <p className="reveal-load mt-12 flex flex-wrap items-center gap-3 text-sm tracking-[0.12em] text-muted-foreground uppercase">
              <span>01</span>
              <span aria-hidden="true">·</span>
              <span>{SITE.location[locale]}</span>
              <span aria-hidden="true">·</span>
              <span>VI / EN</span>
            </p>
          </div>

          <div className="hero-portrait reveal-load">
            <Illustration name="hero" alt="" width={880} height={880} priority />
          </div>
        </div>
      </Container>
    </section>
  );
}
```

`src/styles/sections/hero.css`:

```css
/* The portrait sits in a circle with a soft tinted ground behind it, so a
   rectangular illustration reads as part of the page rather than as a photo
   dropped on it. */
.hero-portrait {
  position: relative;
  isolation: isolate;
  border-radius: 999px;
  overflow: hidden;
  background: color-mix(in srgb, var(--base-primary) 8%, var(--base-surface));
  aspect-ratio: 1;
}

.hero-portrait img {
  height: 100%;
  object-fit: cover;
}
```

- [ ] **Step 4: Compose the page and run the tests**

`src/app/[lang]/page.tsx`:

```tsx
import { Hero } from '@/components/sections/hero';

export default function Page() {
  return <Hero />;
}
```

```bash
npx vitest run tests/sections.test.tsx && npm run build
```
Expected: 4 tests PASS. The build succeeds; the hero image 404s until Task 13,
which is expected and does not fail the build.

- [ ] **Step 5: Commit**

```bash
npm run verify
git add -A
git commit -m "$(cat <<'EOF'
feat: hero, and the picture element the whole site loads art through

The hero uses the `-load` reveal variants rather than the scroll-driven
ones. Scroll-driven animation is keyed to an element entering the viewport,
and the hero never enters it — it starts there, so the animation would
never play.

Illustration is a plain <picture>, not next/image, because images.unoptimized
is on for the static export. It carries three things a bare <img> would not:
avif/webp/jpg negotiation, width and height on every image so art loading
cannot reflow the page, and aria-hidden when alt is empty. Empty alt is the
normal case here — every illustration sits next to text that already says
the same thing.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Proof bar with rolling figures

**Files:**
- Create: `src/components/motion/count-up.tsx`,
  `src/components/sections/proof-bar.tsx`
- Modify: `src/app/[lang]/page.tsx`, `tests/sections.test.tsx`

**Interfaces:**
- Consumes: `METRICS` (Task 3), `Container` (Task 7), `getLocale` (Task 3),
  `BCP47` (Task 2).
- Produces: `<CountUp value={number} locale={string} suffix? duration? />`,
  `<ProofBar />`.

- [ ] **Step 1: Add the failing tests**

Append to `tests/sections.test.tsx`:

```tsx
import { CountUp } from '@/components/motion/count-up';

describe('CountUp', () => {
  it('renders the FINAL number in the HTML, not zero', () => {
    // The static export is what a search engine, a JS-less visitor and a
    // reduced-motion visitor all get. If the figure lived in React state the
    // exported HTML would say 0, and that is the number that gets indexed.
    render(<CountUp value={1400} locale="vi" suffix="+" />);
    expect(screen.getByText('1.400+')).toBeInTheDocument();
  });

  it('formats per locale — 1.400 and 1,400 are different numbers', () => {
    const { rerender } = render(<CountUp value={1400} locale="vi" />);
    expect(screen.getByText('1.400')).toBeInTheDocument();
    rerender(<CountUp value={1400} locale="en" />);
    expect(screen.getByText('1,400')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx vitest run tests/sections.test.tsx
```
Expected: FAIL — `Failed to resolve import "@/components/motion/count-up"`.

- [ ] **Step 3: Write the components**

`src/components/motion/count-up.tsx` — digits roll like an odometer:

```tsx
'use client';

import { useEffect, useRef } from 'react';

const ROLL_MS = 900;

/** Digits roll individually, like a meter.
 *
 *  The number is NEVER held in React state. The exported HTML has to contain
 *  the FINAL figure, or a search engine, a visitor with JS off and a visitor
 *  with reduced motion all read zero. The effect builds its own DOM inside the
 *  span after the text is already readable, and puts it back on unmount. */
export function CountUp({
  value,
  locale,
  suffix = '',
  duration = ROLL_MS,
}: {
  value: number;
  /** BCP-47, so Intl groups digits the way the language does. */
  locale: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const text = `${new Intl.NumberFormat(locale).format(value)}${suffix}`;

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const chars = [...new Intl.NumberFormat(locale).format(value)];
    const original = host.textContent;

    // A column of 0-9 is noise to a screen reader — it would read all ten.
    // Label the whole thing and hide the machinery.
    host.setAttribute('role', 'img');
    host.setAttribute('aria-label', original ?? '');
    host.textContent = '';

    const strip = document.createElement('span');
    strip.setAttribute('aria-hidden', 'true');
    strip.style.display = 'inline-flex';
    strip.style.alignItems = 'baseline';

    const columns: HTMLElement[] = [];

    for (const char of chars) {
      if (!/\d/.test(char)) {
        const sep = document.createElement('span');
        sep.textContent = char;
        strip.append(sep);
        continue;
      }

      const frame = document.createElement('span');
      frame.style.display = 'inline-block';
      frame.style.overflow = 'hidden';
      frame.style.height = '1em';
      frame.style.lineHeight = '1';

      const column = document.createElement('span');
      column.style.display = 'block';
      column.style.willChange = 'transform';
      for (let d = 0; d <= 9; d += 1) {
        const cell = document.createElement('span');
        cell.style.display = 'block';
        cell.style.height = '1em';
        cell.textContent = String(d);
        column.append(cell);
      }
      column.dataset.target = char;

      frame.append(column);
      strip.append(frame);
      columns.push(column);
    }

    const tail = document.createElement('span');
    tail.textContent = suffix;
    strip.append(tail);
    host.append(strip);

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        io.disconnect();
        columns.forEach((column, index) => {
          // Right-hand digits take longer than left-hand ones. Rolling them in
          // lockstep looks like one sliding block, not like wheels stopping.
          column.style.transition = `transform ${duration + index * 120}ms cubic-bezier(0.2, 0, 0, 1) ${index * 70}ms`;
          column.style.transform = `translateY(-${Number(column.dataset.target)}em)`;
        });
      },
      { rootMargin: '0px 0px -20% 0px' },
    );
    io.observe(host);

    return () => {
      io.disconnect();
      host.removeAttribute('role');
      host.removeAttribute('aria-label');
      host.textContent = original;
    };
  }, [value, locale, suffix, duration]);

  return <span ref={ref}>{text}</span>;
}
```

`src/components/sections/proof-bar.tsx`:

```tsx
import { Container } from '@/components/site/container';
import { CountUp } from '@/components/motion/count-up';
import { RevealScope } from '@/components/motion/reveal-scope';
import { METRICS } from '@/content/metrics';
import { getLocale } from '@/content/dictionaries';
import { BCP47 } from '@/content/locales';

export async function ProofBar() {
  const locale = await getLocale();

  return (
    <section className="border-y border-border bg-surface-muted py-12">
      <RevealScope>
        <Container>
          <dl className="stagger grid grid-cols-2 gap-8 md:grid-cols-4">
            {METRICS.map((metric, i) => (
              <div key={metric.key} className="reveal" style={{ '--i': i } as React.CSSProperties}>
                <dt className="text-sm text-muted-foreground">{metric.label[locale]}</dt>
                <dd className="mt-1 text-[clamp(2rem,4vw,3rem)] leading-none font-semibold tracking-tight tabular-nums">
                  <CountUp value={metric.value} locale={BCP47[locale]} suffix={metric.suffix} />
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </RevealScope>
    </section>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx vitest run tests/sections.test.tsx
```
Expected: 6 tests PASS.

- [ ] **Step 5: Add it to the page and commit**

```tsx
// src/app/[lang]/page.tsx
import { Hero } from '@/components/sections/hero';
import { ProofBar } from '@/components/sections/proof-bar';

export default function Page() {
  return (
    <>
      <Hero />
      <ProofBar />
    </>
  );
}
```

```bash
npm run verify
git add -A
git commit -m "$(cat <<'EOF'
feat: the proof bar, with figures that roll digit by digit

The figure is never in React state. The exported HTML has to contain the
final number — it is what a search engine indexes, what a visitor with JS
off reads, and what a reduced-motion visitor sees. The effect builds the
digit columns inside the span AFTER the text is already readable, and puts
the plain text back on unmount.

Right-hand digits roll longer than left-hand ones. In lockstep it reads as
one sliding block rather than as wheels coming to rest.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Expertise and Work

**Files:**
- Create: `src/components/sections/expertise.tsx`,
  `src/components/sections/work.tsx`
- Modify: `src/styles/sections/work.css`, `src/app/[lang]/page.tsx`,
  `tests/sections.test.tsx`
- Test: `tests/sections.test.tsx`

**Interfaces:**
- Consumes: `Section`, `SectionHeading` (Task 7); `EXPERTISE`, `FOCUS`,
  `PROJECTS`, `CASE_STUDY` (Task 3); `Illustration` (Task 8).
- Produces: `<Expertise />`, `<Work />`.

- [ ] **Step 1: Add the failing tests**

Append to `tests/sections.test.tsx`:

```tsx
import { PROJECTS } from '@/content/projects';
import { EXPERTISE } from '@/content/expertise';

describe('project data', () => {
  it('gives every project a unique slug, since they key React lists and anchors', () => {
    const slugs = PROJECTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('only ever links out over https', () => {
    for (const p of PROJECTS) {
      for (const href of [p.repo, p.demo].filter(Boolean) as string[]) {
        expect(href, `${p.slug} links to ${href}`).toMatch(/^https:\/\//);
      }
    }
  });

  it('marks at least one project as a highlight, or the grid has no lead item', () => {
    expect(PROJECTS.some((p) => p.highlight)).toBe(true);
  });
});

describe('expertise data', () => {
  it('gives every area a unique key', () => {
    const keys = EXPERTISE.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx vitest run tests/sections.test.tsx -t 'project data'
```
Expected: FAIL if any project lacks a slug, links over `http://`, or no project
is flagged `highlight`. Fix the data in `src/content/projects.ts` — by adding
the missing field, never by weakening the assertion.

- [ ] **Step 3: Write the sections**

`src/components/sections/expertise.tsx`:

```tsx
import { Section, SectionHeading } from '@/components/site/section';
import { Illustration } from '@/components/site/illustration';
import { EXPERTISE, FOCUS } from '@/content/expertise';
import { getDictionary, getLocale } from '@/content/dictionaries';

export async function Expertise() {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    <Section id="expertise" blueprint className="bg-surface-muted">
      <SectionHeading
        eyebrow={dict.sections.expertise.eyebrow}
        title={dict.sections.expertise.title}
        lead={dict.sections.expertise.lead}
      />

      <div className="mt-16 grid gap-12 wide:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] wide:items-start">
        <ul className="stagger grid gap-6 sm:grid-cols-2">
          {EXPERTISE.map((area, i) => (
            <li
              key={area.key}
              className="reveal rounded-lg border border-border bg-surface p-6"
              style={{ '--i': i } as React.CSSProperties}
            >
              <h3 className="text-xl font-semibold tracking-tight">{area.title[locale]}</h3>
              <p className="mt-2 text-muted-foreground">{area.summary[locale]}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {area.items[locale].map((item) => (
                  <li
                    key={item}
                    className="pop-on-hover rounded-full border border-border px-3 py-1 text-sm text-muted-foreground"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <div className="reveal">
          <Illustration name="expertise" alt="" width={560} height={560} className="rounded-lg" />
          <ul className="mt-8 space-y-3">
            {FOCUS.map((line, i) => (
              <li key={i} className="flex gap-3 text-muted-foreground">
                <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {line[locale]}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
```

`src/components/sections/work.tsx` — the project grid plus the case study. The
highlighted project spans both columns; the rest tile:

```tsx
import { Section, SectionHeading } from '@/components/site/section';
import { PROJECTS, CASE_STUDY } from '@/content/projects';
import { getDictionary, getLocale } from '@/content/dictionaries';
import { cn } from '@/lib/cn';

export async function Work() {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    <Section id="projects">
      <SectionHeading
        eyebrow={dict.sections.work.eyebrow}
        title={dict.sections.work.title}
        lead={dict.sections.work.lead}
      />

      {/* The case study first: it is the one piece of work with a problem, an
          approach and a result written down, so it carries more than a card. */}
      <article className="case-band reveal mt-16 rounded-lg border border-border bg-surface p-8 sm:p-12">
        <h3 className="text-[clamp(1.75rem,3vw,2.5rem)] leading-tight font-semibold tracking-tight">
          {CASE_STUDY.title[locale]}
        </h3>
        <dl className="mt-8 grid gap-8 md:grid-cols-3">
          {(['problem', 'approach', 'result'] as const).map((key) => (
            <div key={key}>
              <dt className="text-sm font-semibold tracking-[0.14em] text-ink-primary uppercase">
                {dict.sections.work[key]}
              </dt>
              <dd className="mt-2 text-muted-foreground">{CASE_STUDY[key][locale]}</dd>
            </div>
          ))}
        </dl>
        <ul className="mt-8 flex flex-wrap gap-2">
          {CASE_STUDY.stack.map((tool) => (
            <li key={tool} className="pop-on-hover rounded-full bg-surface-muted px-3 py-1 text-sm">
              {tool}
            </li>
          ))}
        </ul>
      </article>

      <ul className="stagger mt-12 grid gap-6 sm:grid-cols-2 wide:grid-cols-3">
        {PROJECTS.map((project, i) => (
          <li
            key={project.slug}
            style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
            className={cn(
              'reveal flex flex-col rounded-lg border border-border bg-surface p-6',
              project.highlight && 'sm:col-span-2',
            )}
          >
            <h3 className="text-lg font-semibold tracking-tight">{project.name}</h3>
            <p className="mt-2 flex-1 text-muted-foreground">{project.summary[locale]}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {project.stack.map((tool) => (
                <li key={tool} className="rounded-full bg-surface-muted px-2.5 py-0.5 text-sm">
                  {tool}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex gap-4 text-sm">
              {project.repo ? (
                <a href={project.repo} rel="noreferrer noopener" className="link-underline font-medium">
                  {dict.common.repository}
                </a>
              ) : null}
              {project.demo ? (
                <a href={project.demo} rel="noreferrer noopener" className="link-underline font-medium">
                  {dict.common.demo}
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
```

`src/styles/sections/work.css`:

```css
/* An underline that grows from the left on hover. A `transform` on a
   pseudo-element, not a width change: width animates on the layout thread and
   makes the whole card repaint. */
.link-underline {
  position: relative;
}

.link-underline::after {
  content: '';
  position: absolute;
  inset: auto 0 -2px;
  height: 2px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--duration-fast) var(--ease-out-soft);
}

.link-underline:hover::after,
.link-underline:focus-visible::after {
  transform: scaleX(1);
}

/* The case study gets a tinted ground so it separates from the plain cards
   below without needing a heavier border. */
.case-band {
  background: color-mix(in srgb, var(--base-primary) 4%, var(--base-surface));
}
```

- [ ] **Step 4: Run the tests and add the sections to the page**

```bash
npx vitest run tests/sections.test.tsx && npm run build
```
Expected: 10 tests PASS.

```tsx
// src/app/[lang]/page.tsx
<>
  <Hero />
  <ProofBar />
  <Expertise />
  <Work />
</>
```

- [ ] **Step 5: Commit**

```bash
npm run verify
git add -A
git commit -m "$(cat <<'EOF'
feat: expertise and work

The case study leads the section rather than sitting in the grid. It is the
only piece of work with a problem, an approach and a result written down,
and a card cannot carry that.

The hover underline scales a pseudo-element rather than animating width.
Width animates on the layout thread and repaints the whole card for a 2px
line.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Experience and Capabilities

**Files:**
- Create: `src/components/sections/experience.tsx`,
  `src/components/sections/capabilities.tsx`
- Modify: `src/app/[lang]/page.tsx`, `tests/sections.test.tsx`

**Interfaces:**
- Consumes: `Section`, `SectionHeading` (Task 7); `EXPERIENCE`, `EDUCATION`,
  `CERTIFICATION`, `SKILL_GROUPS`, `PLAYBOOK` (Task 3).
- Produces: `<Experience />`, `<Capabilities />`.

- [ ] **Step 1: Add the failing test**

```tsx
import { EXPERIENCE } from '@/content/experience';

describe('experience data', () => {
  it('has exactly one current role', () => {
    expect(EXPERIENCE.filter((r) => r.current)).toHaveLength(1);
  });

  it('puts the current role first, because the timeline reads top-down', () => {
    expect(EXPERIENCE[0].current).toBe(true);
  });

  it('gives every role at least one highlight in both languages', () => {
    for (const role of EXPERIENCE) {
      expect(role.highlights.vi.length, `${role.company} vi`).toBeGreaterThan(0);
      expect(role.highlights.en.length, `${role.company} en`).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx vitest run tests/sections.test.tsx -t 'experience data'
```
Expected: FAIL if the port left the roles in `data.js` order or dropped a
highlight list. Fix the data, not the test.

- [ ] **Step 3: Write the sections**

`src/components/sections/experience.tsx` — a vertical timeline. The rail is a
pseudo-element on the list, so adding a role does not require touching it:

```tsx
import { Section, SectionHeading } from '@/components/site/section';
import { EXPERIENCE, EDUCATION, CERTIFICATION } from '@/content/experience';
import { getDictionary, getLocale } from '@/content/dictionaries';

export async function Experience() {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    <Section id="experience" className="bg-surface-muted">
      <SectionHeading
        eyebrow={dict.sections.experience.eyebrow}
        title={dict.sections.experience.title}
        lead={dict.sections.experience.lead}
      />

      <ol className="stagger mt-16 space-y-10 border-l border-border pl-8">
        {EXPERIENCE.map((role, i) => (
          <li key={role.company} className="reveal relative" style={{ '--i': i } as React.CSSProperties}>
            <span
              aria-hidden="true"
              className="absolute top-2 -left-[2.3rem] size-3 rounded-full border-2 border-background bg-primary"
            />
            <p className="text-sm tracking-[0.12em] text-muted-foreground uppercase">
              {role.period[locale]}
              {role.current ? ` · ${dict.common.present}` : ''}
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">
              {role.role[locale]} <span className="text-ink-primary">@ {role.company}</span>
            </h3>
            <p className="mt-2 text-muted-foreground">{role.summary[locale]}</p>
            <ul className="mt-4 space-y-2">
              {role.highlights[locale].map((line) => (
                <li key={line} className="flex gap-3 text-muted-foreground">
                  <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {line}
                </li>
              ))}
            </ul>
            <ul className="mt-4 flex flex-wrap gap-2">
              {role.stack.map((tool) => (
                <li key={tool} className="pop-on-hover rounded-full bg-surface px-2.5 py-0.5 text-sm">
                  {tool}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {[EDUCATION, CERTIFICATION].map((entry, i) => (
          <div key={i} className="reveal rounded-lg border border-border bg-surface p-6">
            <h3 className="text-lg font-semibold tracking-tight">{entry.title[locale]}</h3>
            <p className="mt-1 text-muted-foreground">{entry.detail[locale]}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
```

`src/components/sections/capabilities.tsx` — skill groups plus the numbered
playbook:

```tsx
import { Section, SectionHeading } from '@/components/site/section';
import { SKILL_GROUPS, PLAYBOOK } from '@/content/capabilities';
import { getDictionary, getLocale } from '@/content/dictionaries';

export async function Capabilities() {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    <Section id="capabilities" blueprint>
      <SectionHeading
        eyebrow={dict.sections.capabilities.eyebrow}
        title={dict.sections.capabilities.title}
        lead={dict.sections.capabilities.lead}
      />

      <ul className="stagger mt-16 grid gap-6 sm:grid-cols-2 wide:grid-cols-3">
        {SKILL_GROUPS.map((group, i) => (
          <li
            key={group.key}
            className="reveal rounded-lg border border-border bg-surface p-6"
            style={{ '--i': Math.min(i, 7) } as React.CSSProperties}
          >
            <h3 className="text-lg font-semibold tracking-tight">{group.title[locale]}</h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="pop-on-hover rounded-full bg-surface-muted px-3 py-1 text-sm text-muted-foreground"
                >
                  {item}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <ol className="stagger mt-16 grid gap-8 sm:grid-cols-2 wide:grid-cols-5">
        {PLAYBOOK.map((step, i) => (
          <li key={step.step} className="reveal" style={{ '--i': i } as React.CSSProperties}>
            <p className="text-sm font-semibold tracking-[0.14em] text-ink-primary uppercase">
              {step.step}
            </p>
            <h3 className="mt-2 font-semibold tracking-tight">{step.title[locale]}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{step.body[locale]}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
```

- [ ] **Step 4: Run the tests, add both sections, verify**

```bash
npx vitest run tests/sections.test.tsx && npm run build
```
Expected: 13 tests PASS.

- [ ] **Step 5: Commit**

```bash
npm run verify
git add -A
git commit -m "$(cat <<'EOF'
feat: the experience timeline and the capability grid

The timeline rail is a border on the list with dots positioned against it,
so adding a role needs no change to the rail. Tests pin the two invariants
the layout assumes and TypeScript cannot: exactly one current role, and it
is first.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: Writing and Contact

**Files:**
- Create: `src/components/sections/writing.tsx`,
  `src/components/sections/contact.tsx`
- Modify: `src/styles/sections/contact.css`, `src/app/[lang]/page.tsx`,
  `tests/sections.test.tsx`

**Interfaces:**
- Consumes: `Section`, `SectionHeading` (Task 7); `WRITING`, `CONTACTS`, `SITE`
  (Task 3).
- Produces: `<Writing />`, `<Contact />`. Contact is the page's dark band and
  the last section, matching the reference.

- [ ] **Step 1: Add the failing test**

```tsx
import { CONTACTS } from '@/content/contacts';

describe('contact data', () => {
  it('gives every channel a usable href', () => {
    for (const c of CONTACTS) {
      expect(c.href, `${c.key} has no scheme`).toMatch(/^(https:\/\/|mailto:|tel:)/);
    }
  });

  it('includes an email channel, since that is the one the CTA points at', () => {
    expect(CONTACTS.some((c) => c.href.startsWith('mailto:'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx vitest run tests/sections.test.tsx -t 'contact data'
```
Expected: FAIL — `@/content/contacts` has no `href` on at least one entry, or
the schemes were not carried over from `data.js`.

- [ ] **Step 3: Write the sections**

`src/components/sections/writing.tsx`:

```tsx
import { Section, SectionHeading } from '@/components/site/section';
import { WRITING } from '@/content/writing';
import { getDictionary, getLocale } from '@/content/dictionaries';

export async function Writing() {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    <Section id="writing" className="bg-surface-muted">
      <SectionHeading
        eyebrow={dict.sections.writing.eyebrow}
        title={dict.sections.writing.title}
        lead={dict.sections.writing.lead}
      />

      <ul className="stagger mt-16 divide-y divide-border border-y border-border">
        {WRITING.map((article, i) => (
          <li key={article.href} className="reveal" style={{ '--i': i } as React.CSSProperties}>
            <a
              href={article.href}
              rel="noreferrer noopener"
              className="duration-fast group grid gap-2 py-6 transition-colors hover:bg-surface wide:grid-cols-[8rem_minmax(0,1fr)] wide:items-baseline wide:gap-8 wide:px-4"
            >
              <time dateTime={article.date} className="text-sm text-muted-foreground tabular-nums">
                {article.date}
              </time>
              <div>
                <h3 className="text-xl font-semibold tracking-tight">{article.title[locale]}</h3>
                <p className="mt-1 text-muted-foreground">{article.blurb[locale]}</p>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
```

`src/components/sections/contact.tsx` — the dark closing band:

```tsx
import { Section, SectionHeading } from '@/components/site/section';
import { CONTACTS } from '@/content/contacts';
import { SITE } from '@/content/site';
import { getDictionary, getLocale } from '@/content/dictionaries';
import { DrawnUnderline } from '@/components/motion/drawn-underline';

/** The last band, and the only dark one. `dark` on Section sets data-theme, so
 *  every token inside flips — nothing here needs a dark-specific class. */
export async function Contact() {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    <Section id="contact" dark blueprint>
      <SectionHeading
        eyebrow={dict.sections.contact.eyebrow}
        title={dict.sections.contact.title}
        lead={dict.sections.contact.lead}
      />
      <DrawnUnderline className="mt-4 max-w-md" />

      <ul className="stagger mt-14 grid gap-4 sm:grid-cols-2 wide:grid-cols-3">
        {CONTACTS.map((contact, i) => (
          <li key={contact.key} className="reveal" style={{ '--i': i } as React.CSSProperties}>
            <a
              href={contact.href}
              rel="noreferrer noopener"
              className="duration-fast contact-card flex flex-col gap-1 rounded-lg border border-border p-6 transition-colors"
            >
              <span className="text-sm tracking-[0.12em] text-muted-foreground uppercase">
                {contact.label[locale]}
              </span>
              <span className="text-lg font-medium break-all">{contact.value}</span>
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-14 text-muted-foreground">
        {SITE.location[locale]} · {SITE.status[locale]}
      </p>
    </Section>
  );
}
```

`src/styles/sections/contact.css`:

```css
/* A card on the dark band. `--base-surface` is already the dark surface here,
   because the section sets data-theme and the tokens follow. */
.contact-card:hover {
  background: color-mix(in srgb, var(--base-primary) 12%, transparent);
  border-color: color-mix(in srgb, var(--base-primary) 40%, var(--base-border));
}
```

- [ ] **Step 4: Compose the whole page**

`src/app/[lang]/page.tsx`:

```tsx
import { Hero } from '@/components/sections/hero';
import { ProofBar } from '@/components/sections/proof-bar';
import { Expertise } from '@/components/sections/expertise';
import { Work } from '@/components/sections/work';
import { Experience } from '@/components/sections/experience';
import { Capabilities } from '@/components/sections/capabilities';
import { Writing } from '@/components/sections/writing';
import { Contact } from '@/components/sections/contact';

/* Eight bands, alternating plain / muted / blueprint, ending dark. The order
   is the argument: who this is, proof, what he can do, what he built, where he
   did it, how he works, what he has written, how to reach him. */
export default function Page() {
  return (
    <>
      <Hero />
      <ProofBar />
      <Expertise />
      <Work />
      <Experience />
      <Capabilities />
      <Writing />
      <Contact />
    </>
  );
}
```

- [ ] **Step 5: Run everything**

```bash
npm run verify
```
Expected: all gates green; `out/vi/index.html` and `out/en/index.html` both
contain all eight sections.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: writing, the dark contact band, and the full eight-section page

Contact is the last band and the only dark one, which is where the
reference puts it. It needs no dark-specific classes: Section sets
data-theme and every token inside flips with it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: Illustrations

**Files:**
- Create: `docs/illustrations.md`, `scripts/compress-illustrations.sh`
- Add: `public/images/illustrations/{hero,expertise,work,contact}.{avif,webp,jpg}`
- Modify: `scripts/check-budget.mjs` (created here, extended in Task 14)
- Test: `tests/budget.test.ts`

**Interfaces:**
- Consumes: `<Illustration name .../>` from Task 8. The four names it expects
  are `hero`, `expertise`, `work`, `contact`.
- Produces: twelve files under `public/images/illustrations/`, every one at or
  under 40 KB.

**Division of labour, as agreed:** this task writes the prompts, the
compression pipeline and the gate. The owner generates the raw images and hands
them back. Nothing here invents an image.

- [ ] **Step 1: Write the prompt sheet**

`docs/illustrations.md`:

````markdown
# Illustrations — prompts and pipeline

Four images. Generate each one in Gemini, ChatGPT or Midjourney using the
prompt below **verbatim**, save the raw output to `raw/<name>.png`, then run
`scripts/compress-illustrations.sh`.

## The palette, which every prompt locks

These are the site's tokens. A generated image that drifts off them will read
as a sticker on the page rather than part of it.

| Role | Hex |
| --- | --- |
| Background | `#f5f5f5` |
| Primary (blue) | `#2b7fd4` |
| Accent (teal) | `#40a69f` |
| Ink | `#1f1f1f` |
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

> Four horizontal layers stacked like a cross-section of infrastructure, each
> layer built from simple repeated shapes — servers at the bottom, containers
> above, a model in the middle, an interface on top. Thin vertical lines
> connect the layers. [+ shared style clause]

## 3. `work` — shipped

> A pipeline running left to right: a rough sketch enters on the left, passes
> through three processing stages drawn as simple geometric gates, and exits on
> the right as a finished rectangular panel. [+ shared style clause]

## 4. `contact` — the signal

> Two figures at opposite edges of the frame with a single clean line arcing
> between them, the line made of evenly spaced dots. Open and uncluttered.
> **This one sits on the dark band, so use `#0b0b0b` as the background instead
> of `#f5f5f5`.** [+ shared style clause]

## Compression

```bash
./scripts/compress-illustrations.sh
```

The script targets 40 KB per file, which the budget gate enforces. If a file
comes out over, lower the quality argument for that one rather than raising the
ceiling — the reference ships 3–6 MB per image and that is the mistake this
site is not repeating.
````

- [ ] **Step 2: Write the compression script**

`scripts/compress-illustrations.sh`:

```bash
#!/usr/bin/env bash
# Three formats per image: avif for browsers that take it, webp for the rest,
# jpg as the floor. <picture> picks; see src/components/site/illustration.tsx.
#
# 1600px wide is the largest any illustration is ever displayed at on a 2x
# screen. Shipping the generator's native 2048 buys nothing a visitor can see.
set -euo pipefail

SRC="raw"
OUT="public/images/illustrations"
WIDTH=1600
mkdir -p "$OUT"

for file in "$SRC"/*.png; do
  name=$(basename "$file" .png)

  magick "$file" -resize "${WIDTH}x" -strip "$OUT/$name.jpg"
  magick "$OUT/$name.jpg" -quality 72 "$OUT/$name.jpg"

  cwebp -q 72 -m 6 "$OUT/$name.jpg" -o "$OUT/$name.webp"
  avifenc --min 24 --max 34 --speed 4 "$OUT/$name.jpg" "$OUT/$name.avif"

  for ext in jpg webp avif; do
    size=$(wc -c < "$OUT/$name.$ext")
    printf '%-24s %6s KB\n' "$name.$ext" "$((size / 1024))"
    if [ "$size" -gt 40960 ]; then
      echo "  OVER the 40KB ceiling — lower the quality for this one." >&2
    fi
  done
done
```

```bash
chmod +x scripts/compress-illustrations.sh
echo 'raw/' >> .gitignore
```

- [ ] **Step 3: Write the failing budget test**

`tests/budget.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { globSync } from 'node:fs';

const CEILING = 40 * 1024;
const NAMES = ['hero', 'expertise', 'work', 'contact'];

describe('illustrations', () => {
  it('has all three formats for every name the page asks for', () => {
    for (const name of NAMES) {
      for (const ext of ['avif', 'webp', 'jpg']) {
        const path = `public/images/illustrations/${name}.${ext}`;
        expect(existsSync(path), `${path} is referenced by a component`).toBe(true);
      }
    }
  });

  it('keeps every image under 40KB', () => {
    // Images are served exactly as committed — unoptimized is on. The file
    // size IS what the visitor downloads.
    for (const file of globSync('public/images/**/*.{avif,webp,jpg,png}')) {
      expect(statSync(file).size, `${file}`).toBeLessThanOrEqual(CEILING);
    }
  });
});
```

- [ ] **Step 4: Run it to verify it fails**

```bash
npx vitest run tests/budget.test.ts
```
Expected: FAIL — twelve missing files. **This is where the task hands off to
the owner.** Report: the prompts are in `docs/illustrations.md`, the pipeline
is `scripts/compress-illustrations.sh`, and the test names exactly which files
are missing.

- [ ] **Step 5: Integrate what comes back**

```bash
mkdir -p raw   # drop the four generated PNGs here
./scripts/compress-illustrations.sh
npx vitest run tests/budget.test.ts
```
Expected: PASS, and the script prints twelve sizes all under 40 KB.

- [ ] **Step 6: Commit**

```bash
npm run verify
git add -A
git commit -m "$(cat <<'EOF'
feat: four illustrations, at 40KB each instead of 3MB

The reference ships its generator's raw output — seven files, 26.5MB, at
5504x3072. That is roughly 150x this entire site, for pictures that are
never displayed above 1600px. This ships the same four-format-per-image
idea at 40KB a file, enforced by a test rather than by intent.

Prompts are locked to the site's tokens so the art reads as part of the
page rather than as a sticker on it. The contact illustration is generated
on #0b0b0b because it sits on the dark band.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: The budget gate and the Pages deployment

**Files:**
- Create: `scripts/check-budget.mjs`, `.github/workflows/deploy.yml`
- Modify: `package.json`, `README.md`

**Interfaces:**
- Consumes: `out/` from `npm run build`.
- Produces: `npm run check:budget`, the last step of `npm run verify`; and a
  GitHub Actions workflow that publishes `out/` to Pages on every push to
  `main`.

- [ ] **Step 1: Write the budget gate**

`scripts/check-budget.mjs` — it reads the built HTML and sums the scripts each
page actually loads, rather than trusting the build's own report:

```js
/* Measures what a visitor downloads, from the HTML they would be served.
   Two ceilings, and they are different kinds of number:

   - JS, 200 KB gzip per page. Transfer size, because that is what crosses the
     wire. The reference sets 120 KB as a target and 330 KB as a ceiling, and
     says the gap exists only because the design system's barrel does not
     tree-shake. This site is smaller than the reference and takes the tighter
     number. If the barrel makes it unreachable, raise it ONCE, in a commit
     whose message carries the measurement — do not nudge it.

   - Images, 40 KB RAW per file. Not gzip: images are already compressed and
     gzip does nothing for them, and next.config has images.unoptimized, so the
     bytes on disk are the bytes served. */
import { readFileSync, statSync } from 'node:fs';
import { globSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const OUT = 'out';
const PAGES = ['vi/index.html', 'en/index.html'];
const JS_CEILING_KB = 200;
const IMAGE_CEILING_KB = 40;

let failed = false;

for (const page of PAGES) {
  const html = readFileSync(join(OUT, page), 'utf8');
  // Only the scripts THIS page loads. A flat sum over _next/static would count
  // chunks that no page references.
  const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  const unique = [...new Set(srcs)];

  let total = 0;
  for (const src of unique) {
    const path = join(OUT, src.replace(/^\//, ''));
    try {
      total += gzipSync(readFileSync(path)).length;
    } catch {
      console.error(`FAIL  ${page} loads ${src}, which is not in the export.`);
      failed = true;
    }
  }

  const kb = (total / 1024).toFixed(1);
  if (total > JS_CEILING_KB * 1024) {
    console.error(`FAIL  ${page}  ${kb} KB gzip of JS across ${unique.length} scripts`);
    console.error(`      Ceiling is ${JS_CEILING_KB} KB. Find what grew before raising it.`);
    failed = true;
  } else {
    console.log(`OK    ${page}  ${kb} KB gzip / ${JS_CEILING_KB} KB  (${unique.length} scripts)`);
  }
}

for (const file of globSync(`${OUT}/**/*.{png,jpg,jpeg,webp,avif,gif}`)) {
  const size = statSync(file).size;
  if (size > IMAGE_CEILING_KB * 1024) {
    console.error(`FAIL  ${file}  ${(size / 1024).toFixed(1)} KB raw, ceiling ${IMAGE_CEILING_KB} KB`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('OK    every page and image is inside budget');
```

Add to `package.json`, as the last step of `verify`:
```json
"check:budget": "node scripts/check-budget.mjs",
"verify": "npm run format:check && npm run lint && npm run typecheck && npm test && npm run check:colors && npm run build && npm run check:content && npm run check:budget"
```

- [ ] **Step 2: Run it**

```bash
npm run build && npm run check:budget
```
Expected: `OK vi/index.html …` and `OK en/index.html …`, both under 200 KB.

**If a page is over:** report the measured number and what is in it. Do not
raise the ceiling as part of this task — that is a separate decision with its
own commit message carrying the measurement.

- [ ] **Step 3: Write the deploy workflow**

`.github/workflows/deploy.yml`:

```yaml
# Branch-based Pages publishes the repository root. What we publish is out/,
# which does not exist in the repo — so Pages has to be served from Actions.
# Set Settings > Pages > Source to "GitHub Actions" once, by hand; this
# workflow cannot set it.
name: deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

# Never two deploys at once. `cancel-in-progress: false` so a running deploy
# finishes rather than leaving the site half-published.
concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.DESIGN_SYSTEM_DEPLOY_KEY }}

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci

      # The full gate, not just `build`. A deploy that skips verify is a deploy
      # that can publish a page nothing checked.
      - run: npm run verify

      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 4: Rewrite the README**

Replace the Run Locally and Gates sections. Record, at minimum:

- `npm run dev` for development, `npm run verify` before every commit.
- That `npm ci` needs SSH access to the private design system, and what the
  failure looks like without it (a permission error that reads like a missing
  package).
- That Pages **must** be set to "GitHub Actions" as its source, by hand, once.
- That `public/.nojekyll` and `public/CNAME` are load-bearing: without the
  first the site loads unstyled, without the second the custom domain detaches.
- The two budget ceilings and the rule that raising one takes its own commit
  with the measurement in the message.

- [ ] **Step 5: Stop and confirm before the first deploy**

Publishing replaces what is live at
`portfolio-dungca.ai-innovation-homelab.org`. **Do not push `main` or merge
without the owner saying so.** Report: verify is green, the workflow is ready,
Pages needs its source switched to "GitHub Actions" by hand, and the
`DESIGN_SYSTEM_DEPLOY_KEY` secret must exist before the first run.

- [ ] **Step 6: Commit**

```bash
npm run verify
git add -A
git commit -m "$(cat <<'EOF'
feat: budget gate and the GitHub Pages deployment

The gate measures from the built HTML — the scripts each page actually
references — rather than summing _next/static, which would count chunks no
page loads. Two ceilings, two kinds of number: 200 KB gzip of JS per page
because that is what crosses the wire, and 40 KB RAW per image because
images.unoptimized means the bytes on disk are the bytes served and gzip
does nothing for them.

Pages has to be served from Actions here. Branch-based publishing serves
the repository root, and what we publish is out/, which is not in the repo.
The workflow runs the full verify before uploading: a deploy that skips the
gate can publish a page nothing checked.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

**1. Spec coverage.** Walked each requirement:

| Spec | Task |
| --- | --- |
| §4.1 stack, pinned versions, static export | 1 |
| §4.2 bilingual content, nothing invented, sync-github kept | 3 |
| §4.3 routing, `.nojekyll`, CNAME, root redirect, preserved URLs | 1 (files), 14 (Actions deploy) |
| §4.4 image ceiling 40 KB | 13, 14 |
| §4.4 JS ceiling 200 KB gzip | 14 |
| §4.5 verify chain, `check:content`, `check:colors`, `check:budget` | 3, 4, 14 |
| §4.6 AA contrast, ink layer | 4 |
| §4.6 reduced motion lands on the final frame | 6 |
| §4.6 decorative alt, skip link, focus ring | 7, 8, 4 |
| §2.3 eight-section structure, band rhythm | 8–12 |
| §2.4 section head with a required lead | 7 |
| §2.5 theme, no flash, per-section dark | 5, 7 |
| §2.6 illustrations, not shipped the reference's way | 13 |
| §6.1 verify green from a clean clone | 14 (CI runs it) |
| §6.2 both locales render every section | 3 test, 12 |
| §6.3 theme persists, no flash | 5 |
| §6.4 Lighthouse a11y ≥ 95 | **gap** — see below |
| §6.5 live domain and the preserved URLs resolve | 14 |
| §6.6 same design family at 1200px | **gap** — see below |

Two acceptance criteria had no task. Both are verification of the finished
site rather than units of construction, so rather than inventing a fifteenth
build task, they are added as the final steps of Task 14:

- [ ] **Task 14, Step 4b: Run Lighthouse on the built `/vi/` and record the
  accessibility score.** `npx --yes lighthouse http://localhost:3000/vi/
  --only-categories=accessibility --chrome-flags="--headless"` after
  `npx serve out`. Below 95, fix what it names before the deploy step.
- [ ] **Task 14, Step 4c: Screenshot `/vi/` at 1200px next to the reference at
  1200px and put both in the report.** The owner's acceptance is visual, and a
  passing gate is not evidence of it.

**2. Placeholder scan.** Three deliberate `/* … verbatim */` markers remain, all
in Task 3, all in the content modules. They are not vagueness: Step 1 of that
task dumps `data.js` to `/tmp/data.json` and the instruction is to copy values
out of it byte for byte. Writing the strings into this plan would create a
second copy to drift against the first, which is exactly the failure the port
is trying to avoid. Every other task carries complete code.

**3. Type consistency.** Checked across task boundaries:
`Localized<T>` (Task 2) is the return shape every content module in Task 3 uses
and every section in Tasks 8–12 indexes with `[locale]`. `getLocale()` returns
`Promise<Locale>` in Task 3 and is `await`ed in every Server Component that
calls it. `cn(...parts)` (Task 2) matches every call site. `Section`'s props
(`id`, `className`, `blueprint`, `dark`) are what Tasks 8–12 pass, and the dark
band is `dark` on Contact only. `SectionHeading` takes `eyebrow`/`title`/`lead`,
and every section reads those three from `dict.sections.<name>` — so
`dictionaries/vi.ts` must define an `{eyebrow, title, lead}` triple for
`expertise`, `work`, `experience`, `capabilities`, `writing` and `contact`, plus
`hero.lead`, plus `work.problem`/`work.approach`/`work.result`. That is recorded
here because Task 3 writes the dictionary before those sections exist to demand
it. `Illustration`'s `name` values (`hero`, `expertise`, `work`, `contact`) match
the four filenames in Task 13. `CountUp` takes `value: number`, which is why
Task 3's `Metric` splits `value` from `suffix` rather than storing `"3+"`.
