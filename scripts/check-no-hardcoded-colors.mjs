/* One file owns colour. Everywhere else goes through a token, so that changing
   the palette is one edit and so that dark mode cannot be forgotten in a
   corner — a literal hex does not flip with the theme, and nothing warns you. */
import { readFileSync, globSync } from 'node:fs';

const ALLOWED = 'src/app/globals.css';
const NAMED_COLOURS = [
  'red',
  'white',
  'black',
  'blue',
  'green',
  'yellow',
  'orange',
  'purple',
  'pink',
  'gray',
  'grey',
  'brown',
  'cyan',
  'magenta',
  'navy',
  'teal',
  'maroon',
  'olive',
  'lime',
  'aqua',
  'fuchsia',
  'silver',
  'gold',
  'indigo',
  'violet',
  'coral',
  'salmon',
  'crimson',
  'turquoise',
  'transparent',
];
// Hex/rgb/hsl/oklch literals are caught wherever they appear on the line.
// Named colours are only caught in VALUE position — right after a `:` or a
// `,`, with an optional quote in between — so prose ("the red border") and
// identifiers (`text-white-ish`, `bg-red-500`) do not false-positive: neither
// is immediately preceded by a colon or comma.
const PATTERN = new RegExp(
  `#[0-9a-fA-F]{3,8}\\b|\\b(?:rgb|rgba|hsl|hsla|oklch)\\(|[:,]\\s*['"]?(?:${NAMED_COLOURS.join('|')})\\b(?!-)`,
  'i',
);

const files = globSync('src/**/*.{ts,tsx,css}').filter((f) => !f.endsWith(ALLOWED));
let failed = false;

/**
 * An SVG path's `d` attribute is full of hex-looking noise, and a fragment
 * href/url is not a colour. Earlier this stripped the WHOLE LINE on a bare
 * `/\bd=|href="#|url\(#/` match, which a comment like `/* d= *\/` also
 * satisfied — that discarded any real colour literal elsewhere on the same
 * line. This strips only the noisy attribute VALUE, so the rest of the line
 * still gets checked.
 */
function stripSafeNoise(line) {
  return line
    .replace(/\bd="[^"]*"/g, 'd=""')
    .replace(/\bd='[^']*'/g, "d=''")
    .replace(/href="#[^"]*"/g, 'href="#"')
    .replace(/href='#[^']*'/g, "href='#'")
    .replace(/url\(#[^)]*\)/g, 'url(#)');
}

for (const file of files) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      const checked = stripSafeNoise(line);
      if (PATTERN.test(checked)) {
        console.error(`FAIL  ${file}:${i + 1}  colour literal outside the token layer`);
        console.error(`      ${line.trim()}`);
        failed = true;
      }
    });
}

if (failed) {
  console.error('\n      Use a design-system token or a Tailwind class that resolves to one.');
  console.error(`      Only ${ALLOWED} may contain a colour literal.`);
  process.exit(1);
}

console.log(`OK    ${files.length} files carry no colour literals`);
