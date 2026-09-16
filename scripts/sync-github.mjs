import fs from 'node:fs/promises';
import path from 'node:path';

const username = process.argv[2] || 'dungca1512';
const outputPath = process.argv[3] || 'public/github-data.json';

/** Optional, and only a rate limit - never access. Every endpoint below
 *  reads public profile data that any stranger can curl, so a token buys
 *  nothing but headroom.
 *
 *  It matters because the headroom differs by two orders of magnitude.
 *  Unauthenticated calls to api.github.com get 60 an hour PER IP ADDRESS,
 *  and a GitHub Actions runner does not have an IP of its own - it borrows
 *  one from a pool shared with every other job on the platform. The
 *  scheduled sync can therefore arrive to find the hour's 60 already spent
 *  by strangers and fail with a 403 that has nothing to do with this
 *  repository. Authenticated with the workflow's GITHUB_TOKEN the limit is
 *  1,000 an hour per repository - a budget no one else can draw on.
 *
 *  Unset is the normal case at a desk: two requests against 60 an hour from
 *  one machine is not a limit anyone reaches. */
const token = process.env.GITHUB_TOKEN;

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'portfolio-sync-script',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Request failed: ${url} -> ${res.status} ${res.statusText} ${body}`);
  }

  return res.json();
}

function normalize(user, repos) {
  const nonForkRepos = repos.filter((repo) => !repo.fork);
  const currentYear = new Date().getFullYear();

  const recentRepos = nonForkRepos.filter((repo) => {
    const year = new Date(repo.pushed_at).getFullYear();
    return year >= currentYear - 1;
  }).length;

  return {
    generatedAt: new Date().toISOString(),
    source: `https://api.github.com/users/${username}`,
    profile: {
      username: user.login,
      name: user.name,
      avatar_url: user.avatar_url,
      html_url: user.html_url,
    },
    stats: {
      publicRepos: user.public_repos,
      followers: user.followers,
      following: user.following,
      nonForkRepos: nonForkRepos.length,
      recentRepos,
    },
    repos: nonForkRepos.reduce((acc, repo) => {
      acc[repo.name] = {
        name: repo.name,
        html_url: repo.html_url,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        pushed_at: repo.pushed_at,
        description: repo.description,
      };
      return acc;
    }, {}),
  };
}

async function main() {
  const [user, repos] = await Promise.all([
    fetchJson(`https://api.github.com/users/${username}`),
    fetchJson(
      `https://api.github.com/users/${username}/repos?per_page=100&type=owner&sort=updated`,
    ),
  ]);

  const data = normalize(user, repos);
  const abs = path.resolve(outputPath);

  await fs.writeFile(abs, JSON.stringify(data, null, 2) + '\n', 'utf8');

  console.log(`Synced GitHub data for ${username}`);
  console.log(`Output: ${abs}`);
  console.log(
    `publicRepos=${data.stats.publicRepos}, nonForkRepos=${data.stats.nonForkRepos}, recentRepos=${data.stats.recentRepos}`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
