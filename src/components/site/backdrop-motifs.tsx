/* ─────────────────────────────────────────────────────────────────────────────
 * The motif layer of the page backdrop.
 *
 * `src/styles/layout/tech-backdrop.css` draws a circuit board out of gradients:
 * traces, vias, a dot matrix. It is structure, and read on its own it is a
 * grid of squares — correct as a surface, but it says nothing about what this
 * site is about. This layer is the subject on top of that surface: the things
 * the work is made of, drawn small and faint — a terminal, angle brackets, a
 * neural net, a chip, a laptop, a branch, a database, a waveform.
 *
 * Drawn in SVG rather than shipped as an image, for the same three reasons the
 * board is: a raster would spend part of the 40KB-per-file image budget on
 * something nobody is meant to look at, it would not flip with the theme, and
 * at this stroke width vector is sharper than anything that survives
 * compression. It is markup in the HTML, not JavaScript — check:budget weighs
 * script, and this adds none.
 *
 * It TILES rather than being one viewport-sized composition. A fixed
 * composition would have to scale with the viewport, so the same drawing would
 * be a wall of huge glyphs on a phone and a scatter of small ones on a desktop.
 * A pattern in `userSpaceOnUse` units is the same physical size everywhere, and
 * the viewport just shows more or less of it.
 *
 * Colour comes from `.motif` in the stylesheet, never from here: every shape is
 * `currentColor`, and the four tints are four token-valued `color`
 * declarations. Nothing in this file names a colour.
 * ────────────────────────────────────────────────────────────────────────── */

/** The tile, in CSS pixels: 64rem at a 16px root. Sized against the window, not
 *  against the drawing. At 44rem a 1440px window showed two full columns of the
 *  tile side by side, and the eye reads two identical terminals at the same
 *  height as wallpaper rather than as texture — seen in the browser, not
 *  reasoned about. At 64rem that window shows one tile and a sliver, so the
 *  repeat is off-screen. A phone still lands inside a single tile and gets
 *  whichever glyphs that slice contains. */
export const TILE = 1024;

export type Tint = 'ink' | 'info' | 'accent' | 'success';

export type Placement = {
  glyph: () => React.ReactElement;
  x: number;
  y: number;
  /** Degrees. Nothing sits perfectly square: a few degrees of tilt is what
   *  keeps nine glyphs from reading as a second grid laid over the first. */
  angle: number;
  scale: number;
  tint: Tint;
};

/* Placed by hand rather than scattered by a generator. A static export renders
   once, so a random scatter would freeze into one arrangement anyway — and this
   one is checked for the two things that matter: no glyph crosses a tile edge,
   so the repeat never shows a cut-in-half chip; and no glyph appears twice at
   the same scale and tint, so the five that appear more than once read as
   different objects rather than as a copy. */
export const PLACEMENTS: Placement[] = [
  { glyph: Terminal, x: 120, y: 110, angle: -4, scale: 1, tint: 'info' },
  { glyph: Brackets, x: 400, y: 70, angle: 7, scale: 0.8, tint: 'ink' },
  { glyph: Laptop, x: 660, y: 150, angle: -5, scale: 0.95, tint: 'ink' },
  { glyph: Waveform, x: 900, y: 90, angle: 4, scale: 0.85, tint: 'accent' },
  { glyph: NeuralNet, x: 150, y: 330, angle: 3, scale: 1.05, tint: 'accent' },
  { glyph: Chip, x: 430, y: 320, angle: -8, scale: 0.9, tint: 'ink' },
  { glyph: Braces, x: 690, y: 380, angle: 5, scale: 0.85, tint: 'ink' },
  { glyph: Database, x: 930, y: 330, angle: -4, scale: 0.95, tint: 'info' },
  { glyph: Brackets, x: 110, y: 590, angle: -6, scale: 0.9, tint: 'ink' },
  { glyph: Terminal, x: 400, y: 600, angle: 5, scale: 0.8, tint: 'ink' },
  { glyph: Branch, x: 660, y: 610, angle: -5, scale: 0.9, tint: 'success' },
  { glyph: Laptop, x: 930, y: 600, angle: 6, scale: 0.8, tint: 'info' },
  { glyph: Chip, x: 130, y: 860, angle: 5, scale: 0.8, tint: 'accent' },
  { glyph: Database, x: 390, y: 880, angle: -5, scale: 0.8, tint: 'ink' },
  { glyph: NeuralNet, x: 700, y: 870, angle: 4, scale: 0.85, tint: 'ink' },
  { glyph: Braces, x: 940, y: 860, angle: -6, scale: 0.9, tint: 'ink' },
];

