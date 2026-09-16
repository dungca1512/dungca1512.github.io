/* This site's advantage over a framework build is its weight. That is only true
   until someone stops watching. The ceilings below are set above where the site
   sits today - enough room to work, not enough to drift into a different class
   of page.

   The code ceiling moved from 40KB to 48KB when the sheet was redesigned from
   hairlines to raised surfaces (radii, shadows, washes, and the prose that
   argues for them). It moved because the page changed on purpose, not because a
   gate was inconvenient - and it moved by less than the old "25% above today"
   rule would give (that would be 53KB), for a measured reason:

     style.css  63.3KB raw / 17.1KB gzip
     the same sheet with comments stripped  39.4KB raw / 7.1KB gzip

   Roughly 10KB gzip - about a quarter of everything a visitor downloads - is
   commentary, and Pages serves the sheet exactly as it is written. That is a
   deliberate trade (the comments are why the next person can edit this safely)
   but it is also the single largest line item here, and it is bigger than the
   entire redesign that pushed this ceiling up. The headroom left above is
   therefore small on purpose: the next increase should have to confront that
   10KB - by minifying on deploy, which this repo does not do today - rather
   than quietly absorb it. */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const CODE = ['index.html', 'style.css', 'main.js', 'data.js'];
const CODE_CEILING_KB = 48;
const IMAGE_CEILING_KB = 40;
const IMAGE_TYPES = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg', '.ico']);

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

// Ask git what ships, rather than reading the root directory. A flat
// `readdirSync(root)` only measured images sitting beside index.html, so the
// first `assets/` or `img/` folder anyone added would carry an unbudgeted 2MB
// hero straight past this gate. A recursive walk overcorrects the other way:
// it would weigh .playwright-mcp screenshots and this branch's scratch
// workspace, neither of which any visitor downloads. Tracked files are
// exactly the set Pages publishes, and the ignore rules that define it live
// in .gitignore where they are already maintained.
function trackedImages() {
    let listing;
    try {
        listing = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' });
    } catch (error) {
        // Fail rather than fall back to a partial scan: a budget gate that
        // silently stops measuring is worse than one that stops running.
        console.error(`FAIL  cannot list tracked files (${error.message.split('\n')[0]}).`);
        console.error('      This gate measures what git publishes, so it needs to run inside the repo.');
        process.exit(1);
    }

    return listing
        .split('\0')
        .filter((name) => name && IMAGE_TYPES.has(extname(name).toLowerCase()));
}

// Images are served as-is, so raw bytes are what the visitor pays.
for (const name of trackedImages()) {
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
