import type { Localized } from './locales';

/** `PORTFOLIO_DATA.contacts[i]` is `{ label, url, download? }` — there is no
 *  `key` or split `value`/`href` in the source; each entry is a single link.
 *  `key` is a stable slug derived from the English label (an internal
 *  identifier, not user-visible content). `download` is kept for the one
 *  entry (the CV) that sets it, since the source does. */
export type Contact = { key: string; label: Localized<string>; url: string; download?: boolean };

/** `PORTFOLIO_DATA.contacts`, all five, verbatim. */
export const CONTACTS: Contact[] = [
  {
    key: 'download-cv',
    label: { en: 'Download CV', vi: 'Tải CV' },
    url: '/CV_CongAnhDung.pdf',
    download: true,
  },
  {
    key: 'book-a-call',
    label: { en: 'Book a Call', vi: 'Đặt lịch trao đổi' },
    url: 'mailto:dungca@ai-innovation-homelab.org?subject=Book%20a%20call%20with%20Cong%20Anh%20Dung',
  },
  {
    key: 'email',
    label: { en: 'Email', vi: 'Email' },
    url: 'mailto:dungca@ai-innovation-homelab.org',
  },
  {
    key: 'github',
    label: { en: 'GitHub', vi: 'GitHub' },
    url: 'https://github.com/dungca1512',
  },
  {
    key: 'linkedin',
    label: { en: 'LinkedIn', vi: 'LinkedIn' },
    url: 'https://www.linkedin.com/in/dungca/',
  },
];
