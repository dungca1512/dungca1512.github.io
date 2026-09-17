/* ─────────────────────────────────────────────────────────────────────────────
 * One glyph per kind of work, for the bullets in the experience timeline.
 *
 * Those bullets used to open with an identical 6px dot — the same mark whether
 * the line was about a Kubernetes migration, a GPU bill or a chatbot. A reader
 * scanning the column got no signal at all from the left edge, which is the
 * one place a scanning eye actually lands, and the feedback that came back was
 * exactly that: "thay dấu chấm kia thành icon gì đó ứng với từng nội dung ấy".
 *
 * These are drawn rather than imported, for the same reason `tech-art` is: an
 * icon package would be a dependency and a slice of the page budget for nine
 * shapes at 16px. Everything is `currentColor` on a 24-unit grid, so the glyph
 * follows whatever ink its line is set in and flips with the theme for free.
 *
 * The wrapper is `aria-hidden`. The bullet's own text says what the line is;
 * a screen reader announcing "cluster" before it would be noise, and there is
 * no information in the glyph that is not already in the sentence.
 * ────────────────────────────────────────────────────────────────────────── */

export type HighlightGlyph =
  /** Speech, audio, anything with a signal in it. */
  | 'waveform'
  /** A measurement that settled an argument — benchmarks, latency, cost. */
  | 'gauge'
  /** Orchestration: nodes under a control plane. */
  | 'cluster'
  /** Embeddings and retrieval — points in a space. */
  | 'vector'
  /** Build and release: stages running left to right. */
  | 'pipeline'
  /** Reading something in: OCR, ingestion, scanning. */
  | 'scan'
  /** Conversation: assistants, chatbots, call transcripts. */
  | 'chat'
  /** Guardrails, policy, anything that refuses bad input. */
  | 'shield'
  /** Analytics over a body of data. */
  | 'chart';

/* Each path is drawn for a 24×24 box with a 2-unit stroke, so they share a
   weight and sit together without one looking bolder than its neighbours. */
const PATHS: Record<HighlightGlyph, React.ReactNode> = {
  waveform: (
    <>
      <path d="M3 12h2M19 12h2" />
      <path d="M7 8v8M11 4v16M15 9v6" />
    </>
  ),
  gauge: (
    <>
      <path d="M4 18a8 8 0 1 1 16 0" />
      <path d="M12 18 16 11" />
    </>
  ),
  cluster: (
    <>
      <rect x="9" y="3" width="6" height="5" rx="1.5" />
      <rect x="2" y="16" width="6" height="5" rx="1.5" />
      <rect x="16" y="16" width="6" height="5" rx="1.5" />
      <path d="M12 8v4M12 12H5v4M12 12h7v4" />
    </>
  ),
  vector: (
    <>
      <circle cx="6" cy="17" r="2" />
      <circle cx="12" cy="7" r="2" />
      <circle cx="18" cy="15" r="2" />
      <path d="M7.6 15.6 10.6 8.6M13.7 8.2l3 5.2" />
    </>
  ),
  pipeline: (
    <>
      <path d="M3 17h4l3-10h4l3 5h4" />
      <path d="M18 9l3 3-3 3" />
    </>
  ),
  scan: (
    <>
      <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
      <path d="M7 12h10" />
    </>
  ),
  chat: (
    <>
      <path d="M20 13a5 5 0 0 1-5 5H9l-5 3v-4a5 5 0 0 1-1-3V9a5 5 0 0 1 5-5h7a5 5 0 0 1 5 5z" />
      <path d="M8 10h8M8 13h5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 20 6v6c0 4.2-3.1 7.6-8 9-4.9-1.4-8-4.8-8-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  chart: (
    <>
      <path d="M4 4v16h16" />
      <path d="M8 16V11M12 16V7M16 16v-3" />
    </>
  ),
};

export function HighlightIcon({ glyph, className }: { glyph: HighlightGlyph; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[glyph]}
    </svg>
  );
}
