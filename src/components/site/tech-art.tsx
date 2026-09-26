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
export type ArtVariant = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/* There used to be an `artFor(index)` here, and it is worth saying what was
   wrong with it, because it looked reasonable:

     return { variant: VARIANTS[index % 6], accent: ACCENTS[index % 4] };

   Four accents against six layouts are coprime, so no two of nine cards ever
   showed the same pair — which is what the function was designed to guarantee,
   and it did. But the thing it guaranteed was variety, and variety is not what
   a picture on a project card is for. The art was a function of the card's
   POSITION IN AN ARRAY. Reorder the projects and every picture moves to a
   different project; the speech platform got a rack of servers because it
   happened to be third. The feedback was "mấy cái dự án của em cho ảnh xem nó
   hoạt động thế nào", and the honest answer was that these pictures could not
   show that, because nothing connected them to the work.

   So each project now NAMES its own art, in the content module, and the four
   layouts that had no project to belong to were replaced by ones that do: a
   fallback chain, a fan-out to a judge, a training loop, a partitioned stream.
   The accent is named there too. Losing the coprime trick means two projects
   could now be given the same pair by hand, so tests/art.test.ts asserts
   the pairs are distinct — a property that used to be arithmetic and is now a
   decision someone has to keep. */
export type Art = { variant: ArtVariant; accent: ArtAccent };

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
          {variant === 7 ? <ArtFallback still={still} /> : null}
          {variant === 8 ? <ArtJudge still={still} /> : null}
          {variant === 9 ? <ArtLoop still={still} /> : null}
          {variant === 10 ? <ArtStream still={still} /> : null}
        </g>
      </svg>
    </div>
  );
}

type PartProps = { still?: boolean };

/* A packet stream laid over a wire. `d` MUST run from the outside world in
   to the thing being fed: motion/art.css moves the dash pattern towards the
   path's end, and tests/art-signal.test.tsx checks the chip's legs for it.
   `--i` is the phase; the stylesheet turns it into a negative delay so the
   packets on neighbouring wires are never in step. Runs on `still` art too
   (see the stylesheet for why). */
function Signal({ d, phase }: { d: string; phase: number }) {
  return (
    <path
      d={d}
      className="art-signal"
      opacity="0.9"
      style={{ '--i': phase } as React.CSSProperties}
    />
  );
}

