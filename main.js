const byId = (id) => document.getElementById(id);

function renderHero() {
    const data = PORTFOLIO_DATA;

    const trustEl = byId('heroTrust');
    trustEl.innerHTML = data.heroTrust.map((item) => `<li>${item}</li>`).join('');

    const focusEl = byId('focusList');
    focusEl.innerHTML = data.focus.map((item) => `<li>${item}</li>`).join('');

    byId('profileLocation').textContent = data.profile.location;
    byId('profileStatus').textContent = data.profile.status;
}

function renderMetrics() {
    const metricsGrid = byId('metricsGrid');
    metricsGrid.innerHTML = PORTFOLIO_DATA.metrics.map((item) => `
        <article class="metric-card reveal">
            <h3>${item.value}</h3>
            <p>${item.label}</p>
        </article>
    `).join('');
}

function renderExpertise() {
    const expertiseGrid = byId('expertiseGrid');
    expertiseGrid.innerHTML = PORTFOLIO_DATA.expertise.map((item) => `
        <article class="expertise-card reveal">
            <div class="expertise-icon">${item.icon}</div>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
        </article>
    `).join('');
}

function renderProjects() {
    const projectsGrid = byId('projectsGrid');

    projectsGrid.innerHTML = PORTFOLIO_DATA.projects.map((project) => {
        const stack = project.stack.map((tech) => `<li>${tech}</li>`).join('');
        const links = project.links.map((link) => `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.label}</a>`).join('');

        return `
            <article class="project-card reveal">
                <div class="project-head">
                    <h3>${project.name}</h3>
                    <span class="project-period">${project.period}</span>
                </div>
                <p class="project-summary">${project.summary}</p>
                <p class="project-impact">${project.impact}</p>
                <ul class="project-stack">${stack}</ul>
                <div class="project-links">${links}</div>
            </article>
        `;
    }).join('');
}

function renderPlaybook() {
    const playbookList = byId('playbookList');

    playbookList.innerHTML = PORTFOLIO_DATA.playbook.map((item) => `
        <li class="reveal">
            <h3>${item.title}</h3>
            <p>${item.description}</p>
        </li>
    `).join('');
}

function renderWriting() {
    const writingGrid = byId('writingGrid');

    writingGrid.innerHTML = PORTFOLIO_DATA.writing.map((article) => {
        const tags = article.tags.map((tag) => `<li>${tag}</li>`).join('');
        const hasLink = Boolean(article.url);
        const tagName = hasLink ? 'a' : 'article';
        const hrefAttr = hasLink ? `href=\"${article.url}\"` : '';
        const relAttrs = hasLink && article.url.startsWith('http')
            ? 'target=\"_blank\" rel=\"noopener noreferrer\"'
            : '';

        return `
            <${tagName} class="article-card reveal" ${hrefAttr} ${relAttrs}>
                <span class="article-meta">${article.year}</span>
                <h3>${article.title}</h3>
                <p>${article.summary}</p>
                <ul class="article-tags">${tags}</ul>
            </${tagName}>
        `;
    }).join('');
}

function renderContacts() {
    const contactActions = byId('contactActions');

    contactActions.innerHTML = PORTFOLIO_DATA.contacts.map((item) => {
        const isExternal = item.url.startsWith('http');
        const attrs = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${item.url}" ${attrs}>${item.label}</a>`;
    }).join('');
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

    if (!toggle || !nav) {
        return;
    }

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
    }, { threshold: [0.2, 0.45, 0.7], rootMargin: '-20% 0px -50% 0px' });

    sections.forEach((section) => observer.observe(section));
}

function initReveal() {
    const revealNodes = Array.from(document.querySelectorAll('.reveal'));

    if (!revealNodes.length) {
        return;
    }

    if (!('IntersectionObserver' in window)) {
        revealNodes.forEach((node) => node.classList.add('is-visible'));
        return;
    }

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.14, rootMargin: '0px 0px -10% 0px' });

    revealNodes.forEach((node) => revealObserver.observe(node));
}

function setCurrentYear() {
    byId('currentYear').textContent = new Date().getFullYear();
}

function bootstrap() {
    renderHero();
    renderMetrics();
    renderExpertise();
    renderProjects();
    renderPlaybook();
    renderWriting();
    renderContacts();

    setCurrentYear();
    initHeader();
    initMobileMenu();
    initActiveNav();
    initReveal();
}

document.addEventListener('DOMContentLoaded', bootstrap);
