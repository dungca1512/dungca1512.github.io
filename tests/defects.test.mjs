import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { css, html, data, ROOT } from './helpers.mjs';

test('anchors clear the sticky header', () => {
    const rule = css().match(/\nhtml\s*\{([\s\S]*?)\n\}/);
    assert.ok(rule, 'style.css has no html rule');

    const padding = rule[1].match(/scroll-padding-top:\s*([\d.]+)rem/);
    assert.ok(padding, 'html needs scroll-padding-top or every anchor lands under the header');
    assert.ok(
        Number(padding[1]) >= 4.5,
        `scroll-padding-top is ${padding[1]}rem; the header is ~4.1rem tall, so it needs at least 4.5rem`
    );
});

test('a favicon is declared and present, so the page stops 404ing on load', () => {
    assert.match(html(), /<link[^>]+rel="icon"[^>]+href="favicon\.svg"/);
    assert.ok(existsSync(join(ROOT, 'favicon.svg')), 'favicon.svg does not exist');
});

test('the avatar is sized for how it renders, not for how it was exported', () => {
    const file = join(ROOT, 'profile.webp');
    assert.ok(existsSync(file), 'profile.webp does not exist');
    assert.ok(
        statSync(file).size < 20 * 1024,
        `profile.webp is ${Math.round(statSync(file).size / 1024)}KB; it renders at 76px and must stay under 20KB`
    );
});

test('nothing still points at the 203KB original', () => {
    assert.doesNotMatch(data(), /profile\.jpeg/);
    assert.doesNotMatch(html(), /profile\.jpeg/);
});

test('the avatar reserves its space, so it cannot shift the layout', () => {
    const img = html().match(/<img[^>]+id="heroAvatar"[^>]*>/);
    assert.ok(img, 'index.html has no #heroAvatar image');
    assert.match(img[0], /width="\d+"/);
    assert.match(img[0], /height="\d+"/);
});

test('every cache-busting query string agrees, so a bump cannot be partial', () => {
    const tokens = new Set([...html().matchAll(/\?v=([\w.-]+)/g)].map((m) => m[1]));
    assert.equal(tokens.size, 1, `expected exactly one ?v= token across index.html, found: ${[...tokens].join(', ')}`);
    assert.notEqual([...tokens][0], '20260906a', 'the cache-busting token was never bumped past its stale value');
});
