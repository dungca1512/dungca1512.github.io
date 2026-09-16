# Spec — Portfolio rebuilt on the hands stack

**Status:** approved by the site owner on 2026-09-16.
**Supersedes:** the static HTML/CSS/JS site currently at `index.html`.

## 1. What the owner asked for

> "thôi bây giờ như này, tôi cho phép bạn đập đi toàn bộ và xây lại bằng nodejs
> hoặc một cái gì đó miễn web portfolio của tôi đẹp và giống như của team hands
> của tôi là được?"

Two decisions were put to the owner with the evidence in §2 and answered:

- **Stack:** tear the current site down and rebuild on Next.js.
- **Illustrations:** the owner generates the images; this project writes the
  prompts, the compression pipeline and the markup, and integrates them.

The owner was told, before deciding, that the current site already carries the
reference's page structure and that a framework rewrite changes no pixels by
itself. They chose the rewrite anyway. That is recorded here so nobody later
mistakes it for an unexamined default.

## 2. The reference, measured

"Like hands" means `/Users/dungca/project/jobs/portfolio_team_hands`, measured
on 2026-09-16 from its source and from its static export served at
`http://localhost:8012/vi/`.

### 2.1 Stack

| Thing         | Value                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| Framework     | `next@16.3.4`, `output: 'export'`, `trailingSlash: true`, `images.unoptimized`                           |
| React         | `react@19.2.8` / `react-dom@19.2.8`                                                                      |
| CSS           | `tailwindcss@^4` via `@tailwindcss/postcss`                                                              |
| Design system | `@levi-it/design-system` from `git+ssh://git@github.com/Levi-IT/web_component_design_systerm.git#v0.1.3` |
| Fonts         | `@fontsource-variable/inter`, `@fontsource-variable/dm-sans` — self-hosted                               |
| Node          | `>=22`                                                                                                   |
| Gates         | `format:check`, `lint`, `typecheck`, `check:colors`, `build`, `check:budget`                             |

SSH access to the private design system was verified (`git ls-remote` succeeds).

### 2.2 Design tokens

The design system publishes 53 custom properties on `:root`. The ones this
project binds to, copied verbatim:

```
--base-palette-brand-500: #4e46b4   --base-palette-accent-500: #40a69f
--base-palette-blue-500:  #2b7fd4   --base-palette-blue-100:   #e3f0fb
--base-palette-neutral-0: #fff      --base-palette-neutral-50: #f5f5f5
--base-palette-neutral-100:#ebebeb  --base-palette-neutral-200:#e2e2e2
--base-palette-neutral-600:#595d62  --base-palette-neutral-700:#444
--base-palette-neutral-850:#1f1f1f  --base-palette-neutral-950:#0b0b0b
--base-palette-neutral-1000:#000
--base-palette-red-500:   #ff4e64   --base-palette-red-100:    #ffe4e8
--base-palette-green-600: #2e7d32   --base-palette-green-200:  #95f1d5
--base-palette-yellow-400:#ffb319   --base-palette-yellow-100: #fff1d6
--base-radius-xs: 4px  --base-radius-sm: 8px  --base-radius-md: 12px  --base-radius-lg: 16px
--base-duration: .2s   --base-duration-fast: .15s
--base-ease: cubic-bezier(.4, 0, .2, 1)
--base-shadow-raised: 0 4px 16px -4px #0000001f
--base-shadow-overlay: 0 12px 32px -8px #00000029, 0 2px 8px -2px #00000014
```

The reference overrides the brand hue to the system blue, in both themes at
once, and this project does the same:

```css
:root,
[data-theme='dark'] {
  --base-palette-brand-500: var(--base-palette-blue-500);
  --base-primary-subtle: var(--base-info-subtle);
}
```

