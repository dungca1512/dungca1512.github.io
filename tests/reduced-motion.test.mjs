import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, js } from './helpers.mjs';

const reducedBlock = () => {
    const match = css().match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(match, 'style.css has no prefers-reduced-motion block');
    return match[1];
};

test('reduced motion does not blanket-kill every animation', () => {
    assert.doesNotMatch(
        reducedBlock(),
        /animation:\s*none\s*!important/,
        'blanket `animation: none !important` removes feedback along with decoration'
    );
});

test('reduced motion does not blanket-kill every transition', () => {
    assert.doesNotMatch(
        reducedBlock(),
        /transition:\s*none\s*!important/,
        'blanket `transition: none !important` removes hover feedback'
    );
});

test('reduced motion keeps colour and opacity feedback, capped at --dur-fast', () => {
    const block = reducedBlock();
    assert.match(block, /transition-property:\s*opacity[^;]*!important/);
    assert.match(block, /transition-duration:\s*var\(--dur-fast\)\s*!important/);
});

test('revealed content lands at its final state under reduced motion', () => {
    const block = reducedBlock();
    const reset = block.match(/\.reveal,\s*\n\s*\.reveal-load\s*\{([\s\S]*?)\}/);
    assert.ok(reset, 'the reduced-motion block must reset .reveal and .reveal-load');

    // `!important` is the whole point: `.js-animate .reveal` is (0,2,0) and outranks this
    // (0,1,0) selector, so without the weight the reset is dead code and below-fold
    // content stays at opacity:0 under reduced motion.
    assert.match(reset[1], /opacity:\s*1\s*!important/);
    assert.match(reset[1], /transform:\s*none\s*!important/);
    assert.match(reset[1], /clip-path:\s*none\s*!important/);
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
    assert.match(reducedBlock(), /transition-property:[^;]*\bfilter\b[^;]*!important/);
});
