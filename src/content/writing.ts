import type { Localized } from './locales';

/** `PORTFOLIO_DATA.writing[i]` is `{ year, title, summary, tags, url }`. The
 *  brief sketched `{ title, blurb, href, date }`; `date` <- `year` (the
 *  source only carries a year, e.g. "2026", never a full date), `blurb` <-
 *  `summary`, `href` <- `url` — renames only, no reworded text. `tags` is
 *  kept alongside (it exists in the source and nothing in the brief said to
 *  drop it). */
export type Article = {
  title: Localized<string>;
  blurb: Localized<string>;
  /** The repository this note is *about* — NOT a link to the note itself.
   *  None of these six is a published article: there is nowhere to read
   *  them. The old `data.js` pointed all five at `github.com/dungca1512`,
   *  the bare profile, and the first port of this file narrowed that to the
   *  specific repo where one existed. Both were still a link that looked
   *  like an article and was not one — a row titled "Vì sao tôi không để
   *  agent tự điều phối nữa" that opened a README.
   *
   *  So the field is named `repo`, the row is never itself a link, and the
   *  component renders an explicit, separately-labelled "Mã nguồn" link
   *  underneath for the three entries that have one. Whoever clicks now
   *  knows they are going to code before they click. Give an entry a real
   *  published URL and it wants a new `href` field beside this one, not a
   *  reuse of it. */
  repo?: string;
  date: string;
  tags: string[];
};

/** `PORTFOLIO_DATA.writing`, all six, verbatim. */
export const WRITING: Article[] = [
  {
    date: '2026',
    title: {
      en: 'Why I stopped letting the agent orchestrate itself',
      vi: 'Vì sao tôi không để agent tự điều phối nữa',
    },
    blurb: {
      en: 'A hybrid pattern for agentic RAG: the framework owns the runtime, code owns orchestration and every number, and the LLM is restricted to phrasing — with grounding verification as the enforcement layer.',
      vi: 'Mẫu kiến trúc lai cho agentic RAG: framework sở hữu runtime, code sở hữu điều phối và mọi con số, LLM chỉ được diễn đạt câu chữ — với kiểm chứng grounding làm lớp cưỡng chế.',
    },
    tags: ['Agentic RAG', 'Google ADK', 'Anti-hallucination'],
    repo: 'https://github.com/dungca1512/research-agent',
  },
  {
    date: '2026',
    title: {
      en: 'Provider-agnostic LLM serving: cloud API or local vLLM behind one env var',
      vi: 'Phục vụ LLM không phụ thuộc provider: cloud API hay vLLM local chỉ đổi một biến môi trường',
    },
    blurb: {
      en: 'Designing the LLM layer as an interface so a CPU-only VM ships on a cloud API today and swaps to on-premise vLLM later without touching application code.',
      vi: 'Thiết kế tầng LLM như một interface để máy chủ CPU-only hôm nay chạy bằng cloud API và sau này chuyển sang vLLM on-premise mà không sửa code ứng dụng.',
    },
    tags: ['LLM Infra', 'vLLM', 'Portability'],
  },
  {
    date: '2026',
    title: {
      en: 'GPU Cost Engineering: let the benchmark pick the hardware',
      vi: 'Tối ưu chi phí GPU: để benchmark chọn phần cứng',
    },
    blurb: {
      en: 'Measuring before buying: p95 1.86s under concurrent load on ~8% of a commodity GPU, why the H100 line item (~$2,475/mo) was never justified, and how CPU-only serving died on a ~1 req/s throughput wall.',
      vi: 'Đo trước khi mua: p95 1.86s dưới tải đồng thời, chỉ dùng ~8% một GPU phổ thông, vì sao khoản H100 (~$2,475/tháng) không bao giờ hợp lý, và vì sao CPU-only chết ở trần throughput ~1 req/s.',
    },
    tags: ['Cost Engineering', 'GPU', 'Benchmarking'],
  },
  {
    date: '2026',
    title: {
      en: 'Home infrastructure deserves production discipline',
      vi: 'Hạ tầng ở nhà cũng đáng được đối xử như production',
    },
    blurb: {
      en: 'Rewriting a hand-configured Raspberry Pi as one idempotent Ansible playbook: DNS latency 199ms -> 27ms, Slack ChatOps for status and outage alerts, lint/secret-scan CI gates, and GPG-encrypted backups with a recovery runbook.',
      vi: 'Viết lại chiếc Raspberry Pi cấu hình tay thành một playbook Ansible idempotent: độ trễ DNS 199ms -> 27ms, Slack ChatOps để xem trạng thái và cảnh báo sự cố, CI lint/quét secret và backup mã hóa GPG kèm runbook phục hồi.',
    },
    tags: ['Ansible', 'IaC', 'ChatOps'],
  },
  {
    date: '2025',
    title: {
      en: 'Docker Swarm to GKE: migrating production ML services',
      vi: 'Từ Docker Swarm sang GKE: di trú dịch vụ ML production',
    },
    blurb: {
      en: 'Notes on moving live ML workloads to Kubernetes with Helm, ArgoCD App-of-Apps, and a bare-metal kubeadm homelab for testing.',
      vi: 'Ghi chú về việc đưa workload ML đang chạy lên Kubernetes với Helm, ArgoCD App-of-Apps và homelab kubeadm bare-metal để thử nghiệm.',
    },
    tags: ['Kubernetes', 'GKE', 'GitOps'],
    repo: 'https://github.com/dungca1512/homelab',
  },
  {
    date: '2025',
    title: {
      en: 'AI Gateway: reactive resilience for LLM traffic',
      vi: 'AI Gateway: resilience reactive cho lưu lượng LLM',
    },
    blurb: {
      en: 'A practical breakdown of provider routing, Resilience4j controls, and a unified API contract for multi-provider LLM products.',
      vi: 'Phân tích thực tế về định tuyến provider, các cơ chế Resilience4j và chuẩn API thống nhất cho sản phẩm LLM đa nhà cung cấp.',
    },
    tags: ['WebFlux', 'Resilience4j', 'LLM Infra'],
    repo: 'https://github.com/dungca1512/ai-gateway',
  },
];
