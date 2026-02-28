import fs from 'node:fs/promises';
import path from 'node:path';

const username = process.argv[2] || 'dungca1512';
const outputPath = process.argv[3] || 'github-data.json';

async function fetchJson(url) {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'portfolio-sync-script'
        }
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
        stats: {
            publicRepos: user.public_repos,
            followers: user.followers,
            following: user.following,
            nonForkRepos: nonForkRepos.length,
            recentRepos
        },
        repos: nonForkRepos.reduce((acc, repo) => {
            acc[repo.name] = {
                name: repo.name,
                html_url: repo.html_url,
                language: repo.language,
                stargazers_count: repo.stargazers_count,
                forks_count: repo.forks_count,
                pushed_at: repo.pushed_at,
                description: repo.description
            };
            return acc;
        }, {})
    };
}

async function main() {
    const [user, repos] = await Promise.all([
        fetchJson(`https://api.github.com/users/${username}`),
        fetchJson(`https://api.github.com/users/${username}/repos?per_page=100&type=owner&sort=updated`)
    ]);

    const data = normalize(user, repos);
    const abs = path.resolve(outputPath);

    await fs.writeFile(abs, JSON.stringify(data, null, 2) + '\n', 'utf8');

    console.log(`Synced GitHub data for ${username}`);
    console.log(`Output: ${abs}`);
    console.log(`publicRepos=${data.stats.publicRepos}, nonForkRepos=${data.stats.nonForkRepos}, recentRepos=${data.stats.recentRepos}`);
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
