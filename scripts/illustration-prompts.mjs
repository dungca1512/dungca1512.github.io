/* The prompts, verbatim, that produced everything in raw/. docs/illustrations.md
 * explains the style and why each constraint is there; this file is what the
 * generator actually sends, so the two must not drift — tests/illustrations.test.ts
 * checks that every name here has a file on disk and a section that renders it.
 *
 * Every clause in SHARED is load-bearing and most of them are scar tissue.
 * Read docs/illustrations.md before removing one.
 */

const SHARED = [
  'Hand-drawn editorial line illustration in a modern flat style.',
  'Confident black outlines of even weight, slightly loose and organic, as if inked by hand.',
  'Objects float free on the page with generous space between them, joined by thin lines,',
  'with small scattered accents: dots, tiny hollow circles, short dashes.',
  'Flat colour only — no gradients, no shading, no drop shadows, no texture, no photorealism.',
  'Most shapes stay unfilled or pale grey; fill sparingly with #2b7fd4 blue, #40a69f teal and #ffb319 amber.',
  'The background is solid #f5f5f5 and fills the entire canvas edge to edge:',
  'no frame, no border, no inset panel, no vignette.',
  'No text, no letters, no numbers, no logos, no watermark, no labels of any kind.',
  'Nothing is cropped by the canvas edge; keep a wide empty margin on all four sides.',
  'Square composition, 2048x2048.',
].join(' ');

/** The dark band's illustration sits on #0b0b0b instead. */
const SHARED_DARK = SHARED.replace(
  'The background is solid #f5f5f5 and fills',
  'The background is solid #0b0b0b and fills',
).replace('unfilled or pale grey', 'unfilled with white outlines');

export const PROMPTS = {
  hero: [
    'A single engineer seen three-quarter from behind at a standing desk, working calmly.',
    'In the air in front of them floats a system diagram: circles joined by straight lines,',
    'a small server rack, a terminal window drawn as a plain empty rectangle,',
    'and a chip drawn as a square with short legs on each side.',
    'Unhurried and deliberate, not frantic.',
    SHARED,
  ].join(' '),

  expertise: [
    'A cross-section of infrastructure in four stacked horizontal layers, seen straight on.',
    'Bottom: three wide server boxes. Above: three rounded container boxes.',
    'Middle: a ring of six circles joined by straight lines, a small neural graph.',
    'Top: one plain window shape. Thin vertical lines connect the layers.',
    'A few small hollow circles and short dashes float in the space around the stack.',
    'Keep the inside of every box plain and empty — no hatching, no grids, no tiny rules.',
    SHARED,
  ].join(' '),

  work: [
    'A pipeline running left to right across the canvas.',
    'A rough sketch enters at the left, passes through three processing stages drawn as',
    'simple geometric gates with small gears beside them, and leaves at the right as a',
    'finished panel. Thin dotted connector lines link the stages; a few small circles and',
    'dashes float above and below the line of travel.',
    SHARED,
  ].join(' '),

  experience: [
    'Three flat platforms of increasing height stepping up from left to right, like a path.',
    'A small figure walks up them. On each platform stands one object: a server box on the',
    'lowest, a laptop on the middle, and a ring of circles joined by lines on the highest.',
    'Thin dotted lines arc between the platforms; small hollow circles and dashes float around them.',
    SHARED,
  ].join(' '),

  capabilities: [
    'A loose scattered toolkit floating on the page with wide gaps between the pieces:',
    'a laptop seen three-quarter, a terminal window drawn as a plain empty rectangle,',
    'two gears of different sizes, a chip drawn as a square with short legs,',
    'a small stack of discs for a database, a wrench, and a magnifying glass.',
    'Nothing overlaps; each object sits on its own with air around it.',
    'Small hollow circles, dots and short dashes fill the gaps.',
    SHARED,
  ].join(' '),

  writing: [
    'An open notebook lying flat, seen from slightly above, with a pen resting beside it.',
    'Above the page float loose ideas drawn as simple shapes: a small diagram of circles',
    'joined by lines, a lightbulb, a short stack of paper sheets, and a tiny window shape.',
    'Thin lines rise from the notebook towards them. Calm and uncluttered.',
    SHARED,
  ].join(' '),

  contact: [
    'Two simple standing figures, one on the left third of the canvas and one on the right',
    'third, both drawn whole with a wide empty margin between each figure and the canvas',
    'edge — neither figure is cropped and neither touches the border.',
    'A single clean line arcs between them, made of evenly spaced amber dots.',
    'A few small hollow circles float in the space above the arc. Open and uncluttered.',
    SHARED_DARK,
  ].join(' '),
};
