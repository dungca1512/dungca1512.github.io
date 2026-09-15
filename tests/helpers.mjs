/* The gates assert against the source files themselves. That is a deliberate
   limit: they prove the motion system is PRESENT, not that it looks right.
   Visual confirmation is the manual checklist in the spec, section 5. */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const readSource = (name) => readFileSync(join(ROOT, name), 'utf8');

export const css = () => readSource('style.css');
export const js = () => readSource('main.js');
export const html = () => readSource('index.html');
export const data = () => readSource('data.js');

/* The FIRST :root block is the token block. A second one further down the
   sheet would be a bug in its own right - see Task 1, step 6. */
export function rootBlock() {
    const match = css().match(/:root\s*\{([\s\S]*?)\}/);
    if (!match) {
        throw new Error('style.css has no :root block');
    }
    return match[1];
}

/* style.css with the :root block blanked out. Literals are the whole point
   inside :root and a defect everywhere else, so tests that hunt for a stray
   literal search this, not the raw file. Blanked rather than removed so
   reported offsets still line up with the real file. */
export function cssOutsideRoot() {
    const source = css();
    const match = source.match(/:root\s*\{[\s\S]*?\}/);
    if (!match) {
        throw new Error('style.css has no :root block');
    }
    return source.replace(match[0], match[0].replace(/[^\n]/g, ' '));
}
