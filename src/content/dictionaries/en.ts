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
    analytics: 'Data',
    writing: 'Notes',
    contact: 'Contact',
    toggleTheme: 'Toggle light and dark theme',
  },
  common: {
    hireMe: 'Hire Me',
    downloadCv: 'Download CV',
    readBlog: 'Read the blog',
    repository: 'Repository',
    demo: 'Demo',
    present: 'Present',
    /* See vi.ts — these are the summary lines of the collapsed panels, and
       `{count}` is substituted at the call site from the list's own length. */
    moreProjects: 'Show {count} more projects',
    caseStudyDetail: 'Read the detail: problem, architecture, trade-offs, result',
    measuredOutcome: 'The measured outcome',
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
      /* See vi.ts — this band absorbed the capabilities band, so its lead has
         to introduce the toolbox and the playbook too. */
      lead: 'Four areas I work in depth, the toolbox I use daily, and the five principles that decide how I use it.',
      toolbox: 'The everyday toolbox',
    },
    work: {
      eyebrow: 'Selected Work',
      title: 'Infrastructure, ML serving, and platform engineering work.',
      lead: 'Nine systems that shipped, plus one case study taken from problem to measured result.',
    },
    experience: {
      eyebrow: 'Experience',
      title: 'Three years shipping and operating AI systems in production.',
      lead: 'Three years across three places, oldest first: conversation analytics at FPT Smart Cloud, AI engineering at AMELA, now owning AI/ML infrastructure at eUp Group.',
      /* The two ends of the time axis. `axisStart` is the year the first role
         began, kept as copy rather than derived from EXPERIENCE: the axis is
         the reader's orientation, and pinning it here means a role added at
         either end is a deliberate edit to the label too. */
      axisStart: '2023',
      axisNow: 'Now',
    },
    /* See vi.ts — the band merged into `expertise`; this line survives as the
       label on the panel holding the five principles. */
    capabilities: {
      title: 'Operating principles for production AI infrastructure.',
    },
    analytics: {
      eyebrow: 'Data Snapshot',
      title: 'GitHub activity and repository signals.',
      lead: 'Every number below is read straight from the GitHub API and frozen at the moment of the snapshot, so the page always shows exactly the data the build saw — nothing on this band is drawn by hand.',
      scope:
        'Scope: public repositories with commits since 2025. University coursework is excluded, and most production work at eUp, AMELA and FPT lives in private repositories, so it does not appear here.',
      snapshot: 'GitHub snapshot',
      kpiPublic: 'Public repositories',
      kpiOwn: 'Own repositories, not forks',
      kpiScope: 'In scope since 2025',
      kpiLanguages: 'Languages used in scope',
      languageMix: 'Language mix',
      velocity: 'Update rhythm by month',
      freshness: 'Repository freshness',
      topRepos: 'Most recently active repositories',
      days30: 'Updated <= 30 days',
      days90: 'Updated 31-90 days',
      days180: 'Updated 91-180 days',
      older: 'Updated > 180 days',
      tableRepo: 'Repository',
      tableLanguage: 'Language',
      tableUpdated: 'Last update',
      unknown: 'Unknown',
      repoUnit: 'repos',
    },
    writing: {
      eyebrow: 'Technical notes',
      title: 'Infrastructure, MLOps and what cost engineering taught me.',
      lead: 'Things I tried, broke and fixed — mostly around GPU cost, LLM serving and operations.',
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
