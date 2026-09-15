import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, js } from './helpers.mjs';

test('the reveal is driven by a view() timeline where supported', () => {
    const block = css().match(
        /@supports\s*\(animation-timeline:\s*view\(\)\)\s*\{([\s\S]*?)\n\}/
    );
    assert.ok(block, 'no `@supports (animation-timeline: view())` block found');
    assert.match(block[1], /animation-timeline:\s*view\(\);/);
    assert.match(block[1], /animation-range:\s*entry/);
});

test('a fallback branch exists for browsers without scroll-driven animation', () => {
    assert.match(css(), /@supports\s+not\s*\(animation-timeline:\s*view\(\)\)/);
});

test('the fallback stays gated on .js-animate so a no-JS page is not left blank', () => {
    const fallback = css().match(
        /@supports\s+not\s*\(animation-timeline:\s*view\(\)\)\s*\{([\s\S]*?)\n\}/
    );
    assert.ok(fallback, 'no `@supports not (animation-timeline: view())` block found');
    assert.match(fallback[1], /\.js-animate\s+\.reveal/);
    assert.doesNotMatch(
        fallback[1],
        /\n\s*\.reveal\s*\{/,
        'an ungated `.reveal { opacity: 0 }` hides content when JS is unavailable'
    );
});

test('initReveal returns early when the browser drives the reveal itself', () => {
    const initReveal = js().match(/function initReveal\(\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(initReveal, 'main.js has no initReveal function');
    assert.match(initReveal[1], /CSS\.supports\(\s*'animation-timeline:\s*view\(\)'\s*\)/);
});

test('staggered elements carry both an index and a delay, one per reveal path', () => {
    const source = js();
    assert.match(source, /--reveal-i:\$\{/, 'the scroll path staggers by --reveal-i');
    assert.match(source, /--reveal-delay:\$\{/, 'the fallback path staggers by --reveal-delay');
});
