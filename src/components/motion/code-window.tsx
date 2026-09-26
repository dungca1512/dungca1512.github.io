'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { Locale } from '@/content/locales';
import { SNIPPETS, type Snippet } from '@/content/snippets';

/* ─── The code window ──────────────────────────────────────────────────────
   A terminal card that types an API request, waits the request's latency,
   streams the answer back in small chunks, holds it, and moves on to the
   next tab — for ever, on a clock, with no input from the reader. It is the
   right column of the hero, and it exists because the headline makes a
   claim about services in production and a picture cannot evidence that
   while a request that answers can. The composition is wigin.ai's hero
   card (measured 2026-09-26): three dots, a tab row, a monospace body.

   Everything below is decoration in the accessibility sense. The card is
   `aria-hidden`: the text it types is illustrative (content/snippets.ts),
   and a screen reader following a region that rewrites itself thirty times
   a second would be read a request one letter at a time. The lead
   paragraph beside it already says what the services are.

   Three states this has to get right, and how it does:

   - No JavaScript / first paint. The server renders snippet 0 IN FULL, with
     no cursor. `shown` starts at Infinity so the client's first render is
     identical to the server's and hydration has nothing to reconcile; the
     effect then resets to zero and starts typing. That reset happens under
     the hero's own 700ms `reveal-load` fade, which is what hides it.
   - Reduced motion. The effect returns before scheduling anything, so the
     full snippet 0 stays put — the last frame, which is the rule every
     motion file here follows (see styles/motion-reduced.css).
   - Offscreen or hidden tab. The loop pauses on `visibilitychange` and on
     an IntersectionObserver leaving the viewport, and resumes from the same
     character when it comes back. A hero card is off screen for most of a
     visit, and there is no reason to keep re-rendering it there. */

export const TYPE_MS = 24;
export const STREAM_MS = 28;
export const STREAM_CHUNK = 3;
export const HOLD_MS = 3200;
export const SWITCH_MS = 280;
/* The pause between the tab's last character and the cursor starting to
   type, so a switch reads as "new request" rather than as a scroll. */
export const LEAD_IN_MS = 3 * TYPE_MS;

type Phase = 'idle' | 'typing' | 'waiting' | 'streaming' | 'hold' | 'switching';
type State = { index: number; shown: number; phase: Phase };

export type Token = { text: string; cls?: string };

/* One flat token list per snippet, request then a blank line then the
   status line and the response, and two numbers: how many characters the
   request is (where typing stops and the latency wait begins) and how many
   the whole thing is (where streaming stops). One counter walking one list
   is what keeps the render trivial: a token is shown whole, or cut at the
   counter, or not at all. */
export type Compiled = { tokens: Token[]; requestLength: number; total: number };

const METHOD_LINE = /^(GET|POST|PUT|PATCH|DELETE) (\S+)$/;
const STATUS_LINE = /^(\d{3} [A-Za-z ]+?)( — .+)$/;
/* Order matters: a string followed by a colon is a key, and has to be tried
   before the plain string alternative would swallow it. */
const JSON_TOKEN = /"[^"]*"(?=\s*:)|"[^"]*"|-?\d+(?:\.\d+)?|[{}[\],:]|\s+|\S+/g;

function tokenizeLine(line: string): Token[] {
  const method = METHOD_LINE.exec(line);
  if (method) {
    return [{ text: method[1]!, cls: 'kw' }, { text: ' ' }, { text: method[2]!, cls: 'path' }];
  }
  const status = STATUS_LINE.exec(line);
  if (status) {
    return [
      { text: status[1]!, cls: 'ok' },
      { text: status[2]!, cls: 'muted' },
    ];
  }
  const out: Token[] = [];
  for (const m of line.matchAll(JSON_TOKEN)) {
    const text = m[0];
    if (/^"[^"]*"$/.test(text)) {
      // The lookahead is consumed by the regex engine, not the match, so
      // "is this a key" is re-derived from what follows in the line.
      const after = line.slice(m.index + text.length);
      out.push({ text, cls: /^\s*:/.test(after) ? 'key' : 'str' });
    } else if (/^-?\d/.test(text)) {
      out.push({ text, cls: 'num' });
    } else {
      out.push({ text });
    }
  }
  return out;
}

function tokenizeLines(lines: string[]): Token[] {
  return lines.flatMap((line, i) => (i === 0 ? [] : [{ text: '\n' }]).concat(tokenizeLine(line)));
}

export function compile(snippet: Snippet): Compiled {
  const request = tokenizeLines(snippet.request);
  const response = tokenizeLines([`200 OK — ${snippet.latency}`, ...snippet.response]);
  const requestLength = request.reduce((n, t) => n + t.text.length, 0);
  const tokens = [...request, { text: '\n\n' }, ...response];
  const total = tokens.reduce((n, t) => n + t.text.length, 0);
  return { tokens, requestLength, total };
}

