const byId = (id) => document.getElementById(id);
const LANG_STORAGE_KEY = 'portfolio_lang';

function getInitialLanguage() {
    try {
        return localStorage.getItem(LANG_STORAGE_KEY) || 'en';
    } catch (error) {
        return 'en';
    }
}

const state = {
    lang: getInitialLanguage(),
    github: null,
    revealObserver: null
};

function getValueByPath(obj, path) {
    return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
}

function t(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return value;
    }
    if (value.en !== undefined || value.vi !== undefined) {
        return value[state.lang] || value.en;
    }
    return value;
}

function formatDate(isoDate) {
    if (!isoDate) {
        return '';
    }
    const locale = state.lang === 'vi' ? 'vi-VN' : 'en-US';
    return new Date(isoDate).toLocaleDateString(locale, { month: 'short', year: 'numeric' });
}

function setLanguage(lang) {
    state.lang = lang;
    try {
        localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (error) {
        // Ignore storage failures and keep in-memory language state.
    }
    document.documentElement.lang = lang;

    document.querySelectorAll('.lang-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    applyStaticI18n();
    renderDynamicSections();
}

function applyStaticI18n() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.dataset.i18n;
        const value = getValueByPath(PORTFOLIO_DATA.i18n, key);
        if (value) {
            el.textContent = t(value);
        }
    });

    const year = new Date().getFullYear();
    byId('footerText').textContent = `© ${year} ${PORTFOLIO_DATA.profile.name}. ${t(PORTFOLIO_DATA.i18n.contact.footer)}`;
}

function resolveMetricValue(metric) {
    const fromGithub = state.github ? getValueByPath(state.github, metric.source) : null;
    if (fromGithub !== null && fromGithub !== undefined && fromGithub !== '') {
        return String(fromGithub);
    }
    return metric.fallback;
}

