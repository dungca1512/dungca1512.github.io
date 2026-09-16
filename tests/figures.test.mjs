import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, html, blankComments, rootBlock } from './helpers.mjs';

/* The two decorative figures - the contact orbit and the expertise ticker.
   Neither carries information, so nothing else on the page goes wrong when one
   disappears: no layout shifts, no test elsewhere notices, and the quality
   gates stay green. That is exactly why they need gates of their own.

   Every assertion below was mutation-proved: the declaration it names was
   deleted or changed and the suite went red. Comments are blanked first - this
   file asserts the PRESENCE of declarations whose rationale is written in
   comments directly above them, and an unblanked regex would find the prose. */
const sheet = () => blankComments(css());
const markup = () => blankComments(html());

const rule = (selector) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = sheet().match(new RegExp(`\\n${escaped}\\s*\\{([\\s\\S]*?)\\n\\}`));
    assert.ok(match, `style.css has no \`${selector}\` rule`);
    return match[1];
};

/* ---- shared ---- */

test('the ambient loop periods are tokens, and are not on the millisecond scale', () => {
    const tokens = rootBlock();
    const periods = ['--loop-orbit', '--loop-ticker'].map((name) => {
        const match = tokens.match(new RegExp(`${name}:\\s*([\\d.]+)(m?s)\\s*;`));
        assert.ok(match, `:root has no ${name} token`);
        return { name, value: Number(match[1]), unit: match[2] };
    });
    periods.forEach(({ name, value, unit }) => {
        const ms = unit === 's' ? value * 1000 : value;
        assert.ok(
            ms >= 20000,
            `${name} is ${value}${unit}; an ambient loop under 20s reads as the page responding to you, which is what the --dur-* scale is for`
        );
    });
});

test('both figures are hidden from assistive tech, because both repeat copy printed nearby', () => {
    const source = markup();
    assert.match(source, /<svg class="orbit"[^>]*aria-hidden="true"/);
    assert.match(source, /<div class="ticker" aria-hidden="true">/);
});

/* ---- orbit ---- */

