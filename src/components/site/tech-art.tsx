import { cn } from '@/lib/cn';

/* ─────────────────────────────────────────────────────────────────────────────
 * Line art drawn in SVG rather than generated as a raster file.
 *
 * The seven images under public/images/illustrations are the expensive kind:
 * each one is a Gemini generation, three encoded formats, and a slice of the
 * 40KB-per-file budget. There are nine project cards and four metrics, and
 * giving each of them a generated picture would be twenty-six more files for
 * art that is a background texture, not a subject.
 *
 * So this is the reference portfolio's own answer, ported: the small art is
 * DRAWN, in `currentColor`, from the token layer. It costs no image bytes and
 * nothing for check:budget to weigh, it cannot go stale against the palette,
 * and it is correct in dark mode for free — `currentColor` follows the accent
 * class, and the accent is a token that already flips.
 *
 * Every shape here is decoration. The wrapper is `aria-hidden`: each card's
 * heading and summary already say what the card is, and a screen reader
 * reading "diagram" before every one of nine projects is noise.
 * ────────────────────────────────────────────────────────────────────────── */

export type ArtAccent = 'primary' | 'accent' | 'info' | 'success';
export type ArtVariant = 1 | 2 | 3 | 4 | 5 | 6;

/* Four accents against six layouts. The two cycles are coprime, so a list has
   to reach twenty-four items before a (layout, colour) pair repeats — the nine
   project cards never show the same combination twice. Picking at random would
   also avoid repeats most of the time, but a static export renders once and
   keeps whatever it rolled, so "most of the time" would be a permanent
   property of the built page rather than a per-visit one. */
const ACCENTS: ArtAccent[] = ['info', 'accent', 'primary', 'success'];
const VARIANTS: ArtVariant[] = [1, 2, 3, 4, 5, 6];

export function artFor(index: number): { variant: ArtVariant; accent: ArtAccent } {
  return {
    variant: VARIANTS[index % VARIANTS.length]!,
    accent: ACCENTS[index % ACCENTS.length]!,
  };
}

type TechArtProps = {
  variant: ArtVariant;
  accent: ArtAccent;
  className?: string;
  /** Drops the idle drift. For art shown large, where a shape that never quite
   *  settles competes with the text beside it instead of decorating it. */
  still?: boolean;
  /** A long, shallow strip instead of the default card frame. For art on an
   *  element that spans more than one grid column, where 16/10 would be a
   *  half-screen picture above three lines of text. It is a data attribute
   *  rather than a Tailwind `aspect-*` class at the call site because both
   *  would be plain class selectors of equal weight, and `.tech-art` is
   *  imported after Tailwind's utilities — so the utility would lose the tie
   *  and silently do nothing. */
  banner?: boolean;
};

/** The tint and the grid are CSS on the wrapper, not `<defs>` in the SVG. Nine
 *  cards would otherwise carry nine copies of the same `<pattern>` and
 *  `<linearGradient>` — and each copy needs a unique id, because duplicate ids
 *  in one document are invalid and `url(#…)` silently resolves to the first.
 *  Moving them to a stylesheet removes both the weight and the id problem. */
export function TechArt({ variant, accent, className, still, banner }: TechArtProps) {
  return (
    <div
      className={cn('tech-art', className)}
      data-art-accent={accent}
      data-art-aspect={banner ? 'banner' : undefined}
      aria-hidden="true"
    >
      {/* The wipe. It travels across the frame and leaves; the art is revealed
          behind it. Both halves are clip-path, so both run on the compositor. */}
      <span className="tech-art-veil shutter-veil" />
      {/* `meet`, not `slice`. The viewBox is 16/10 and so is the default frame,
          so the two are identical there — but the banner frame is 32/9, and
          `slice` scaled the drawing to COVER that, which cropped a 200-unit
          tall composition down to 90 and showed four enormous arcs with the
          middle missing. Seen in the browser, not reasoned about. `meet` fits
          the art and lets the frame's own tint and grid fill the rest. */}
      <svg
        viewBox="0 0 320 200"
        preserveAspectRatio="xMidYMid meet"
        className="tech-art-svg shutter"
      >
        <g className={still ? undefined : 'art-drift'}>
          {variant === 1 ? <ArtMesh still={still} /> : null}
          {variant === 2 ? <ArtWaveform still={still} /> : null}
          {variant === 3 ? <ArtPipeline still={still} /> : null}
          {variant === 4 ? <ArtRack still={still} /> : null}
          {variant === 5 ? <ArtChip still={still} /> : null}
          {variant === 6 ? <ArtStack still={still} /> : null}
        </g>
      </svg>
    </div>
  );
}

type PartProps = { still?: boolean };

/* Six layouts so a grid of cards does not read as one shape repeated. They are
   drawn from the same vocabulary as the generated illustrations — service
   boxes, a terminal, a chip, discs for a database, a small graph — so the two
   kinds of art on the page look like they came from one hand. */

/** Fan-out: one service in the middle, four behind it. */
function ArtMesh({ still }: PartProps) {
  return (
    <g fill="none" stroke="currentColor" strokeLinecap="round">
      <path
        d="M160 100 62 54M160 100 62 146M160 100 258 54M160 100 258 146"
        strokeWidth="1.5"
        opacity="0.3"
      />
      <rect x="132" y="76" width="56" height="48" rx="9" strokeWidth="2" opacity="0.85" />
      <circle cx="62" cy="54" r="11" strokeWidth="2" opacity="0.65" />
      <circle cx="62" cy="146" r="11" strokeWidth="2" opacity="0.65" />
      <circle cx="258" cy="54" r="11" strokeWidth="2" opacity="0.65" />
      <circle cx="258" cy="146" r="11" strokeWidth="2" opacity="0.65" />
      <circle
        cx="160"
        cy="100"
        r="7"
        fill="currentColor"
        stroke="none"
        className={still ? undefined : 'art-pulse'}
        style={{ transformOrigin: '160px 100px' }}
      />
    </g>
  );
}

