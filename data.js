// ============================================
// DATA — Edit your content here
// ============================================

const PINNED_REPOS = [
    {
        name: 'ai-gateway',
        desc: 'Multi-provider AI orchestration with circuit breakers, rate limiting & intelligent routing across OpenAI, Gemini, Claude & local models',
        langs: [{ name: 'Java', color: '#b07219' }, { name: 'Python', color: '#3572A5' }],
        stars: 18, forks: 3
    },
    {
        name: 'nihongo-learn',
        desc: 'AI-powered Japanese learning platform with hybrid LLM + SudachiPy analysis and on-device speech recognition',
        langs: [{ name: 'Python', color: '#3572A5' }],
        stars: 12, forks: 2
    },
    {
        name: 'devops-ai-agent',
        desc: 'Multi-agent incident response system with MCP, A2A protocols, LangChain & LangGraph orchestration',
        langs: [{ name: 'Python', color: '#3572A5' }],
        stars: 10, forks: 1
    },
    {
        name: 'mobile-ocr',
        desc: 'Cross-platform OCR app for iOS & Android with on-device ML for multilingual text recognition',
        langs: [{ name: 'Python', color: '#3572A5' }, { name: 'JS', color: '#f1e05a' }],
        stars: 8, forks: 0
    }
];

const TIMELINE_ITEMS = [
    { color: 'green', date: 'Feb 2025', text: 'Pushed 14 commits to <strong>ai-gateway</strong> — added Gemini Pro 2.5 support and streaming response handling' },
    { color: 'blue', date: 'Feb 2025', text: 'Created repository <strong>devops-ai-agent</strong> — multi-agent incident response with MCP + A2A' },
    { color: 'purple', date: 'Jan 2025', text: 'Published blog post: <strong>"World Models & the Path to AGI"</strong>' },
    { color: 'orange', date: 'Jan 2025', text: 'Released <strong>v2.0</strong> of <strong>nihongo-learn</strong> — added Whisper-based speech recognition for mobile' },
    { color: 'green', date: 'Dec 2024', text: 'Pushed 23 commits to <strong>ai-gateway</strong> — implemented circuit breaker patterns and Redis caching layer' },
    { color: 'blue', date: 'Nov 2024', text: 'Opened PR on <strong>nihongo-learn</strong> — hybrid SudachiPy + LLM vocabulary extraction pipeline' },
];

const PROJECTS = [
    {
        name: 'ai-gateway', label: 'Public',
        banner: 'linear-gradient(135deg, #0f4c75, #1b262c)',
        icon: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
        desc: 'A multi-provider AI orchestration system that intelligently routes requests across OpenAI, Gemini, Claude, and local models. Built with reactive Java Spring Boot WebFlux for high-throughput request handling and Python FastAPI for model-specific processing. Features circuit breaker patterns for failover, Redis-backed rate limiting and caching, Docker containerization, and a unified API interface.',
        techs: ['Java', 'Spring Boot WebFlux', 'Python', 'FastAPI', 'Redis', 'Docker'],
        langs: [{ name: 'Java', color: '#b07219', pct: '55%' }, { name: 'Python', color: '#3572A5', pct: '35%' }],
        stars: 18, forks: 3, updated: 'Feb 2025'
    },
    {
        name: 'nihongo-learn', label: 'Public',
        banner: 'linear-gradient(135deg, #c0392b, #2c1320)',
        icon: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
        desc: 'AI-powered Japanese learning platform with hybrid content generation — combining LLM creativity for lesson content with deterministic code (SudachiPy) for accurate Japanese word analysis and morphology. Integrates on-device speech recognition using Whisper and SenseVoice models optimized for CJK languages on mobile platforms.',
        techs: ['Python', 'SudachiPy', 'Whisper', 'SenseVoice', 'iOS', 'Android'],
        langs: [{ name: 'Python', color: '#3572A5', pct: '80%' }],
        stars: 12, forks: 2, updated: 'Jan 2025'
    },
    {
        name: 'devops-ai-agent', label: 'Public',
        banner: 'linear-gradient(135deg, #6c3483, #1a1a2e)',
        icon: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4M7 8l3 3-3 3M13 14h4"/>',
        desc: 'Comprehensive multi-agent incident response system integrating MCP (Model Context Protocol) and A2A (Agent-to-Agent) protocols. Built with LangChain and LangGraph for complex agent orchestration. Agents collaborate to detect, diagnose, and respond to infrastructure incidents with human-in-the-loop checkpoints.',
        techs: ['LangChain', 'LangGraph', 'MCP', 'A2A', 'Python'],
        langs: [{ name: 'Python', color: '#3572A5', pct: '92%' }],
        stars: 10, forks: 1, updated: 'Feb 2025'
    },
    {
        name: 'mobile-ocr', label: 'Public',
        banner: 'linear-gradient(135deg, #1e8449, #0b2e1a)',
        icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
        desc: 'Cross-platform OCR application for iOS and Android, leveraging on-device ML for text recognition across Vietnamese, Japanese, Chinese, and Korean. Optimized for mobile deployment with models in the 0.5B-1.5B parameter range.',
        techs: ['iOS', 'Android', 'Computer Vision', 'ML'],
        langs: [{ name: 'Python', color: '#3572A5', pct: '60%' }, { name: 'JS', color: '#f1e05a', pct: '25%' }],
        stars: 8, forks: 0, updated: 'Dec 2024'
    }
];