**Accent colours fail contrast as text and must not be used raw.** Measured on
the reference: accent 2.69:1 and info 3.78:1 on light, primary 2.68:1 on dark —
all under AA's 4.5:1. The reference mixes 68% of the accent into
`--base-foreground`, which flips with the theme, so one formula serves both
directions (measured range after mixing: 4.74:1 to 11.32:1). Because a custom
property is substituted where it is _declared_, this must be declared under
**both** `:root` and `[data-theme='dark']` or the dark block silently reuses the
light theme's foreground.

### 2.3 Page structure

Eight sections, 7193px tall at 1200px wide, `body` on `#f5f5f5`:

1. Hero — `min-h-[min(48rem,88svh)]`, eyebrow, oversized headline, hand-drawn
   underline, lead, two CTAs (filled + plain), an index row `01 · … · VI / EN`,
   and a full-height circular illustration in the right column.
2. Proof bar — `border-y bg-surface-muted`, counted statistics.
3. Work (`#work`) — section head, an illustrated intro card, then cases.
4. About (`#about`) — `blueprint bg-surface-muted`.
5. Capabilities (`#capabilities`).
6. Team (`#team`) — `bg-surface-muted`.
7. Process — `blueprint bg-surface-muted`.
8. Contact (`#contact`) — `blueprint bg-background text-foreground`, dark.

Section rhythm is `py-20 sm:py-28` throughout, alternating plain / muted /
blueprint / dark bands.

### 2.4 Section head

Two columns from 900px (`--breakpoint-wide: 900px`), stacked below:

- eyebrow: `text-sm font-semibold tracking-[0.14em] uppercase`, accent ink
- title: `text-[clamp(2.25rem,4.8vw,4.5rem)] leading-[0.98] font-semibold tracking-tighter text-balance`
- lead: `text-lg text-pretty text-muted-foreground`, bottom-aligned in the right column

**The lead paragraph is required.** The current site has no equivalent and looks
sparser than the reference for exactly this reason.

### 2.5 Theme

Light and dark, chosen by the visitor and persisted. The reference sets it in a
blocking inline script before first paint (`localStorage` key `hands-theme`,
written to `document.documentElement.dataset.theme`) and adds a `.js` class in
the same script, because the reveal animations hide content until JS runs and a
JS-less visitor would otherwise get a blank page. Any section can also be forced
dark with `data-theme="dark"` on the element, since the tokens flip on an
ordinary attribute selector rather than on `:root`.

### 2.6 Illustrations

Seven raster images totalling 26.5MB, served unoptimised at 5504×3072:

```
hero-teamwork.jpg 5.9M   hero-linework.jpg 3.9M   team-collaboration.jpg 3.6M
line-art-team.jpg 3.6M   idea-lightbulb.jpg 3.4M  values-key.jpg 3.1M
creative-builder.jpg 3.0M
```

They carry a C2PA manifest naming Google Generative AI, plus a SynthID
watermark: they were generated, not licensed. The reference also hand-draws SVG
in `src/components/work/project-art.tsx`.

**This project does not copy how the reference ships them.** 26.5MB is roughly
150× the entire current site. See §4.4.

## 3. Goal

A bilingual, statically exported portfolio for Công Anh Dũng that a viewer would
place in the same design family as the reference, deployed to
`https://portfolio-dungca.ai-innovation-homelab.org/`.

## 4. Requirements

### 4.1 Stack

- Next.js 16 with `output: 'export'`, `trailingSlash: true`,
  `images: { unoptimized: true }`. Export is configured in the first commit, not
  retrofitted: it turns everything that cannot work on a static host into a
  build error at the point it is written.
- React 19, TypeScript strict, Tailwind 4, `@levi-it/design-system` at the same
  pinned tag the reference uses, `v0.1.3`.
- Node `>=22`.

### 4.2 Content

- Every string is bilingual. `data.js` is already shaped `{ en, vi }` at every
  leaf, so it ports directly onto `Localized<T> = Record<Locale, T>`; the type
  makes a missing translation a typecheck failure rather than a runtime blank.
- Nothing is invented. Every number, employer, date and metric comes from the
  existing `data.js` / `github-data.json` unchanged. Where the reference has a
  section this site has no true content for, the section is dropped, not filled.
