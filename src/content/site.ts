import type { Localized } from './locales';

/** Ported verbatim from `PORTFOLIO_DATA.profile` in the legacy data.js. */
export const SITE = {
  url: 'https://portfolio-dungca.ai-innovation-homelab.org',
  name: 'Công Anh Dũng',
  /** Served straight out of public/. next/image is off (unoptimized), so these
   *  are plain paths, not imports. */
  avatar: '/profile.webp',
  cv: '/CV_CongAnhDung.pdf',
  /** Absolute and off-site: a separate deployment, not a route in this
   *  export. Kept here rather than inline in the Writing band because it is
   *  a property of the person, not of that one section. */
  blog: 'https://blog-dungca.ai-innovation-homelab.org/',
  /** The card a link to the site unfurls into. Drawn by
   *  scripts/build-og-image.py; 1200x630 is the size every unfurler crops to. */
  ogImage: { url: '/og.jpg', width: 1200, height: 630 },
  /** Every other page on the web that is this person, for the `sameAs` of
   *  the Person in lib/structured-data.ts. This list is what lets a search
   *  engine treat the portfolio, the social profiles and the research
   *  profile as one entity, so a search for the name can surface all of
   *  them together. Add a profile here when one is created (Google Scholar,
   *  ORCID, ResearchGate); nothing else needs to change. */
  sameAs: [
    'https://github.com/dungca1512',
    'https://www.linkedin.com/in/dungca/',
    'https://huggingface.co/dungca',
    'https://www.facebook.com/dungca1512',
    'https://www.alphaxiv.org/@cong-anh-dung',
    'https://blog-dungca.ai-innovation-homelab.org/',
  ],
  location: {
    en: 'Hanoi, Vietnam',
    vi: 'Hà Nội, Việt Nam',
  } satisfies Localized<string>,
  status: {
    en: 'AI/ML Systems Architect · Infrastructure & MLOps @ eUp Group',
    vi: 'AI/ML Systems Architect · Hạ tầng & MLOps @ eUp Group',
  } satisfies Localized<string>,
} as const;

/** The capability strip under the hero headline, ported verbatim from
 *  `PORTFOLIO_DATA.heroTrust`. Six badges, bilingual. Two of them read the same
 *  in both locales because the source does — they are product names, not prose.
 *
 *  This nearly went missing: no task in the plan claimed it, so the port had
 *  nowhere to put it and the review caught it with no home. It is the densest
 *  thing available to the hero, which is exactly where the page was reading
 *  thin against the reference. */
export const HERO_TRUST: Localized<string>[] = [
  { en: 'Kubernetes & GitOps (GKE)', vi: 'Kubernetes & GitOps (GKE)' },
  { en: 'Production ML Serving', vi: 'Triển khai ML thực chiến' },
  { en: 'Agentic RAG & LLM Systems', vi: 'Hệ thống Agentic RAG & LLM' },
  { en: 'IaC (Terraform · Ansible)', vi: 'IaC (Terraform · Ansible)' },
  { en: 'Cloud Cost Engineering', vi: 'Tối ưu chi phí hạ tầng' },
  { en: 'Multi-cloud (GCP · AWS · OCI)', vi: 'Đa cloud (GCP · AWS · OCI)' },
];