const COMPILED = SNIPPETS.map(compile);

/** The first `shown` characters of the token list, each token in its
 *  colour class. A token the counter lands inside is cut, not dropped. */
function Typed({ tokens, shown }: { tokens: Token[]; shown: number }) {
  const parts: ReactNode[] = [];
  let left = shown;
  for (let i = 0; i < tokens.length && left > 0; i++) {
    const token = tokens[i]!;
    const text = token.text.length <= left ? token.text : token.text.slice(0, left);
    left -= token.text.length;
    parts.push(
      token.cls ? (
        <span key={i} className={`code-window-${token.cls}`}>
          {text}
        </span>
      ) : (
        text
      ),
    );
  }
  return <>{parts}</>;
}

type CodeWindowProps = {
  locale: Locale;
  className?: string;
};

export function CodeWindow({ locale, className }: CodeWindowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>({
    index: 0,
    shown: Number.POSITIVE_INFINITY,
    phase: 'idle',
  });

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let hidden = document.hidden;
    let offscreen = false;
    let disposed = false;
    let current: State = { index: 0, shown: 0, phase: 'typing' };

    const paused = () => hidden || offscreen || disposed;
    const commit = () => setState({ ...current });
    const schedule = (ms: number) => {
      clearTimeout(timer);
      timer = setTimeout(step, ms);
    };

    const step = () => {
      if (paused()) return;
      const snippet = SNIPPETS[current.index]!;
      const compiled = COMPILED[current.index]!;
      let next = TYPE_MS;
      switch (current.phase) {
        case 'typing': {
          current.shown += 1;
          if (current.shown >= compiled.requestLength) {
            current.shown = compiled.requestLength;
            current.phase = 'waiting';
            next = snippet.waitMs;
          } else {
            // A hand does not type at a metronome: a little jitter, and a
            // beat at every line end, is what stops it reading as a marquee.
            const justTyped = charAt(compiled.tokens, current.shown - 1);
            next = TYPE_MS * (justTyped === '\n' ? 4 : 0.7 + Math.random() * 0.6);
          }
          break;
        }
        case 'waiting':
          current.phase = 'streaming';
          next = STREAM_MS;
          break;
        case 'streaming': {
          current.shown = Math.min(compiled.total, current.shown + STREAM_CHUNK);
          if (current.shown >= compiled.total) {
            current.phase = 'hold';
            next = HOLD_MS;
          } else {
            next = STREAM_MS;
          }
          break;
        }
        case 'hold':
          current.phase = 'switching';
          next = SWITCH_MS;
          break;
        case 'switching':
        case 'idle':
          current = { index: (current.index + 1) % SNIPPETS.length, shown: 0, phase: 'typing' };
          next = LEAD_IN_MS;
          break;
      }
      commit();
      schedule(next);
    };

    const resume = () => {
      if (!paused()) schedule(60);
    };
    const onVisibility = () => {
      hidden = document.hidden;
      if (hidden) clearTimeout(timer);
      else resume();
    };
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        offscreen = !entry.isIntersecting;
      }
      if (offscreen) clearTimeout(timer);
      else resume();
    });

    io.observe(root);
    document.addEventListener('visibilitychange', onVisibility);
    commit();
    schedule(LEAD_IN_MS);

    return () => {
      disposed = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      io.disconnect();
    };
  }, []);

  const { index, shown, phase } = state;
  const cursor =
    phase === 'idle' ? null : phase === 'waiting' || phase === 'hold' ? 'blink' : 'solid';

  return (
    <div ref={ref} className={cn('code-window', className)} data-phase={phase} aria-hidden="true">
      <div className="code-window-bar">
        <span className="code-window-dot" data-live="true" />
        <span className="code-window-dot" />
        <span className="code-window-dot" />
      </div>
      <div className="code-window-tabs">
        {SNIPPETS.map((snippet, i) => (
          <span
            key={snippet.tab.en}
            className="code-window-tab"
            data-active={i === index ? 'true' : undefined}
          >
            {snippet.tab[locale]}
          </span>
        ))}
      </div>
      <pre className="code-window-body">
        <Typed tokens={COMPILED[index]!.tokens} shown={shown} />
        {cursor && <span className="code-window-cursor" data-blink={cursor === 'blink'} />}
      </pre>
    </div>
  );
}

/** The character at flat position `at` across the token list. */
function charAt(tokens: Token[], at: number): string {
  let left = at;
  for (const token of tokens) {
    if (left < token.text.length) return token.text[left]!;
    left -= token.text.length;
  }
  return '';
}
