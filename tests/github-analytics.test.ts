import { describe, expect, it } from 'vitest';
import { analyse, type Repo, type Snapshot } from '@/lib/github-analytics';

/** A repo with everything defaulted, so each test states only the field it is
 *  about and a reader can see the variable at a glance. */
function repo(name: string, pushed_at: string, extra: Partial<Repo> = {}): Repo {
  return {
    name,
    html_url: `https://github.com/dungca1512/${name}`,
    language: 'Python',
    stargazers_count: 0,
    forks_count: 0,
    pushed_at,
    description: null,
    ...extra,
  };
}

function snapshot(generatedAt: string, repos: Repo[]): Snapshot {
  return {
    generatedAt,
    stats: { publicRepos: 64, nonForkRepos: 49 },
    repos: Object.fromEntries(repos.map((r) => [r.name, r])),
  };
}

describe('the GitHub snapshot analysis', () => {
  /* The one that matters most. The snapshot is a file committed to the repo:
   * it does not change between builds, so any window measured against the
   * wall clock reports a different answer every time the site is rebuilt from
   * unchanged data. A snapshot taken in June 2025 is over a year stale by the
   * time this test runs, so a Date.now() implementation puts every repo below
   * in `older` and this assertion fails. */
  it('measures freshness from the snapshot date, not from the clock', () => {
    const taken = '2025-06-30T00:00:00Z';
    const result = analyse(
      snapshot(taken, [
        repo('fresh', '2025-06-20T00:00:00Z'), // 10 days before the snapshot
        repo('recent', '2025-05-01T00:00:00Z'), // 60 days
        repo('fading', '2025-03-01T00:00:00Z'), // 121 days
        repo('stale', '2025-01-05T00:00:00Z'), // 176 days
      ]),
    );

    expect(result.freshness).toEqual({ d30: 1, d90: 1, d180: 2, older: 0 });
  });

  it('puts anything past 180 days in the last bucket', () => {
    const result = analyse(snapshot('2026-01-01T00:00:00Z', [repo('old', '2025-01-02T00:00:00Z')]));
    expect(result.freshness.older).toBe(1);
  });

  it('drops the profile README and this site, which are not work', () => {
    const result = analyse(
      snapshot('2026-01-01T00:00:00Z', [
        repo('dungca1512', '2025-12-01T00:00:00Z'),
        repo('dungca1512.github.io', '2025-12-01T00:00:00Z'),
        repo('ai-gateway', '2025-12-01T00:00:00Z'),
      ]),
    );

    expect(result.inScope).toBe(1);
    expect(result.topRepos.map((r) => r.name)).toEqual(['ai-gateway']);
  });

  it('drops coursework pushed before 2025', () => {
    const result = analyse(
      snapshot('2026-01-01T00:00:00Z', [
        repo('coursework', '2024-12-31T23:59:59Z'),
        repo('current', '2025-01-01T00:00:00Z'),
      ]),
    );

    expect(result.inScope).toBe(1);
    expect(result.topRepos[0]!.name).toBe('current');
  });

  /* Six of the seven real languages tie at one repo each. Sorting on the count
   * alone leaves their order to whatever the object enumerates, and the chart
   * colours rows by position — so an unstable sort means the same data draws a
   * differently-coloured chart on a different engine. */
  it('breaks a tie on count by name, so the colours do not shuffle', () => {
    const result = analyse(
      snapshot('2026-01-01T00:00:00Z', [
        repo('c', '2025-06-01T00:00:00Z', { language: 'Scala' }),
        repo('a', '2025-06-01T00:00:00Z', { language: 'Java' }),
        repo('b', '2025-06-01T00:00:00Z', { language: 'Makefile' }),
      ]),
    );

    expect(result.languages.map((l) => l.name)).toEqual(['Java', 'Makefile', 'Scala']);
    expect(result.languages.map((l) => l.series)).toEqual([1, 2, 3]);
  });

  it('shows at most six languages but counts them all', () => {
    const languages = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const result = analyse(
      snapshot(
        '2026-01-01T00:00:00Z',
        languages.map((language, i) => repo(`r${i}`, '2025-06-01T00:00:00Z', { language })),
      ),
    );

    expect(result.languages).toHaveLength(6);
    expect(result.languageCount).toBe(7);
  });

  it('keeps a missing language as null for the view to label', () => {
    const result = analyse(
      snapshot('2026-01-01T00:00:00Z', [repo('x', '2025-06-01T00:00:00Z', { language: null })]),
    );
    expect(result.languages[0]!.name).toBeNull();
  });

  it('reports twelve months, oldest first, ending in the snapshot month', () => {
    const result = analyse(snapshot('2026-09-05T04:42:01Z', [repo('x', '2026-03-09T00:00:00Z')]));

    expect(result.months).toHaveLength(12);
    expect(result.months[0]!.key).toBe('2025-10');
    expect(result.months[11]!.key).toBe('2026-09');
    expect(result.months.find((m) => m.key === '2026-03')!.count).toBe(1);
  });

  it('counts a month at zero rather than omitting it', () => {
    const result = analyse(snapshot('2026-09-05T00:00:00Z', [repo('x', '2026-03-09T00:00:00Z')]));
    expect(result.months.filter((m) => m.count === 0)).toHaveLength(11);
  });

  it('orders the table by most recently pushed and stops at six', () => {
    const result = analyse(
      snapshot(
        '2026-09-05T00:00:00Z',
        Array.from({ length: 8 }, (_, i) => repo(`r${i}`, `2025-0${i + 1}-01T00:00:00Z`)),
      ),
    );

    expect(result.topRepos).toHaveLength(6);
    expect(result.topRepos[0]!.name).toBe('r7');
    const dates = result.topRepos.map((r) => Date.parse(r.pushed_at));
    expect([...dates].sort((a, b) => b - a)).toEqual(dates);
  });

  it('states percentages against the repos in scope, not the account total', () => {
    const result = analyse(
      snapshot('2026-01-01T00:00:00Z', [
        repo('a', '2025-06-01T00:00:00Z', { language: 'Python' }),
        repo('b', '2025-06-01T00:00:00Z', { language: 'Python' }),
        repo('c', '2025-06-01T00:00:00Z', { language: 'Java' }),
        repo('dungca1512', '2025-06-01T00:00:00Z', { language: 'Java' }),
      ]),
    );

    expect(result.inScope).toBe(3);
    expect(result.languages[0]).toMatchObject({ name: 'Python', count: 2 });
    expect(Math.round(result.languages[0]!.pct)).toBe(67);
  });
});

/* The committed snapshot itself. Everything above proves the maths; this
 * proves the band is not quietly empty — a sync that returned nothing, or a
 * scope rule that excluded everything, would leave four charts drawn over no
 * data, and every assertion above would still pass. */
describe('the committed snapshot', () => {
  const real = analyse();

  it('leaves something for the band to draw', () => {
    expect(real.inScope).toBeGreaterThan(0);
    expect(real.languages.length).toBeGreaterThan(0);
    expect(real.topRepos.length).toBeGreaterThan(0);
  });

  it('carries the account totals the KPI row prints', () => {
    expect(real.publicRepos).toBeGreaterThan(0);
    expect(real.ownRepos).toBeGreaterThan(0);
    expect(real.ownRepos).toBeLessThanOrEqual(real.publicRepos);
  });

  it('was generated at a real instant', () => {
    expect(Number.isFinite(Date.parse(real.generatedAt))).toBe(true);
  });

  it('accounts for every in-scope repo in exactly one freshness bucket', () => {
    const { d30, d90, d180, older } = real.freshness;
    expect(d30 + d90 + d180 + older).toBe(real.inScope);
  });
});
