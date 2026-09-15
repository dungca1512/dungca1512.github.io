import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, blankComments } from './helpers.mjs';

/* Comments blanked before matching. Two of the assertions below locate the dim
   rule and its guard by INDEX, and a comment elsewhere in the sheet that names
   `#projectsGrid:has(` - describing this very rule, as prose about it naturally
   would - relocates the containment walk onto the comment and fails a sheet
   that is entirely correct. */
const sheet = () => blankComments(css());

test('hovering one project row dims the others, using :has()', () => {
    assert.match(sheet(), /#projectsGrid:has\(\.project-row:hover\)\s+\.project-row:not\(:hover\)/);
});

/* lastIndexOf a preceding occurrence only proves the guard exists SOMEWHERE
   earlier in the file - not that the rule sits inside its braces. Walk the
   guard's own brace depth from its opening `{` to the matching `}` and check
   the rule's index falls inside that span, so a later edit that closes the
   block early cannot let the rule escape its guard with this test still green. */
test('the dim is gated to real pointers, so it never sticks on touch', () => {
    const source = sheet();
    const ruleIndex = source.indexOf('#projectsGrid:has(');
    assert.ok(ruleIndex > -1, 'the :has() dim rule is missing');

    const guardIndex = source.lastIndexOf('@media (hover: hover) and (pointer: fine)', ruleIndex);
    assert.ok(guardIndex > -1, 'the :has() dim rule must sit inside a hover/fine-pointer query');

    const openBrace = source.indexOf('{', guardIndex);
    assert.ok(openBrace > -1, 'the hover/fine-pointer query has no opening brace');

    let depth = 0;
    let closeBrace = -1;
    for (let i = openBrace; i < source.length; i++) {
        if (source[i] === '{') depth++;
        else if (source[i] === '}') {
            depth--;
            if (depth === 0) {
                closeBrace = i;
                break;
            }
        }
    }
    assert.ok(closeBrace > -1, 'the hover/fine-pointer query never closes');
    assert.ok(
        ruleIndex > openBrace && ruleIndex < closeBrace,
        'the :has() dim rule must fall inside the matching braces of its guard, not merely after it somewhere in the file'
    );
});

test('the dim animates opacity only', () => {
    const rule = sheet().match(/#projectsGrid:has\(\.project-row:hover\)\s+\.project-row:not\(:hover\)\s*\{([\s\S]*?)\n\s*\}/);
    assert.ok(rule, 'the :has() dim rule is missing');
    assert.match(rule[1], /opacity:\s*0?\.\d+/);
    assert.doesNotMatch(rule[1], /transform:/, 'moving the siblings would shift the row you are reading');
});
