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

/* A regex over raw CSS or JS matches COMMENT TEXT as readily as code, and this
   branch has shipped that bug five times. A test that forbids `transition: none
   !important` goes red the moment someone writes a comment explaining why that
   rule is forbidden; a test that locates a rule by index locates the comment
   mentioning it instead. This is the same function scripts/check-tokens.mjs
   uses, promoted here so both gates share one definition.

   Comment bodies are replaced with spaces rather than deleted, so every offset
   and line number still lines up with the real file - the brace-depth
   containment walks in grid-drift and has-dim depend on that.

   Block comments only. `//` is not stripped, because blanking it would eat the
   `//` in every `https://` URL in main.js and data.js.

   Do NOT route an assertion through this when the assertion's PURPOSE is to
   check that a comment is present. */
export function blankComments(text) {
    return text.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
}

/* style.css with comments AND the :root block blanked out. Literals are the
   whole point inside :root and a defect everywhere else, so tests that hunt for
   a stray literal search this, not the raw file. Comments go first, for both
   places below: a comment quoting the literal it warns against is
   documentation, not a violation, and a comment containing `:root {` would
   otherwise decide where the token block starts. Blanked rather than removed so
   reported offsets still line up with the real file. */
export function cssOutsideRoot() {
    const source = blankComments(css());
    const match = source.match(/:root\s*\{[\s\S]*?\}/);
    if (!match) {
        throw new Error('style.css has no :root block');
    }
    return source.replace(match[0], match[0].replace(/[^\n]/g, ' '));
}
