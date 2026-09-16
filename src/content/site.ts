import type { Localized } from './locales';

/** Ported verbatim from `PORTFOLIO_DATA.profile` in the legacy data.js. */
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
