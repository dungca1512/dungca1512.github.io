import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, js, html, data, rootBlock, blankComments } from './helpers.mjs';

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

/* Two assertions, because the size now arrives through a token and either half
   can fail on its own: the headline can stop spending --display-1, or
   --display-1 can be quietly shrunk and take every display on the page with it.
   The floor is 5rem rather than 4: the reference sets its h1 at 89.6px, and a
   headline that tops out below that is the exact failure this branch exists to
   correct. */
test('the headline is scaled up to carry the page', () => {
    const rule = css().match(/\.hero-copy h1\s*\{([\s\S]*?)\n\}/);
    assert.ok(rule, 'style.css has no .hero-copy h1 rule');
    assert.match(rule[1], /font-size:\s*var\(--display-1\)/, 'the headline must spend the display scale, not its own size');

    const max = rootBlock().match(/--display-1:\s*clamp\([^,]+,[^,]+,\s*([\d.]+)rem\s*\)/);
    assert.ok(max, '--display-1 must be a clamp() so the headline scales with the viewport');
    assert.ok(Number(max[1]) >= 5, `the display scale maxes out at ${max[1]}rem, expected at least 5rem`);
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

/* The underline is drawn, not extended: a dashed stroke un-hiding along its own
   curve, not a rectangle scaling from 0. The distinction is the whole reason it
   is an SVG at all, and it is entirely recoverable from the sheet - a
   `transform: scaleX()` keyframe here would mean someone put the bar back and
   left the markup behind. */
test('the accent rule draws itself along a curve', () => {
    const sheet = blankComments(css());

    const frames = sheet.match(/@keyframes rule-draw\s*\{([\s\S]*?)\n\}/);
    assert.ok(frames, 'style.css has no @keyframes rule-draw');
    assert.match(frames[1], /stroke-dashoffset:\s*0/, 'the rule must be drawn by retracting a dash, not by scaling a bar');
    assert.doesNotMatch(frames[1], /transform:/, 'a transform here means the stroke went back to being a scaling rectangle');

    const stroke = sheet.match(/\.rule-draw path\s*\{([\s\S]*?)\n\}/);
    assert.ok(stroke, 'style.css has no .rule-draw path rule');
    assert.match(stroke[1], /stroke-dasharray:\s*var\(--draw-length\)/);
    assert.match(stroke[1], /stroke-dashoffset:\s*var\(--draw-length\)/, 'without a starting offset the whole stroke is visible before it draws');
    assert.match(
        stroke[1],
        /animation:\s*rule-draw\b/,
        'nothing applies the rule-draw animation, so the accent rule is just a static line'
    );
    // Timed off the LAST headline line (index 3) plus a beat, so it reads as a
    // follow-through. Without the delay it draws under a headline still moving.
    assert.match(
        stroke[1],
        /animation-delay:\s*calc\([^;]*var\(--stagger-hero\)[^;]*\);/,
        'the accent rule must wait for the last headline line'
    );
    assert.match(rootBlock(), /--draw-length\s*:/, '--draw-length must be a token; the dash length is the path length');
});

/* Two attributes carry the hand-drawn quality and both look like boilerplate.
   `preserveAspectRatio="none"` is what varies the stroke weight around each
   curve; without it the line comes out mechanically even. And a curve command
   is what makes it a curve - a `d` of straight line segments would satisfy
   every assertion above and draw a bar. */
test('the underline is a squashed curve, not a straight segment', () => {
    const svg = html().match(/<svg class="rule-draw"[\s\S]*?<\/svg>/);
    assert.ok(svg, 'index.html has no .rule-draw svg');
    assert.match(svg[0], /preserveAspectRatio="none"/, 'uniform scaling gives an evenly weighted, mechanical line');
    assert.match(svg[0], /aria-hidden="true"/, 'the underline is decoration and must not be announced');
    const d = svg[0].match(/\sd="([^"]+)"/);
    assert.ok(d, 'the underline svg has no path data');
    assert.match(d[1], /[Cc]/, 'the path must curve; a line of straight segments is the bar this replaced');
});

/* The one place reduced motion could delete content instead of stilling it: the
   stroke's resting state is invisible, so the blanket `transform: none` reset -
   which is what used to restore this element - now reaches nothing. */
test('reduced motion leaves the underline drawn, not erased', () => {
    const block = blankComments(css()).match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*)/);
    assert.ok(block, 'style.css has no reduced-motion block');
    assert.match(
        block[1],
        /\.rule-draw path\s*\{[^}]*stroke-dashoffset:\s*0\s*!important/,
        'under reduced motion the stroke must be shown drawn, not left hidden by its own dashoffset'
    );
});
