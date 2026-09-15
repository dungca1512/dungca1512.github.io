# Cong Anh Dung Portfolio

Personal portfolio website for AI/ML Engineer profile, built as a static GitHub Pages site.

## Tech Stack

- HTML (`index.html`)
- CSS (`style.css`)
- Vanilla JavaScript (`main.js`, `data.js`)
- GitHub data sync script (`scripts/sync-github.mjs`)

## Project Structure

- `index.html`: main portfolio page
- `style.css`: full site styles
- `main.js`: rendering, i18n toggle, UI behavior
- `data.js`: portfolio content, section copy, links
- `github-data.json`: cached GitHub stats/repo metadata used by UI
- `scripts/sync-github.mjs`: script to refresh `github-data.json`
- `CV_CongAnhDung.pdf`: downloadable CV
- `about.html`, `projects.html`, `blog.html`: redirects to sections in `index.html`

## Run Locally

```bash
npm run serve          # http://localhost:8011
```

No build step and no dependencies — the repo is the site. `npm` exists here only
for the checks below.

## Quality gates

`npm run verify` runs all three. CI runs the same command on every pull request and on
pushes to `main` — a push to a feature branch does not trigger it, so run `verify`
locally before opening the PR:

| Step           | What it stops                                                        |
| -------------- | -------------------------------------------------------------------- |
| `npm test`     | The motion system going missing: tokens, `@supports` branches, guards |
| `check:tokens` | Colour or duration literals creeping in outside `:root`               |
| `check:budget` | Code over 40KB gzip, or any image over 40KB                           |

These assert against the source, so they prove the system is *present*, not that
it *looks* right. For that, see the manual checklist in
[docs/superpowers/specs/2026-09-15-motion-system.md](docs/superpowers/specs/2026-09-15-motion-system.md).

## Motion system

Five duration tokens and two easing curves on `:root`, four rules:

1. Everything enters from a direction that means something. Never a bare fade.
2. Animate only `transform`, `opacity`, `clip-path`, `filter`. Colour changes are
   fine; `width`, `height` and `top` are not.
3. Durations come from the token scale. A full entrance is ≤ 700ms.
4. `prefers-reduced-motion` changes the treatment, it does not remove it.

Reveals, the header, the progress bar and the grid drift are all driven by
`animation-timeline` — the browser computes them from scroll position, off the
main thread. Each has its own answer for browsers without it, and they are not
the same answer:

- **Reveals** fall back to `IntersectionObserver` (`initReveal`, `main.js`),
  which adds the same class the scroll timeline would have animated. Where
  even that is missing, every reveal is shown at once — content never hides
  behind a feature the browser lacks.
- **The header and the progress bar** fall back to a plain scroll listener
  (`initHeaderScrollFallback`, `main.js`), because both read the document's
  own scroll offset rather than an element's position in the viewport.
- **The grid drift** has no JavaScript fallback at all. Without scroll
  timelines the grid simply sits still, which is the pre-existing behaviour
  and costs nothing.

Each JS path is skipped by its own `CSS.supports()` check — `scroll(root
block)` for the header, `view()` for the reveals — so no browser runs both the
CSS and the JS version of the same effect.

## Update Portfolio Content

Edit `data.js` for:

- hero content
- project cards
- case study section
- bilingual copy (EN/VI)
- contact links and CTA labels

Replace CV file if needed, then update the CV URL in `data.js`.

## Sync GitHub Data

Refresh live GitHub stats and repo metadata:

```bash
node scripts/sync-github.mjs
```

Optional custom username/output:

```bash
node scripts/sync-github.mjs <github_username> <output_file>
```

## Deploy (GitHub Pages)

```bash
git add .
git commit -m "update portfolio"
git push origin main
```

After push, GitHub Pages usually updates within a few minutes.

## Notes

- Keep `github-data.json` committed if you want stable content without runtime API dependency.
- The site also attempts live GitHub API fetch as a fallback when local JSON is unavailable.