function calculateAnalytics() {
    const repos = Object.values(state.github?.repos || {});
    if (!repos.length) {
        return null;
    }

    const unknownLabel = t(PORTFOLIO_DATA.i18n.analytics.unknown);
    const languageCountMap = {};
    const yearlyCountMap = {};
    const freshness = { d30: 0, d90: 0, d180: 0, old: 0 };
    const now = Date.now();

    repos.forEach((repo) => {
        const language = repo.language || unknownLabel;
        languageCountMap[language] = (languageCountMap[language] || 0) + 1;

        if (repo.pushed_at) {
            const date = new Date(repo.pushed_at);
            if (!Number.isNaN(date.getTime())) {
                const year = String(date.getFullYear());
                yearlyCountMap[year] = (yearlyCountMap[year] || 0) + 1;

                const days = Math.floor((now - date.getTime()) / (1000 * 60 * 60 * 24));
                if (days <= 30) freshness.d30 += 1;
                else if (days <= 90) freshness.d90 += 1;
                else if (days <= 180) freshness.d180 += 1;
                else freshness.old += 1;
            }
        }
    });

    const languages = Object.entries(languageCountMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

    const years = Object.entries(yearlyCountMap)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .slice(-6);

    return {
        total: repos.length,
        languages,
        years,
        freshness
    };
}

function renderAnalytics() {
    const languageEl = byId('languageChart');
    const yearlyEl = byId('yearlyChart');
    const freshnessEl = byId('freshnessChart');
    const analytics = calculateAnalytics();

    if (!languageEl || !yearlyEl || !freshnessEl) {
        return;
    }

    if (!analytics) {
        const emptyText = t(PORTFOLIO_DATA.i18n.analytics.noData);
        languageEl.innerHTML = `<div class="chart-empty">${emptyText}</div>`;
        yearlyEl.innerHTML = `<div class="chart-empty">${emptyText}</div>`;
        freshnessEl.innerHTML = `<div class="chart-empty">${emptyText}</div>`;
        return;
    }

    const langMax = Math.max(...analytics.languages.map((item) => item[1]), 1);
    languageEl.innerHTML = `
        <div class="chart-list">
            ${analytics.languages.map(([language, count]) => `
                <div class="chart-row">
                    <span class="chart-row-label" title="${language}">${language}</span>
                    <span class="chart-track"><span class="chart-fill" style="width:${(count / langMax) * 100}%"></span></span>
                    <span class="chart-row-value">${count}</span>
                </div>
            `).join('')}
        </div>
    `;

    const yearMax = Math.max(...analytics.years.map((item) => item[1]), 1);
    yearlyEl.innerHTML = `
        <div class="year-bars">
            ${analytics.years.map(([year, count]) => `
                <div class="year-col">
                    <div class="year-col-bar-wrap"><div class="year-col-bar" style="height:${(count / yearMax) * 100}%"></div></div>
                    <span class="year-col-count">${count}</span>
                    <span class="year-col-label">${year}</span>
                </div>
            `).join('')}
        </div>
    `;

    const freshTotal = Math.max(
        analytics.freshness.d30 + analytics.freshness.d90 + analytics.freshness.d180 + analytics.freshness.old,
        1
    );
    const freshRows = [
        { key: 'd30', cls: 'fresh-30', label: t(PORTFOLIO_DATA.i18n.analytics.days30) },
        { key: 'd90', cls: 'fresh-90', label: t(PORTFOLIO_DATA.i18n.analytics.days90) },
        { key: 'd180', cls: 'fresh-180', label: t(PORTFOLIO_DATA.i18n.analytics.days180) },
        { key: 'old', cls: 'fresh-old', label: t(PORTFOLIO_DATA.i18n.analytics.older) }
    ];

    freshnessEl.innerHTML = `
        <div class="freshness-stack">
            ${freshRows.map((row) => `
                <span class="fresh-seg ${row.cls}" style="width:${(analytics.freshness[row.key] / freshTotal) * 100}%"></span>
            `).join('')}
        </div>
        <ul class="freshness-legend">
            ${freshRows.map((row) => `
                <li>
                    <span class="fresh-left"><span class="fresh-dot ${row.cls}"></span>${row.label}</span>
                    <span class="fresh-val">${analytics.freshness[row.key]}</span>
                </li>
            `).join('')}
        </ul>
    `;
}

function renderHero() {
    byId('profileLocation').textContent = t(PORTFOLIO_DATA.profile.location);
    byId('profileStatus').textContent = t(PORTFOLIO_DATA.profile.status);

    const avatarEl = byId('heroAvatar');
    if (avatarEl) {
        const localAvatar = PORTFOLIO_DATA.profile.avatarUrl;
        const githubAvatar = state.github?.profile?.avatar_url;
        const defaultGithubAvatar = `https://avatars.githubusercontent.com/${PORTFOLIO_DATA.github.username}?v=4`;
        const profileAvatar = localAvatar || githubAvatar || defaultGithubAvatar;
        const fallbackAvatar = githubAvatar || defaultGithubAvatar;
        avatarEl.src = profileAvatar;
        avatarEl.onerror = () => {
            avatarEl.onerror = null;
            avatarEl.src = fallbackAvatar;
        };
    }

    byId('heroTrust').innerHTML = PORTFOLIO_DATA.heroTrust
        .map((item) => `<li>${t(item)}</li>`)
        .join('');

    byId('focusList').innerHTML = PORTFOLIO_DATA.focus
        .map((item) => `<li>${t(item)}</li>`)
        .join('');
}

function renderMetrics() {
    byId('metricsGrid').innerHTML = PORTFOLIO_DATA.metrics
        .map((item, index) => `
            <article class="metric-card reveal" style="--reveal-delay:${index * 80}ms">
                <h3>${resolveMetricValue(item)}</h3>
                <p>${t(item.label)}</p>
            </article>
        `)
        .join('');
}

function renderExpertise() {
    byId('expertiseGrid').innerHTML = PORTFOLIO_DATA.expertise
        .map((item, index) => `
            <article class="expertise-card reveal" style="--reveal-delay:${index * 90}ms">
                <div class="expertise-icon">${item.icon}</div>
                <h3>${t(item.title)}</h3>
                <p>${t(item.description)}</p>
            </article>
        `)
        .join('');
}

function renderProjects() {
    const repoMap = state.github?.repos || {};

    byId('projectsGrid').innerHTML = PORTFOLIO_DATA.projects
        .map((project, index) => {
            const stack = project.stack.map((tech) => `<li>${tech}</li>`).join('');
            const links = project.links
                .map((link) => `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${t(link.label)}</a>`)
                .join('');

            const repoData = repoMap[project.repo] || null;
            const repoMeta = [];

            if (repoData?.language) {
                repoMeta.push(repoData.language);
            }
            if (repoData?.stargazers_count !== undefined) {
                repoMeta.push(`${t(PORTFOLIO_DATA.i18n.common.stars)} ${repoData.stargazers_count}`);
            }
            if (repoData?.forks_count !== undefined) {
                repoMeta.push(`${t(PORTFOLIO_DATA.i18n.common.forks)} ${repoData.forks_count}`);
            }
            if (repoData?.pushed_at) {
                repoMeta.push(`${t(PORTFOLIO_DATA.i18n.common.updated)} ${formatDate(repoData.pushed_at)}`);
            }

            return `
                <article class="project-card reveal" style="--reveal-delay:${index * 100}ms">
                    <div class="project-head">
                        <h3>${project.name}</h3>
                        <span class="project-period">${project.period}</span>
                    </div>
                    <p class="project-summary">${t(project.summary)}</p>
                    <p class="project-impact">${t(project.outcome)}</p>
                    ${repoMeta.length ? `<p class="project-repo-meta">${repoMeta.join(' · ')}</p>` : ''}
                    <ul class="project-stack">${stack}</ul>
                    <div class="project-links">${links}</div>
                </article>
            `;
        })
        .join('');
}

function renderCaseStudy() {
    const data = PORTFOLIO_DATA.caseStudy;

    byId('caseStudyHeading').textContent = t(data.title);
    byId('caseStudySubheading').textContent = t(data.subtitle);
    byId('caseStudyRepo').href = data.repoUrl;
    byId('caseStudyRepo').textContent = t(PORTFOLIO_DATA.i18n.common.repository);

    byId('caseHighlights').innerHTML = data.highlights
        .map((item, index) => `<li class="reveal" style="--reveal-delay:${index * 90}ms">${t(item)}</li>`)
        .join('');

    byId('caseGrid').innerHTML = data.blocks
        .map((item, index) => `
            <article class="case-block reveal" style="--reveal-delay:${index * 90}ms">
                <h4>${t(item.title)}</h4>
                <p>${t(item.text)}</p>
            </article>
        `)
        .join('');
}

function renderPlaybook() {
    byId('playbookList').innerHTML = PORTFOLIO_DATA.playbook
        .map((item, index) => `
            <li class="reveal" style="--reveal-delay:${index * 80}ms">
                <h3>${t(item.title)}</h3>
                <p>${t(item.description)}</p>
            </li>
        `)
        .join('');
}

function renderWriting() {
    byId('writingGrid').innerHTML = PORTFOLIO_DATA.writing
        .map((article, index) => {
            const tags = article.tags.map((tag) => `<li>${tag}</li>`).join('');
            return `
                <a class="article-card reveal" style="--reveal-delay:${index * 100}ms" href="${article.url}" target="_blank" rel="noopener noreferrer">
                    <span class="article-meta">${article.year}</span>
                    <h3>${t(article.title)}</h3>
                    <p>${t(article.summary)}</p>
                    <ul class="article-tags">${tags}</ul>
                </a>
            `;
        })
        .join('');
}

function renderContacts() {
    byId('contactActions').innerHTML = PORTFOLIO_DATA.contacts
        .map((item, index) => {
            const isExternal = item.url.startsWith('http');
            const targetAttrs = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
            const downloadAttr = item.download ? 'download' : '';
            return `<a class="reveal" style="--reveal-delay:${index * 70}ms" href="${item.url}" ${targetAttrs} ${downloadAttr}>${t(item.label)}</a>`;
        })
        .join('');
}

function renderDynamicSections() {
    renderHero();
    renderMetrics();
    renderAnalytics();
    renderExpertise();
    renderProjects();
    renderCaseStudy();
    renderPlaybook();
    renderWriting();
    renderContacts();
    initReveal();
}

function initHeader() {
    const header = byId('siteHeader');

    const onScroll = () => {
        header.classList.toggle('scrolled', window.scrollY > 8);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
}

function initMobileMenu() {
    const toggle = byId('menuToggle');
    const nav = byId('siteNav');

    toggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('open');
        toggle.classList.toggle('open', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
    });

    nav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            nav.classList.remove('open');
            toggle.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        });
    });
}

