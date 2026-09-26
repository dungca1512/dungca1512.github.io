import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { render, cleanup, act } from '@testing-library/react';
import { MockIntersectionObserver } from './setup';
import {
  CodeWindow,
  compile,
  HOLD_MS,
  LEAD_IN_MS,
  STREAM_CHUNK,
  STREAM_MS,
  SWITCH_MS,
  TYPE_MS,
  type Compiled,
} from '@/components/motion/code-window';
import { SNIPPETS } from '@/content/snippets';

const first = compile(SNIPPETS[0]!);
const requestText = SNIPPETS[0]!.request.join('\n');
const lastResponseLine = SNIPPETS[0]!.response.at(-1)!;

function fullText(c: Compiled): string {
  return c.tokens.map((t) => t.text).join('');
}

/* Typing is jittered (0.7–1.3 × TYPE_MS per character, 4× after a line end).
   Every clocked test below pins Math.random to 0.5, which makes the factor
   exactly 1, so the time to type a request is a sum this helper can compute
   and the assertions can land on a phase boundary rather than inside a
   window wide enough to have run on into the next snippet. */
function typingMs(c: Compiled): number {
  const text = fullText(c);
  let ms = LEAD_IN_MS;
  for (let i = 0; i < c.requestLength - 1; i++) ms += text[i] === '\n' ? TYPE_MS * 4 : TYPE_MS;
  return ms;
}

/** From the end of the wait to the last streamed character: one step per
 *  chunk, the last of which lands the 'hold' phase. */
function streamMs(c: Compiled): number {
  return STREAM_MS * Math.ceil((c.total - c.requestLength) / STREAM_CHUNK);
}

function body(container: HTMLElement): string {
  return container.querySelector('.code-window-body')!.textContent ?? '';
}

function mount() {
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  return render(<CodeWindow locale="en" />);
}

