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

function renderHero() {
    byId('profileLocation').textContent = t(PORTFOLIO_DATA.profile.location);
    byId('profileStatus').textContent = t(PORTFOLIO_DATA.profile.status);

    byId('heroTrust').innerHTML = PORTFOLIO_DATA.heroTrust
        .map((item) => `<li>${t(item)}</li>`)
        .join('');

    byId('focusList').innerHTML = PORTFOLIO_DATA.focus
        .map((item) => `<li>${t(item)}</li>`)
        .join('');
}

function renderMetrics() {
    byId('metricsGrid').innerHTML = PORTFOLIO_DATA.metrics
        .map((item) => `
            <article class="metric-card reveal">
                <h3>${resolveMetricValue(item)}</h3>
                <p>${t(item.label)}</p>
            </article>
        `)
        .join('');
}

function renderExpertise() {
    byId('expertiseGrid').innerHTML = PORTFOLIO_DATA.expertise
        .map((item) => `
            <article class="expertise-card reveal">
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
        .map((project) => {
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
                <article class="project-card reveal">
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
        .map((item) => `<li>${t(item)}</li>`)
        .join('');

    byId('caseGrid').innerHTML = data.blocks
        .map((item) => `
            <article class="case-block">
                <h4>${t(item.title)}</h4>
                <p>${t(item.text)}</p>
            </article>
        `)
        .join('');
}

function renderPlaybook() {
    byId('playbookList').innerHTML = PORTFOLIO_DATA.playbook
        .map((item) => `
            <li class="reveal">
                <h3>${t(item.title)}</h3>
                <p>${t(item.description)}</p>
            </li>
        `)
        .join('');
}

function renderWriting() {
    byId('writingGrid').innerHTML = PORTFOLIO_DATA.writing
        .map((article) => {
            const tags = article.tags.map((tag) => `<li>${tag}</li>`).join('');
            return `
                <a class="article-card reveal" href="${article.url}" target="_blank" rel="noopener noreferrer">
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
        .map((item) => {
            const isExternal = item.url.startsWith('http');
            const targetAttrs = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
            const downloadAttr = item.download ? 'download' : '';
            return `<a href="${item.url}" ${targetAttrs} ${downloadAttr}>${t(item.label)}</a>`;
        })
        .join('');
}

function renderDynamicSections() {
    renderHero();
    renderMetrics();
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
    }, { threshold: 0.14, rootMargin: '0px 0px -10% 0px' });

    revealNodes.forEach((node) => {
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
