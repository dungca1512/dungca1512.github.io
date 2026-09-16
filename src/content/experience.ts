import type { Localized } from './locales';

/** `PORTFOLIO_DATA.experience[i].period` is a single plain string (e.g.
 *  "Jan 2025 — Present") — the source never splits it by locale, because the
 *  month abbreviations and the en dash read the same in both languages. Per
 *  the porting rule ("if an entry has no en, port the vi into both and flag
 *  it"), that single string is ported into both `en` and `vi` here rather than
 *  left as a bare string, so `period` stays `Localized<string>` and every
 *  user-visible field keeps the same guarantee. */
export type Role = {
  company: string;
  role: Localized<string>;
  period: Localized<string>;
  current: boolean;
  summary: Localized<string>;
  highlights: Localized<string[]>;
  stack: string[];
};

/** `PORTFOLIO_DATA.experience`, most recent first, verbatim. Each source
 *  highlight is itself a `{ en, vi }` pair; they are regrouped here into one
 *  `{ en: string[], vi: string[] }` pair to match the `Localized<string[]>`
 *  contract — the strings themselves are untouched. */
export const EXPERIENCE: Role[] = [
  {
    company: 'eUp Group',
    role: {
      en: 'AI/ML Systems Architect — Infrastructure & MLOps',
      vi: 'AI/ML Systems Architect — Hạ tầng & MLOps',
    },
    period: { en: 'Jan 2025 — Present', vi: 'Jan 2025 — Present' },
    current: true,
    summary: {
      en: 'Own AI infrastructure end-to-end for the HeyJapan product line — provisioning, delivery, model serving and observability — and architect the speech, translation and lesson-generation systems on top of it.',
      vi: 'Sở hữu toàn trình hạ tầng AI cho dòng sản phẩm HeyJapan — provisioning, delivery, model serving và observability — đồng thời thiết kế các hệ thống speech, dịch thuật và sinh bài học chạy trên đó.',
    },
    highlights: {
      en: [
        'Architected a multi-market speech scoring platform (JLPT, TOPIK, HSKK, English): 4 FastAPI/Gunicorn services with multi-engine STT — Kotoba-Whisper, faster-whisper/CTranslate2, SenseVoice ONNX, ReazonSpeech — behind automatic fallback.',
        'Ruled out a ~$2,475/mo H100 plan with a benchmark instead of an opinion: p95 1.86s under concurrent load on ~8% of a commodity CUDA GPU. Also ran the RCA that closed a 3x ASR latency gap between two environments.',
        'Migrated production ML services from Docker Swarm to Kubernetes (GKE and bare-metal kubeadm) with Terraform, Ansible, Helm and ArgoCD App-of-Apps; Prometheus, Grafana and Loki for observability.',
        'Replaced the OpenAI Embedding API with a self-hosted Qwen3-Embedding-4B service and built the RAG code-review pipeline it feeds, gated by an exit-code check in GitLab CI.',
        'Build and release engineering: Jenkins signed tags, GitLab CI with pytest and Docker-in-Docker, Harbor registry, gitleaks and Qodana quality gates.',
      ],
      vi: [
        'Thiết kế nền tảng chấm điểm phát âm đa thị trường (JLPT, TOPIK, HSKK, tiếng Anh): 4 dịch vụ FastAPI/Gunicorn với STT đa engine — Kotoba-Whisper, faster-whisper/CTranslate2, SenseVoice ONNX, ReazonSpeech — kèm cơ chế fallback tự động.',
        'Loại phương án H100 ~$2,475/tháng bằng số liệu chứ không bằng cảm tính: p95 1.86s dưới tải đồng thời, chỉ dùng ~8% một GPU CUDA phổ thông. Đồng thời chủ trì RCA khép lại chênh lệch latency ASR gấp 3 lần giữa hai môi trường.',
        'Di trú các dịch vụ ML production từ Docker Swarm sang Kubernetes (GKE và bare-metal kubeadm) với Terraform, Ansible, Helm và ArgoCD App-of-Apps; observability bằng Prometheus, Grafana và Loki.',
        'Thay thế OpenAI Embedding API bằng dịch vụ Qwen3-Embedding-4B tự host và xây pipeline review code RAG chạy trên đó, kiểm soát bằng exit-code gate trong GitLab CI.',
        'Kỹ thuật build và release: Jenkins signed tag, GitLab CI với pytest và Docker-in-Docker, registry Harbor, quality gate gitleaks và Qodana.',
      ],
    },
    stack: ['Terraform', 'Ansible', 'Kubernetes', 'ArgoCD', 'FastAPI', 'CTranslate2', 'Prometheus'],
  },
  {
    company: 'AMELA Technology',
    role: { en: 'AI Engineer', vi: 'AI Engineer' },
    period: { en: 'Nov 2024 — Jan 2025', vi: 'Nov 2024 — Jan 2025' },
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
    stack: ['PyTorch', 'OCR', 'RAG', 'OpenCV'],
  },
  {
    company: 'FPT Smart Cloud',
    role: { en: 'AI Engineer Intern', vi: 'Thực tập sinh AI Engineer' },
    period: { en: 'Mar 2023 — Nov 2024', vi: 'Mar 2023 — Nov 2024' },
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
    vi: 'Khoa học Máy tính và Thông tin · Mar 2019 — Jun 2025',
  },
};

/** `PORTFOLIO_DATA.certification` is `{ name, status }`; `name` is a plain
 *  string, not bilingual — ported into both locales per the "no en" fallback
 *  rule and flagged in the report. Per A5: `title` <- `name`, `detail` <-
 *  `status` (already bilingual, verbatim). */
export type Certification = { title: Localized<string>; detail: Localized<string> };

export const CERTIFICATION: Certification = {
  title: {
    en: 'AWS Certified Solutions Architect — Associate (SAA-C03)',
    vi: 'AWS Certified Solutions Architect — Associate (SAA-C03)',
  },
  detail: {
    en: 'In progress',
    vi: 'Đang theo học',
  },
};
