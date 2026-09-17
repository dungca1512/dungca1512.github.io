import type { Localized } from './locales';
import type { HighlightGlyph } from '@/components/site/highlight-icon';

/** `PORTFOLIO_DATA.experience[i].period` is a single plain string (e.g.
 *  "Jan 2025 — Present") — the source never splits it by locale. It was ported
 *  into both `en` and `vi` verbatim, which left English month abbreviations and
 *  the English word "Present" sitting in the Vietnamese export: the one field
 *  in the timeline that a Vietnamese reader had to translate in their head,
 *  in the section whose whole job is to be read at a glance. The `vi` side now
 *  reads in Vietnamese — numeric months, which need no abbreviation in either
 *  language, and "Hiện tại" for the open end. `period` stays
 *  `Localized<string>`, so every user-visible field keeps the same guarantee.*/
export type Role = {
  company: string;
  role: Localized<string>;
  period: Localized<string>;
  current: boolean;
  summary: Localized<string>;
  highlights: Localized<string[]>;
  /** One glyph per highlight, index-aligned with both arrays in `highlights`.
   *
   *  A parallel array rather than a `{ glyph, en, vi }` object per line,
   *  because `highlights` has to stay a `Localized<string[]>`: the bilingual
   *  walker in tests/content.test.ts finds every user-visible pair on this
   *  module by its SHAPE, and a third key beside `en` and `vi` would take
   *  these strings out from under the gate that proves neither language is
   *  missing. The cost of the parallel array is that it can fall out of step,
   *  so tests/sections.test.tsx pins the three lengths equal — a bullet added
   *  without a glyph fails there rather than rendering a hole. */
  glyphs: HighlightGlyph[];
  stack: string[];
};

/** `PORTFOLIO_DATA.experience`, most recent first. Each source highlight is
 *  itself a `{ en, vi }` pair; they are regrouped here into one
 *  `{ en: string[], vi: string[] }` pair to match the `Localized<string[]>`
 *  contract.
 *
 *  The order here stays newest-first because that is what a CV is, and because
 *  `current` is asserted to be the first entry. The SECTION renders it the
 *  other way up — see experience.tsx, which reverses a copy. Reading order and
 *  storage order are different questions and this file only answers the second.
 *
 *  The eUp highlights are no longer verbatim: that role shipped five bullets
 *  and about 160 Vietnamese words against forty-nine for each of the other two,
 *  so the most relevant role was also the one a reader gave up on. It is four
 *  bullets now. Every number and every named system survived the cut; what went
 *  was two enumerations the page already carries elsewhere — the four STT engine
 *  names, which the projects section lists in full, and the build-tool list,
 *  which is what the `stack` chips under this very role are for. */
