import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, html, blankComments, rootBlock, cssOutsideRoot } from './helpers.mjs';

/* The grid's colours, its cell size and its mask are all tokens. The mask
   especially: it is the only place in the sheet where a colour literal is
   spent as alpha rather than as ink, which is exactly the kind of exception
   that talks itself into being written inline. */
test('the blueprint is drawn entirely out of tokens', () => {
    const root = rootBlock();
    for (const token of ['--blueprint', '--blueprint-on-dark', '--blueprint-cell', '--blueprint-mask']) {
        assert.match(root, new RegExp(`${token}\\s*:`), `${token} is not defined in :root`);
    }
    assert.doesNotMatch(cssOutsideRoot(), /mask-image:\s*linear-gradient/, 'the mask gradient belongs in --blueprint-mask');
});

/* The whole argument for bringing graph paper back is that it is confined to
   one section. A `body::before` or `html::before` painting it - which is where
   it lived before, and where it is easiest to put back - reinstates the claim
   that the document is an engineering drawing, globally, from one declaration. */
test('the grid is confined to .blueprint, not stretched under the page', () => {
    const sheet = blankComments(css());

    const bodyRule = sheet.match(/\nbody\s*\{([\s\S]*?)\n\}/);
    assert.ok(bodyRule, 'style.css has no body rule');
    assert.doesNotMatch(bodyRule[1], /background-image:/, 'the grid belongs to a section, not to body');

    assert.doesNotMatch(sheet, /(?:^|[\s,])(?:body|html)::before\s*\{/m, 'nothing may paint a page-wide ground layer again');

    const layer = sheet.match(/\.blueprint::before\s*\{([\s\S]*?)\n\}/);
    assert.ok(layer, 'style.css has no .blueprint::before grid layer');
    assert.match(layer[1], /position:\s*absolute/, 'the layer is positioned against its section, not the viewport');
    assert.match(layer[1], /z-index:\s*-1/);
    assert.match(layer[1], /pointer-events:\s*none/);
    assert.match(layer[1], /linear-gradient\(to right,\s*var\(--blueprint\)\s*1px/, 'the grid needs its vertical lines');
    assert.match(layer[1], /linear-gradient\(to bottom,\s*var\(--blueprint\)\s*1px/, 'the grid needs its horizontal lines');
});

/* `z-index: -1` on the ::before of a section that paints its own background
   puts the grid BEHIND that background, where it is never seen. The only thing
   that makes it visible is the isolated stacking context on the parent, so the
   two declarations are a pair and the pair is easy to break by deleting the
   half that looks decorative. */
test('the grid layer has a stacking context to sit inside', () => {
    const parent = blankComments(css()).match(/\n\.blueprint\s*\{([\s\S]*?)\n\}/);
    assert.ok(parent, 'style.css has no .blueprint rule');
    assert.match(parent[1], /position:\s*relative/);
    assert.match(parent[1], /isolation:\s*isolate/, 'without an isolated stacking context the z-index:-1 layer hides behind the section background');
});

/* Asserting that SOME matching `@supports` exists in a 2000-line sheet proves
   nothing: other guards elsewhere would satisfy it on their own. Strip the
   guard off `.blueprint::before` and a browser without view timelines resolves
   `animation: grid-drift linear both` to a 0s animation that snaps the grid to
   -6vh and leaves it there. So walk the brace depth of every matching guard and
   prove the drift declaration falls inside one. */
test('the grid drifts on a view timeline, and only where one exists', () => {
    const sheet = blankComments(css());
    assert.match(sheet, /@keyframes grid-drift\b/);

    const drift = sheet.indexOf('animation: grid-drift');
    assert.ok(drift > -1, 'nothing applies the grid-drift animation');

    const guard = /@supports\s*\(animation-timeline:\s*view\(\)\)/g;
    let guarded = false;
    for (const hit of sheet.matchAll(guard)) {
        const open = sheet.indexOf('{', hit.index);
        if (open === -1) {
            continue;
        }
        let depth = 0;
        for (let i = open; i < sheet.length; i++) {
            if (sheet[i] === '{') depth++;
            else if (sheet[i] === '}' && --depth === 0) {
                if (drift > open && drift < i) guarded = true;
                break;
            }
        }
    }
    assert.ok(guarded, 'the grid-drift animation must sit inside a view-timeline @supports guard, not merely somewhere after one');
});

test('the drift moves only transform', () => {
    const frames = css().match(/@keyframes grid-drift\s*\{([\s\S]*?)\n\}/);
    assert.ok(frames, 'no grid-drift keyframes');
    assert.match(frames[1], /transform:\s*translateY\(/);
    assert.doesNotMatch(frames[1], /background-position:/, 'background-position repaints the whole layer');
});

/* A `.blueprint` class nothing wears is dead CSS, and a second one is the
   redesign eating itself - the point of the texture is that ONE room has it. */
test('exactly one section wears the blueprint', () => {
    const worn = html().match(/class="[^"]*\bblueprint\b[^"]*"/g) || [];
    assert.equal(worn.length, 1, `the blueprint belongs to one section, found ${worn.length}`);
    assert.match(worn[0], /\bsection--dark\b/, 'the grid is only legible in the dark room');
});
