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

Use a local static server from project root:

```bash
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000
```

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
