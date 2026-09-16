import type { Localized } from './locales';

/** `PORTFOLIO_DATA.expertise[i]` is `{ icon, title, description }` — there is no
 *  `items` list in the source data, so none is invented here. `icon` (a
 *  two-digit ordinal, "01".."04") becomes `key`; `description` becomes
 *  `summary`, matching the naming the rest of this module set uses. */
export type ExpertiseArea = {
  key: string;
  title: Localized<string>;
  summary: Localized<string>;
};

export const EXPERTISE: ExpertiseArea[] = [
  {
    key: '01',
    title: {
      en: 'Solution Architecture & Cost Engineering',
      vi: 'Kiến trúc giải pháp & Tối ưu chi phí',
    },
    summary: {
      en: 'System design for ML serving, benchmark-driven GPU sizing, and root-cause analysis — a measured p95 of 1.86s under concurrent load at ~8% GPU utilization proved a commodity CUDA GPU was enough where an H100 plan would have cost ~$2,475/mo.',
      vi: 'Thiết kế hệ thống cho ML serving, chọn GPU dựa trên benchmark và phân tích nguyên nhân gốc — p95 đo được 1.86s dưới tải đồng thời, chỉ chiếm ~8% công suất GPU, chứng minh chỉ cần GPU CUDA phổ thông, trong khi phương án H100 tốn ~$2,475/tháng.',
    },
  },
  {
    key: '02',
    title: {
      en: 'Cloud & Kubernetes Infrastructure',
      vi: 'Hạ tầng Cloud & Kubernetes',
    },
    summary: {
      en: 'End-to-end ownership: Terraform/Ansible provisioning, Docker, and Kubernetes on GKE, DigitalOcean, and bare-metal kubeadm — plus AWS EC2 deployment automation, ArgoCD GitOps, and Cloudflare Tunnel.',
      vi: 'Sở hữu toàn trình: provisioning Terraform/Ansible, Docker và Kubernetes trên GKE, DigitalOcean và bare-metal kubeadm — cùng tự động deploy AWS EC2, GitOps ArgoCD và Cloudflare Tunnel.',
    },
  },
  {
    key: '03',
    title: {
      en: 'ML Serving & MLOps',
      vi: 'ML Serving & MLOps',
    },
    summary: {
      en: 'Shipping ASR (faster-whisper/CTranslate2), TTS, pronunciation scoring (wav2vec2), and embedding (Qwen3) services with full CI/CT/CD pipelines, quality gates, and Prometheus/CloudWatch observability.',
      vi: 'Triển khai dịch vụ ASR (faster-whisper/CTranslate2), TTS, chấm phát âm (wav2vec2) và embedding (Qwen3) với pipeline CI/CT/CD đầy đủ, các cổng kiểm soát chất lượng và observability Prometheus/CloudWatch.',
    },
  },
  {
    key: '04',
    title: {
      en: 'Agentic RAG & LLM Application Architecture',
      vi: 'Agentic RAG & Kiến trúc ứng dụng LLM',
    },
    summary: {
      en: 'Multi-agent orchestration (Google ADK) with hybrid keyword/semantic retrieval, rule-based slot-filling, and grounding verification — so code owns every figure and the LLM only phrases it. Provider-agnostic serving across Gemini, Claude, and self-hosted vLLM/Ollama.',
      vi: 'Điều phối multi-agent (Google ADK) với truy xuất hybrid keyword/semantic, slot-filling theo luật và kiểm chứng grounding — code sở hữu mọi con số, LLM chỉ diễn đạt câu chữ. Phục vụ không phụ thuộc provider: Gemini, Claude và vLLM/Ollama tự host.',
    },
  },
];

/** `PORTFOLIO_DATA.focus`, verbatim. */
export const FOCUS: Localized<string>[] = [
  {
    en: 'Migrating remaining production ML services from Docker Swarm to GKE with Helm and ArgoCD App-of-Apps',
    vi: 'Di trú các dịch vụ ML production còn lại từ Docker Swarm sang GKE bằng Helm và ArgoCD App-of-Apps.',
  },
  {
    en: 'Hardening the internal Qwen3 embedding service and its RAG code-review pipeline',
    vi: 'Củng cố dịch vụ embedding Qwen3 nội bộ và pipeline review code dựa trên RAG.',
  },
  {
    en: 'Treating the home LAN like production — Ansible IaC for the Raspberry Pi, Slack ChatOps alerts, and GPG-encrypted config backups',
    vi: 'Vận hành LAN ở nhà như production — Ansible IaC cho Raspberry Pi, cảnh báo Slack ChatOps và backup cấu hình mã hóa GPG.',
  },
  {
    en: 'Designing agentic RAG systems where code owns orchestration and retrieval, and the LLM only phrases the answer',
    vi: 'Thiết kế hệ thống agentic RAG với code sở hữu điều phối và truy xuất, LLM chỉ diễn đạt câu trả lời.',
  },
  {
    en: 'Earning AWS Solutions Architect Associate (SAA-C03) to round out multi-cloud depth',
    vi: 'Hoàn thành chứng chỉ AWS Solutions Architect Associate (SAA-C03) để củng cố chiều sâu đa cloud.',
  },
];
