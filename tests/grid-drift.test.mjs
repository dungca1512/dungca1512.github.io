import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, rootBlock, cssOutsideRoot } from './helpers.mjs';

test('the grid line colour is a token', () => {
    assert.match(rootBlock(), /--grid-line\s*:/);
    assert.doesNotMatch(cssOutsideRoot(), /rgba\(255,\s*255,\s*255,\s*0\.028\)/);
});

test('the grid moved off body onto its own fixed layer', () => {
    const bodyRule = css().match(/\nbody\s*\{([\s\S]*?)\n\}/);
    assert.ok(bodyRule, 'style.css has no body rule');
    assert.doesNotMatch(bodyRule[1], /background-image:/, 'the grid belongs on body::before now');

    const layer = css().match(/body::before\s*\{([\s\S]*?)\n\}/);
    assert.ok(layer, 'style.css has no body::before grid layer');
    assert.match(layer[1], /position:\s*fixed/);
    assert.match(layer[1], /z-index:\s*-1/);
    assert.match(layer[1], /pointer-events:\s*none/);
});

test('the grid drifts on a scroll timeline', () => {
    const sheet = css();
    assert.match(sheet, /@keyframes grid-drift\b/);
    assert.match(sheet, /@supports\s*\(animation-timeline:\s*scroll\(root(?: block)?\)\)/);
});

test('the drift moves only transform', () => {
    const frames = css().match(/@keyframes grid-drift\s*\{([\s\S]*?)\n\}/);
    assert.ok(frames, 'no grid-drift keyframes');
    assert.match(frames[1], /transform:\s*translateY\(/);
    assert.doesNotMatch(frames[1], /background-position:/, 'background-position repaints the whole layer');
});
