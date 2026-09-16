import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { LOCALES } from '@/content/locales';
import { SITE, HERO_TRUST } from '@/content/site';
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
  SITE,
  METRICS,
  EXPERTISE,
  FOCUS,
  PROJECTS,
  CASE_STUDY,
  EXPERIENCE,
  EDUCATION,
  CERTIFICATION,
  SKILL_GROUPS,
  PLAYBOOK,
  WRITING,
  CONTACTS,
};

describe('every bilingual field is filled in both languages', () => {
  for (const [name, mod] of Object.entries(modules)) {
    it(name, () => {
      const found = [...localized(mod, name)];
      expect(
        found.length,
        `${name} has no bilingual fields — did the port drop them?`,
      ).toBeGreaterThan(0);
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
    // The count is exactly 9, verified against data.json — an inequality
    // would let a dropped project pass unnoticed.
    expect(PROJECTS.length).toBe(9);
    expect(EXPERIENCE.length).toBe(3);
    expect(SKILL_GROUPS.length).toBe(6);
    expect(WRITING.length).toBe(6);
    expect(CONTACTS.length).toBe(5);
    expect(METRICS.length).toBe(4);
    expect(EXPERTISE.length).toBe(4);
    // 4, down from 5: the SAA-C03 line left this list when the
    // certification stopped being pending. This assertion is what noticed —
    // which is the point of pinning counts rather than reading them back.
    expect(FOCUS.length).toBe(4);
    expect(PLAYBOOK.length).toBe(5);
    expect(HERO_TRUST.length).toBe(6);
  });

  it('points at the real CV and avatar files', () => {
    expect(SITE.cv).toBe('/CV_CongAnhDung.pdf');
    expect(SITE.avatar).toBe('/profile.webp');
  });

  it('sends the blog link off-site, not to a route this export does not have', () => {
    // A relative '/blog/' here would build, render, and 404 — the blog is a
    // separate deployment, and check:export only knows about pages inside
    // out/. Absolute + https is the property that makes it work at all.
    expect(SITE.blog).toMatch(/^https:\/\//);
    expect(SITE.blog).toContain('blog-dungca.ai-innovation-homelab.org');
  });
});

/* The Writing band used to be called "Bài viết" / "Writing" and its lead
 * opened "Sáu bài viết…" / with a count — while not one of the six entries
 * was published anywhere, and the rows linked to GitHub repositories under a
 * pointer label reading "Đọc bài". The band is now "Ghi chép" / "Notes" and
 * the count is gone.
 *
 * This asserts the copy, in both locales, because the failure was a copy
 * failure: the markup was fine, the words were the lie. A future edit that
 * reinstates "bài viết" in the lead is exactly the regression worth catching,
 * and it would not show up in any structural gate. */
describe('the writing band does not claim articles it has not published', () => {
  for (const [name, dict] of [
    ['vi', vi],
    ['en', en],
  ] as const) {
    it(`${name}: the lead counts nothing and the eyebrow says notes`, () => {
      const { eyebrow, lead } = dict.sections.writing;
      expect(lead).not.toMatch(/sáu bài viết|six (articles|posts)/i);
      expect(eyebrow).toMatch(name === 'vi' ? /ghi chép/i : /notes/i);
    });
  }

  it('gives a repository link only to entries that have a repository', () => {
    // `repo` replaced `href`, and the rename is the whole point: the URL is
    // the code the note is about, never the note itself. Anything on
    // github.com that is NOT a repo URL (the bare profile, which is where
    // the legacy data.js sent all five) is the regression this catches.
    for (const article of WRITING) {
      if (article.repo === undefined) continue;
      expect(article.repo).toMatch(/^https:\/\/github\.com\/[^/]+\/[^/]+$/);
    }
    expect(WRITING.filter((a) => a.repo).length).toBe(3);
  });
});

/* The <h1> used to be `SITE.name`, and the owner's complaint was exactly that:
 * a name in 6rem type says who is speaking and nothing about what they do. The
 * headline is now a claim from the dictionary, and the name is a byline in the
 * index row.
 *
 * Two things can quietly undo that. The headline can drift back to the name —
 * it is one `{SITE.name}` away. Or the name can be moved out of the <h1> and
 * not land anywhere else, which reads as tidier code and loses the byline. So
 * this asserts both directions, and reads hero.tsx as text because Hero is an
 * async Server Component that calls `lang()` from next/root-params — rendering
 * it under jsdom asserts nothing about what ships. */
describe('the hero headline', () => {
  const hero = readFileSync('src/components/sections/hero.tsx', 'utf8');
  // The doc comment above the <h1> names `SITE.name` while explaining why it
  // is gone. Matching on the comment would pass forever regardless of the JSX.
  const heroCode = hero.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

  it('is a claim from the dictionary, in both locales', () => {
    for (const [locale, dict] of [
      ['vi', vi],
      ['en', en],
    ] as const) {
      const lines = dict.sections.hero.title;
      expect(Array.isArray(lines), locale).toBe(true);
      expect(lines.length, locale).toBeGreaterThanOrEqual(2);
      for (const line of lines)
        expect(line.trim().length, `${locale}: "${line}"`).toBeGreaterThan(0);
      // A headline that is the owner's name is the thing this replaced.
      expect(lines.join(' '), locale).not.toContain(SITE.name);
    }
  });

  it('breaks in the same place in every locale', () => {
    expect(en.sections.hero.title.length).toBe(vi.sections.hero.title.length);
  });

  it('renders that headline in the <h1>, not the name', () => {
    const h1 = heroCode.match(/<h1[\s\S]*?<\/h1>/)?.[0];
    expect(h1, 'hero.tsx has no <h1>').toBeDefined();
    expect(h1).toContain('dict.sections.hero.title');
    expect(h1).not.toContain('SITE.name');
  });

  /* The headline wrapped mid-phrase the first time it shipped — "Đưa mô /
   * hình AI" — because it was sized in `vw` while its column stops growing at
   * the Container's max width. Measured in the browser: the longest line is
   * 8.67x its own font size, so `11cqi` (a share of the column, not the
   * viewport) holds the authored break at every width from 1600 down to 390 in
   * both locales. jsdom applies no stylesheet and lays nothing out, so it
   * cannot re-measure that — but it can hold the two structural facts the
   * measurement depends on, either of which can be undone by a one-word edit
   * that looks harmless. */
  it('sizes the headline against its column, so the authored break survives', () => {
    const h1 = heroCode.match(/<h1[\s\S]*?>/)?.[0] ?? '';
    expect(h1, 'the <h1> must size in cqi, not vw — see the comment above').toMatch(/\d+cqi/);
    expect(h1).not.toMatch(/\dvw/);
  });

  it('declares the container those cqi units are a share of', () => {
    // `cqi` with no container resolves against the small viewport instead,
    // which is the bug wearing the fix's clothes.
    expect(heroCode).toMatch(/className="[^"]*@container/);
  });

  it('keeps the name on the page as a byline rather than dropping it', () => {
    // In the hero itself, and in the two places it has always also appeared.
    expect(heroCode, 'hero.tsx').toContain('{SITE.name}');
    for (const file of ['src/components/layout/menu-bar.tsx', 'src/components/site/footer.tsx']) {
      expect(readFileSync(file, 'utf8'), file).toContain('{SITE.name}');
    }
  });
});

/* The 1.86s benchmark is quoted on four pages — the project card, the
 * expertise list, an article summary and a role's highlights. It used to carry
 * "20 concurrent users" in all four; the owner asked for the count to go, and
 * an edit applied to three of four is worse than no edit, because the page
 * then contradicts itself in the reader's scroll.
 *
 * So this asserts the decision rather than the wording: the count is absent
 * everywhere, and the utilisation figure that replaced its evidentiary job is
 * present everywhere the latency is. Checking only the first half would let
 * the claim degrade into a bare "p95 1.86s" with nothing behind it, which is
 * the failure this pairing exists to prevent. */
describe('the 1.86s benchmark, quoted in four places', () => {
  const quoting = [
    'src/content/projects.ts',
    'src/content/expertise.ts',
    'src/content/writing.ts',
    'src/content/experience.ts',
  ]
    /* Comments are stripped before anything is asserted, and that is not a
     * convenience: the sourcing note in projects.ts *quotes* the phrase that
     * was removed, in order to explain why it was removed. Reading raw source
     * would fail on the very comment that documents the decision, and the
     * obvious way to make that green again is to delete the explanation. The
     * assertions are about what ships to a reader, so they run on what ships. */
    .map((file) => {
      const src = readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      return [file, src] as const;
    });

  it('is actually quoted in all four — a renamed file would empty this suite', () => {
    for (const [file, src] of quoting) expect(src, file).toContain('1.86');
  });

  it('states a concurrency count nowhere', () => {
    for (const [file, src] of quoting) {
      // Any digit directly qualifying "concurrent"/"đồng thời", in either order.
      expect(src, file).not.toMatch(/\d+\s*(concurrent|người dùng đồng thời)/i);
    }
  });

  /* Per LINE, not per file. The first version of this searched everything
   * after the first "1.86" in the file and passed when the English sentence
   * lost its "8%", because the Vietnamese sentence further down still had one
   * — a gate that was green while the thing it guards was broken in half the
   * site's languages. Each locale's sentence is its own line here (prettier
   * keeps these long strings unwrapped), so the line is the unit that has to
   * stand up on its own. */
  it('keeps the utilisation figure that now carries the claim, in every locale', () => {
    for (const [file, src] of quoting) {
      const quotingLines = src.split('\n').filter((line) => line.includes('1.86'));
      expect(quotingLines.length, `${file}: expected one line per locale`).toBeGreaterThanOrEqual(
        2,
      );
      for (const line of quotingLines) {
        expect(line, `${file}: 1.86s quoted with no GPU figure behind it`).toMatch(/8%/);
      }
    }
  });
});
