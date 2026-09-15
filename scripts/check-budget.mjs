/* This site's advantage over a framework build is that it is 31KB. That is only
   true until someone stops watching. The ceilings below are roughly 25% above
   where the site sits today - enough room to work, not enough to drift into a
   different class of page. */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const CODE = ['index.html', 'style.css', 'main.js', 'data.js'];
const CODE_CEILING_KB = 40;
const IMAGE_CEILING_KB = 40;
const IMAGE_TYPES = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

let failed = false;

// Gzip the files together: they ship together, and separate gzip streams
// overstate the total by repeating each file's dictionary.
const combined = Buffer.concat(
    CODE.filter((name) => existsSync(join(root, name))).map((name) => readFileSync(join(root, name)))
);
const codeKb = gzipSync(combined, { level: 9 }).length / 1024;

console.log(`  code   ${codeKb.toFixed(1)} KB gzip  (ceiling ${CODE_CEILING_KB} KB)  ${CODE.join(' + ')}`);

if (codeKb > CODE_CEILING_KB) {
    console.error(`FAIL  code is ${codeKb.toFixed(1)}KB gzip, over the ${CODE_CEILING_KB}KB ceiling`);
    failed = true;
}

// Images are served as-is, so raw bytes are what the visitor pays.
for (const name of readdirSync(root)) {
    if (!IMAGE_TYPES.has(extname(name).toLowerCase())) {
        continue;
    }

    const kb = statSync(join(root, name)).size / 1024;
    console.log(`  image  ${kb.toFixed(1)} KB       (ceiling ${IMAGE_CEILING_KB} KB)  ${name}`);

    if (kb > IMAGE_CEILING_KB) {
        console.error(`FAIL  ${name} is ${kb.toFixed(1)}KB, over the ${IMAGE_CEILING_KB}KB ceiling`);
        failed = true;
    }
}

if (failed) {
    process.exit(1);
}

console.log('OK    within budget');
