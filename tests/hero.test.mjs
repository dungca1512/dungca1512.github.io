import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, js, html, data } from './helpers.mjs';

test('the headline has authored line breaks in both locales', () => {
    const source = data();
    assert.match(source, /titleLines:\s*\{/, 'data.js has no hero.titleLines');

    const block = source.match(/titleLines:\s*\{([\s\S]*?)\n\s{12}\}/);
    assert.ok(block, 'hero.titleLines is not shaped as expected');
    assert.match(block[1], /en:\s*\[/, 'titleLines.en is missing');
    assert.match(block[1], /vi:\s*\[/, 'titleLines.vi is missing');
});

test('the single-string title survives as the no-JS and meta fallback', () => {
    assert.match(data(), /title:\s*\{[\s\S]{0,200}?en:\s*'/, 'hero.title must stay');
});

test('renderHeroTitle splits the headline into clipping blocks', () => {
    const source = js();
    assert.match(source, /function renderHeroTitle\(\)/);
    assert.match(source, /class="hero-line"/);
});

test('renderHeroTitle escapes the copy it interpolates', () => {
    const source = js();
    assert.match(source, /function escapeHtml\(/);

    const fn = source.match(/function renderHeroTitle\(\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(fn, 'main.js has no renderHeroTitle function');
    assert.match(fn[1], /escapeHtml\(/);
});

test('renderHeroTitle falls back to the plain title when lines are absent', () => {
    const fn = js().match(/function renderHeroTitle\(\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(fn);
    assert.match(fn[1], /Array\.isArray\(/);
});

test('renderHero calls renderHeroTitle, so the headline follows the language switch', () => {
    const fn = js().match(/function renderHero\(\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(fn, 'main.js has no renderHero function');
    assert.match(fn[1], /renderHeroTitle\(\)/);
});

test('the h1 is addressable by id and keeps its no-JS text', () => {
    const source = html();
    assert.match(source, /<h1 id="heroTitle"[^>]*>[^<]+<\/h1>/);
    assert.doesNotMatch(
        source,
        /<h1[^>]*data-i18n="hero\.title"/,
        'the generic i18n pass would overwrite the split lines with one string'
    );
});

test('the headline is scaled up to carry the page', () => {
    const rule = css().match(/\.hero-copy h1\s*\{([\s\S]*?)\n\}/);
    assert.ok(rule, 'style.css has no .hero-copy h1 rule');

    const max = rule[1].match(/font-size:\s*clamp\([^,]+,[^,]+,\s*([\d.]+)rem\s*\)/);
    assert.ok(max, '.hero-copy h1 must set a clamp() font-size');
    assert.ok(Number(max[1]) >= 4, `headline maxes out at ${max[1]}rem, expected at least 4rem`);
});

test('each line clips to its own baseline', () => {
    const rule = css().match(/\.hero-line\s*\{([\s\S]*?)\n\}/);
    assert.ok(rule, 'style.css has no .hero-line rule');
    assert.match(rule[1], /overflow:\s*hidden/);
});

test('the accent rule draws itself from the left', () => {
    const sheet = css();
    const rule = sheet.match(/\.rule-draw\s*\{([\s\S]*?)\n\}/);
    assert.ok(rule, 'style.css has no .rule-draw rule');
    assert.match(rule[1], /transform-origin:\s*left/);
    assert.match(sheet, /@keyframes rule-draw\b/);
    assert.match(html(), /class="rule-draw"/);
});
