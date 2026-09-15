/* Colour and duration literals are how a token system dies: one rule at a time,
   each one locally reasonable. This gate reads style.css, ignores the :root
   block where literals are the whole point, and fails on anything left over.
   Run by `npm run verify`, which CI runs on every push. */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'style.css'), 'utf8');

// Blank comments across the WHOLE source first, not line-by-line. A per-line
// `line.split('/*')[0]` only catches a comment that opens and closes on the
// same line - the continuation lines of a multi-line block comment (of which
// this sheet has several, describing exactly the kind of literal this gate
// hunts) still read as code and false-positive. Replace comment bodies with
// blanks rather than deleting them so every reported line number still lines
// up with the real file. This is the fifth regex-over-raw-CSS/JS bug this
// branch has shipped because of comment text - don't reintroduce a sixth.
function blankComments(text) {
    return text.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
}

const withoutComments = blankComments(source);

const rootBlock = withoutComments.match(/:root\s*\{[\s\S]*?\}/);
if (!rootBlock) {
    console.error('FAIL  style.css has no :root block to define tokens in.');
    process.exit(1);
}

// Blank the :root block too, rather than removing it, so reported line
// numbers still match the real file.
const body = withoutComments.replace(rootBlock[0], rootBlock[0].replace(/[^\n]/g, ' '));

const COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;
const DURATION = /(?:transition|animation)(?:-duration|-delay)?\s*:[^;]*?\b\d*\.?\d+m?s\b/;

// `var(--token, 0ms)` is not a literal - it's a custom property with an
// identity fallback, the opposite of what this gate hunts. Strip var(...)
// (nesting-aware, so `calc(var(--i, 0) * 85ms)` still exposes the real `85ms`
// literal) before the duration test only. The colour test keeps scanning the
// raw line: a colour never legitimately hides inside a var() fallback here.
function stripVarCalls(line) {
    let out = '';
    let i = 0;
    while (i < line.length) {
        if (line.startsWith('var(', i)) {
            let depth = 1;
            let j = i + 4;
            while (j < line.length && depth > 0) {
                if (line[j] === '(') depth++;
                else if (line[j] === ')') depth--;
                j++;
            }
            i = j;
        } else {
            out += line[i];
            i++;
        }
    }
    return out;
}

// Pre-existing durations, out of scope to retime here (spec §3.1: "rewriting
// them is out of scope" for the sheet as it stood before this branch).
// Keyed on the exact trimmed declaration text, not line numbers - line
// numbers rot on the next edit and would silently re-admit a real violation
// landing on a stale number. This list may only ever shrink; if a rule here
// is retimed onto the token scale, delete its entry.
const ALLOWED_DURATIONS = new Set([
    // Group A - the reduced-motion off-switches. New on this branch and
    // deliberate: they are the mechanism by which reduced motion works, and
    // --dur-instant (100ms) would defeat the purpose of collapsing to ~0.
    'animation-duration: 1ms !important;',
    'animation-delay: 0ms !important;',
    'transition-delay: 0ms !important;',

    // Group B - declarations that predate this branch. Spec §3.1 scopes
    // rewriting them out ("rewriting them is out of scope"). Two of these
    // (`width`, `height`) also violate motion law 2 (never animate
    // width/height), and three exceed the 700ms ceiling of law 3 - recorded
    // here rather than fixed because retiming them is a visual change, not a
    // gate change.
    'transition: color 0.15s linear;',
    'transition: color 0.15s linear, background 0.15s linear;',
    'transition: background 0.15s linear, color 0.15s linear;',
    'transition: border-color 0.15s linear, background 0.15s linear, color 0.15s linear;',
    'transition: filter 0.25s linear;',
    'transition: transform 0.9s var(--ease) 0.12s;',
    'transition: color 0.3s linear;',
    'transition: background 0.15s linear;',
    'transition: border-color 0.15s linear, color 0.15s linear;',
    'transition: transform 0.28s var(--ease);',
    'animation: sd-print 0.45s var(--ease) forwards;',
    'animation-delay: calc(var(--i, 0) * 85ms + 250ms);',
    'animation: sd-caret-in 0s linear 700ms forwards, sd-blink 1.15s steps(1) 700ms infinite;',
    'transition: opacity 0.2s linear, transform 0.28s var(--ease);',
    'transition: color 0.2s linear;',
    'transition: width 0.95s var(--ease);',
    'transition: height 0.7s var(--ease);',
    'transition: width 0.8s var(--ease);',
    'transition: background 0.2s linear;'
]);

const seenAllowed = new Set();
const failures = [];

body.split('\n').forEach((line, index) => {
    const number = index + 1;

    if (COLOUR.test(line)) {
        failures.push([number, 'colour literal - move it to :root as a token', line.trim()]);
    }

    const durationLine = stripVarCalls(line);
    if (DURATION.test(durationLine)) {
        const trimmed = line.trim();
        if (ALLOWED_DURATIONS.has(trimmed)) {
            seenAllowed.add(trimmed);
        } else {
            failures.push([number, 'literal duration - use a --dur-* token', trimmed]);
        }
    }
});

// An allowlist nobody prunes becomes a permanent exemption. If a rewrite (or
// removal) drops an allowed declaration from the sheet, its entry must go
// too - fail loudly rather than let it sit as dead cover for a future
// violation. Reported as its own check, with its own message, so a stale
// entry is never confused with a real literal-duration violation above.
const staleEntries = [...ALLOWED_DURATIONS].filter((entry) => !seenAllowed.has(entry));
if (staleEntries.length > 0) {
    console.error(`FAIL  ${staleEntries.length} stale entr${staleEntries.length === 1 ? 'y' : 'ies'} in scripts/check-tokens.mjs' ALLOWED_DURATIONS - no longer present in style.css:\n`);
    for (const entry of staleEntries) {
        console.error(`  ${entry}`);
    }
    console.error('\nRemove the entry (do not retime the declaration as part of fixing this gate).');
    process.exit(1);
}

if (failures.length > 0) {
    console.error(`FAIL  ${failures.length} literal(s) outside :root in style.css\n`);
    for (const [number, why, text] of failures) {
        console.error(`  style.css:${number}  ${why}`);
        console.error(`    ${text}\n`);
    }
    process.exit(1);
}

console.log('OK    style.css: no colour or duration literals outside :root');
