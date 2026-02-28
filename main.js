// ============================================
// RENDER FUNCTIONS
// ============================================

const repoIconSVG = '<svg class="repo-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.28 1.15-.28 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>';

function renderPinnedRepos() {
    const grid = document.getElementById('pinnedGrid');
    if (!grid) return;
    grid.innerHTML = PINNED_REPOS.map(r => `
        <div class="repo-card">
            <div class="repo-header">
                ${repoIconSVG}
                <span class="repo-name">${r.name}</span>
            </div>
            <p class="repo-desc">${r.desc}</p>
            <div class="repo-footer">
                ${r.langs.map(l => `<span class="repo-lang"><span class="lang-dot" style="background:${l.color};width:8px;height:8px"></span> ${l.name}</span>`).join('')}
                <span class="repo-stat">⭐ ${r.stars}</span>
                ${r.forks ? `<span class="repo-stat">🍴 ${r.forks}</span>` : ''}
            </div>
        </div>
    `).join('');
}

function renderTimeline() {
    const el = document.getElementById('timeline');
    if (!el) return;
    el.innerHTML = TIMELINE_ITEMS.map(t => `
        <div class="timeline-item">
            <div class="timeline-dot ${t.color}"></div>
            <div class="timeline-date">${t.date}</div>
            <div class="timeline-text">${t.text}</div>
        </div>
    `).join('');
}

function renderProjects() {
    const el = document.getElementById('tab-projects');
    if (!el) return;
    el.innerHTML = PROJECTS.map(p => `
        <div class="project-full">
            <div class="project-full-card">
                <div class="project-full-banner" style="background:${p.banner}">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">${p.icon}</svg>
                </div>
                <div class="project-full-body">
                    <h3>${p.name} <span class="visibility">${p.label}</span></h3>
                    <p>${p.desc}</p>
                    <div class="project-full-techs">
                        ${p.techs.map(t => `<span class="tech-badge">${t}</span>`).join('')}
                    </div>
                    <div class="project-full-stats">
                        ${p.langs.map(l => `<span><span class="lang-dot-inline" style="background:${l.color}"></span> ${l.name} ${l.pct}</span>`).join('')}
                        <span>⭐ ${p.stars}</span>
                        ${p.forks ? `<span>🍴 ${p.forks}</span>` : ''}
                        <span>Updated ${p.updated}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderBlog() {
    const el = document.getElementById('tab-blog');
    if (!el) return;
    el.innerHTML = '<div class="post-list">' + BLOG_POSTS.map(p => `
        <div class="post-item">
            <div>
                <div class="post-title">${p.title}</div>
                <div class="post-excerpt">${p.excerpt}</div>
                <div class="post-meta">
                    ${p.tags.map(t => `<span class="post-tag">${t}</span>`).join('')}
                </div>
            </div>
            <span class="post-date">${p.date}</span>
        </div>
    `).join('') + '</div>';
}

function renderReadme() {
    const el = document.getElementById('tab-readme');
    if (!el) return;
    el.innerHTML = `
        <div class="readme-card">
            <div class="readme-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                README.md
            </div>
            <div class="readme-body">${README_HTML}</div>
        </div>
    `;
}

function generateContribGraph() {
    const graph = document.getElementById('contribGraph');
    if (!graph) return;
    // Seeded pseudo-random for consistent look
    let seed = 42;
    function rand() {
        seed = (seed * 16807 + 0) % 2147483647;
        return seed / 2147483647;
    }
    for (let w = 0; w < 52; w++) {
        for (let d = 0; d < 7; d++) {
            const cell = document.createElement('div');
            cell.className = 'contrib-cell';
            const recency = w / 52;
            const r = rand();
            const threshold = 0.3 + recency * 0.25;
            if (r < threshold * 0.4) { /* l0 - empty */ }
            else if (r < threshold * 0.65) cell.classList.add('l1');
            else if (r < threshold * 0.8) cell.classList.add('l2');
            else if (r < threshold * 0.92) cell.classList.add('l3');
            else cell.classList.add('l4');
            graph.appendChild(cell);
        }
    }
}

// ============================================
// TAB SWITCHING
// ============================================

function switchTab(tabName) {
    // Tab content
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const target = document.getElementById('tab-' + tabName);
    if (target) target.classList.add('active');

    // Tab buttons (main)
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tabName);
    });

    // Topbar nav
    document.querySelectorAll('.topbar-nav a, .mobile-dropdown a').forEach(a => {
        a.classList.toggle('active', a.dataset.tab === tabName);
    });

    // Close mobile dropdown
    const dd = document.getElementById('mobileDropdown');
    const toggle = document.getElementById('topbarToggle');
    if (dd) dd.classList.remove('open');
    if (toggle) toggle.classList.remove('open');

    // Scroll to tabs on mobile
    if (window.innerWidth <= 900) {
        const tabNav = document.querySelector('.tab-nav');
        if (tabNav) {
            setTimeout(() => tabNav.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        }
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Render everything
    renderPinnedRepos();
    renderTimeline();
    renderProjects();
    renderBlog();
    renderReadme();
    generateContribGraph();

    // Tab button clicks
    document.querySelectorAll('[data-tab]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(el.dataset.tab);
        });
    });

    // Topbar scroll shadow
    const topbar = document.getElementById('topbar');
    window.addEventListener('scroll', () => {
        topbar.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });

    // Mobile menu toggle
    const toggle = document.getElementById('topbarToggle');
    const dropdown = document.getElementById('mobileDropdown');
    if (toggle && dropdown) {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('open');
            dropdown.classList.toggle('open');
        });
    }
});
