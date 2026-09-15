/* Colour and duration literals are how a token system dies: one rule at a time,
   each one locally reasonable. This gate reads style.css, ignores the :root
   block where literals are the whole point, and fails on anything left over.
   Run by `npm run verify`, which CI runs on every push.

   What this gate does NOT catch, stated plainly so nobody mistakes a pass for
   a proof:

   - It reads one line at a time. A declaration split across lines
     (`transition:\n    color 0.15s linear;`) is invisible to both regexes.
     Nothing in the build enforces single-line declarations; the sheet simply
     writes them that way today. If that changes, this gate goes blind before
     it goes red.
   - The colour regex catches `#hex`, `rgb(`, `rgba(`, `hsl(` and `hsla(` -
     exactly the forms spec 3.6 enumerates. Named colours (`red`,
     `rebeccapurple`), `color-mix()`, `oklch()` and `lab()` pass through.
     Widen the regex when the sheet starts using them, not before. */
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
// landing on a stale number.
//
// The number beside each entry is how many times that exact declaration
// appears in the sheet, and it is checked in BOTH directions. Text alone is
// not enough cover: a brand-new rule written as `transition: color 0.15s
// linear;` would otherwise match an existing entry and pass silently, which
// is precisely the sweep spec 3.1 forbids. A count that goes UP means a new
// rule slipped in - fix the rule, not this file. A count that goes DOWN
// means a declaration was retimed or deleted, so the number here (or the
// whole entry, at zero) must come down with it. This list may grow in value
// only when the sheet does, and it may never grow by hand to make a failure
// go away.
const ALLOWED_DURATIONS = new Map([
    // Group A - the reduced-motion off-switches. New on this branch and
    // deliberate: they are the mechanism by which reduced motion works, and
    // --dur-instant (100ms) would defeat the purpose of collapsing to ~0.
    ['animation-duration: 1ms !important;', 1],
    ['animation-delay: 0ms !important;', 1],
    ['transition-delay: 0ms !important;', 1],

    // Group B - declarations that predate this branch. Spec §3.1 scopes
    // rewriting them out ("rewriting them is out of scope"). Two of these
    // (`width`, `height`) also violate motion law 2 (never animate
    // width/height), and three exceed the 700ms ceiling of law 3 - recorded
    // here rather than fixed because retiming them is a visual change, not a
    // gate change.
    ['transition: color 0.15s linear;', 3],
    ['transition: color 0.15s linear, background 0.15s linear;', 1],
    ['transition: background 0.15s linear, color 0.15s linear;', 1],
    ['transition: border-color 0.15s linear, background 0.15s linear, color 0.15s linear;', 1],
    ['transition: filter 0.25s linear;', 1],
    ['transition: transform 0.9s var(--ease) 0.12s;', 1],
    ['transition: color 0.3s linear;', 1],
    ['transition: background 0.15s linear;', 2],
    ['transition: border-color 0.15s linear, color 0.15s linear;', 1],
    ['transition: transform 0.28s var(--ease);', 1],
    ['animation: sd-print 0.45s var(--ease) forwards;', 1],
    ['animation-delay: calc(var(--i, 0) * 85ms + 250ms);', 1],
    ['animation: sd-caret-in 0s linear 700ms forwards, sd-blink 1.15s steps(1) 700ms infinite;', 1],
    ['transition: opacity 0.2s linear, transform 0.28s var(--ease);', 1],
    ['transition: color 0.2s linear;', 2],
    ['transition: width 0.95s var(--ease);', 1],
    ['transition: height 0.7s var(--ease);', 1],
    ['transition: width 0.8s var(--ease);', 1],
    ['transition: background 0.2s linear;', 1]
]);

const seenAllowed = new Map();
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
            seenAllowed.set(trimmed, (seenAllowed.get(trimmed) || 0) + 1);
        } else {
            failures.push([number, 'literal duration - use a --dur-* token', trimmed]);
        }
    }
});

// An allowlist nobody prunes becomes a permanent exemption, and an allowlist
// keyed on text alone is a licence to write the same literal again. Both are
// the same check: the sheet must contain each allowed declaration EXACTLY as
// many times as this file says. Too many means a new rule borrowed an
// existing exemption; too few means one was retimed or removed and its entry
// (or its count) should have come down with it. Reported separately from the
// literal-duration failures above, with its own wording per direction, so
// neither is ever mistaken for the other.
const miscounts = [];
for (const [entry, expected] of ALLOWED_DURATIONS) {
    const actual = seenAllowed.get(entry) || 0;
    if (actual !== expected) {
        miscounts.push([entry, expected, actual]);
    }
}

if (miscounts.length > 0) {
    console.error(`FAIL  ${miscounts.length} allowlist entr${miscounts.length === 1 ? 'y' : 'ies'} in scripts/check-tokens.mjs no longer ${miscounts.length === 1 ? 'matches' : 'match'} style.css\n`);
    for (const [entry, expected, actual] of miscounts) {
        console.error(`  ${entry}`);
        console.error(`    expected ${expected} occurrence(s), found ${actual}`);
        console.error(actual > expected
            ? '    A NEW rule reused this exemption. Give it a --dur-* token instead of raising the count here.\n'
            : '    This declaration was retimed or removed. Lower the count (delete the entry at zero); do not retime anything else to fix this gate.\n');
    }
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