export function BackdropMotifs() {
  return (
    /* No viewBox: one user unit is one CSS pixel, which is what makes the tile
       a fixed physical size instead of something the viewport stretches.
       focusable="false" because IE-era SVG is a tab stop and this is texture. */
    <svg className="tech-motifs" aria-hidden="true" focusable="false">
      <defs>
        {/* One instance of this component exists on the page, so this id is
            unique by construction. Two would both resolve `url(#tech-motifs)`
            to the first — which is why this is a layout-level element and not
            something a section can drop in. */}
        <pattern id="tech-motifs" width={TILE} height={TILE} patternUnits="userSpaceOnUse">
          {PLACEMENTS.map(({ glyph: Glyph, x, y, angle, scale, tint }) => (
            <g
              key={`${x}-${y}`}
              className={`motif motif-${tint}`}
              transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}
            >
              <Glyph />
            </g>
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#tech-motifs)" />
    </svg>
  );
}

/* Every glyph is drawn around its own origin, so a placement is a translate and
   nothing else. They share the vocabulary of site/tech-art.tsx — the same boxes,
   discs, chips and bars — so the backdrop looks like it came from the same hand
   as the card art in front of it. */

/** A terminal: window chrome, a prompt chevron, a line of output. */
function Terminal() {
  return (
    <>
      <rect x="-62" y="-44" width="124" height="88" rx="10" strokeWidth="3" />
      <path d="M-62 -20H62" strokeWidth="2.5" opacity="0.7" />
      <circle cx="-50" cy="-32" r="3.5" fill="currentColor" stroke="none" opacity="0.8" />
      <circle cx="-38" cy="-32" r="3.5" fill="currentColor" stroke="none" opacity="0.55" />
      <circle cx="-26" cy="-32" r="3.5" fill="currentColor" stroke="none" opacity="0.4" />
      <path d="M-46 -4 L-32 8 L-46 20" strokeWidth="3" />
      <path d="M-22 20H10" strokeWidth="3" opacity="0.7" />
      <path d="M-46 34H30" strokeWidth="3" opacity="0.45" />
    </>
  );
}

/** Angle brackets with a slash: code, in the shortest mark there is for it. */
function Brackets() {
  return (
    <>
      <path d="M-32 -24 L-56 0 L-32 24" strokeWidth="3.5" />
      <path d="M32 -24 L56 0 L32 24" strokeWidth="3.5" />
      <path d="M12 -30 L-12 30" strokeWidth="3" opacity="0.7" />
    </>
  );
}

/** A three-layer net, every edge drawn: the model, not a metaphor for one. */
function NeuralNet() {
  const layers: { x: number; ys: number[] }[] = [
    { x: -62, ys: [-40, 0, 40] },
    { x: 0, ys: [-60, -20, 20, 60] },
    { x: 62, ys: [-26, 26] },
  ];
  return (
    <>
      {layers
        .slice(0, -1)
        .map((layer, i) =>
          layer.ys.map((from) =>
            layers[i + 1]!.ys.map((to) => (
              <path
                key={`${layer.x}-${from}-${to}`}
                d={`M${layer.x} ${from} L${layers[i + 1]!.x} ${to}`}
                strokeWidth="1.5"
                opacity="0.4"
              />
            )),
          ),
        )}
      {layers.map((layer) =>
        layer.ys.map((y) => (
          <circle
            key={`${layer.x}-${y}`}
            cx={layer.x}
            cy={y}
            r="6"
            fill="currentColor"
            stroke="none"
            opacity="0.85"
          />
        )),
      )}
    </>
  );
}

/** A chip: legs on all four sides, a die in the middle. */
function Chip() {
  const legs = [-20, 0, 20];
  return (
    <>
      <rect x="-38" y="-38" width="76" height="76" rx="10" strokeWidth="3" />
      <rect x="-15" y="-15" width="30" height="30" rx="5" strokeWidth="2.5" opacity="0.75" />
      {legs.map((i) => (
        <path
          key={i}
          d={`M${i} -38V-54M${i} 38V54M-38 ${i}H-54M38 ${i}H54`}
          strokeWidth="2.5"
          opacity="0.6"
        />
      ))}
    </>
  );
}

/** A laptop, screen full of lines. */
function Laptop() {
  return (
    <>
      <rect x="-46" y="-36" width="92" height="60" rx="6" strokeWidth="3" />
      <path d="M-60 36H60 L50 24H-50 Z" strokeWidth="3" />
      <path d="M-34 -20H6M-34 -6H22M-34 8H-4" strokeWidth="2.5" opacity="0.6" />
    </>
  );
}

/** A branch leaving a trunk and stopping at a commit. */
function Branch() {
  return (
    <>
      <path d="M-26 -37V37" strokeWidth="3" />
      <path d="M-26 6C-26 -20 26 -14 26 -33" strokeWidth="3" opacity="0.7" />
      <circle cx="-26" cy="-44" r="7" strokeWidth="3" />
      <circle cx="-26" cy="44" r="7" strokeWidth="3" />
      <circle cx="26" cy="-40" r="7" strokeWidth="3" />
    </>
  );
}

/** Braces around an ellipsis: a block of something, contents unstated. */
function Braces() {
  return (
    <>
      <path d="M-20 -36c-9 0-9 8-9 15s-5 12-9 12c4 0 9 5 9 12s0 15 9 15" strokeWidth="3.5" />
      <path d="M20 -36c9 0 9 8 9 15s5 12 9 12c-4 0-9 5-9 12s0 15-9 15" strokeWidth="3.5" />
      <circle cx="-9" cy="0" r="3" fill="currentColor" stroke="none" opacity="0.6" />
      <circle cx="0" cy="0" r="3" fill="currentColor" stroke="none" opacity="0.6" />
      <circle cx="9" cy="0" r="3" fill="currentColor" stroke="none" opacity="0.6" />
    </>
  );
}

/** Discs in a stack: storage. */
function Database() {
  const discs = [0, 1, 2];
  return (
    <>
      <path d="M-40 -24V24M40 -24V24" strokeWidth="3" opacity="0.5" />
      {discs.map((i) => (
        <ellipse
          key={i}
          cx="0"
          cy={24 - i * 24}
          rx="40"
          ry="13"
          strokeWidth="3"
          opacity={0.9 - i * 0.18}
        />
      ))}
    </>
  );
}

/** Bars about a baseline: speech, the input half of the work. */
function Waveform() {
  const heights = [22, 46, 70, 34, 58, 26, 48];
  return (
    <>
      {heights.map((h, i) => (
        <path
          key={i}
          d={`M${-54 + i * 18} ${-h / 2}V${h / 2}`}
          strokeWidth="6"
          opacity={0.35 + (i % 4) * 0.16}
        />
      ))}
    </>
  );
}