test('the orbit is drawn, spun, and its keyframes exist', () => {
    const source = markup();
    assert.equal((source.match(/class="orbit-rings"/g) || []).length, 1);
    assert.equal((source.match(/class="orbit-track /g) || []).length, 2, 'the orbit needs both tracks');
    assert.equal((source.match(/class="orbit-node"/g) || []).length, 7);

    assert.match(
        rule('.orbit-track'),
        /animation:\s*orbit-spin\s+var\(--loop-orbit\)/,
        'nothing spins the orbit; it would be three static circles'
    );
    assert.match(sheet(), /@keyframes orbit-spin\s*\{/);
    assert.match(sheet(), /@keyframes orbit-counter-spin\s*\{/);
});

test('the two rings differ in BOTH period and direction, or they read as one rigid object', () => {
    const inner = rule('.orbit-track-in');
    assert.match(inner, /animation-duration:\s*calc\(var\(--loop-orbit\)/, 'the inner ring must not share the outer ring period');
    assert.match(inner, /animation-direction:\s*reverse/, 'the inner ring must turn the other way');
});

/* The one piece of this figure that is easy to get wrong and impossible to see
   in source: the counter-rotation origin. `0 0` is correct ONLY because each
   .orbit-node carries its own translate() attribute, so the group's local
   origin is already that node's centre. transform-box decides which coordinate
   system that `0 0` is read in, so it is as load-bearing as the origin. */
test('the counter-rotation pins its origin to the node, not to the drawing', () => {
    const hold = rule('.orbit-hold');
    assert.match(hold, /animation:\s*orbit-counter-spin\s+var\(--loop-orbit\)/, 'without this the markers turn into diamonds');
    assert.match(hold, /transform-box:\s*view-box/, 'fill-box would pick the group box, not the node origin');
    assert.match(hold, /transform-origin:\s*0\s+0/, 'any other origin swings each marker around the drawing centre');
});

test('the orbit cannot be clicked, and leaves at the single-column breakpoint', () => {
    assert.match(rule('.orbit'), /pointer-events:\s*none/, 'a decoration must not eat clicks meant for the card');
    const narrow = sheet().match(/@media\s*\(max-width:\s*860px\)\s*\{([\s\S]*?)\n\}/g);
    assert.ok(
        narrow && narrow.some((block) => /\.orbit\s*\{[^}]*display:\s*none/.test(block)),
        'the orbit must be removed below 860px; a 200px orbit is a smudge'
    );
});

/* ---- ticker ---- */

test('the ticker track holds the run TWICE, which is what the -50% keyframe assumes', () => {
    assert.equal(
        (markup().match(/class="ticker-run"/g) || []).length,
        2,
        'one run leaves a gap at the seam; three makes translateX(-50%) land mid-run'
    );
    const frames = sheet().match(/@keyframes ticker-drift\s*\{([\s\S]*?)\n\}/);
    assert.ok(frames, 'style.css has no `@keyframes ticker-drift`');
    assert.match(
        frames[1],
        /transform:\s*translateX\(-50%\)/,
        'any distance other than half the track jumps visibly at the seam'
    );
    assert.match(rule('.ticker-track'), /animation:\s*ticker-drift\s+var\(--loop-ticker\)/);
});

test('the ticker clips, and cannot become a horizontal scrollbar on the page', () => {
    assert.match(rule('.ticker'), /overflow:\s*hidden/);
    assert.match(rule('.ticker-track'), /width:\s*max-content/, 'a track that wraps does not scroll, it stacks');
});

/* The global reduced-motion reset ends every animation after 1ms, parking the
   element on its `to` frame. Every other loop on this page ends where it began;
   this one ends at translateX(-50%), so without its own reset a reduced-motion
   visitor gets the strip frozen half off the left edge. Verified in a browser
   with reducedMotion emulated: the run's left edge sits on the strip's. */
test('reduced motion parks the ticker at its start, not half-slid', () => {
    const blocks = sheet().match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/g);
    assert.ok(blocks, 'style.css has no prefers-reduced-motion block');
    const reset = blocks.find((block) => /\.ticker-track\s*\{([\s\S]*?)\}/.test(block));
    assert.ok(reset, 'no reduced-motion block resets .ticker-track');
    const body = reset.match(/\.ticker-track\s*\{([\s\S]*?)\}/)[1];
    assert.match(body, /animation:\s*none\s*!important/);
    assert.match(body, /transform:\s*none\s*!important/, 'killing the animation alone leaves the last computed transform in place');
});

/* ---- hover pause ---- */

test('the hover pause is gated on a real pointer, because :hover latches on touch', () => {
    const guarded = sheet().match(/@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)\s*\{([\s\S]*?)\n\}/g);
    assert.ok(guarded, 'style.css has no pointer-guarded block');
    const paused = guarded.filter((block) => /animation-play-state:\s*paused/.test(block));
    assert.equal(paused.length, 2, 'both figures pause on hover, and both pauses must sit behind the pointer guard');
    assert.ok(paused.some((block) => /\.contact:hover\s+\.orbit-track/.test(block)), 'the orbit pause is missing');
    assert.ok(paused.some((block) => /\.ticker:hover\s+\.ticker-track/.test(block)), 'the ticker pause is missing');
});

/* Guards the guard: if animation-play-state ever moves OUT of the pointer-gated
   blocks, the test above still finds two and passes. This one fails. */
test('no hover pause sits outside the pointer guard', () => {
    const source = sheet();
    const guardedText = (source.match(/@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)\s*\{([\s\S]*?)\n\}/g) || []).join('\n');
    const total = (source.match(/animation-play-state:\s*paused/g) || []).length;
    const inside = (guardedText.match(/animation-play-state:\s*paused/g) || []).length;
    assert.equal(inside, total, `${total - inside} \`animation-play-state: paused\` declaration(s) sit outside the pointer guard`);
});
