import { describe, it, expect } from 'vitest';
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
    expect(FOCUS.length).toBe(5);
    expect(PLAYBOOK.length).toBe(5);
    expect(HERO_TRUST.length).toBe(6);
  });

  it('points at the real CV and avatar files', () => {
    expect(SITE.cv).toBe('/CV_CongAnhDung.pdf');
    expect(SITE.avatar).toBe('/profile.webp');
  });
});
