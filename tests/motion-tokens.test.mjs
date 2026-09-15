import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, rootBlock } from './helpers.mjs';

test('the five duration tokens are declared on :root', () => {
    const block = rootBlock();
    for (const name of ['--dur-instant', '--dur-fast', '--dur-base', '--dur-slow', '--dur-hero']) {
        assert.match(block, new RegExp(`${name}\\s*:\\s*\\d+ms`), `${name} is missing from :root`);
    }
});

test('both easing tokens are declared on :root', () => {
    const block = rootBlock();
    assert.match(block, /--ease-out-soft\s*:\s*cubic-bezier\(/, '--ease-out-soft is missing');
    assert.match(block, /--ease-spring\s*:\s*cubic-bezier\(/, '--ease-spring is missing');
});

test('the original --ease token survives, because existing rules use it', () => {
    assert.match(rootBlock(), /--ease\s*:\s*cubic-bezier\(/, '--ease is missing');
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
