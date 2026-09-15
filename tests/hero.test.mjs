import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, js, html, data } from './helpers.mjs';

// Both title assertions scope themselves to the `hero:` block first. Unanchored,
// `/title:/` matches the next `title:` anywhere in data.js - `panel.title` is the
// one that would silently stand in - so deleting hero.title would not fail a test.
// The indentation of the closing brace is deliberately NOT pinned: reformatting
// data.js is not a regression, and this branch has already lost time to regexes
// that asserted whitespace instead of behaviour.
const heroBlock = () => {
    const block = data().match(/\n(\s*)hero:\s*\{([\s\S]*?)\n\1\}/);
    assert.ok(block, 'data.js has no i18n.hero block');
    return block[2];
};

test('the headline has authored line breaks in both locales', () => {
    const hero = heroBlock();
    const lines = hero.match(/titleLines:\s*\{([\s\S]*?)\n\s*\}/);
    assert.ok(lines, 'hero.titleLines is missing or not shaped as expected');
    assert.match(lines[1], /en:\s*\[/, 'titleLines.en is missing');
    assert.match(lines[1], /vi:\s*\[/, 'titleLines.vi is missing');
});

test('both locales break into the same number of lines', () => {
    // `.rule-draw` waits for the LAST line by hardcoding its index. A locale with
    // an extra line would have the rule draw before the headline finished, and a
    // locale with one fewer would leave a visible gap. Nothing else enforces this.
    const lines = heroBlock().match(/titleLines:\s*\{([\s\S]*?)\n\s*\}/)[1];
    const count = (key) => {
        const arr = lines.match(new RegExp(key + ":\\s*\\[([\\s\\S]*?)\\]"));
        assert.ok(arr, `titleLines.${key} is missing`);
        return (arr[1].match(/'/g) || []).length / 2;
    };
    assert.equal(count('en'), count('vi'), 'en and vi must have the same line count');
    assert.equal(count('en'), 4, '.rule-draw hardcodes the last index as 3');
});

test('the single-string title survives as the no-JS and meta fallback', () => {
    assert.match(heroBlock(), /\btitle:\s*\{[\s\S]{0,200}?en:\s*'/, 'hero.title must stay');
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

/* The headline is the one piece of above-the-fold motion, and it is driven by a
   clock rather than by `view()` - anything already on screen at load sits at
   100% of a view() timeline and never animates. Each of the three pieces below
   could be deleted on its own with the whole suite still green: the animation
   itself, the keyframes it names, and the stagger delay. Delete the animation
   and the headline simply appears; delete the delay and all four lines arrive
   at once, which is the effect, not a detail of it. */
test('each headline line rises out of its own baseline, staggered by its index', () => {
    const rule = css().match(/\.hero-line\s*>\s*span\s*\{([\s\S]*?)\n\}/);
    assert.ok(rule, 'style.css has no `.hero-line > span` rule');
    assert.match(
        rule[1],
        /animation:\s*hero-line-in\b/,
        'nothing animates the headline lines in; the hero is the only above-the-fold motion on the page'
    );
    assert.match(
        rule[1],
        /animation-delay:\s*calc\([^;]*var\(--delay-hero-start\)[^;]*var\(--stagger-hero\)[^;]*\);/,
        'without the staggered animation-delay all four lines arrive on the same frame'
    );
    assert.match(
        rule[1],
        /var\(--reveal-i\b/,
        'the stagger has to read the authored line index, or every line takes the same delay'
    );
});

test('the headline keyframes move a line up out of its own clip', () => {
    const frames = css().match(/@keyframes hero-line-in\s*\{([\s\S]*?)\n\}/);
    assert.ok(frames, 'style.css has no `@keyframes hero-line-in`; the animation the hero names does not exist');
    assert.match(frames[1], /opacity:\s*0/);
    assert.match(
        frames[1],
        /transform:\s*translateY\(/,
        'the line has to start below its own baseline, or `overflow: hidden` on .hero-line clips nothing'
    );
});

test('the accent rule draws itself from the left', () => {
    const sheet = css();
    const rule = sheet.match(/\.rule-draw\s*\{([\s\S]*?)\n\}/);
    assert.ok(rule, 'style.css has no .rule-draw rule');
    assert.match(rule[1], /transform-origin:\s*left/);
    assert.match(
        rule[1],
        /animation:\s*rule-draw\b/,
        'nothing applies the rule-draw animation, so the accent rule is just a static 1px line'
    );
    // Timed off the LAST headline line (index 3) plus a beat, so it reads as a
    // follow-through. Without the delay it draws under a headline still moving.
    assert.match(
        rule[1],
        /animation-delay:\s*calc\([^;]*var\(--stagger-hero\)[^;]*\);/,
        'the accent rule must wait for the last headline line'
    );
    assert.match(sheet, /@keyframes rule-draw\b/);
    assert.match(html(), /class="rule-draw"/);
});
