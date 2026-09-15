import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, js, html, rootBlock, cssOutsideRoot, blankComments } from './helpers.mjs';

/* Both sources are read with comments blanked. Every assertion here locates
   code by index or counts occurrences, and this sheet documents its own scroll
   timelines at length: the prose beside the header block names
   `animation-timeline`, `animation-range` and the scroll listener it replaced.
   Matching that prose as if it were code is the bug this branch shipped five
   times. */
const sheet = () => blankComments(css());
const source = () => blankComments(js());

test('the header background is a token, not a literal', () => {
    assert.match(rootBlock(), /--bg-header\s*:/);
    assert.doesNotMatch(cssOutsideRoot(), /rgba\(10,\s*11,\s*12,\s*0\.85\)/);
});

/* Spec 3.4 effects 5 and 6 - the entire CSS deliverable of Task 4 - are the two
   rules inside the `@supports (animation-timeline: scroll(root block))` block
   beside "Header on scroll". Deleting that whole block used to leave 46/46
   green, because the only assertion in the area matched the @supports CONDITION
   anywhere in the sheet, and the grid drift up at the top of the file opens a
   second block carrying the identical condition. Finding a condition proves
   nothing about either block.

   So: prove the keyframes exist, prove something applies them, and walk the
   brace depth of every matching guard to prove both declarations fall INSIDE
   one. Unguarded, `animation: header-settle var(--dur-base) linear both` is a
   250ms clock on page load in every browser without scroll timelines - the
   header would fade in once and never respond to scroll again. */
function guardSpans(text) {
    const spans = [];
    const guard = /@supports\s*\(animation-timeline:\s*scroll\(root(?: block)?\)\)/g;

    for (const hit of text.matchAll(guard)) {
        const open = text.indexOf('{', hit.index);
        if (open === -1) {
            continue;
        }
        let depth = 0;
        for (let i = open; i < text.length; i++) {
            if (text[i] === '{') depth++;
            else if (text[i] === '}' && --depth === 0) {
                spans.push([open, i]);
                break;
            }
        }
    }

    return spans;
}

test('the header settles and the progress bar grows on a root scroll timeline, inside its guard', () => {
    const text = sheet();
    assert.match(text, /@keyframes header-settle\b/, 'style.css has no `@keyframes header-settle`');
    assert.match(text, /@keyframes progress-grow\b/, 'style.css has no `@keyframes progress-grow`');

    const spans = guardSpans(text);
    assert.ok(spans.length > 0, 'style.css has no `@supports (animation-timeline: scroll(root block))` guard');

    for (const [name, effect] of [
        ['header-settle', 'the header never settles into its own surface on scroll'],
        ['progress-grow', 'the scroll progress bar never grows']
    ]) {
        const applied = text.indexOf(`animation: ${name}`);
        assert.ok(applied > -1, `nothing applies the ${name} animation, so ${effect}`);

        const inside = spans.some(([open, close]) => applied > open && applied < close);
        assert.ok(
            inside,
            `\`animation: ${name}\` must sit inside a scroll-timeline @supports guard, not merely somewhere after one - unguarded it becomes a one-shot clock on load in browsers without scroll timelines`
        );

        const rule = text.slice(text.lastIndexOf('{', applied) + 1, text.indexOf('}', applied));
        assert.match(
            rule,
            /animation-timeline:\s*scroll\(root block\)/,
            `the ${name} rule must name its timeline; without it the animation runs on the document clock`
        );
    }

    // Colour only. Animating the header's `padding` or `height` relayouts the
    // page on every scroll frame, which is motion law 2.
    const frames = text.match(/@keyframes header-settle\s*\{([\s\S]*?)\n\}/);
    assert.ok(frames, 'no header-settle keyframes');
    assert.match(frames[1], /background-color:/);
    assert.doesNotMatch(frames[1], /\b(?:padding|height|width)\s*:/, 'the header settle must not animate layout');
});

test('the header settle is ranged to the hero, not to the whole document', () => {
    const rule = sheet().match(/\.site-header\s*\{[^{}]*animation:\s*header-settle[^{}]*\}/);
    assert.ok(rule, 'no `.site-header` rule applies header-settle');
    assert.match(
        rule[0],
        /animation-range:\s*0\s+[\d.]+rem/,
        'without a short `animation-range` the header settles across the entire page instead of over the hero'
    );
});

test('the page carries the element both progress paths drive', () => {
    const element = html().match(/<span[^>]*id="scrollProgress"[^>]*>/);
    assert.ok(element, 'index.html has no #scrollProgress element - the CSS progress bar and the JS fallback both target it');
    assert.match(
        element[0],
        /class="[^"]*\bscroll-progress\b/,
        '#scrollProgress must carry .scroll-progress, which is the selector the CSS drives'
    );
});

test('initHeader returns early where CSS drives both effects', () => {
    const initHeader = source().match(/function initHeader\(\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(initHeader, 'main.js has no initHeader function');
    assert.match(initHeader[1], /CSS\.supports\(\s*'animation-timeline:\s*scroll\(root block\)'\s*\)/);
});

test('initHeader hands off to the fallback on browsers that need it', () => {
    const initHeader = source().match(/function initHeader\(\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(initHeader, 'main.js has no initHeader function');
    // Defining initHeaderScrollFallback is not the same as reaching it. Without
    // this call the progress bar is frozen at scaleX(0) on every browser
    // without scroll-driven animation, and nothing else in the file notices.
    assert.match(
        initHeader[1],
        /(?:^|[^\w.])initHeaderScrollFallback\(\)\s*;/m,
        'initHeader must CALL initHeaderScrollFallback after the early return'
    );
});

test('the scroll progress bar is driven by CSS, not by a transform written from the main path', () => {
    const initHeader = source().match(/function initHeader\(\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(initHeader, 'main.js has no initHeader function');
    assert.doesNotMatch(initHeader[1], /progress\.style\.transform/);
});

test('the scroll listener lives only in the clearly-named fallback', () => {
    const text = source();
    const listeners = text.match(/addEventListener\(\s*'scroll'/g) || [];
    assert.equal(listeners.length, 1, 'expected exactly one scroll listener, in the fallback');

    const fallback = text.match(/function initHeaderScrollFallback\(\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(fallback, 'the scroll listener must live in initHeaderScrollFallback');
    assert.match(fallback[1], /addEventListener\(\s*'scroll'/);
});
