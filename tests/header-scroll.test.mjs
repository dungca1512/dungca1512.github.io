import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, js, rootBlock, cssOutsideRoot } from './helpers.mjs';

test('the header background is a token, not a literal', () => {
    assert.match(rootBlock(), /--bg-header\s*:/);
    assert.doesNotMatch(cssOutsideRoot(), /rgba\(10,\s*11,\s*12,\s*0\.85\)/);
});

test('the header settles in on a root scroll timeline', () => {
    assert.match(css(), /animation-timeline:\s*scroll\(root block\)/);
});

test('initHeader returns early where CSS drives both effects', () => {
    const initHeader = js().match(/function initHeader\(\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(initHeader, 'main.js has no initHeader function');
    assert.match(initHeader[1], /CSS\.supports\(\s*'animation-timeline:\s*scroll\(root block\)'\s*\)/);
});

test('the scroll progress bar is driven by CSS, not by a transform written from the main path', () => {
    const initHeader = js().match(/function initHeader\(\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(initHeader, 'main.js has no initHeader function');
    assert.doesNotMatch(initHeader[1], /progress\.style\.transform/);
});

test('the scroll listener lives only in the clearly-named fallback', () => {
    const source = js();
    const listeners = source.match(/addEventListener\(\s*'scroll'/g) || [];
    assert.equal(listeners.length, 1, 'expected exactly one scroll listener, in the fallback');

    const fallback = source.match(/function initHeaderScrollFallback\(\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(fallback, 'the scroll listener must live in initHeaderScrollFallback');
    assert.match(fallback[1], /addEventListener\(\s*'scroll'/);
});
