import { describe, it, expect } from 'vitest';
import { profileJsonLd, jsonLdScript } from '@/lib/structured-data';
import { SITE } from '@/content/site';
import { CONTACTS } from '@/content/contacts';

describe('profileJsonLd', () => {
  it('is a ProfilePage about the person, at the locale URL', () => {
    const data = profileJsonLd('vi');
    expect(data['@type']).toBe('ProfilePage');
    expect(data.url).toBe(`${SITE.url}/vi/`);
    expect(data.mainEntity['@type']).toBe('Person');
    expect(data.mainEntity.name).toBe('Công Anh Dũng');
  });

  it('names the same person in both locales, so the two pages are one entity', () => {
    expect(profileJsonLd('vi').mainEntity['@id']).toBe(profileJsonLd('en').mainEntity['@id']);
  });

  it('answers the name typed without diacritics', () => {
    expect(profileJsonLd('en').mainEntity.alternateName).toContain('Cong Anh Dung');
  });

  it('links every off-site profile the page itself links to', () => {
    const sameAs = profileJsonLd('en').mainEntity.sameAs;
    for (const contact of CONTACTS.filter((c) => c.url.startsWith('https://'))) {
      expect(sameAs).toContain(contact.url);
    }
    for (const url of sameAs) expect(url).toMatch(/^https:\/\//);
  });
});

describe('jsonLdScript', () => {
  it('cannot close its script element early', () => {
    expect(jsonLdScript({ x: '</script><script>' })).not.toContain('</script>');
    expect(JSON.parse(jsonLdScript({ x: '</script>' }))).toEqual({ x: '</script>' });
  });
});
