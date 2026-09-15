import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, js, blankComments } from './helpers.mjs';

/* EVERY reduced-motion block, not the first one.
   `.match()` returns one result, so the negative assertions below used to see
   only the first block in the sheet. Appending a second
   `@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`
   to style.css left the whole suite green - precisely the regression this
   branch exists to prevent, sitting in the file the tests were reading.
   Cascade order makes the LAST matching block win, so the one nobody was
   looking at is the one that decides the behaviour.

   Comments are blanked before matching (see helpers). These tests assert the
   ABSENCE of rules like `transition: none !important`, and a comment explaining
   why that rule is banned would otherwise fail the very test documenting it. */
const reducedBlocks = () => {
    const blocks = [
        ...blankComments(css()).matchAll(
            /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/g
        )
    ].map((match) => match[1]);
    assert.ok(blocks.length > 0, 'style.css has no prefers-reduced-motion block');
    return blocks;
};

/* All reduced-motion blocks as one text, for assertions that ask whether
   something is declared SOMEWHERE under reduced motion. Only the negative
   assertions have to look block by block. */
const reducedCss = () => reducedBlocks().join('\n');

test('no reduced-motion block blanket-kills every animation', () => {
    const blocks = reducedBlocks();
    blocks.forEach((block, index) => {
        assert.doesNotMatch(
            block,
            /animation:\s*none\s*!important/,
            `reduced-motion block ${index + 1} of ${blocks.length}: blanket \`animation: none !important\` removes feedback along with decoration`
        );
    });
});

test('no reduced-motion block blanket-kills every transition', () => {
    const blocks = reducedBlocks();
    blocks.forEach((block, index) => {
        assert.doesNotMatch(
            block,
            /transition:\s*none\s*!important/,
            `reduced-motion block ${index + 1} of ${blocks.length}: blanket \`transition: none !important\` removes hover feedback`
        );
    });
});

test('reduced motion keeps colour and opacity feedback, capped at --dur-fast', () => {
    const block = reducedCss();
    assert.match(block, /transition-property:\s*opacity[^;]*!important/);
    assert.match(block, /transition-duration:\s*var\(--dur-fast\)\s*!important/);
});

/* Every class that animates itself into place from a start state has to appear
   in this reset list, or reduced motion leaves it stuck at that start state -
   invisible, or offset, forever. The list is checked one selector at a time.
   Matching it as one blob passes as long as ANY of it survives, which is how
   two-thirds of it could be deleted with the suite still green. */
const RESET_SELECTORS = [
    '.section-head.reveal::after',
    '.reveal',
    '.hero-line > span',
    '.rule-draw'
];

test('every self-animating rule lands at its final state under reduced motion', () => {
    // Anchored on `.hero-line > span` - the rule that actually carries the
    // above-the-fold entrance - rather than on the order of the selector list:
    // the comment above that rule tells later tasks to add their own classes to
    // it, and pinning the order would fail every one of them. (It was anchored
    // on `.reveal-load`, a selector that matched no element anywhere, so the
    // assertion could not fail for any reason worth failing for.)
    const reset = reducedCss().match(/([^{}]*\.hero-line\s*>\s*span[^{}]*)\{([\s\S]*?)\}/);
    assert.ok(reset, 'the reduced-motion block must reset `.hero-line > span` along with the reveal rules');

    const listed = reset[1]
        .split(',')
        .map((selector) => selector.replace(/\s+/g, ' ').trim())
        .filter(Boolean);

    for (const selector of RESET_SELECTORS) {
        assert.ok(
            listed.includes(selector),
            `\`${selector}\` is missing from the reduced-motion reset list (found: ${listed.join(', ')}); it animates itself in from a start state, so without the reset it stays there`
        );
    }

    // `!important` is the whole point: `.js-animate .reveal` is (0,2,0) and outranks this
    // (0,1,0) selector, so without the weight the reset is dead code and below-fold
    // content stays at opacity:0 under reduced motion.
    assert.match(reset[2], /opacity:\s*1\s*!important/);
    assert.match(reset[2], /transform:\s*none\s*!important/);
    assert.match(reset[2], /clip-path:\s*none\s*!important/);
});

test('reduced motion is handled in CSS, not branched on in the reveal JS', () => {
    const initReveal = js().match(/function initReveal\(\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(initReveal, 'main.js has no initReveal function');
    assert.doesNotMatch(
        initReveal[1],
        /prefers-reduced-motion/,
        'initReveal must not duplicate the CSS reduced-motion rule'
    );
});

test('paint-only hover feedback survives reduced motion', () => {
    // filter is one of the four animatable properties in the spec and drives the avatar's
    // grayscale hover; dropping it from the narrowed list silently kills that feedback.
    assert.match(reducedCss(), /transition-property:[^;]*\bfilter\b[^;]*!important/);
});