/* Ten layouts, one per thing the projects actually do. They are
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
      <Signal d="M30 150 96 150 128 88 192 88 224 48 286 48" phase={0} />
      <path d="M30 172 112 172 144 122 208 122 240 78 286 78" strokeWidth="1.5" opacity="0.3" />
      <Signal d="M30 172 112 172 144 122 208 122 240 78 286 78" phase={3} />
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
      {/* The stream: one packet path per leg, each drawn from the outer
          end IN to the body's edge, and each with its own phase. The
          phases are a small permutation rather than 0..15 in order so the
          four legs on one side do not light up as a running sequence. */}
      {legs.map((i) => (
        <g key={`signal-${i}`}>
          <Signal d={`M${116 + i * 24} 26V46`} phase={(i * 5) % 8} />
          <Signal d={`M${116 + i * 24} 174V154`} phase={(i * 5 + 2) % 8} />
          <Signal d={`M88 ${70 + i * 20}H110`} phase={(i * 5 + 4) % 8} />
          <Signal d={`M232 ${70 + i * 20}H210`} phase={(i * 5 + 6) % 8} />
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

/** A router in front of a stack of engines: the first one answers, the two
 *  behind it are the fallback. For a service whose point is that a provider
 *  going down degrades the result instead of ending it — the solid line is the
 *  path taken, the dashed ones are the paths held ready. */
function ArtFallback({ still }: PartProps) {
  const engines = [40, 86, 132];
  return (
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <g strokeWidth="6" opacity="0.6">
        <path d="M24 88v24M36 76v48M48 86v28" />
      </g>
      <path d="M60 100h22" strokeWidth="2" opacity="0.5" />
      <rect x="86" y="80" width="46" height="40" rx="9" strokeWidth="2.5" opacity="0.9" />
      <path d="M132 100c26 0 26-43 52-43" strokeWidth="2.5" opacity="0.85" />
      <path d="M132 100c26 0 26 3 52 3" strokeWidth="2" strokeDasharray="5 6" opacity="0.4" />
      <path d="M132 100c26 0 26 49 52 49" strokeWidth="2" strokeDasharray="5 6" opacity="0.4" />
      {engines.map((y, i) => (
        <rect
          key={y}
          x="184"
          y={y}
          width="96"
          height="34"
          rx="8"
          strokeWidth="2"
          opacity={i === 0 ? 1 : 0.35}
          fill={i === 0 ? 'currentColor' : 'none'}
          className={i === 0 && !still ? 'art-pulse' : undefined}
          style={i === 0 ? { transformOrigin: '232px 57px' } : undefined}
        />
      ))}
    </g>
  );
}

/** One input answered by four providers at once, then a judge that keeps one.
 *  The fan-out and the fan-in are the whole idea, so both are drawn. */
function ArtJudge({ still }: PartProps) {
  const rows = [26, 66, 106, 146];
  return (
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <rect x="14" y="82" width="40" height="36" rx="8" strokeWidth="2.5" opacity="0.9" />
      {rows.map((y) => (
        <g key={y}>
          <path
            d={`M54 100c22 0 22 ${y + 14 - 100} 44 ${y + 14 - 100}`}
            strokeWidth="1.5"
            opacity="0.32"
          />
          <rect x="98" y={y} width="56" height="28" rx="7" strokeWidth="2" opacity="0.55" />
          <path
            d={`M154 ${y + 14}c22 0 22 ${100 - y - 14} 38 ${100 - y - 14}`}
            strokeWidth="1.5"
            opacity="0.32"
          />
        </g>
      ))}
      <path
        d="M212 100 226 82 240 100 226 118Z"
        strokeWidth="2.5"
        opacity="0.95"
        className={still ? undefined : 'art-pulse'}
        style={{ transformOrigin: '226px 100px' }}
      />
      <path d="M240 100h20" strokeWidth="2" opacity="0.5" />
      <rect x="260" y="84" width="42" height="32" rx="8" strokeWidth="2.5" opacity="0.85" />
    </g>
  );
}

/** A closed loop with a gate on it: train, evaluate, promote, train again.
 *  The arc carries an arrowhead because a cycle with no direction is a ring. */
function ArtLoop({ still }: PartProps) {
  const stations: [number, number][] = [
    [160, 42],
    [218, 100],
    [160, 158],
    [102, 100],
  ];
  return (
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {/* Arc centre (160, 100), r=58, drawn clockwise from the top and stopping
          just short of it at (119, 59). The head is placed on that endpoint and
          its barbs swept back along the tangent there — eyeballed coordinates
          left it floating a few units off the line, which on screen reads as a
          stray mark rather than as an arrow. */}
      <path d="M160 42a58 58 0 1 1-41 17" strokeWidth="2.5" opacity="0.8" />
      <path d="M108 63 119 59 115 70" strokeWidth="2.5" opacity="0.8" />
      {stations.map(([cx, cy], i) => (
        <circle
          key={cx + '-' + cy}
          cx={cx}
          cy={cy}
          r="9"
          strokeWidth="2.5"
          opacity={i === 1 ? 1 : 0.45}
          fill={i === 1 ? 'currentColor' : 'none'}
          className={i === 1 && !still ? 'art-pulse' : undefined}
          style={i === 1 ? { transformOrigin: `${cx}px ${cy}px` } : undefined}
        />
      ))}
    </g>
  );
}

/** A partitioned log feeding its consumers. Three lanes of segments, because
 *  the ordering inside a partition is the part of a stream that matters. */
function ArtStream({ still }: PartProps) {
  const lanes = [56, 100, 144];
  const slots = [0, 1, 2, 3, 4];
  return (
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {lanes.map((y, lane) =>
        slots.map((j) => {
          const lit = lane === 1 && j === 4;
          return (
            <rect
              key={`${y}-${j}`}
              x={20 + j * 32}
              y={y - 10}
              width="26"
              height="20"
              rx="5"
              strokeWidth="2"
              opacity={lit ? 1 : 0.3 + j * 0.04}
              fill={lit ? 'currentColor' : 'none'}
              className={lit && !still ? 'art-pulse' : undefined}
              style={lit ? { transformOrigin: `${20 + 4 * 32 + 13}px ${y}px` } : undefined}
            />
          );
        }),
      )}
      <path
        d="M178 56c30 0 24 22 52 22M178 100h52M178 144c30 0 24-22 52-22"
        strokeWidth="1.5"
        opacity="0.32"
      />
      <Signal d="M178 56c30 0 24 22 52 22" phase={0} />
      <Signal d="M178 100h52" phase={3} />
      <Signal d="M178 144c30 0 24-22 52-22" phase={6} />
      <rect x="230" y="62" width="70" height="32" rx="8" strokeWidth="2.5" opacity="0.85" />
      <rect x="230" y="106" width="70" height="32" rx="8" strokeWidth="2.5" opacity="0.55" />
    </g>
  );
}
