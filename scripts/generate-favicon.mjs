#!/usr/bin/env node
/* Generates candidate tab icons into raw/icon/ (gitignored). Pick one, then
 * scripts/build-favicon.mjs turns it into the shipped public/favicon.png.
 *
 * Why this is not just another entry in illustration-prompts.mjs: the
 * illustration pipeline globs raw/*.png into public/images/illustrations/,
 * and tests/illustrations.test.ts requires every name there to be rendered by
 * an <Illustration> somewhere in src/. A tab icon is rendered by the browser
 * chrome, not by a section, so it would fail that test the moment it was
 * compressed. Separate output directory, separate build step - raw/icon/ is
 * deliberately one level down, because that glob is not recursive.
 *
 * The prompts are here rather than in a shell history for the same reason the
 * illustration ones are: regenerating should be a command, not archaeology.
 *
 * Usage:
 *   node scripts/generate-favicon.mjs            # every concept
 *   node scripts/generate-favicon.mjs chip node  # only these
 *
 * Needs GEMINI_API_KEY in .env (gitignored, never committed). The key goes to
 * Google's generativelanguage endpoint and nowhere else, and is never printed,
 * not even in an error.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const MODEL = 'gemini-3-pro-image';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const OUT_DIR = 'raw/icon';

/* Every clause below is about one thing: surviving at 16 pixels, which is the
 * size a browser tab actually draws. The site's illustrations are the opposite
 * of that brief - thin black outlines, objects floating in generous white
 * space - so what carries over is the vocabulary (loose hand-drawn ink, flat
 * colour, the brand palette) and not the composition. The composition is an
 * app icon: one shape, centred, fat strokes, no margin, no detail that a
 * 16px grid cannot hold.
 *
 * The blue ground is load-bearing rather than decorative. A near-white tile
 * vanishes into a light browser chrome and a dark one has nothing to sit
 * against; one solid mid-blue reads in both, which is why the drawn SVG this
 * replaces used the same ground. #2b7fd4 is the brand blue - the value behind
 * the blue-500 token in globals.css. */
const SHARED = [
  'A flat app icon, square, filling the entire canvas edge to edge with a solid #2b7fd4 blue background.',
  'No frame, no border, no margin, no rounded corners, no drop shadow, no gradient, no texture, no vignette.',
  'One single symbol, centred, occupying about 65% of the canvas.',
  'The symbol is drawn in pure white #ffffff in a loose hand-drawn ink style with very thick strokes:',
  'every stroke at least 1/12 of the canvas width. No thin lines anywhere.',
  'High contrast, only two colours in the whole image: the blue ground and the white mark.',
  'Bold and simple enough to stay readable when the image is shrunk to 16x16 pixels.',
  'No text, no letters, no numbers, no logos, no watermark.',
  'Square composition, 2048x2048.',
].join(' ');

export const ICONS = {
  chip: [
    'The symbol is a microchip: a plain square with four short straight legs',
    'sticking out of each of its four sides, and one small solid circle at its centre.',
    SHARED,
  ].join(' '),

  node: [
    'The symbol is a tiny network: three fat solid circles arranged as a triangle,',
    'joined to each other by three thick straight lines.',
    SHARED,
  ].join(' '),

  stack: [
    'The symbol is three wide horizontal bars stacked with even gaps between them,',
    'like server racks seen from the front, the middle bar slightly narrower.',
    SHARED,
  ].join(' '),

  orbit: [
    'The symbol is one fat solid circle at the centre with a single thick ring',
    'orbiting it at an angle, and one small solid dot sitting on the ring.',
    SHARED,
  ].join(' '),
};

function apiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (!existsSync('.env')) fail('no GEMINI_API_KEY in the environment and no .env to read it from');
  const line = readFileSync('.env', 'utf8')
    .split('\n')
    .find((l) => l.trim().startsWith('GEMINI_API_KEY='));
  if (!line) fail('.env has no GEMINI_API_KEY');
  return line
    .slice(line.indexOf('=') + 1)
    .trim()
    .replace(/^["']|["']$/g, '');
}

function fail(message) {
  // Never interpolates the key: an error is the easiest place to leak one.
  console.error(`generate-favicon: ${message}`);
  process.exit(1);
}

async function generate(name, prompt, key) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE'], imageConfig: { imageSize: '2K' } },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    fail(`${name}: ${response.status} ${response.statusText} — ${body.slice(0, 400)}`);
  }

  const payload = await response.json();
  const part = payload.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part) {
    const reason = payload.candidates?.[0]?.finishReason ?? 'no candidates';
    fail(`${name}: the response carried no image (${reason})`);
  }

  const bytes = Buffer.from(part.inlineData.data, 'base64');
  const file = `${OUT_DIR}/${name}.png`;
  writeFileSync(file, bytes);
  console.log(`${file.padEnd(28)} ${String(Math.round(bytes.length / 1024)).padStart(6)} KB raw`);
}

const requested = process.argv.slice(2);
const names = requested.length ? requested : Object.keys(ICONS);
for (const name of names) {
  if (!ICONS[name]) fail(`no icon named "${name}" — have: ${Object.keys(ICONS).join(', ')}`);
}

mkdirSync(OUT_DIR, { recursive: true });
const key = apiKey();
for (const name of names) {
  await generate(name, ICONS[name], key);
}
