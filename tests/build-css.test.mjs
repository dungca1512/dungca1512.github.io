/* The built sheet is the one visitors get, which makes the stripper that
   produces it load-bearing in a way no other script here is: a bug in it does
   not fail a gate, it ships a broken page. These tests are the cases a regex
   gets wrong, plus proof that the whole real sheet survives the round trip. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { build, stripComments } from '../scripts/build-css.mjs';
import { css, html, readSource } from './helpers.mjs';

/* Collapse whitespace so the comparison is about tokens, not formatting - the
   stripper is allowed to change indentation and blank lines and nothing else. */
const tokens = (text) => text.replace(/\s+/g, ' ').trim();

test('a comment is removed', () => {
    assert.equal(tokens(build('a { /* why */ color: red; }')), 'a { color: red; }');
});

test('a /* inside a string is content, not the start of a comment', () => {
    /* The failure this guards against is not cosmetic: a regex starting a
       comment here would swallow every rule after it and ship half a sheet. */
    const out = build(`a::before { content: '/*'; } b { color: red; }`);
    assert.match(out, /content: '\/\*';/);
    assert.match(out, /b \{/, 'the rule after the string was eaten');
});

test('an escaped quote does not end the string', () => {
    const out = build(`a::before { content: '\\'/*'; } b { color: red; }`);
    assert.match(out, /b \{/, 'the rule after the string was eaten');
});

test('an unterminated comment is an error, not a truncated sheet', () => {
    assert.throws(() => build('a { color: red; } /* and then nothing'), /unterminated/);
});

test('an unterminated string is an error, not a truncated sheet', () => {
    assert.throws(() => build(`a::before { content: 'oops`), /unterminated/);
});

test('every line stays on its own line, so no two tokens can be joined', () => {
    const out = build('a {\n    color: red;\n    margin: 0 auto;\n}');
    assert.equal(out, 'a {\ncolor: red;\nmargin: 0 auto;\n}\n');
});

test('whitespace inside a declaration is untouched', () => {
    /* `calc(100% - 4px)` and `and (max-width: 860px)` both break if a minifier
       gets clever about spaces. This one is not allowed to be clever. */
    const out = build('@media screen and (max-width: 860px) {\n    a { width: calc(100% - 4px); }\n}');
    assert.match(out, /screen and \(max-width: 860px\)/);
    assert.match(out, /calc\(100% - 4px\)/);
});

test('the real sheet survives the round trip with its tokens unchanged', () => {
    assert.equal(tokens(readSource('style.min.css')), tokens(stripComments(css())));
});

test('the built sheet is what index.html loads', () => {
    /* A build nobody links to is a build that silently stops mattering. */
    assert.match(html(), /<link rel="stylesheet" href="style\.min\.css\?v=/);
    assert.doesNotMatch(html(), /href="style\.css/);
});