function setHidden(value: boolean) {
  Object.defineProperty(document, 'hidden', { value, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  Object.defineProperty(document, 'hidden', { value: false, configurable: true });
});

describe('compile', () => {
  it('colours the method, the path, keys, strings and numbers apart', () => {
    const { tokens } = first;
    expect(tokens[0]).toEqual({ text: 'POST', cls: 'kw' });
    expect(tokens[2]).toEqual({ text: '/v1/asr', cls: 'path' });
    expect(tokens).toContainEqual({ text: '"model"', cls: 'key' });
    expect(tokens).toContainEqual({ text: '"vi"', cls: 'str' });
    expect(tokens).toContainEqual({ text: '0.97', cls: 'num' });
    expect(tokens).toContainEqual({ text: '200 OK', cls: 'ok' });
  });

  it('counts the request as the characters typed before the wait', () => {
    expect(first.requestLength).toBe(requestText.length);
    const all = fullText(first);
    expect(all.startsWith(`${requestText}\n\n200 OK — ${SNIPPETS[0]!.latency}`)).toBe(true);
    expect(all.endsWith(lastResponseLine)).toBe(true);
    expect(first.total).toBe(all.length);
  });
});

describe('<CodeWindow>', () => {
  it('serves the first snippet in full, with no cursor, so a JS-less reader gets the picture', () => {
    const html = renderToString(<CodeWindow locale="vi" />);
    expect(html).toContain('code-window-kw">POST<');
    expect(html).toContain('/v1/asr');
    expect(html).toContain('code-window-num">0.97<');
    expect(html).toContain('&quot;confidence&quot;');
    expect(html).not.toContain('code-window-cursor');
    expect(html).toContain('aria-hidden="true"');
    // The tab row is the localised label; the code is not.
    expect(html).toContain(SNIPPETS[0]!.tab.vi);
  });

  it('types the request from the first character after mount, then streams the answer', () => {
    const { container } = mount();
    // The effect resets to nothing typed, cursor solid.
    expect(body(container)).toBe('');
    expect(container.querySelector('.code-window-cursor')).not.toBeNull();
    expect(container.firstElementChild).toHaveAttribute('data-phase', 'typing');

    act(() => vi.advanceTimersByTime(LEAD_IN_MS + 1));
    expect(body(container)).toBe('P');

    act(() => vi.advanceTimersByTime(typingMs(first) - LEAD_IN_MS));
    expect(body(container)).toBe(requestText);
    expect(container.firstElementChild).toHaveAttribute('data-phase', 'waiting');
    expect(container.querySelector('.code-window-cursor')).toHaveAttribute('data-blink', 'true');

    act(() => vi.advanceTimersByTime(SNIPPETS[0]!.waitMs + streamMs(first)));
    expect(body(container)).toBe(fullText(first));
    expect(body(container)).toContain(`200 OK — ${SNIPPETS[0]!.latency}`);
    expect(container.firstElementChild).toHaveAttribute('data-phase', 'hold');
  });

  it('moves to the second tab after the hold and starts that request from nothing', () => {
    const { container } = mount();
    const cycle = typingMs(first) + SNIPPETS[0]!.waitMs + streamMs(first) + HOLD_MS + SWITCH_MS;
    act(() => vi.advanceTimersByTime(cycle - 1));
    expect(container.firstElementChild).toHaveAttribute('data-phase', 'switching');
    act(() => vi.advanceTimersByTime(2));
    const active = container.querySelectorAll('.code-window-tab[data-active="true"]');
    expect(active).toHaveLength(1);
    expect(active[0]!.textContent).toBe(SNIPPETS[1]!.tab.en);
    expect(body(container)).toBe('');
    expect(container.firstElementChild).toHaveAttribute('data-phase', 'typing');
  });

  it('under reduced motion shows the whole first snippet and schedules nothing', () => {
    vi.useFakeTimers();
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({ matches: /prefers-reduced-motion/.test(query), media: query }) as MediaQueryList,
    );
    const { container } = render(<CodeWindow locale="en" />);
    expect(vi.getTimerCount()).toBe(0);
    expect(body(container)).toBe(fullText(first));
    expect(container.querySelector('.code-window-cursor')).toBeNull();
    expect(MockIntersectionObserver.instances).toHaveLength(0);
  });

  it('pauses while the document is hidden and resumes from the same character', () => {
    const { container } = mount();
    act(() => vi.advanceTimersByTime(LEAD_IN_MS + TYPE_MS * 4 + 1));
    expect(body(container)).toBe('POST ');

    act(() => setHidden(true));
    act(() => vi.advanceTimersByTime(10_000));
    expect(body(container)).toBe('POST ');

    act(() => setHidden(false));
    // Resumes on a short timer, then finishes the request; the overshoot here
    // is well inside the wait that follows, so the phase is still 'waiting'.
    act(() => vi.advanceTimersByTime(typingMs(first) + 60));
    expect(body(container)).toBe(requestText);
    expect(container.firstElementChild).toHaveAttribute('data-phase', 'waiting');
  });

  it('pauses while off screen, through the observer it registered', () => {
    const { container } = mount();
    const root = container.firstElementChild!;
    const io = MockIntersectionObserver.instances.find((i) => i.observed.has(root));
    expect(io, 'the card never asked to be observed').toBeDefined();

    act(() => vi.advanceTimersByTime(LEAD_IN_MS + TYPE_MS * 4 + 1));
    expect(body(container)).toBe('POST ');
    act(() => io!.trigger(root, false));
    act(() => vi.advanceTimersByTime(10_000));
    expect(body(container)).toBe('POST ');

    act(() => io!.trigger(root, true));
    act(() => vi.advanceTimersByTime(typingMs(first) + 60));
    expect(body(container)).toBe(requestText);
  });

  it('stops its timers and observer on unmount', () => {
    const { container, unmount } = mount();
    const root = container.firstElementChild!;
    const io = MockIntersectionObserver.instances.find((i) => i.observed.has(root))!;
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(io.disconnected).toBe(true);
  });
});

describe('wiring', () => {
  it('has its stylesheet imported from globals.css and its reduced-motion resets', () => {
    const globals = readFileSync('src/app/globals.css', 'utf8');
    const reduced = readFileSync('src/styles/motion-reduced.css', 'utf8');
    expect(globals).toContain("@import '../styles/site/code-window.css';");
    expect(reduced).toMatch(/\.code-window-cursor[^{]*\{[^}]*animation:\s*none\s*!important/s);
  });

  it('sits in the hero beside the portrait illustration, not in place of it', () => {
    const hero = readFileSync('src/components/sections/hero.tsx', 'utf8');
    expect(hero).toContain('<CodeWindow locale={locale}');
    // The owner's portrait is required on the hero; the card overlaps it,
    // it does not replace it.
    expect(hero).toMatch(/<Illustration[\s\S]*?name="hero"/);
  });
});