export const EXPERIENCE: Role[] = [
  {
    company: 'eUp Group',
    role: {
      en: 'AI/ML Systems Architect — Infrastructure & MLOps',
      vi: 'AI/ML Systems Architect — Hạ tầng & MLOps',
    },
    period: { en: 'Jan 2025 — Present', vi: '01/2025 — Hiện tại' },
    current: true,
    summary: {
      en: 'Own AI infrastructure end-to-end for the HeyJapan product line — provisioning, delivery, model serving and observability — and architect the speech, translation and lesson-generation systems on top of it.',
      vi: 'Sở hữu toàn trình hạ tầng AI cho dòng sản phẩm HeyJapan — provisioning, delivery, model serving và observability — đồng thời thiết kế các hệ thống speech, dịch thuật và sinh bài học chạy trên đó.',
    },
    highlights: {
      en: [
        'Architected a multi-market speech scoring platform (JLPT, TOPIK, HSKK, English): four FastAPI services with multi-engine STT behind automatic fallback.',
        'Ruled out a ~$2,475/mo H100 plan with a benchmark instead of an opinion: p95 1.86s under concurrent load on ~8% of a commodity CUDA GPU.',
        'Migrated production ML services from Docker Swarm to Kubernetes — GKE and bare-metal — with Terraform, Ansible, Helm and ArgoCD, observable through Prometheus, Grafana and Loki.',
        'Replaced the OpenAI Embedding API with a self-hosted Qwen3-Embedding-4B service, feeding the RAG code-review pipeline gated in GitLab CI.',
      ],
      vi: [
        'Thiết kế nền tảng chấm điểm phát âm đa thị trường (JLPT, TOPIK, HSKK, tiếng Anh): 4 dịch vụ FastAPI, STT đa engine kèm fallback tự động.',
        'Loại phương án H100 ~$2,475/tháng bằng số liệu chứ không bằng cảm tính: p95 1.86s dưới tải đồng thời, chỉ dùng ~8% một GPU CUDA phổ thông.',
        'Di trú dịch vụ ML production từ Docker Swarm sang Kubernetes — GKE và bare-metal — với Terraform, Ansible, Helm, ArgoCD; quan trắc bằng Prometheus, Grafana, Loki.',
        'Thay OpenAI Embedding API bằng dịch vụ Qwen3-Embedding-4B tự host, cấp cho pipeline review code RAG kiểm soát trong GitLab CI.',
      ],
    },
    glyphs: ['waveform', 'gauge', 'cluster', 'vector'],
    stack: ['Terraform', 'Ansible', 'Kubernetes', 'ArgoCD', 'FastAPI', 'CTranslate2', 'Prometheus'],
  },
  {
    company: 'AMELA Technology',
    role: { en: 'AI Engineer', vi: 'AI Engineer' },
    period: { en: 'Nov 2024 — Jan 2025', vi: '11/2024 — 01/2025' },
    current: false,
    summary: {
      en: 'Delivered computer vision and retrieval-augmented generation features for client products.',
      vi: 'Triển khai các tính năng thị giác máy tính và RAG cho sản phẩm khách hàng.',
    },
    highlights: {
      en: [
        'Built a Japanese handwriting OCR pipeline, from data preparation through model training to a serving endpoint.',
        'Shipped RAG chatbots over client document sets, and an AI-guided cosmetic eyeliner feature driven by facial landmark detection.',
      ],
      vi: [
        'Xây dựng pipeline OCR chữ viết tay tiếng Nhật, từ chuẩn bị dữ liệu, huấn luyện mô hình đến endpoint phục vụ.',
        'Triển khai chatbot RAG trên tập tài liệu khách hàng và tính năng kẻ eyeliner có AI dẫn đường dựa trên nhận diện điểm mốc khuôn mặt.',
      ],
    },
    glyphs: ['scan', 'chat'],
    stack: ['PyTorch', 'OCR', 'RAG', 'OpenCV'],
  },
  {
    company: 'FPT Smart Cloud',
    role: { en: 'AI Engineer', vi: 'AI Engineer' },
    period: { en: 'Mar 2023 — Nov 2024', vi: '03/2023 — 11/2024' },
    current: false,
    summary: {
      en: 'Worked on FPT AI Enhance, the conversation analytics platform serving Home Credit, FE Credit, MB Bank, FPT Long Chau and FPT Shop.',
      vi: 'Tham gia FPT AI Enhance — nền tảng phân tích hội thoại phục vụ Home Credit, FE Credit, MB Bank, FPT Long Châu và FPT Shop.',
    },
    highlights: {
      en: [
        'Developed conversation analytics features on production call-centre data for enterprise banking and retail customers.',
        'Implemented LLM guardrails, and built virtual assistant chatbots for the State Securities Commission of Vietnam.',
      ],
      vi: [
        'Phát triển các tính năng phân tích hội thoại trên dữ liệu tổng đài thực tế cho khách hàng ngân hàng và bán lẻ quy mô lớn.',
        'Xây dựng guardrail cho LLM và phát triển chatbot trợ lý ảo cho Ủy ban Chứng khoán Nhà nước Việt Nam.',
      ],
    },
    glyphs: ['chart', 'shield'],
    stack: ['Python', 'NLP', 'LLM Guardrails', 'Chatbot'],
  },
];

/** `PORTFOLIO_DATA.education` is `{ school, degree, period }`; `period` is a
 *  plain string, not bilingual, same reasoning as `Role.period` above.
 *  Composed per controller ruling A5: `title` <- `school` (the institution,
 *  same role a project's `name` plays), `detail` <- `degree` joined with
 *  `period` by " · " (the same separator the source itself uses elsewhere,
 *  e.g. project periods like "eUp · 2025-2026") — no new words, just the two
 *  remaining raw fields concatenated. */
export type Education = { title: Localized<string>; detail: Localized<string> };

export const EDUCATION: Education = {
  title: {
    en: 'VNU University of Science (HUS)',
    vi: 'Trường Đại học Khoa học Tự nhiên, ĐHQGHN',
  },
  detail: {
    en: 'Computer and Information Science · Mar 2019 — Jun 2025',
    vi: 'Khoa học Máy tính và Thông tin · 03/2019 — 06/2025',
  },
};

/** `PORTFOLIO_DATA.certification` is `{ name, status }`; `name` is a plain
 *  string, not bilingual — ported into both locales per the "no en" fallback
 *  rule and flagged in the report. Per A5: `title` <- `name`, `detail` <-
 *  `status` (already bilingual, verbatim).
 *
 *  `detail` is optional, and this entry now omits it. It carried the status
 *  line ("In progress" / "Đang theo học"), which the owner asked to drop so
 *  the certification stands on its own. The field stays on the type rather
 *  than being deleted because Education next to it still uses it, and a
 *  future certification may want an issue date here. The card in
 *  experience.tsx renders the line only when a detail exists — an empty
 *  string would leave a blank paragraph and knock the two cards out of
 *  alignment. */
export type Certification = { title: Localized<string>; detail?: Localized<string> };

export const CERTIFICATION: Certification = {
  title: {
    en: 'AWS Certified Solutions Architect — Associate (SAA-C03)',
    vi: 'AWS Certified Solutions Architect — Associate (SAA-C03)',
  },
};
