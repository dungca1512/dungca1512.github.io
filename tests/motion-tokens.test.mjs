import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, rootBlock } from './helpers.mjs';

/* The mandated motion scale. These are literals, not patterns: this suite is
   the only automated guard on the token scale's values, so a regression that
   silently changes a number (e.g. --dur-instant to 50ms) has to fail here. */
const DURATIONS = [
    ['--dur-instant', '100ms'],
    ['--dur-fast', '150ms'],
    ['--dur-base', '250ms'],
    ['--dur-slow', '400ms'],
    ['--dur-hero', '700ms'],
];

const EASINGS = [
    ['--ease-out-soft', 'cubic-bezier(0.2, 0, 0, 1)'],
    ['--ease-spring', 'cubic-bezier(0.34, 1.56, 0.64, 1)'],
];

const ORIGINAL_EASE = ['--ease', 'cubic-bezier(0.2, 0.7, 0.2, 1)'];

/* Turns an expected literal into a regex that tolerates reformatting
   (whitespace around the colon and after commas) without tolerating a
   changed number - so reformatting the stylesheet doesn't break the suite,
   but an altered value still does. */
function tolerant(expected) {
    return expected
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/,\s*/g, ',\\s*');
}

/* Whatever value is actually declared for `name` in `block`, so a failure
   message can name it. Without this, a token present at the wrong value
   would report as "missing", sending the next reader looking in the wrong
   place. */
function declaredValue(block, name) {
    const match = block.match(new RegExp(`${name}\\s*:\\s*([^;]+);`));
    return match ? match[1].trim() : null;
}

function assertToken(block, name, expected) {
    const pattern = new RegExp(`${name}\\s*:\\s*${tolerant(expected)}\\s*;`);
    const found = declaredValue(block, name);
    const foundDescription = found === null ? '(not declared)' : `"${found}"`;
    assert.match(block, pattern, `${name}: expected "${expected}", found ${foundDescription}`);
}

test('the five duration tokens are declared on :root', () => {
    const block = rootBlock();
    for (const [name, value] of DURATIONS) {
        assertToken(block, name, value);
    }
});

test('both easing tokens are declared on :root', () => {
    const block = rootBlock();
    for (const [name, value] of EASINGS) {
        assertToken(block, name, value);
    }
});

test('the original --ease token survives, because existing rules use it', () => {
    const [name, value] = ORIGINAL_EASE;
    assertToken(rootBlock(), name, value);
});

test('there is exactly one :root block, so tokens have one home', () => {
    /* Anchored to the start of the line: this counts top-level :root token
       blocks only. A pre-existing, unrelated :root override nested inside a
       @media query (a responsive --gutter tweak, indented and not a token
       definition block) is not a duplicate of the kind Task 1 removes, so it
       is intentionally excluded here. */
    const count = css().match(/^:root\s*\{/gm) || [];
    assert.equal(count.length, 1, `found ${count.length} top-level :root blocks, expected 1`);
});
