/* ─────────────────────────────────────────────────────────────────────────────
 * One small drawn mark per number in the proof bar.
 *
 * The proof bar was the only band on the page with no picture in it at all —
 * four large numerals on an empty strip. These are line marks in the same hand
 * as site/tech-art.tsx: `currentColor`, no image bytes, correct in both themes
 * without a second file.
 *
 * Chosen BY KEY, from src/content/metrics.ts, with a fallback for a key this
 * file has not been taught. A mark that means nothing in particular is still a
 * mark; a build that fails because someone added a metric is not worth the
 * pedantry, and a blank gap where three neighbours have art looks like a bug.
 * ────────────────────────────────────────────────────────────────────────── */

const MARKS: Record<string, React.ReactNode> = {
  /* Years: a clock face. */
  yearsExperience: (
    <>
      <circle cx="20" cy="20" r="14" strokeWidth="2" />
      <path d="M20 12v9l6 4" strokeWidth="2" />
    </>
  ),
  /* Scoring services: a spoken waveform. */
  scoringServices: (
    <>
      <path d="M4 20h4M32 20h4" strokeWidth="2" opacity="0.5" />
      <path d="M11 13v14M16 8v24M21 15v10M26 10v20M31 17v6" strokeWidth="2.5" />
    </>
  ),
  /* Cloud platforms: a cloud over two racks. */
  cloudPlatforms: (
    <>
      <path d="M11 17a6 6 0 0 1 11.6-2.2A5 5 0 1 1 25 24H12a4 4 0 0 1-1-7z" strokeWidth="2" />
      <rect x="9" y="28" width="10" height="6" rx="2" strokeWidth="2" opacity="0.55" />
      <rect x="22" y="28" width="10" height="6" rx="2" strokeWidth="2" opacity="0.55" />
    </>
  ),
  /* Published models: a small graph with a highlighted output node. */
  hfModels: (
    <>
      <path d="M11 11 25 20 11 29M25 20h5" strokeWidth="2" opacity="0.55" />
      <circle cx="11" cy="11" r="4" strokeWidth="2" />
      <circle cx="11" cy="29" r="4" strokeWidth="2" />
      <circle cx="30" cy="20" r="4.5" strokeWidth="2" fill="currentColor" />
    </>
  ),
};

const FALLBACK = (
  <>
    <rect x="8" y="8" width="24" height="24" rx="6" strokeWidth="2" />
    <path d="M15 20h10" strokeWidth="2" opacity="0.6" />
  </>
);

export function MetricGlyph({ metricKey }: { metricKey: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className="metric-glyph">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {MARKS[metricKey] ?? FALLBACK}
      </g>
    </svg>
  );
}
