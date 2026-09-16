/* A hand-written declaration, because the prompts module is plain `.mjs`: the
 * generator is run straight by node (`node scripts/generate-illustrations.mjs`)
 * and node will not import a `.ts` file, so the module cannot be typed at
 * source. `tests/illustrations.test.ts` imports the same file under tsc.
 *
 * Deliberately `Record<string, string>` rather than the seven literal keys.
 * Repeating the key list here would put a fourth copy of "which illustrations
 * exist" in the repo, and that copy would be the only one no test checks —
 * exactly the drift tests/illustrations.test.ts was written to catch.
 */
export declare const PROMPTS: Record<string, string>;
