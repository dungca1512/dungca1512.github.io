/* The test checks the content modules. This checks the HTML they produced.
   They are not the same thing: a component can hold correct bilingual data and
   still render the wrong half of it, or none. */
import { readFileSync } from 'node:fs';

const pages = ['out/vi/index.html', 'out/en/index.html'];
let failed = false;

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  // An unresolved Localized<T> stringifies to this. If it reaches the HTML, a
  // component rendered the wrapper instead of picking a language out of it.
  if (html.includes('[object Object]')) {
    console.error(`FAIL  ${page} contains [object Object] — a Localized<T> was rendered raw.`);
    failed = true;
  }
  if (html.includes('undefined<')) {
    console.error(`FAIL  ${page} contains a rendered \`undefined\`.`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log(`OK    ${pages.length} pages carry no unresolved content`);
