import type { Localized } from './locales';

/* The API calls the hero's code window types out (components/motion/
 * code-window.tsx). Four of them, one per service the lead paragraph
 * claims: speech recognition, pronunciation and tone scoring, embeddings,
 * and the agentic RAG layer on top. They are ILLUSTRATIVE — the shape of a
 * request and its answer, with plausible latencies — not a transcript of a
 * live endpoint, which is why no host or key appears anywhere in them.
 *
 * Line lengths are kept under 44 characters on purpose: the window is
 * `pre-wrap`, and a line that wraps on a phone changes the card's height
 * mid-animation. Measured at 13.4px monospace, 44 characters is 345px,
 * which fits the narrowest column the hero renders (a 360px phone minus
 * the gutters and the card's own padding). The tab label is bilingual;
 * the JSON is not, because it is JSON. */
export type Snippet = {
  tab: Localized<string>;
  request: string[];
  /** Printed after the status line's dash. A string, not a number, because
   *  one of them reads better as "1.4 s" than as "1400 ms". */
  latency: string;
  /** How long the window waits between the last typed character and the
   *  first streamed one, in milliseconds. Separate from `latency` above:
   *  the label is what the reader is told, the wait is what they feel, and
   *  1.4 seconds of a blinking cursor is longer than anyone wants to watch. */
  waitMs: number;
  response: string[];
};

export const SNIPPETS: Snippet[] = [
  {
    tab: { en: 'Speech · ASR', vi: 'Nhận dạng giọng nói' },
    request: [
      'POST /v1/asr',
      '{',
      '  "model": "asr-vi-conformer",',
      '  "audio": "lesson_12.wav",',
      '  "lang": "vi"',
      '}',
    ],
    latency: '142 ms',
    waitMs: 620,
    response: ['{ "text": "Xin chào, tôi là Dũng",', '  "confidence": 0.97 }'],
  },
  {
    tab: { en: 'Pronunciation', vi: 'Chấm phát âm' },
    request: [
      'POST /v1/pronunciation/score',
      '{',
      '  "model": "pron-tone-v2",',
      '  "audio": "ma_tone.wav",',
      '  "reference": "mà"',
      '}',
    ],
    latency: '88 ms',
    waitMs: 480,
    response: ['{ "score": 92, "tone": "huyền",', '  "phonemes": ["m", "a"] }'],
  },
  {
    tab: { en: 'Embeddings', vi: 'Embedding' },
    request: [
      'POST /v1/embeddings',
      '{',
      '  "model": "embed-multilingual",',
      '  "input": ["hợp đồng thuê nhà"]',
      '}',
    ],
    latency: '19 ms',
    waitMs: 380,
    response: ['{ "dims": 768, "device": "cpu",', '  "vectors": [[0.021, -0.117, …]] }'],
  },
  {
    tab: { en: 'Agentic RAG', vi: 'Agentic RAG' },
    request: [
      'POST /v1/agents/rag',
      '{',
      '  "model": "qwen-14b-awq",',
      '  "query": "SLA của dịch vụ ASR?",',
      '  "top_k": 5',
      '}',
    ],
    latency: '1.4 s',
    waitMs: 900,
    response: ['{ "answer": "99.9% theo tháng…",', '  "sources": 3, "tokens": 412 }'],
  },
];
