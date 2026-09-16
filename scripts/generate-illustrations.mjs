#!/usr/bin/env node
/* Generates the raw 2048px illustrations into raw/ (gitignored) from the
 * prompts in scripts/illustration-prompts.mjs. Compression is a separate step:
 * scripts/compress-illustrations.sh turns raw/*.png into the shipped files and
 * enforces the 40KB ceiling.
 *
 * The first four were produced by hand-rolled curl calls that lived nowhere.
 * This script exists so the next regeneration is a command rather than an
 * archaeology exercise, and so the prompts, the model and the size are one
 * file rather than three memories.
 *
 * Usage:
 *   node scripts/generate-illustrations.mjs             # every name
 *   node scripts/generate-illustrations.mjs hero work   # only these
 *
 * Needs GEMINI_API_KEY in .env (gitignored, never committed). The key is read
 * and sent to Google's generativelanguage endpoint and nowhere else; it is
 * never printed, not even in an error.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { PROMPTS } from './illustration-prompts.mjs';

const MODEL = 'gemini-3-pro-image';
const ENDPOINT = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
const OUT_DIR = 'raw';

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
  console.error(`generate-illustrations: ${message}`);
  process.exit(1);
}

async function generate(name, prompt, key) {
  const response = await fetch(ENDPOINT(MODEL), {
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

  const file = `${OUT_DIR}/${name}.png`;
  writeFileSync(file, Buffer.from(part.inlineData.data, 'base64'));
  const kb = Math.round(Buffer.from(part.inlineData.data, 'base64').length / 1024);
  console.log(`${file.padEnd(28)} ${String(kb).padStart(6)} KB raw`);
}

const requested = process.argv.slice(2);
const names = requested.length ? requested : Object.keys(PROMPTS);
for (const name of names) {
  if (!PROMPTS[name]) fail(`no prompt named "${name}" — have: ${Object.keys(PROMPTS).join(', ')}`);
}

mkdirSync(OUT_DIR, { recursive: true });
const key = apiKey();
for (const name of names) {
  await generate(name, PROMPTS[name], key);
}
