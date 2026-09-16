import type { Dictionary } from './vi';

/** English half of the chrome dictionary. See vi.ts for the full sourcing
 *  breakdown. Six keys have no bilingual source in `data.js` because they are
 *  interface chrome rather than anything the owner wrote: `nav.skipToContent`,
 *  `nav.toggleTheme`, `common.demo` and `notFound.{title,back}` carry their
 *  conventional English wording (controller ruling R25 — "no invented content"
 *  governs claims about the owner, not the words on a skip link).
 *  `meta.description` IS a claim, so it is not written here either: it is
 *  `i18n.hero.lead` verbatim, which already exists in both locales.
 *  `meta.title` and `common.present` are exceptions with evidence: `meta.title`
 *  is kept identical in both locales the same way `i18n.hero.eyebrow` already
 *  is in the source data, and `common.present` is the literal word "Present"
 *  that already appears, unchanged, inside every English `EXPERIENCE[].period`
 *  string in data.js ("Jan 2025 — Present"). */
const en: Dictionary = {
  meta: {
    title: 'Công Anh Dũng — AI/ML Systems Architect',
    description:
      'Speech (ASR, pronunciation and tone scoring) and embedding services on GCP and DigitalOcean for users in VN, JP, KR and CN. Cost-conscious by default: GPU right-sizing, CPU-first inference, self-hosted alternatives to paid APIs.',
  },
  nav: {
    skipToContent: 'Skip to content',
    expertise: 'Expertise',
    projects: 'Projects',
    experience: 'Experience',
    writing: 'Writing',
    contact: 'Contact',
    toggleTheme: 'Toggle light and dark theme',
  },
  common: {
    hireMe: 'Hire Me',
    downloadCv: 'Download CV',
    repository: 'Repository',
    demo: 'Demo',
    present: 'Present',
    readArticle: 'Read',
  },
  sections: {
    hero: {
      /* See vi.ts for why the <h1> is a claim rather than the owner's name.
         Same two-line shape, so both locales break in the same place. */
      title: ['Taking AI models', 'into real production.'],
      /* The accessible name for the hero's pill row. Deliberately NOT
         `sections.expertise.eyebrow`: reusing that gave two regions on one page
         the same accessible name, and tied this list's name to copy that
         belongs to a different section. */
      trustList: 'Technologies and practices worked with',
      lead: 'Speech (ASR, pronunciation and tone scoring) and embedding services on GCP and DigitalOcean for users in VN, JP, KR and CN. Cost-conscious by default: GPU right-sizing, CPU-first inference, self-hosted alternatives to paid APIs.',
    },
    expertise: {
      eyebrow: 'Core Expertise',
      title: 'How I build and operate AI infrastructure.',
      lead: 'Four areas I work in depth: architecture and cost control, Kubernetes operations, model serving, and LLM application design.',
    },
    work: {
      eyebrow: 'Selected Work',
      title: 'Infrastructure, ML serving, and platform engineering work.',
      lead: 'Nine systems that shipped, plus one case study taken from problem to measured result.',
    },
    experience: {
      eyebrow: 'Experience',
      title: 'Three years shipping and operating AI systems in production.',
      lead: 'Three years across three places: AI intern at FPT Smart Cloud, AI engineer at AMELA, now owning AI/ML infrastructure at eUp Group.',
    },
    capabilities: {
      eyebrow: 'Engineering Playbook',
      title: 'Operating principles for production AI infrastructure.',
      lead: 'The tools I use daily, and the five principles that decide how I use them.',
    },
    writing: {
      eyebrow: 'Writing',
      title: 'Notes on infrastructure, MLOps, and cost engineering.',
      lead: 'Six pieces on things I tried, broke and fixed — mostly GPU cost, LLM serving and operations.',
    },
    contact: {
      eyebrow: 'Contact',
      title: 'Building AI infrastructure or an ML platform?',
      lead: 'I am available for AI/ML infrastructure, DevOps, and MLOps roles focused on production model serving, Kubernetes platforms, and cost-efficient cloud architecture.',
    },
  },
  notFound: {
    title: 'Page not found',
    back: 'Back to home',
  },
};

export default en;
