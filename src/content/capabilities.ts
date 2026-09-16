import type { Localized } from './locales';

/** `PORTFOLIO_DATA.skillGroups[i]` is `{ label, items }` — there is no `key`
 *  in the source. `label` is renamed to `title` to match this module set's
 *  naming; `key` is a stable slug derived from the English label (an internal
 *  identifier for list rendering, not user-visible content, so it is not a
 *  "no invented content" violation). */
export type SkillGroup = { key: string; title: Localized<string>; items: string[] };

/** `PORTFOLIO_DATA.skillGroups`, all six, verbatim. */
export const SKILL_GROUPS: SkillGroup[] = [
  {
    key: 'infrastructure-platform',
    title: { en: 'Infrastructure & Platform', vi: 'Hạ tầng & Nền tảng' },
    items: [
      'Terraform',
      'Ansible',
      'Kubernetes (GKE · kubeadm · Autopilot)',
      'ArgoCD',
      'Helm',
      'Kustomize',
      'Docker',
      'Harbor',
      'Cloudflare Tunnel',
      'Tailscale',
    ],
  },
  {
    key: 'cloud',
    title: { en: 'Cloud', vi: 'Cloud' },
    items: [
      'GCP (GKE · Vertex AI · Artifact Registry)',
      'AWS (EC2 · CloudWatch)',
      'DigitalOcean',
      'OCI',
      'Workload Identity',
      'Preemptible pools',
      'vast.ai',
    ],
  },
  {
    key: 'ml-speech',
    title: { en: 'ML & Speech', vi: 'ML & Xử lý tiếng nói' },
    items: [
      'faster-whisper / CTranslate2',
      'Kotoba-Whisper',
      'SenseVoice ONNX',
      'ReazonSpeech',
      'wav2vec2 CTC (GOP)',
      'LoRA / PEFT',
      'espeak-ng G2P',
      'Praat / parselmouth',
      'SudachiPy · MeCab · pykakasi',
    ],
  },
  {
    key: 'llm-agents',
    title: { en: 'LLM & Agents', vi: 'LLM & Agent' },
    items: [
      'LangChain / LangGraph',
      'Google ADK',
      'MCP',
      'A2A Protocol',
      'Gemini · Claude · GPT · Qwen',
      'vLLM · Ollama',
      'Qwen3 Embedding',
      'LanceDB · Milvus',
    ],
  },
  {
    key: 'backend-data',
    title: { en: 'Backend & Data', vi: 'Backend & Dữ liệu' },
    items: [
      'Python · FastAPI',
      'Java 17/21 · Spring WebFlux',
      'Scala 3',
      'Next.js',
      'Kafka',
      'Spark Streaming',
      'Delta Lake',
      'Elasticsearch',
      'Redis',
      'PostgreSQL',
    ],
  },
  {
    key: 'delivery-observability',
    title: { en: 'Delivery & Observability', vi: 'Delivery & Giám sát' },
    items: [
      'GitLab CI (pytest · DinD)',
      'GitHub Actions',
      'Jenkins',
      'Prometheus',
      'Grafana',
      'Loki',
      'gitleaks',
      'Qodana',
      'n8n',
    ],
  },
];

/** `PORTFOLIO_DATA.playbook[i]` is `{ title, description }` — there is no
 *  `step` in the source; it is the item's 1-based index, an internal
 *  identifier, not content. `description` is renamed to `body`. */
export type PlaybookStep = { step: string; title: Localized<string>; body: Localized<string> };

/** `PORTFOLIO_DATA.playbook`, all five, verbatim. */
export const PLAYBOOK: PlaybookStep[] = [
  {
    step: '1',
    title: {
      en: 'Decide with frameworks, not gut',
      vi: 'Quyết định theo framework, không cảm tính',
    },
    body: {
      en: 'Compare GPU and cloud options on price, data-center location, SLA, and VN-JP-KR latency together — never on raw price alone.',
      vi: 'So sánh phương án GPU và cloud trên giá, vị trí data center, SLA và độ trễ VN-JP-KR cùng lúc — không chỉ nhìn giá thuần.',
    },
  },
  {
    step: '2',
    title: { en: 'Cost-conscious by default', vi: 'Tối ưu chi phí mặc định' },
    body: {
      en: 'Size hardware to the measured workload (wav2vec2 ~315M in FP16 needs ~2GB VRAM) and settle CPU-vs-GPU trade-offs with a benchmark before provisioning anything.',
      vi: 'Chọn phần cứng theo workload đo được (wav2vec2 ~315M FP16 chỉ cần ~2GB VRAM) và giải quyết đánh đổi CPU-vs-GPU bằng benchmark trước khi provisioning.',
    },
  },
  {
    step: '3',
    title: { en: 'CLI-first, reproducible operations', vi: 'CLI-first, vận hành tái lập được' },
    body: {
      en: 'Automate provisioning and deploys with Terraform, Ansible, and GitOps so any environment is rebuildable from code.',
      vi: 'Tự động hóa provisioning và deploy bằng Terraform, Ansible và GitOps để mọi môi trường đều dựng lại được từ code.',
    },
  },
  {
    step: '4',
    title: {
      en: 'Ship through GitOps and quality gates',
      vi: 'Triển khai qua GitOps và cổng chất lượng',
    },
    body: {
      en: 'Deliver via ArgoCD App-of-Apps and CI exit-code gates that fail fast on corruption or regressions before they reach users.',
      vi: 'Giao hàng qua ArgoCD App-of-Apps và CI exit-code gate, fail nhanh khi có lỗi hỏng dữ liệu hoặc hồi quy trước khi tới người dùng.',
    },
  },
  {
    step: '5',
    title: { en: 'Instrument and degrade gracefully', vi: 'Gắn quan sát và suy giảm an toàn' },
    body: {
      en: 'Observe every service with kube-prometheus-stack and treat provider or GPU failure as normal, with predefined fallback paths.',
      vi: 'Quan sát mọi dịch vụ bằng kube-prometheus-stack, xem lỗi provider hay GPU là bình thường và luôn có đường fallback định sẵn.',
    },
  },
];
