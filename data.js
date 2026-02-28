const PORTFOLIO_DATA = {
    profile: {
        name: 'Dung Ca',
        location: 'Hanoi, Vietnam',
        status: 'Open to AI/ML opportunities'
    },

    heroTrust: [
        'LLM Platforms',
        'Multi-Agent Systems',
        'On-Device AI',
        'MLOps + DevOps'
    ],

    focus: [
        'Designing multi-provider AI gateways with resilient failover and routing',
        'Building MCP/A2A agent workflows with human-in-the-loop checkpoints',
        'Shipping mobile-first speech/NLP pipelines for Vietnamese and Japanese use cases'
    ],

    metrics: [
        { value: '12+', label: 'AI/ML repositories built and maintained' },
        { value: '4', label: 'Production-style systems highlighted in this portfolio' },
        { value: '3', label: 'Working languages: Vietnamese, English, Japanese' },
        { value: '1', label: 'Mission: practical AI that delivers business value' }
    ],

    expertise: [
        {
            icon: '01',
            title: 'LLM Platform Engineering',
            description: 'Gateway design, provider abstraction, smart routing, and fault tolerance for real-world LLM traffic.'
        },
        {
            icon: '02',
            title: 'Agentic Workflow Design',
            description: 'MCP and A2A based agent collaboration patterns, plus governance with human checkpoints.'
        },
        {
            icon: '03',
            title: 'Applied ML For Mobile',
            description: 'Speech and NLP workloads tuned for latency, model size constraints, and offline-first experience.'
        }
    ],

    projects: [
        {
            name: 'AI Gateway',
            period: '2024-2025',
            summary: 'A multi-provider orchestration layer for OpenAI, Gemini, Claude, and local models with a unified API for product teams.',
            impact: 'Implemented circuit breakers, rate limiting, and caching to improve service resilience under provider instability.',
            stack: ['Java', 'Spring WebFlux', 'Python', 'FastAPI', 'Redis', 'Docker'],
            links: [
                { label: 'Repository', url: 'https://github.com/dungca1512' }
            ]
        },
        {
            name: 'Nihongo Learn AI',
            period: '2024-2025',
            summary: 'Language learning platform blending LLM content generation with deterministic Japanese morphology via SudachiPy.',
            impact: 'Reduced vocabulary extraction errors by combining AI creativity with rule-based validation before release.',
            stack: ['Python', 'SudachiPy', 'Whisper', 'SenseVoice', 'iOS', 'Android'],
            links: [
                { label: 'Repository', url: 'https://github.com/dungca1512' }
            ]
        },
        {
            name: 'DevOps AI Agent',
            period: '2025',
            summary: 'Incident response system where multiple agents collaborate to detect, triage, and propose remediations.',
            impact: 'Structured incident workflows with explicit decision points, so humans can approve critical actions safely.',
            stack: ['Python', 'LangChain', 'LangGraph', 'MCP', 'A2A'],
            links: [
                { label: 'Repository', url: 'https://github.com/dungca1512' }
            ]
        },
        {
            name: 'Mobile OCR Toolkit',
            period: '2024',
            summary: 'Cross-platform OCR for Vietnamese, Japanese, and CJK scripts with practical on-device deployment constraints.',
            impact: 'Balanced model footprint and inference speed for mobile usage by targeting compact model variants.',
            stack: ['Computer Vision', 'Python', 'Android', 'iOS', 'Edge ML'],
            links: [
                { label: 'Repository', url: 'https://github.com/dungca1512' }
            ]
        }
    ],

    playbook: [
        {
            title: 'Start from reliability goals',
            description: 'Define latency, error budget, and fallback behavior before writing model orchestration logic.'
        },
        {
            title: 'Blend probabilistic + deterministic logic',
            description: 'Use LLMs for generative strengths, then guard outputs with rules, validators, and schema constraints.'
        },
        {
            title: 'Instrument every critical path',
            description: 'Trace prompts, model responses, and agent handoffs so failures can be diagnosed quickly.'
        },
        {
            title: 'Design for graceful degradation',
            description: 'Treat provider outages and model failures as expected conditions, not edge cases.'
        },
        {
            title: 'Keep humans in control',
            description: 'High-impact actions always pass through approval points and transparent decision logs.'
        }
    ],

    writing: [
        {
            year: '2025',
            title: 'Designing Multi-Agent LLM Systems',
            summary: 'Practical architecture patterns for agent collaboration, memory boundaries, and failure recovery.',
            tags: ['Multi-Agent', 'MCP', 'LangGraph'],
            url: ''
        },
        {
            year: '2025',
            title: 'Building a Resilient AI Gateway',
            summary: 'System decisions behind provider routing, retries, and backpressure handling in production APIs.',
            tags: ['LLM Infra', 'Java', 'System Design'],
            url: ''
        },
        {
            year: '2024',
            title: 'Hybrid AI + Deterministic NLP',
            summary: 'Why mixed pipelines are often more dependable than pure prompt-based extraction workflows.',
            tags: ['NLP', 'Quality', 'Production'],
            url: ''
        }
    ],

    contacts: [
        { label: 'Email', url: 'mailto:dungca1512@gmail.com' },
        { label: 'GitHub', url: 'https://github.com/dungca1512' },
        { label: 'LinkedIn', url: 'https://www.linkedin.com/in/dungca/' }
    ]
};
