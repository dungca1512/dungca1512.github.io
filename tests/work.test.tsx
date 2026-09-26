import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { PROJECTS } from '@/content/projects';
import viDict from '@/content/dictionaries/vi';
import enDict from '@/content/dictionaries/en';

/* `Work` is an async Server Component that reads the locale off the URL's
   root param (src/content/dictionaries.ts → next/root-params), which does not
   exist outside a Next request. The loader is the one thing mocked: the
   component is then awaited like any async function and its tree rendered to
   markup, so what is asserted below is the HTML a visitor gets. */
vi.mock('@/content/dictionaries', () => ({
  getLocale: async () => 'vi',
  getDictionary: async () => viDict,
}));

const FEATURED = 5;

async function renderWork(): Promise<Document> {
  const { Work } = await import('@/components/sections/work');
  const markup = renderToStaticMarkup(await Work());
  return new DOMParser().parseFromString(`<body>${markup}</body>`, 'text/html');
}

/** The project cards: an <li> whose heading is a project name. The case
 *  study's own <h3> and the stack chips (also <li>) are not cards. */
function cardsIn(root: ParentNode): HTMLLIElement[] {
  const names = new Set(PROJECTS.map((p) => p.name));
  return [...root.querySelectorAll('li')].filter((li) =>
    names.has(li.querySelector(':scope > div > h3')?.textContent ?? ''),
  );
}

/** The <details> that folds the remaining projects: the one whose summary is
 *  the `moreProjects` line. The case study has a fold of its own. */
function projectFold(doc: Document): HTMLDetailsElement {
  const label = viDict.common.moreProjects.replace('{count}', String(PROJECTS.length - FEATURED));
  const fold = [...doc.querySelectorAll('details')].find(
    (d) => d.querySelector('summary')?.textContent?.trim() === label,
  );
  expect(fold, `no <details> is labelled "${label}"`).toBeDefined();
  return fold!;
}

describe('the featured projects are ordinary cards', () => {
  it('opens the first five as cards and folds the other four, each name once', async () => {
    const doc = await renderWork();
    const fold = projectFold(doc);
    const all = cardsIn(doc);
    const folded = cardsIn(fold);
    const open = all.filter((li) => !folded.includes(li));

    expect(open.map((li) => li.querySelector('h3')!.textContent)).toEqual(
      PROJECTS.slice(0, FEATURED).map((p) => p.name),
    );
    expect(folded.map((li) => li.querySelector('h3')!.textContent)).toEqual(
      PROJECTS.slice(FEATURED).map((p) => p.name),
    );

    // Until 2026-09-26 three of these were drawn twice — once pinned, once in
    // a fold holding all nine. A name that appears twice is that coming back.
    const headings = [...doc.querySelectorAll('h3')].map((h) => h.textContent);
    for (const project of PROJECTS) {
      expect(
        headings.filter((h) => h === project.name),
        project.name,
      ).toHaveLength(1);
    }
  });

  it('keeps the lead card, and its measured outcome, in the open grid', async () => {
    const doc = await renderWork();
    const lead = cardsIn(doc)[0]!;
    expect(lead.querySelector('h3')!.textContent).toBe(PROJECTS[0]!.name);
    expect(lead.className).toContain('sm:col-span-2');
    expect(lead.textContent).toContain(PROJECTS[0]!.outcome.vi);
    // And in the open grid only: folding the lead would take the one
    // paragraph of measured detail on the page behind a click.
    expect(projectFold(doc).textContent).not.toContain(PROJECTS[0]!.outcome.vi);
  });

  it('gives every card the on-enter reveal, staggered by its index', async () => {
    const doc = await renderWork();
    const cards = cardsIn(doc);
    expect(cards).toHaveLength(PROJECTS.length);
    cards.forEach((li, i) => {
      expect(li.classList.contains('reveal'), `card ${i} has no reveal`).toBe(true);
      expect(li.getAttribute('style'), `card ${i}`).toContain(`--i:${Math.min(i, 7)}`);
      expect(li.parentElement!.classList.contains('stagger'), `card ${i}'s list`).toBe(true);
    });
  });

  it('is not pinned, scrubbed, or duplicated anywhere in the markup', async () => {
    const doc = await renderWork();
    const markup = doc.body.innerHTML;
    // The scroll-scrubbed presentation these cards replaced. `pin-` is the
    // prefix every one of its classes carried (pin-stage, pin-card, pin-art,
    // pin-panel, pin-name, pin-scrim, pin-list).
    expect(markup).not.toMatch(/\bpin-/);
    expect(markup).not.toContain('position:sticky');
  });
});

describe('nothing of the pin is left in the stylesheets', () => {
  const WORK_CSS = readFileSync('src/styles/sections/work.css', 'utf8');
  const REDUCED_CSS = readFileSync('src/styles/motion-reduced.css', 'utf8');

  it('work.css carries no pin selector, keyframe, sticky position or scroll timeline', () => {
    expect(WORK_CSS).not.toMatch(/\.pin-/);
    expect(WORK_CSS).not.toMatch(/site-pin/);
    expect(WORK_CSS).not.toMatch(/position:\s*sticky/);
    expect(WORK_CSS).not.toMatch(/-timeline/);
    expect(WORK_CSS).not.toMatch(/@supports/);
  });

  it('motion-reduced.css no longer resets a pin that no longer exists', () => {
    expect(REDUCED_CSS).not.toMatch(/\.pin-/);
  });

  it('the fold says "more", and the dictionaries no longer carry the "all" line the pin needed', () => {
    for (const dict of [viDict, enDict]) {
      const common = dict.common as Record<string, string>;
      expect(common.moreProjects).toContain('{count}');
      expect(common).not.toHaveProperty('allProjects');
    }
  });
});
