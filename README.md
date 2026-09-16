# Cong Anh Dung — Portfolio

A bilingual (Vietnamese / English) personal site for an AI/ML engineer profile,
built with Next.js and published to GitHub Pages as a fully static export.

Live at **https://portfolio-dungca.ai-innovation-homelab.org**

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript 5 (strict) · Tailwind CSS 4 ·
Vitest · ESLint 9 · Prettier. Node 22 (`.nvmrc`); CI runs that version.

There is no server and no runtime data fetching. `next.config.ts` sets
`output: 'export'`, `trailingSlash: true` and `images.unoptimized`, so
`npm run build` writes a directory of plain HTML to `out/` and that directory
is the whole site.

## Run locally

```bash
npm install
npm run dev            # http://localhost:3000 -> redirects to /vi/
npm run verify         # the nine-link gate; run it before every commit
```

`npm install` pulls from the public npm registry only. No SSH access and no
private registry is needed — the design tokens this site's look comes from were
ported into `src/app/globals.css` rather than consumed from a package, and
`grep git+ssh package-lock.json` finds nothing.

## Project structure

| Path                       | What lives there                                                                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/[lang]/`          | The only route. It owns `<html>` and the single `<main id="main">` — there is no root layout.                                            |
| `src/components/sections/` | The eight page sections, each an async Server Component.                                                                                 |
| `src/components/motion/`   | The client components that move: reveals, the count-up, the marquee.                                                                     |
| `src/components/site/`     | Shared primitives — `Section`, `SectionHeading`, `Illustration`, and `IntroCurtain`, the panel that slides off the page on load.         |
| `src/content/`             | Every string and every fact. `Localized<T> = Record<Locale, T>`, so a missing translation is a typecheck error, not a blank on the page. |
| `src/styles/`              | Hand-written CSS that Tailwind utilities cannot express, split by section.                                                               |
| `public/`                  | Copied verbatim into `out/`. See the load-bearing files below.                                                                           |
| `scripts/`                 | The gates, plus the GitHub sync and the illustration compressor.                                                                         |
| `docs/illustrations.md`    | The four image prompts and the compression pipeline.                                                                                     |

## Quality gates

`npm run verify` is nine links, in this order, and each one stops something
specific. CI runs the same command — on every pull request
(`.github/workflows/verify.yml`) and again before every deploy
(`.github/workflows/deploy.yml`). A push to a feature branch does not trigger
it, so run `verify` locally before opening the PR.

| Step            | What it stops                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `format:check`  | Unformatted files.                                                                                                                                            |
| `lint`          | ESLint / `next lint` violations.                                                                                                                              |
| `typecheck`     | Type errors, including a translation that exists in one locale only.                                                                                          |
| `test`          | Component and data regressions, plus the image budget (`tests/budget.test.ts`).                                                                               |
| `check:colors`  | Colour literals creeping in outside the token definitions.                                                                                                    |
| `build`         | Anything that breaks the static export.                                                                                                                       |
| `check:export`  | A page with no `<main>` landmark, two `<main>`s, or duplicate ids.                                                                                            |
| `check:content` | A section that silently stops rendering its data — an unresolved `Localized` object, a rendered `undefined`, a missing project name, a dead same-page anchor. |
| `check:budget`  | A page over 200 KB of gzipped JS, or any image over 40 KB raw.                                                                                                |

The first six assert against the source; the last three read `out/`, so they
measure what a visitor is actually served.

### The two ceilings

- **JS: 200 KB gzip per page.** Transfer size, because that is what crosses the
  wire. Measured from the `<script src>` tags each page actually lists, not from
  a flat sum over `_next/static` — that would count chunks no page loads.
- **Images: 40 KB raw per file.** Not gzip: images are already compressed, and
  `images.unoptimized` means the bytes on disk are the bytes served.

**Raising either one takes its own commit, with the measurement in the message.**
Not a nudge bundled into a feature. If an image will not fit, the image is too
busy — see `docs/illustrations.md`, which records an illustration that was
redrawn rather than a ceiling that was moved.

## Deploying

Pushing to `main` builds, runs the full gate, and publishes `out/` to Pages.
Nothing else publishes; there is no manual step and no committed build output.

### The switch comes before the merge, and the order is not optional

Today `main`'s **repository root** is the published site: it holds `index.html`
and `CNAME`, and Pages serves them from the branch. This rebuild deletes both
from the root — `CNAME` moved into `public/`, and the site it produces is `out/`,
which is gitignored.

So merging this work into `main` while Pages is still on "Deploy from a branch"
publishes a repository root that has **no `index.html` and no `CNAME`**: the
custom domain 404s and can detach itself, and `deploy-pages@v4` cannot deploy
into a site still configured for a legacy branch build either. Both halves of
the site are down, and the workflow's green tick does not say so.

**Do this first, then merge:**

1. **Settings → Pages → Source → "GitHub Actions".** No workflow can set this;
   the API for it is not something an Actions token may touch.
2. **Settings → Environments → `github-pages`** must allow deployments from
   `main` (the default).
3. Confirm the Pages settings page shows the custom domain
   `portfolio-dungca.ai-innovation-homelab.org` and its DNS check still passes.
4. Then merge to `main`. The first deploy takes a few minutes; watch the
   `deploy` workflow rather than reloading the domain.

If the switch is made and the merge never happens, nothing breaks — Pages simply
has no Actions deployment yet and keeps serving the last branch build.

### Three files in `public/` are load-bearing

- **`public/.nojekyll`** — empty on purpose. Without it Pages runs the output
  through Jekyll, which drops every directory whose name starts with an
  underscore. That is `_next/`: every stylesheet and every script. The site
  loads as unstyled text and the failure looks like a CSS bug, not a deploy one.
- **`public/CNAME`** — holds `portfolio-dungca.ai-innovation-homelab.org`. Pages
  reads it from the published artifact on each deploy; if it is missing, the
  custom domain detaches and the site falls back to `*.github.io`.

- **`public/index.html`** — the site has no `/` route of its own; every page
  lives under `/vi/` or `/en/`. This stub is what a visitor to the bare domain
  gets, and it redirects to `/vi/` three ways (canonical link, meta refresh,
  `location.replace`) so it works with JavaScript off. `about.html`,
  `projects.html` and `blog.html` are the same trick for URLs the old site
  published.

All three are copied into `out/` by the build. Deleting any of them is silent
until it is live.

## Updating content

Everything the page says lives in `src/content/`:

| File              | Holds                                                    |
| ----------------- | -------------------------------------------------------- |
| `projects.ts`     | The nine project cards and the case study.               |
| `experience.ts`   | The role timeline.                                       |
| `expertise.ts`    | The four expertise areas and the focus list.             |
| `capabilities.ts` | The capability grid.                                     |
| `metrics.ts`      | The figures in the proof bar.                            |
| `writing.ts`      | The writing list.                                        |
| `contacts.ts`     | The five contact channels, including the CV.             |
| `site.ts`         | Name, title, canonical URL, the things metadata reads.   |
| `locales.ts`      | `Locale`, `Localized<T>`, and the locale list.           |
| `dictionaries/`   | Section headings, leads, and every piece of chrome copy. |

Both locales are required by the type system, so add Vietnamese and English
together. Replace `public/CV_CongAnhDung.pdf` to swap the CV; its URL lives in
`contacts.ts`.

### Refreshing the GitHub stats

```bash
npm run sync:github                       # rewrites public/github-data.json
node scripts/sync-github.mjs <user> <out> # or with an explicit target
```

### Regenerating the illustrations

`docs/illustrations.md` has the prompts, the model, and the pipeline. Short
version: put a 2048×2048 PNG per name in `raw/` (gitignored), then run
`./scripts/compress-illustrations.sh`.
