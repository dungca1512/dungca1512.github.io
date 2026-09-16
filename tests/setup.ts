import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

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

/**
 * jsdom ships neither `CSS` nor `IntersectionObserver`. `useInView`
 * (src/components/motion/use-in-view.ts) treats a missing `CSS.supports` as
 * "the browser does not have `animation-timeline: view()`" and falls
 * through to constructing a real `IntersectionObserver` — which, under
 * jsdom, would otherwise throw `ReferenceError: IntersectionObserver is not
 * defined` the moment anything renders `<RevealScope>`. Task 7's `Section`
 * wraps EVERY band in `RevealScope`, so every later test that renders a
 * section takes this path.
 *
 * A stub that just no-ops (or returns an object with empty methods) would
 * make the crash go away by making the fallback silently do nothing — which
 * is worse than the crash, because it deletes the coverage instead of
 * fixing it: nothing would ever prove the observer was told to watch the
 * right elements, or that it correctly marks an element in-view exactly
 * once and then lets go of it. This stub instead records what it was asked
 * to observe and exposes itself on `MockIntersectionObserver.instances`, so
 * a test can find the instance a component created, fire an intersection
 * entry through it by hand, and assert on what happened.
 */
export class MockIntersectionObserver implements IntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  readonly root: Element | Document | null = null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;
  readonly observed = new Set<Element>();
  disconnected = false;

  constructor(
    private readonly callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.rootMargin = typeof options?.rootMargin === 'string' ? options.rootMargin : '0px';
    this.thresholds = options?.threshold ? ([] as number[]).concat(options.threshold) : [0];
    MockIntersectionObserver.instances.push(this);
  }

  observe(target: Element): void {
    this.observed.add(target);
  }

  unobserve(target: Element): void {
    this.observed.delete(target);
  }

  disconnect(): void {
    this.disconnected = true;
    this.observed.clear();
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  /** Test-only: drives the callback as if `target` had just crossed the
   *  root's threshold, the same shape a real observer hands its callback. */
  trigger(target: Element, isIntersecting = true): void {
    this.callback(
      [{ target, isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
}

// Reset here, globally, rather than leaving it to each test file's own
// `afterEach`. Task 7 renders a `Section` (which wraps every band in
// `RevealScope`) in a test file per section; each render pushes a new
// instance onto this static array, and a file that forgets its own reset
// would leak instances into every test that runs after it in the same
// process, silently corrupting `MockIntersectionObserver.instances[0]`
// lookups in unrelated files.
afterEach(() => {
  MockIntersectionObserver.instances.length = 0;
});
