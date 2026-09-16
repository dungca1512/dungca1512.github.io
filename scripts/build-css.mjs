/* style.css is written to be read: roughly two thirds of it is prose arguing
   for the rule underneath. Pages serves files exactly as they are committed, so
   until now every visitor downloaded that argument - 24.1KB gzip, of which
   15.7KB was commentary. That was the single largest line item in the whole
   page, bigger than the redesign that pushed the budget ceiling up in the first
   place, and check-budget.mjs has carried a note since then saying the next
   increase had to confront it rather than absorb it. This is that.

   The split: style.css stays the file a human edits, comments and all.
   style.min.css is generated from it and is the file index.html loads. The
   generated file is committed, because Pages publishes the repository and there
   is no deploy step to generate it in - which means it can go stale, which is
   what `--check` is for. `npm run verify` runs it, CI runs verify, so a sheet
   edited without a rebuild cannot reach main.

   What this does NOT do: rename, reorder, collapse whitespace inside a
   declaration, or touch a single token. It removes comments and the blank lines
   they leave behind, and it removes leading indentation - a newline still
   separates every line, so no two tokens can ever be joined by it. A minifier
   that rewrites `calc(100% - 4px)` or eats the space in `and (max-width: 860px)`
   buys a few hundred bytes and costs a class of bug nobody would look for here.
   After gzip the difference between this and a real minifier is noise; the
   comments were the whole story. */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SOURCE = 'style.css';
export const BUILT = 'style.min.css';

/* A regex over the raw sheet would be wrong for the same reason it has been
   wrong five times on this branch: it cannot see that it is inside a string.
   `content: '/*'` is legal CSS, and a regex would start a comment there and
   swallow the rest of the file. This walks the text instead, tracking which
   quote it is inside, and skips comments only where a comment can actually
   start. url() is deliberately not special-cased: an unquoted url() may not
   contain an unescaped quote, so the string tracking below cannot be fooled by
   one. */
export function stripComments(css) {
    let out = '';
    let i = 0;
    let quote = null;

    while (i < css.length) {
        const c = css[i];

        if (quote) {
            // A backslash escapes the next character, including the quote that
            // would otherwise close the string.
            if (c === '\\' && i + 1 < css.length) {
                out += c + css[i + 1];
                i += 2;
                continue;
            }
            if (c === quote) quote = null;
            out += c;
            i++;
            continue;
        }

        if (c === '"' || c === "'") {
            quote = c;
            out += c;
            i++;
            continue;
        }

        if (c === '/' && css[i + 1] === '*') {
            const end = css.indexOf('*/', i + 2);
            // An unterminated comment means the rest of the file is comment.
            // Dropping it silently would ship a half-sheet, so say so instead.
            if (end === -1) {
                throw new Error('unterminated /* comment - style.css does not parse');
            }
            i = end + 2;
            continue;
        }

        out += c;
        i++;
    }

    if (quote) {
        throw new Error(`unterminated ${quote} string - style.css does not parse`);
    }

    return out;
}

export function build(css) {
    return stripComments(css)
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '')
        .join('\n')
        .concat('\n');
}

// Braces are the one structural property worth checking, and it is cheap: a
// stripper that ate a rule, or a string that hid one, changes this count. It
// is not a CSS parser and does not pretend to be - it is a tripwire on the
// failure mode this file's whole design is trying to avoid.
function braceBalance(css) {
    let depth = 0;
    let lowest = 0;
    for (const c of css) {
        if (c === '{') depth++;
        else if (c === '}') depth--;
        if (depth < lowest) lowest = depth;
    }
    return { depth, lowest };
}

/* Everything below runs only when this file is the process entry point. The
   test suite imports `build` and `stripComments`, and without this guard that
   import REWROTE style.min.css as a side effect of running the tests - which
   would make `--check` pass in CI by having just regenerated the thing it is
   supposed to be checking. Caught by reading the test output, not by a gate. */
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
    main();
}

function main() {
    const source = readFileSync(join(root, SOURCE), 'utf8');
    const built = build(source);

    const before = braceBalance(stripComments(source));
    const after = braceBalance(built);
    if (before.depth !== after.depth || after.depth !== 0 || after.lowest < 0) {
        console.error(`FAIL  ${BUILT} is not brace-balanced (depth ${after.depth}, lowest ${after.lowest}).`);
        console.error('      The stripper changed the sheet\'s structure. Do not commit this.');
        process.exit(1);
    }

    if (process.argv.includes('--check')) {
        let current;
        try {
            current = readFileSync(join(root, BUILT), 'utf8');
        } catch {
            console.error(`FAIL  ${BUILT} is missing. Run \`npm run build\` and commit it.`);
            process.exit(1);
        }

        if (current !== built) {
            console.error(`FAIL  ${BUILT} is stale - ${SOURCE} has been edited since it was built.`);
            console.error('      index.html loads the built sheet, so this is what visitors would get.');
            console.error('      Run `npm run build` and commit the result.');
            process.exit(1);
        }

        console.log(`OK    ${BUILT} matches ${SOURCE}`);
    } else {
        writeFileSync(join(root, BUILT), built);
        console.log(`OK    ${BUILT} written (${source.length} -> ${built.length} bytes)`);
    }
}