function initActiveNav() {
    const navLinks = Array.from(document.querySelectorAll('[data-nav]'));
    const sections = navLinks
        .map((link) => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    if (!sections.length || !('IntersectionObserver' in window)) {
        return;
    }

    const setActive = (id) => {
        navLinks.forEach((link) => {
            link.classList.toggle('active', link.dataset.nav === id);
        });
    };

    const observer = new IntersectionObserver((entries) => {
        const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
            setActive(visible.target.id);
        }
    }, { threshold: [0.25, 0.45, 0.7], rootMargin: '-20% 0px -50% 0px' });

    sections.forEach((section) => observer.observe(section));
}

function initReveal() {
    if (state.revealObserver) {
        state.revealObserver.disconnect();
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.classList.remove('js-animate');
        document.querySelectorAll('.reveal').forEach((node) => node.classList.add('is-visible'));
        return;
    }

    document.documentElement.classList.add('js-animate');

    const revealNodes = Array.from(document.querySelectorAll('.reveal'));

    if (!('IntersectionObserver' in window)) {
        revealNodes.forEach((node) => node.classList.add('is-visible'));
        return;
    }

    state.revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -12% 0px' });

    revealNodes.forEach((node) => {
        const rect = node.getBoundingClientRect();
        const shouldShowNow = rect.top < window.innerHeight * 0.92;

        if (shouldShowNow) {
            node.classList.add('is-visible');
            return;
        }

        node.classList.remove('is-visible');
        state.revealObserver.observe(node);
    });
}