/** Speech: a waveform mirrored about its own baseline. */
function ArtWaveform({ still }: PartProps) {
  /* A fixed spread rather than a random one — the page is exported once, so a
     random walk would freeze into a single arrangement anyway. */
  const heights = [18, 40, 64, 30, 76, 48, 22, 58, 34, 68, 26, 44];
  return (
    <g stroke="currentColor" strokeLinecap="round">
      {heights.map((h, i) => (
        <line
          key={i}
          x1={38 + i * 22}
          y1={100 - h / 2}
          x2={38 + i * 22}
          y2={100 + h / 2}
          strokeWidth="7"
          opacity={0.25 + (i % 5) * 0.14}
        />
      ))}
      <line x1="24" y1="100" x2="296" y2="100" strokeWidth="1.5" opacity="0.4" />
      <circle
        cx="160"
        cy="100"
        r="5"
        fill="currentColor"
        stroke="none"
        className={still ? undefined : 'art-pulse'}
        style={{ transformOrigin: '160px 100px' }}
      />
    </g>
  );
}

/** A pipeline climbing left to right, with a fainter run underneath it. */
function ArtPipeline({ still }: PartProps) {
  const stops: [number, number][] = [
    [96, 150],
    [192, 88],
    [286, 48],
  ];
  return (
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M30 150 96 150 128 88 192 88 224 48 286 48" strokeWidth="3" opacity="0.85" />
      <path d="M30 172 112 172 144 122 208 122 240 78 286 78" strokeWidth="1.5" opacity="0.3" />
      {stops.map(([cx, cy], i) => (
        <circle
          key={cx}
          cx={cx}
          cy={cy}
          r="7"
          fill="currentColor"
          stroke="none"
          className={still ? undefined : cn('art-pulse', i === 1 && 'art-pulse-late')}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      ))}
    </g>
  );
}

/** A rack of service units, one of them carrying load. */
function ArtRack({ still }: PartProps) {
  const rows = [0, 1, 2];
  const cols = [0, 1, 2, 3];
  return (
    <g fill="none" stroke="currentColor">
      {rows.map((row) =>
        cols.map((col) => {
          const lit = row === 1 && col === 2;
          const x = 44 + col * 60;
          const y = 42 + row * 44;
          return (
            <rect
              key={`${row}-${col}`}
              x={x}
              y={y}
              width="44"
              height="28"
              rx="6"
              strokeWidth="2"
              opacity={lit ? 1 : 0.32}
              fill={lit ? 'currentColor' : 'none'}
              className={lit && !still ? 'art-pulse' : undefined}
              style={lit ? { transformOrigin: `${x + 22}px ${y + 14}px` } : undefined}
            />
          );
        }),
      )}
    </g>
  );
}

/** A chip: legs on all four sides, traces inside. */
function ArtChip({ still }: PartProps) {
  const legs = [0, 1, 2, 3];
  return (
    <g fill="none" stroke="currentColor" strokeLinecap="round">
      {legs.map((i) => (
        <g key={i} opacity="0.5">
          <line x1={116 + i * 24} y1="46" x2={116 + i * 24} y2="26" strokeWidth="2" />
          <line x1={116 + i * 24} y1="154" x2={116 + i * 24} y2="174" strokeWidth="2" />
          <line x1="110" y1={70 + i * 20} x2="88" y2={70 + i * 20} strokeWidth="2" />
          <line x1="210" y1={70 + i * 20} x2="232" y2={70 + i * 20} strokeWidth="2" />
        </g>
      ))}
      <rect x="110" y="46" width="100" height="108" rx="10" strokeWidth="2.5" opacity="0.9" />
      <rect
        x="140"
        y="78"
        width="40"
        height="44"
        rx="6"
        strokeWidth="2"
        opacity="0.75"
        className={still ? undefined : 'art-pulse'}
        style={{ transformOrigin: '160px 100px' }}
      />
      <path d="M130 66h16M174 66h16M130 134h16M174 134h16" strokeWidth="1.5" opacity="0.4" />
    </g>
  );
}

/** Storage under compute: a stack of discs, a row of containers above it. */
function ArtStack({ still }: PartProps) {
  const discs = [0, 1, 2];
  const boxes = [0, 1, 2];
  return (
    <g fill="none" stroke="currentColor" strokeLinecap="round">
      {discs.map((i) => (
        <g key={i} opacity={0.85 - i * 0.18}>
          <ellipse cx="160" cy={186 - i * 26} rx="62" ry="15" strokeWidth="2" />
          <path d={`M98 ${186 - i * 26}v-14M222 ${186 - i * 26}v-14`} strokeWidth="2" />
        </g>
      ))}
      {boxes.map((i) => (
        <rect
          key={i}
          x={58 + i * 72}
          y="34"
          width="52"
          height="38"
          rx="7"
          strokeWidth="2"
          opacity={i === 1 ? 0.95 : 0.4}
          className={i === 1 && !still ? 'art-pulse' : undefined}
          style={i === 1 ? { transformOrigin: `${58 + 72 + 26}px 53px` } : undefined}
        />
      ))}
      <path d="M84 72v22M160 72v22M236 72v22" strokeWidth="1.5" opacity="0.3" />
    </g>
  );
}
