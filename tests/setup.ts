import '@testing-library/jest-dom/vitest';

/* On Node runtimes that ship the experimental Web Storage globals
 * (localStorage/sessionStorage exist on globalThis without a
 * --localstorage-file flag), that global shadows the real, working
 * implementation vitest's jsdom environment attaches to `window` — because
 * vitest only patches globals it doesn't find already present. The result is
 * a `localStorage` that exists but whose methods throw or read as undefined.
 * Detect that broken shadow and fall back to jsdom's own instance, which
 * lives on the `jsdom` global vitest exposes alongside the DOM. */
const jsdomGlobal = (globalThis as { jsdom?: { window: { localStorage: Storage } } }).jsdom;
const brokenStorage = typeof globalThis.localStorage?.clear !== 'function';
if (jsdomGlobal && brokenStorage) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: jsdomGlobal.window.localStorage,
    configurable: true,
    writable: true,
  });
}
