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

test('.js-animate means JS is running, not which reveal path is active', () => {
    const initReveal = js().match(/function initReveal\(\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(initReveal, 'main.js has no initReveal function');

    const body = initReveal[1];
    const added = body.indexOf("classList.add('js-animate')");
    const earlyReturn = body.indexOf('CSS.supports');

    assert.ok(added > -1, 'initReveal must add .js-animate');
    // Five effects unrelated to the reveal hang off this class. Adding it after
    // the early return switches all of them off on every browser that supports
    // scroll-driven animation.
    assert.ok(
        added < earlyReturn,
        '.js-animate must be set before the early return, or .sd-line, .chart-fill, .year-col-bar and .fresh-seg stop animating'
    );
});

test('nothing outside the fallback branch keys off .is-visible', () => {
    const sheet = css();
    const fallback = sheet.match(
        /@supports\s+not\s*\(animation-timeline:\s*view\(\)\)\s*\{([\s\S]*?)\n\}/
    );
    assert.ok(fallback, 'no `@supports not (animation-timeline: view())` block found');

    // `.is-visible` is set only by the observer, which only runs on the fallback
    // path. A rule outside that block keying off it is permanently stuck in its
    // not-yet-visible state on every modern browser.
    // Comments are stripped from both sides before counting. Without that this
    // asserts you may not even NAME `.is-visible` outside the fallback, which
    // makes the rule impossible to explain where it is not allowed to apply.
    const strip = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');

    assert.equal(
        (strip(sheet).match(/is-visible/g) || []).length,
        (strip(fallback[1]).match(/is-visible/g) || []).length,
        'a rule outside the fallback branch depends on .is-visible'
    );
});