- `scripts/sync-github.mjs` and `github-data.json` survive the rewrite.

### 4.3 Routing and deployment

- Routes `/[lang]/` for `lang` in `vi | en`, default `vi`.
- The target is **GitHub Pages**, not Cloudflare, which changes three things
  against the reference:
  - `public/.nojekyll` is mandatory. Next emits `_next/`, and Jekyll drops
    underscore-prefixed directories, so without it the site loads with no CSS
    and no JS.
  - `_redirects` does nothing. The root `/` → `/vi/` hop must be a real
    `public/index.html` that redirects client-side.
  - Pages must be served from GitHub Actions rather than from the branch, since
    the published tree is `out/` and not the repository root.
- `public/CNAME` must contain `portfolio-dungca.ai-innovation-homelab.org`, or
  the custom domain detaches on the first deploy.
- No `basePath`: this is a user site on a custom domain, served from root.
- `CV_CongAnhDung.pdf`, `favicon.svg`, `profile.webp`, `github-data.json` and
  the `about.html` / `blog.html` / `projects.html` redirect stubs all move to
  `public/` and keep their current URLs. Those URLs are live today.

### 4.4 Weight

- **Images: 40 KB each, raw bytes, enforced.** Images are served as-is, so the
  file size is what the visitor pays. The reference's approach — shipping the
  generator's raw 5504×3072 output — is explicitly rejected.
- **JS: 200 KB gzip per page, enforced, measured from the built HTML.** The
  reference's own gate states its 120KB target and its 330KB ceiling, and says
  the gap exists only because the design system's barrel does not tree-shake
  yet. This site is smaller than the reference and takes the tighter number; if
  the barrel makes 200KB unreachable, the gate is raised once, in a commit whose
  message carries the measurement.
- The current site is 35.9 KB gzip in total. That number will not survive this
  rewrite and the owner has accepted that. It is recorded so the cost stays
  visible.

### 4.5 Quality gates

`npm run verify` runs, in order: `format:check`, `lint`, `typecheck`,
`check:content`, `build`, `check:budget`. CI runs the same command.

- `check:content` — every `Localized<T>` leaf has both locales, non-empty.
- `check:budget` — per-page JS gzip against §4.4, and every file under
  `public/` with an image extension against the 40 KB image ceiling.
- No colour literal outside the token layer. The current site has an equivalent
  gate (`check:tokens`) and it has caught real regressions; it is not dropped.

### 4.6 Accessibility

- Text contrast meets AA (4.5:1). Accent colours are mixed per §2.2 before being
  used as text — measured, not assumed.
- Every animation returns to its start frame so the `prefers-reduced-motion`
  reset parks it at rest rather than mid-pose.
- Decorative illustrations are `alt=""`; each restates adjacent text, and an alt
  string would make a screen reader announce the same fact twice.
- A skip link, and a visible focus ring using `--base-focus-width: 4px`.

## 5. Explicitly out of scope

- Team, testimonial and process sections. The reference is a team site with
  clients; this is one person's portfolio. Writing filler to fill those bands
  would be inventing content, which §4.2 forbids.
- The reference's contact form. A static export has no server to post to, and
  the current site's mailto/link list already works.
- Copying any reference component file verbatim. The design language is the
  target; their source is their employer's.

## 6. Acceptance

1. `npm run verify` green from a clean clone.
2. `/vi/` and `/en/` both render every section with no missing-translation
   fallback.
3. The theme toggle persists across reload with no flash of the wrong theme.
4. Lighthouse accessibility ≥ 95 on `/vi/`.
5. The live custom domain serves the new site over HTTPS, and
   `/CV_CongAnhDung.pdf`, `/about.html`, `/blog.html`, `/projects.html` still
   resolve.
6. Side by side with the reference at 1200px, the two read as the same design
   family: same neutral ground, same blue primary, same section rhythm, same
   oversized-headline-plus-lead section head.