function initLanguageToggle() {
    document.querySelectorAll('.lang-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (btn.dataset.lang !== state.lang) {
                setLanguage(btn.dataset.lang);
            }
        });
    });
}

function normalizeGithubData(user, repos) {
    const nonFork = repos.filter((repo) => !repo.fork);
    const currentYear = new Date().getFullYear();

    const recentRepos = nonFork.filter((repo) => {
        const year = new Date(repo.pushed_at).getFullYear();
        return year >= currentYear - 1;
    }).length;

    return {
        generatedAt: new Date().toISOString(),
        profile: {
            username: user.login,
            name: user.name,
            avatar_url: user.avatar_url,
            html_url: user.html_url
        },
        stats: {
            publicRepos: user.public_repos,
            followers: user.followers,
            following: user.following,
            nonForkRepos: nonFork.length,
            recentRepos
        },
        repos: nonFork.reduce((acc, repo) => {
            acc[repo.name] = {
                name: repo.name,
                language: repo.language,
                stargazers_count: repo.stargazers_count,
                forks_count: repo.forks_count,
                pushed_at: repo.pushed_at,
                html_url: repo.html_url
            };
            return acc;
        }, {})
    };
}

async function loadGithubData() {
    const fetchWithTimeout = async (url, options = {}, timeoutMs = 3000) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            return await fetch(url, { ...options, signal: controller.signal });
        } finally {
            clearTimeout(timer);
        }
    };

    try {
        const local = await fetchWithTimeout(PORTFOLIO_DATA.github.dataFile, { cache: 'no-store' }, 1500);
        if (local.ok) {
            state.github = await local.json();
            return;
        }
    } catch (error) {
        // Fallback to live API
    }

    try {
        const username = PORTFOLIO_DATA.github.username;
        const [userRes, reposRes] = await Promise.all([
            fetchWithTimeout(`https://api.github.com/users/${username}`, {}, 3000),
            fetchWithTimeout(`https://api.github.com/users/${username}/repos?per_page=100&type=owner&sort=updated`, {}, 3000)
        ]);

        if (!userRes.ok || !reposRes.ok) {
            return;
        }

        const [user, repos] = await Promise.all([userRes.json(), reposRes.json()]);
        state.github = normalizeGithubData(user, repos);
    } catch (error) {
        // Keep static fallback data
    }
}

async function bootstrap() {
    initHeader();
    initMobileMenu();
    initActiveNav();
    initLanguageToggle();

    // Render immediately with local fallback data to avoid blank UI on slow/blocked network.
    setLanguage(state.lang);

    // Refresh with GitHub data asynchronously when available.
    loadGithubData().then(() => {
        renderDynamicSections();
    });
}

document.addEventListener('DOMContentLoaded', bootstrap);
