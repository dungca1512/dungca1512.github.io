import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, js } from './helpers.mjs';

/* Scoped to the `.reveal` rule itself, not to the @supports block as a whole.
   The block holds two rules - `.reveal` and `.section-head.reveal::after` - and
   both carry `animation-timeline: view()` and an `animation-range`, so an
   assertion against the block's whole text stayed green with the entire
   `.reveal` rule gutted. That rule is the reveal; the other one is a heading
   underline. */
/* Every matching block, not the first one. The sheet now carries a second
   view()-guarded block - the blueprint's drift - and it happens to come first.
   Matching only the first made this helper assert against a block that was
   never going to contain `.reveal`, and the failure it reported ("nothing
   drives the scroll reveal") was a lie about a sheet that was fine. */
const revealRule = () => {
    const blocks = [...css().matchAll(
        /@supports\s*\(animation-timeline:\s*view\(\)\)\s*\{([\s\S]*?)\n\}/g
    )];
    assert.ok(blocks.length > 0, 'no `@supports (animation-timeline: view())` block found');

    for (const block of blocks) {
        const rule = block[1].match(/(?:^|\n)\s*\.reveal\s*\{([\s\S]*?)\n\s*\}/);
        if (rule) return rule[1];
    }
    assert.fail('no view() block has a `.reveal` rule; nothing drives the scroll reveal');
};

test('the reveal is driven by a view() timeline where supported', () => {
    const rule = revealRule();
    assert.match(css(), /@keyframes reveal-up\b/, 'style.css has no `@keyframes reveal-up`');
    assert.match(
        rule,
        /animation:\s*reveal-up\b/,
        'the .reveal rule names no animation, so below-fold content never reveals on the modern path'
    );
    assert.match(rule, /animation-timeline:\s*view\(\);/);
});

test('the reveal stagger lives in animation-range, because a scroll timeline ignores delay', () => {
    // Progress on a view() timeline is a POSITION, not a clock, so
    // `animation-delay` does nothing here and the stagger has to move the range
    // instead. Flattened to the default `normal`, every card in a grid reveals
    // on the same scroll position - the stagger disappears without a trace in
    // the sheet, which is why this asserts the --reveal-i term and not just the
    // property.
    assert.match(
        revealRule(),
        /animation-range:\s*entry[^;]*var\(--reveal-i\b[^;]*;/,
        'the reveal stagger must be expressed as an animation-range offset keyed on --reveal-i'
    );
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
