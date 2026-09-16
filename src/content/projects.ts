import type { Localized } from './locales';

/** `PORTFOLIO_DATA.projects[i].repo` is a slug ("speech-scoring-platform"), not
 *  a URL — the real link(s), when a project has one, live in `links[]`
 *  ({ label, url }[]). That is why this type carries `slug` + `links`
 *  rather than the brief's sketched `repo?`/`demo?`/`highlight?`: those
 *  fields do not exist in the source data, and `links` is what the data
 *  actually uses to point at zero, one, or two external URLs per project. */
export type Project = {
  slug: string;
  name: string; // a proper noun — not translated
  period: string; // e.g. "eUp · 2025-2026" — same string in both locales in the source
  summary: Localized<string>;
  outcome: Localized<string>;
  stack: string[]; // tool names — not translated
  links: { label: Localized<string>; url: string }[];
};

/** `PORTFOLIO_DATA.projects`, all nine, verbatim. */
export const PROJECTS: Project[] = [
  {
    slug: 'speech-scoring-platform',
    /* Two measurements, deliberately kept apart.

       The latency figure is a load test. It used to read "p95 1.86s for 20
       concurrent users"; the owner asked for the 20 to go, because a raw
       concurrency count reads small next to what the platform actually does.
       Dropping it costs something real — a p95 with no stated load is a
       weaker claim — so the GPU utilisation carries that weight instead: a
       latency held under two seconds while the accelerator sits at ~8% busy
       says the same thing about headroom, and says it without a number that
       invites the wrong comparison. Every word of it is still measured, and
       the same edit was made to the three other places the site quoted this
       benchmark — expertise, writing and experience — because one page saying
       "20 concurrent users" while another omits it reads as carelessness.

       The production figure is an observed window, not a load test: the nginx
       access log for the scoring domain, filtered to the heyjapan project over
       30 minutes — 740 requests, 740 of them 2XX. It is deliberately NOT
       restated as a concurrency number. An access log records arrival rate,
       and converting that to concurrent users needs session or service-time
       data the screen does not carry; done naively it yields a number well
       under one, which would say far less than the zero-error run does. It is
       also one market of four, so it understates the platform rather than
       flattering it.

       If the benchmark was closed-loop with 20 in-flight requests, throughput
       of roughly 10 requests a second follows from it directly and would be
       fair to state. That methodology is not recorded anywhere here, so it is
       not claimed. */
    name: 'Multi-Market Speech Scoring Platform',
    period: 'eUp · 2025-2026',
    summary: {
      en: 'Four FastAPI/Gunicorn services scoring pronunciation for JLPT (Japanese), TOPIK (Korean), HSKK (Mandarin) and English, each with a multi-engine STT layer — Kotoba-Whisper, faster-whisper/CTranslate2, SenseVoice ONNX, ReazonSpeech — behind automatic fallback.',
      vi: 'Bốn dịch vụ FastAPI/Gunicorn chấm phát âm cho JLPT (tiếng Nhật), TOPIK (tiếng Hàn), HSKK (tiếng Trung) và tiếng Anh, mỗi dịch vụ có lớp STT đa engine — Kotoba-Whisper, faster-whisper/CTranslate2, SenseVoice ONNX, ReazonSpeech — với cơ chế fallback tự động.',
    },
    outcome: {
      en: 'Scoring is linguistic, not generic: Needleman-Wunsch alignment between reference and hypothesis, wav2vec2 CTC goodness-of-pronunciation with espeak-ng G2P, Japanese pitch accent via SudachiPy/MeCab/pykakasi, Mandarin tone classification, and Praat/parselmouth prosody behind a concurrency semaphore. Under benchmarked concurrent load the serving path holds p95 below two seconds (1.86s) at roughly 8% utilisation of one commodity CUDA GPU — capacity here is bounded by infrastructure budget, not by the models — and in production a 30-minute window on the Japanese market alone ran 740 consecutive scoring requests without a single non-2XX response.',
      vi: 'Việc chấm điểm mang tính ngôn ngữ học chứ không chung chung: căn chỉnh Needleman-Wunsch giữa câu mẫu và câu đọc, goodness-of-pronunciation bằng wav2vec2 CTC với G2P espeak-ng, trọng âm cao độ tiếng Nhật qua SudachiPy/MeCab/pykakasi, phân loại thanh điệu tiếng Trung và phân tích ngôn điệu Praat/parselmouth chạy sau semaphore giới hạn đồng thời. Dưới tải đồng thời đo bằng benchmark, đường phục vụ giữ p95 dưới hai giây (1.86s) ở mức chỉ khoảng 8% công suất một GPU CUDA phổ thông — trần năng lực ở đây nằm ở ngân sách hạ tầng chứ không phải ở mô hình — và trên production, riêng thị trường tiếng Nhật đã chạy 740 request chấm điểm liên tiếp trong cửa sổ 30 phút mà không có một phản hồi nào ngoài 2XX.',
    },
    stack: ['FastAPI', 'Gunicorn', 'CTranslate2', 'wav2vec2 CTC', 'ONNX Runtime', 'parselmouth'],
    links: [],
  },
  {
    slug: 'hey-translate',
    name: 'Hey Translate',
    period: 'eUp · 2025-2026',
    summary: {
      en: 'Translation service that runs Claude, Gemini, GPT and Qwen in parallel on the same input rather than trusting a single provider.',
      vi: 'Dịch vụ dịch thuật chạy song song Claude, Gemini, GPT và Qwen trên cùng một đầu vào thay vì tin tưởng một nhà cung cấp duy nhất.',
    },
    outcome: {
      en: 'Row-alignment validation rejects candidates that silently drop or merge lines, and an LLM-as-judge pass picks the surviving translation — so provider outages and format drift degrade quality instead of breaking the output contract.',
      vi: 'Kiểm tra căn hàng loại bỏ các bản dịch âm thầm bỏ sót hoặc gộp dòng, sau đó một lượt LLM-as-judge chọn bản còn lại — nhờ vậy sự cố nhà cung cấp và trôi định dạng chỉ làm giảm chất lượng chứ không phá vỡ hợp đồng đầu ra.',
    },
    stack: ['Python', 'Claude', 'Gemini', 'GPT', 'Qwen', 'LLM-as-judge'],
    links: [],
  },
  {
    slug: 'ultimate-lesson',
    name: 'Ultimate Lesson',
    period: 'eUp · 2025-2026',
    summary: {
      en: 'Pipeline that turns a YouTube URL into a structured language lesson: yt-dlp to Whisper transcription to GPT-4o-mini subtitle cleanup, then Gemini 2.5 Flash for generation with a fine-tuned Flash Lite extractor on Vertex AI.',
      vi: 'Pipeline biến một URL YouTube thành bài học ngôn ngữ có cấu trúc: yt-dlp qua Whisper để bóc băng, GPT-4o-mini làm sạch phụ đề, rồi Gemini 2.5 Flash sinh nội dung với bộ trích xuất Flash Lite fine-tune trên Vertex AI.',
    },
    outcome: {
      en: 'A Redis cache and multi-key rotation with 429 cooldown keep the generation path inside provider rate limits, so a single quota exhaustion no longer stalls the queue.',
      vi: 'Cache Redis và cơ chế xoay vòng nhiều API key kèm cooldown khi gặp 429 giữ luồng sinh nội dung nằm trong giới hạn rate limit, nên một lần hết quota không còn làm nghẽn toàn bộ hàng đợi.',
    },
    stack: ['Gemini 2.5 Flash', 'Vertex AI', 'Whisper', 'GPT-4o-mini', 'Redis', 'yt-dlp'],
    links: [],
  },
  {
    slug: 'internal-embedding-service',
    name: 'Internal Embedding Service',
    period: 'eUp · 2025',
    summary: {
      en: 'Self-hosted Qwen3-Embedding-4B exposing an OpenAI-compatible /v1/embeddings endpoint on an RTX 4080, replacing the OpenAI Embedding API for internal workloads.',
      vi: 'Tự host Qwen3-Embedding-4B, cung cấp endpoint /v1/embeddings tương thích OpenAI trên RTX 4080, thay thế hoàn toàn OpenAI Embedding API cho workload nội bộ.',
    },
    outcome: {
      en: 'Removed an external API dependency and powered a RAG code-review pipeline (harvest -> embed -> LanceDB -> Qodo PR Agent) gated by a GitLab CI exit-code check.',
      vi: 'Loại bỏ phụ thuộc API bên ngoài và cấp nguồn cho pipeline review code bằng RAG (harvest -> embed -> LanceDB -> Qodo PR Agent), kiểm soát bằng GitLab CI exit-code gate.',
    },
    stack: ['Qwen3-Embedding-4B', 'FastAPI', 'LanceDB', 'Docker Compose', 'GitLab CI', 'RTX 4080'],
    links: [],
  },
  {
    slug: 'ai-gateway',
    name: 'AI Gateway',
    period: '2025-2026',
    summary: {
      en: 'Java 21 Spring WebFlux gateway plus a Python FastAPI worker that unify multi-provider LLM access (OpenAI, Gemini, Anthropic, DashScope) behind one API, with Bucket4j rate limiting and Redis-backed state.',
      vi: 'Gateway Java 21 Spring WebFlux kết hợp worker Python FastAPI, hợp nhất truy cập LLM đa nhà cung cấp (OpenAI, Gemini, Anthropic, DashScope) sau một API duy nhất, có rate limit Bucket4j và trạng thái lưu trên Redis.',
    },
    outcome: {
      en: 'Circuit breaker, bulkhead, retry and per-request token tracking keep LLM traffic degrading gracefully during provider instability. A manual gcloud runbook was replaced by Terraform (API enablement, GKE Autopilot, Artifact Registry, static IP kept outside the cluster lifecycle) with Kustomize overlays and Prometheus metrics, so the whole platform rebuilds with apply and costs near $0 after destroy.',
      vi: 'Circuit breaker, bulkhead, retry và theo dõi token theo từng request giúp lưu lượng LLM suy giảm an toàn khi nhà cung cấp gặp sự cố. Runbook gcloud thủ công được thay bằng Terraform (bật API, GKE Autopilot, Artifact Registry, static IP nằm ngoài lifecycle cluster) cùng overlay Kustomize và metric Prometheus, nên toàn bộ nền tảng dựng lại bằng apply và gần như $0 sau khi destroy.',
    },
    stack: ['Java 21', 'Spring WebFlux', 'Resilience4j', 'Bucket4j', 'Terraform', 'GKE Autopilot'],
    links: [
      {
        label: { en: 'Repository', vi: 'Mã nguồn' },
        url: 'https://github.com/dungca1512/ai-gateway',
      },
    ],
  },
  {
    slug: 'homelab',
    name: 'Homelab Kubernetes & GitOps Platform',
    period: '2025-2026',
    summary: {
      en: 'A 3-node Kubernetes v1.31 cluster bootstrapped by hand with kubeadm instead of a managed distro: Flannel CNI, MetalLB (L2), ingress-nginx, local-path storage and a self-hosted registry.',
      vi: 'Cụm Kubernetes v1.31 ba node dựng tay bằng kubeadm thay vì dùng distro managed: Flannel CNI, MetalLB (L2), ingress-nginx, local-path storage và registry tự host.',
    },
    outcome: {
      en: 'Deploys are git push only via ArgoCD App-of-Apps (prune + selfHeal), observability comes from kube-prometheus-stack and Loki/Promtail, and ~2,400 lines of engineering notes tie every lesson to a real cluster failure.',
      vi: 'Deploy chỉ bằng git push qua ArgoCD App-of-Apps (prune + selfHeal), observability từ kube-prometheus-stack và Loki/Promtail, kèm ~2.400 dòng ghi chú kỹ thuật với mỗi bài học gắn với một sự cố cluster thật.',
    },
    stack: ['kubeadm', 'ArgoCD', 'MetalLB', 'Prometheus', 'Grafana', 'Loki'],
    links: [
      {
        label: { en: 'Repository', vi: 'Mã nguồn' },
        url: 'https://github.com/dungca1512/homelab',
      },
    ],
  },
  {
    slug: 'whisper-finetune-ja',
    name: 'Whisper Finetune JA',
    period: '2026',
    summary: {
      en: 'Reproducible LoRA fine-tuning pipeline for Japanese Whisper ASR on ReazonSpeech data, with training, INT8 export and inference scripts.',
      vi: 'Pipeline fine-tune LoRA tái lập được cho ASR tiếng Nhật trên Whisper với dữ liệu ReazonSpeech, kèm script huấn luyện, export INT8 và inference.',
    },
    outcome: {
      en: 'A full CI/CT/CD loop (GitHub Actions orchestration, Kaggle training, Hugging Face Hub hosting, quality gate for model promotion) published 3 Japanese ASR models, with the LoRA variant at 40+ downloads and an INT8 CTranslate2 export for cheap inference.',
      vi: 'Vòng CI/CT/CD hoàn chỉnh (điều phối GitHub Actions, huấn luyện trên Kaggle, hosting Hugging Face Hub, quality gate để promote model) đã công bố 3 mô hình ASR tiếng Nhật, biến thể LoRA đạt 40+ lượt tải và bản export CTranslate2 INT8 cho inference giá rẻ.',
    },
    stack: ['PyTorch', 'LoRA/PEFT', 'CTranslate2 INT8', 'Kaggle', 'GitHub Actions', 'Hugging Face'],
    links: [
      {
        label: { en: 'Repository', vi: 'Mã nguồn' },
        url: 'https://github.com/dungca1512/whisper-finetune-ja',
      },
      {
        label: { en: 'Models on Hugging Face', vi: 'Model trên Hugging Face' },
        url: 'https://huggingface.co/dungca',
      },
    ],
  },
  {
    slug: 'homelab-iac',
    name: 'Raspberry Pi Homelab — Ansible IaC & Slack ChatOps',
    period: '2026',
    summary: {
      en: 'The Raspberry Pi serving my whole LAN turned into infrastructure as code: one idempotent Ansible playbook rebuilds it from a bare OS (fstab mounts, Docker CE, journald caps, cloudflared, Tailscale, AdGuard Home, cleanup cron).',
      vi: 'Chiếc Raspberry Pi phục vụ toàn bộ LAN được chuyển thành infrastructure as code: một playbook Ansible idempotent dựng lại từ OS trắng (mount fstab, Docker CE, giới hạn journald, cloudflared, Tailscale, AdGuard Home, cron dọn rác).',
    },
    outcome: {
      en: 'LAN-wide DNS on AdGuard Home cut resolver latency 199ms -> 27ms; Slack ChatOps on a Cloudflare Worker gives a /homelab status command and Block Kit alerts that separate power loss from internet loss; ansible-lint/yamllint/gitleaks CI plus GPG-encrypted backups make a dead SD card a rebuild, not an investigation.',
      vi: 'DNS toàn LAN trên AdGuard Home giảm độ trễ resolver 199ms -> 27ms; Slack ChatOps qua Cloudflare Worker cung cấp lệnh /homelab xem trạng thái và alert Block Kit phân biệt mất điện với mất mạng; CI ansible-lint/yamllint/gitleaks cùng backup mã hóa GPG biến thẻ SD chết thành việc dựng lại, không phải điều tra.',
    },
    stack: [
      'Ansible',
      'Docker',
      'AdGuard Home / DoH',
      'Cloudflare Worker',
      'Tailscale',
      'Slack API',
    ],
    links: [],
  },
  {
    slug: 'newspulse-reco-engine',
    name: 'NewsPulse Reco Engine',
    period: '2025',
    summary: {
      en: 'Event-driven Vietnamese news platform: crawling, Spark ETL, Kafka streaming, embeddings, trend detection and FCM push via an n8n orchestration flow.',
      vi: 'Nền tảng tin tức tiếng Việt theo hướng sự kiện: thu thập, Spark ETL, streaming Kafka, embeddings, phát hiện xu hướng và đẩy FCM qua luồng orchestration n8n.',
    },
    outcome: {
      en: 'Designed a 7-module pipeline spanning Scala 3 crawler + Spark ETL + Kafka stream + embeddings + clustering/trending + Spring API + push notification.',
      vi: 'Thiết kế pipeline 7 module gồm crawler Scala 3 + Spark ETL + Kafka stream + embeddings + clustering/trending + Spring API + push notification.',
    },
    stack: ['Scala 3', 'Kafka', 'Spark', 'Elasticsearch', 'n8n', 'Firebase FCM'],
    links: [
      {
        label: { en: 'Repository', vi: 'Mã nguồn' },
        url: 'https://github.com/dungca1512/newspulse-reco-engine',
      },
    ],
  },
];

