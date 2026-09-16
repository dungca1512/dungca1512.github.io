import data from '../../public/github-data.json';

/* The GitHub band, computed at BUILD time from the committed snapshot in
 * public/github-data.json (refreshed by scripts/sync-github.mjs). The previous
 * site fetched that file in the browser and drew the same charts with client
 * JS; this one does not, for two reasons. A static export that fetches its own
 * numbers shows an empty band on first paint, and every visitor gets a
 * slightly different page depending on when the request lands. Neither is
 * worth the kilobytes — the file is already in the repo at build time.
 *
 * Every window below is anchored on `generatedAt`, the moment the snapshot was
 * taken, and NEVER on `Date.now()`. That distinction is the whole reason this
 * module has tests. "Updated in the last 30 days" means 30 days before the
 * data was collected; measured against the clock instead, the same frozen
 * snapshot would drift one repo at a time out of the fresh bucket every time
 * anyone rebuilt the site, and the chart would quietly become a lie about data
 * that never changed. Anchoring also makes the output a pure function of the
 * file, which is what lets a test assert exact numbers. */

/** Two repos are the profile README and this site itself. Neither is work —
 *  one is a text file, the other is the page you are reading — and leaving
 *  them in inflates every count on this band by two. */
const EXCLUDED = new Set(['dungca1512', 'dungca1512.github.io']);

/** Everything older is university coursework. It is real, and it is not
 *  evidence of current capability, so the band says so in its scope note
 *  rather than padding its own numbers with it. */
const SINCE = Date.parse('2025-01-01T00:00:00Z');

const MONTHS_SHOWN = 12;
const DAY = 24 * 60 * 60 * 1000;

export type Repo = {
  name: string;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  description: string | null;
};

export type LanguageSlice = { name: string | null; count: number; pct: number; series: number };
export type MonthBucket = { key: string; count: number };
export type Freshness = { d30: number; d90: number; d180: number; older: number };

export type GithubAnalytics = {
  generatedAt: string;
  /** Repos inside the scope this band declares — not the account total. */
  inScope: number;
  publicRepos: number;
  ownRepos: number;
  languageCount: number;
  languages: LanguageSlice[];
  months: MonthBucket[];
  freshness: Freshness;
  topRepos: Repo[];
};

/** `YYYY-MM` for a timestamp, in UTC. Local time would bucket a push made in
 *  the small hours into the neighbouring month depending on where the build
 *  ran, which is a difference no reader could explain. */
function monthKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** The last `MONTHS_SHOWN` month keys ending at the anchor, oldest first. */
function monthWindow(anchor: number): string[] {
  const end = new Date(anchor);
  const keys: string[] = [];
  for (let back = MONTHS_SHOWN - 1; back >= 0; back -= 1) {
    keys.push(monthKey(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - back, 1)));
  }
  return keys;
}

/** The shape this module needs, declared structurally rather than as
 *  `typeof data`. The inferred type of an imported JSON file has the repo
 *  names as literal keys, so `typeof data` would make the parameter impossible
 *  to satisfy with anything except that exact file — and a function that can
 *  only ever be called with production data cannot be tested against a case
 *  production data does not currently contain. */
export type Snapshot = {
  generatedAt: string;
  stats: { publicRepos: number; nonForkRepos: number };
  repos: Record<string, Repo>;
};

export function analyse(snapshot: Snapshot = data): GithubAnalytics {
  const anchor = Date.parse(snapshot.generatedAt);
  const repos = Object.values(snapshot.repos).filter((repo) => {
    if (EXCLUDED.has(repo.name)) return false;
    const touched = Date.parse(repo.pushed_at ?? '');
    return Number.isFinite(touched) && touched >= SINCE;
  });

  const byLanguage = new Map<string | null, number>();
  const byMonth = new Map<string, number>();
  const freshness: Freshness = { d30: 0, d90: 0, d180: 0, older: 0 };

  for (const repo of repos) {
    byLanguage.set(repo.language, (byLanguage.get(repo.language) ?? 0) + 1);

    const touched = Date.parse(repo.pushed_at);
    byMonth.set(monthKey(touched), (byMonth.get(monthKey(touched)) ?? 0) + 1);

    const days = Math.floor((anchor - touched) / DAY);
    if (days <= 30) freshness.d30 += 1;
    else if (days <= 90) freshness.d90 += 1;
    else if (days <= 180) freshness.d180 += 1;
    else freshness.older += 1;
  }

  /* Sorted by count, then by name, and the second key is not decoration:
   * six of the seven languages here tie at one repo each, and `Array.sort`
   * on the count alone would order them by whatever the object happened to
   * enumerate. The legend's colours are assigned by position, so an unstable
   * order means the same data draws a differently-coloured chart on a
   * different Node version. */
  const languages: LanguageSlice[] = [...byLanguage.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .slice(0, 6)
    .map(([name, count], i) => ({
      name,
      count,
      pct: repos.length === 0 ? 0 : (count / repos.length) * 100,
      series: i + 1,
    }));

  const months: MonthBucket[] = monthWindow(anchor).map((key) => ({
    key,
    count: byMonth.get(key) ?? 0,
  }));

  const topRepos = [...repos]
    .sort(
      (a, b) =>
        Date.parse(b.pushed_at) - Date.parse(a.pushed_at) ||
        b.stargazers_count - a.stargazers_count,
    )
    .slice(0, 6);

  return {
    generatedAt: snapshot.generatedAt,
    inScope: repos.length,
    publicRepos: snapshot.stats.publicRepos,
    ownRepos: snapshot.stats.nonForkRepos,
    languageCount: byLanguage.size,
    languages,
    months,
    freshness,
    topRepos,
  };
}
