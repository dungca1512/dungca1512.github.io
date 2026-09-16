/* `node --test tests/**\/*.test.mjs` looks safe and is not. The shell expands
   that glob, and when it matches nothing the literal pattern is handed to node,
   which reports "tests 0" and exits 0 - measured, not theorised. So does
   `node --test tests/` against a missing directory. Either way `npm run verify`
   goes green having run no tests at all, which is the one failure a gate must
   never have: silent, and indistinguishable from success.

   This runner removes the shell from the path entirely. It discovers the files
   itself, refuses to run when the count looks wrong, and passes an explicit
   file list to node. */
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'tests');

// Raise this with the suite. A floor rather than an exact count so adding a
// test file is not a two-file edit, but deleting one is caught.
const MINIMUM_FILES = 10;

let files;
try {
    files = readdirSync(dir).filter((name) => name.endsWith('.test.mjs')).sort();
} catch (error) {
    console.error(`FAIL  cannot read tests/ (${error.message})`);
    process.exit(1);
}

if (files.length < MINIMUM_FILES) {
    console.error(`FAIL  found ${files.length} test file(s) in tests/, expected at least ${MINIMUM_FILES}.`);
    console.error('      Either a test file was deleted, or discovery broke. Both mean this');
    console.error('      suite is no longer guarding what it claims to guard.');
    if (files.length > 0) {
        console.error(`\n      Found: ${files.join(', ')}`);
    }
    process.exit(1);
}

const result = spawnSync(
    process.execPath,
    ['--test', ...files.map((name) => join(dir, name))],
    { stdio: 'inherit' }
);

process.exit(result.status === null ? 1 : result.status);
