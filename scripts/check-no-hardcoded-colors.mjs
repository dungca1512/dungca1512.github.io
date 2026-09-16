/* One file owns colour. Everywhere else goes through a token, so that changing
   the palette is one edit and so that dark mode cannot be forgotten in a
   corner — a literal hex does not flip with the theme, and nothing warns you. */
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const ALLOWED = 'src/app/globals.css';
const PATTERN = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch)\(/;

const files = globSync('src/**/*.{ts,tsx,css}').filter((f) => !f.endsWith(ALLOWED));
let failed = false;

for (const file of files) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      // An SVG path's `d` attribute is full of hex-looking noise, and a
      // fragment href is not a colour.
      if (/\bd=|href="#|url\(#/.test(line)) return;
      if (PATTERN.test(line)) {
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