const BLOG_POSTS = [
    { title: 'World Models & the Path to AGI', excerpt: 'An exploration connecting historical scientific paradigms — from Newtonian mechanics to quantum field theory — to the limitations of current AI architectures.', tags: ['AGI', 'World Models', 'Research'], date: 'Jan 2025' },
    { title: 'Designing Multi-Agent LLM Systems', excerpt: 'Lessons from building production agent systems: why MCP and A2A protocols matter, how to handle agent failures gracefully, and the importance of human-in-the-loop design.', tags: ['Multi-Agent', 'MCP', 'LangGraph'], date: 'Jan 2025' },
    { title: 'Deploying Speech Models on Mobile', excerpt: 'Practical strategies for running Whisper and SenseVoice on iOS and Android — from model quantization to on-device optimization for CJK language processing.', tags: ['Mobile AI', 'Whisper', 'Optimization'], date: 'Dec 2024' },
    { title: 'Chain of Thought: Beyond the Basics', excerpt: 'Advanced prompt engineering techniques for complex reasoning tasks — when CoT helps, when it hurts, and how to combine it with structured output.', tags: ['Prompt Engineering', 'CoT'], date: 'Nov 2024' },
    { title: 'Building a Resilient AI Gateway', excerpt: 'Architecture decisions behind a multi-provider AI gateway: reactive programming with WebFlux, circuit breaker patterns, and intelligent routing strategies.', tags: ['Architecture', 'Java', 'System Design'], date: 'Oct 2024' },
    { title: 'Hybrid AI + Code for Japanese NLP', excerpt: 'Why pure LLM-based Japanese vocabulary extraction fails, and how combining AI creativity with deterministic morphological analysis produces reliable results.', tags: ['NLP', 'Japanese', 'SudachiPy'], date: 'Sep 2024' },
];

const README_HTML = `
<h1>👋 Hi, I'm Dũng Ca</h1>
<div class="status-badges">
    <div class="status-badge"><span class="status-badge-label">Focus</span><span class="status-badge-value blue">AI/ML Engineering</span></div>
    <div class="status-badge"><span class="status-badge-label">Location</span><span class="status-badge-value green">Hanoi, Vietnam</span></div>
    <div class="status-badge"><span class="status-badge-label">Status</span><span class="status-badge-value purple">Open to collaborate</span></div>
</div>
<blockquote><p>Building production-grade AI systems that combine the creativity of LLMs with the reliability of deterministic engineering.</p></blockquote>
<h2>🔭 What I'm Working On</h2>
<ul>
    <li><strong>AI Gateway</strong> — Multi-provider LLM orchestration with circuit breakers, rate limiting, and intelligent routing (Java Spring Boot WebFlux + Python FastAPI)</li>
    <li><strong>DevOps AI Agent</strong> — Multi-agent incident response using MCP, A2A protocols with LangChain & LangGraph</li>
    <li><strong>Japanese Learning Platform</strong> — Hybrid AI + deterministic NLP for language learning with on-device speech recognition</li>
</ul>
<h2>🌱 Currently Learning</h2>
<ul>
    <li>Kubernetes deployment strategies & advanced orchestration</li>
    <li>World models and their implications for AGI</li>
    <li>Java multithreading — synchronization, thread pools, concurrent patterns</li>
    <li>Mobile AI deployment for speech recognition (Whisper, SenseVoice)</li>
</ul>
<h2>🛠️ Tech Stack</h2>
<h3>Languages & Frameworks</h3>
<p><code>Python</code> <code>Java</code> <code>Spring Boot WebFlux</code> <code>FastAPI</code> <code>C</code></p>
<h3>AI / ML</h3>
<p><code>LangChain</code> <code>LangGraph</code> <code>PyTorch</code> <code>Whisper</code> <code>SenseVoice</code> <code>LoRA/QLoRA</code> <code>SudachiPy</code></p>
<h3>Infrastructure</h3>
<p><code>Docker</code> <code>Kubernetes</code> <code>Redis</code> <code>GitHub Actions</code> <code>CI/CD</code></p>
<h3>Protocols</h3>
<p><code>MCP (Model Context Protocol)</code> <code>A2A (Agent-to-Agent)</code></p>
<h2>🌐 Languages</h2>
<p>🇻🇳 Vietnamese (native) · 🇺🇸 English (fluent) · 🇯🇵 Japanese (conversational)</p>
<h2>💡 Interests</h2>
<ul>
    <li>Southeast Asian language processing, especially Vietnamese-Japanese translation</li>
    <li>Multi-agent LLM systems & agentic AI</li>
    <li>On-device ML for mobile applications</li>
    <li>World models & paths toward AGI</li>
</ul>
<h2>📫 Contact</h2>
<p>
    <a href="mailto:dungca1512@gmail.com">📧 dungca1512@gmail.com</a> ·
    <a href="https://github.com/dungca1512">🐙 GitHub</a> ·
    <a href="https://dungca1512.github.io">🌐 Website</a>
</p>
`;
