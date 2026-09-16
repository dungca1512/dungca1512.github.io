import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, rootBlock, cssOutsideRoot } from './helpers.mjs';

test('the ground wash is a token', () => {
    assert.match(rootBlock(), /--wash\s*:/);
    assert.doesNotMatch(cssOutsideRoot(), /rgba\(143,\s*99,\s*24,/);
});

/* The charter at the top of the sheet says structure is carried by raised
   surfaces, not hairlines, and the ground layer is where that is easiest to
   break: one `linear-gradient(to right, <colour> 1px, transparent 1px)` and the
   graph paper is back under everything, undoing the redesign globally from a
   single declaration. The wash has to stay edgeless. */
test('the ground is an edgeless wash, not graph paper', () => {
    const layer = css().match(/body::before\s*\{([\s\S]*?)\n\}/);
    assert.ok(layer, 'style.css has no body::before ground layer');
    assert.match(layer[1], /radial-gradient\(/, 'the ground should be painted with radial washes');

    /* Split on `;` and test each declaration whole. The obvious regex -
       /linear-gradient\([^)]*1px/ - cannot see a grid line at all, because
       `[^)]*` stops at the first `)`, which in `var(--wash) 1px` arrives
       BEFORE the 1px. That version passes against real reintroduced graph
       paper; this one was mutation-proved against it. */
    const gridLine = layer[1]
        .split(';')
        .find((decl) => /linear-gradient\(/.test(decl) && /\b[0-9.]+px\b/.test(decl));
    assert.equal(
        gridLine,
        undefined,
        `a linear-gradient with a pixel stop on the ground layer is a grid line - the sheet no longer draws graph paper: ${gridLine}`
    );
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

/* Asserting that SOME matching `@supports` exists in a 2000-line sheet proves
   nothing: the header/scroll-progress block far below carries the identical
   condition and would satisfy it on its own. Strip the guard off `body::before`
   and a browser without scroll timelines resolves `animation: grid-drift linear
   both` to a 0s animation that snaps the grid to -6vh and leaves it there. So
   walk the brace depth of every matching guard and prove the drift declaration
   falls inside one. */
test('the grid drifts on a scroll timeline, and only where one exists', () => {
    const sheet = css();
    assert.match(sheet, /@keyframes grid-drift\b/);

    const drift = sheet.indexOf('animation: grid-drift');
    assert.ok(drift > -1, 'nothing applies the grid-drift animation');

    const guard = /@supports\s*\(animation-timeline:\s*scroll\(root(?: block)?\)\)/g;
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
    assert.ok(guarded, 'the grid-drift animation must sit inside a scroll-timeline @supports guard, not merely somewhere after one');
});

test('the drift moves only transform', () => {
    const frames = css().match(/@keyframes grid-drift\s*\{([\s\S]*?)\n\}/);
    assert.ok(frames, 'no grid-drift keyframes');
    assert.match(frames[1], /transform:\s*translateY\(/);
    assert.doesNotMatch(frames[1], /background-position:/, 'background-position repaints the whole layer');
});