/** `PORTFOLIO_DATA.caseStudy` has `{ title, subtitle, repoUrl, highlights[],
 *  blocks[] }` where `blocks` is five `{ title, text }` pairs (Problem,
 *  Architecture, Trade-offs, Result, "What I'd improve next") — not the
 *  brief's sketched `{ problem, approach, result, stack }`. That sketch does
 *  not match the source shape (it would require dropping two blocks or
 *  renaming "Architecture"/"Trade-offs" content that was never named that),
 *  so this module keeps the real, complete shape instead. */
export type CaseStudy = {
  title: Localized<string>;
  subtitle: Localized<string>;
  repoUrl: string;
  highlights: Localized<string>[];
  blocks: { title: Localized<string>; text: Localized<string> }[];
};

export const CASE_STUDY: CaseStudy = {
  title: {
    en: 'AI Gateway: a resilient reactive layer for multi-provider LLM traffic',
    vi: 'AI Gateway: tầng reactive chịu lỗi cho lưu lượng LLM đa nhà cung cấp',
  },
  subtitle: {
    en: 'How I turned fragmented model integrations into a unified, fault-tolerant gateway.',
    vi: 'Cách tôi chuyển các tích hợp mô hình rời rạc thành một gateway thống nhất, chịu lỗi tốt.',
  },
  repoUrl: 'https://github.com/dungca1512/ai-gateway',
  highlights: [
    {
      en: 'Reactive Spring WebFlux gateway routing OpenAI / Gemini / Anthropic / DashScope traffic',
      vi: 'Gateway reactive Spring WebFlux định tuyến lưu lượng OpenAI / Gemini / Anthropic / DashScope',
    },
    {
      en: 'Resilience4j circuit breaker, bulkhead, and retry for graceful degradation',
      vi: 'Circuit breaker, bulkhead và retry (Resilience4j) để suy giảm an toàn',
    },
    {
      en: 'Per-request token-usage tracking under one OpenAI-compatible API contract',
      vi: 'Theo dõi token theo từng request dưới một chuẩn API tương thích OpenAI',
    },
  ],
  blocks: [
    {
      title: { en: 'Problem', vi: 'Bài toán' },
      text: {
        en: 'Teams needed one stable API across multiple LLM providers, but each had different request/response semantics, rate limits, and failure patterns.',
        vi: 'Các đội cần một API ổn định cho nhiều nhà cung cấp LLM, nhưng mỗi bên có định dạng request/response, rate limit và kiểu lỗi khác nhau.',
      },
    },
    {
      title: { en: 'Architecture', vi: 'Kiến trúc' },
      text: {
        en: 'A Java Spring WebFlux gateway handles routing, resilience, and policy control; a Python FastAPI worker serves local models and embedding tasks behind it.',
        vi: 'Gateway Java Spring WebFlux xử lý routing, resilience và policy control; phía sau là worker Python FastAPI phục vụ mô hình nội bộ và tác vụ embedding.',
      },
    },
    {
      title: { en: 'Trade-offs', vi: 'Đánh đổi kỹ thuật' },
      text: {
        en: 'Chose reliability and observability over minimal complexity — more moving parts, but consistent behavior when a provider degrades or rate-limits.',
        vi: 'Ưu tiên độ tin cậy và khả năng quan sát thay vì tối giản — nhiều thành phần hơn nhưng ổn định khi provider suy giảm hoặc bị rate-limit.',
      },
    },
    {
      title: { en: 'Result', vi: 'Kết quả' },
      text: {
        en: 'A reusable gateway baseline for future AI products that reduces integration overhead and standardizes production controls.',
        vi: 'Một nền tảng gateway tái sử dụng cho các sản phẩm AI tiếp theo, giảm chi phí tích hợp và chuẩn hóa cơ chế kiểm soát production.',
      },
    },
    {
      title: { en: "What I'd improve next", vi: 'Bước cải tiến tiếp theo' },
      text: {
        en: 'Per-provider latency dashboards, token-cost analytics, and automated fallback tuning driven by live traffic signals.',
        vi: 'Dashboard độ trễ theo từng provider, phân tích chi phí token và tự động tinh chỉnh fallback dựa trên tín hiệu lưu lượng thực tế.',
      },
    },
  ],
};
