import type { Dictionary } from './vi';

/** English half of the chrome dictionary. See vi.ts for the full sourcing
 *  breakdown. Five keys here have no English source anywhere in `data.js`
 *  (there is no data.js entry to port at all, English or Vietnamese-only):
 *  `meta.description`, `nav.skipToContent`, `nav.toggleTheme`, `common.demo`
 *  and `notFound.{title,back}`. Per the porting rule for a gap with no `en`,
 *  the Vietnamese string is carried into both locales here rather than
 *  invented — flagged in task-3-report.md for the owner to replace.
 *  `meta.title` and `common.present` are exceptions with evidence: `meta.title`
 *  is kept identical in both locales the same way `i18n.hero.eyebrow` already
 *  is in the source data, and `common.present` is the literal word "Present"
 *  that already appears, unchanged, inside every English `EXPERIENCE[].period`
 *  string in data.js ("Jan 2025 — Present"). */
const en: Dictionary = {
  meta: {
    title: 'Công Anh Dũng — AI/ML Systems Architect',
    // No English source exists for this description in data.js. Vietnamese
    // carried into both locales per the "no en" fallback rule — flagged.
    description: 'Hạ tầng và MLOps. Xây dựng hệ thống AI chạy được trong sản xuất tại eUp Group.',
  },
  nav: {
    // No English source exists in data.js. Fallback — flagged.
    skipToContent: 'Tới nội dung chính',
    expertise: 'Expertise',
    projects: 'Projects',
    experience: 'Experience',
    writing: 'Writing',
    contact: 'Contact',
    // No English source exists in data.js. Fallback — flagged.
    toggleTheme: 'Đổi giao diện sáng/tối',
  },
  common: {
    hireMe: 'Hire Me',
    downloadCv: 'Download CV',
    repository: 'Repository',
    // No English source exists in data.js. Fallback — flagged.
    demo: 'Bản chạy thử',
    present: 'Present',
  },
  sections: {
    hero: {
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
      problem: 'Problem',
      approach: 'Architecture',
      result: 'Result',
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
    // No English source exists in data.js. Fallback — flagged.
    title: 'Không tìm thấy trang',
    back: 'Về trang chủ',
  },
};

export default en;
