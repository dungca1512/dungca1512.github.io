import { describe, it, expect } from 'vitest';
import { existsSync, statSync, globSync } from 'node:fs';

const CEILING = 40 * 1024;
const NAMES = ['hero', 'expertise', 'work', 'contact'];

describe('illustrations', () => {
  it('has all three formats for every name the page asks for', () => {
    for (const name of NAMES) {
      for (const ext of ['avif', 'webp', 'jpg']) {
        const path = `public/images/illustrations/${name}.${ext}`;
        expect(existsSync(path), `${path} is referenced by a component`).toBe(true);
      }
    }
  });

  it('keeps every image under 40KB', () => {
    // Images are served exactly as committed — unoptimized is on. The file
    // size IS what the visitor downloads.
    //
    // Glob for everything and filter by extension in JS rather than relying on
    // brace expansion in `fs.globSync`: that API is experimental, CI runs the
    // Node 22 pinned in .nvmrc, and a brace pattern the runtime does not
    // understand matches nothing. A loop over nothing passes while measuring
    // nothing — the exact failure this repo keeps shipping.
    const files = globSync('public/images/**/*').filter((f) => /\.(avif|webp|jpg|png)$/.test(f));
    expect(
      files.length,
      'the image glob matched nothing, so this test measured nothing',
    ).toBeGreaterThanOrEqual(NAMES.length * 3);
    for (const file of files) {
      expect(statSync(file).size, `${file}`).toBeLessThanOrEqual(CEILING);
    }
  });
});
