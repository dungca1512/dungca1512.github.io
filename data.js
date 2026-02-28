const PORTFOLIO_DATA = {
    profile: {
        name: 'Công Anh Dũng',
        location: 'Hanoi, Vietnam',
        status: 'Open to AI/ML Engineer opportunities'
    },

    heroTrust: [
        'LLM Platform Engineering',
        'ASR Fine-tuning',
        'RAG + Research Agents',
        'Streaming Data Systems'
    ],

    focus: [
        'Shipping ai-gateway for multi-provider LLM routing with fallback, rate-limit, and cache layers',
        'Building research-agent workflows with LangChain + LangGraph for web and ArXiv research automation',
        'Training and exporting Whisper Tiny for Japanese ASR using ReazonSpeech data'
    ],

    metrics: [
        { value: '56', label: 'Public repositories on GitHub' },
        { value: '45', label: 'Owned repositories (non-fork)' },
        { value: '13', label: 'Repositories updated during 2025-2026' },
        { value: '2021', label: 'Building publicly on GitHub since' }
    ],

    expertise: [
        {
            icon: '01',
            title: 'LLM Platform Engineering',
            description: 'Provider abstraction, OpenAI-compatible APIs, fallback and retry patterns, and reliability controls for LLM traffic.'
        },
        {
            icon: '02',
            title: 'Research Automation Agents',
            description: 'LangChain and LangGraph workflows that combine iterative search, ArXiv retrieval, and citation-ready reporting.'
        },
        {
            icon: '03',
            title: 'Applied Speech/NLP Systems',
            description: 'ASR fine-tuning and translation pipelines with practical training, evaluation, and deployment workflows.'
        }
    ],

    projects: [
        {
            name: 'AI Gateway',
            period: '2025',
            summary: 'Production-style gateway using Java Spring WebFlux and Python FastAPI to unify AI model access behind one API.',
            impact: 'Implements multi-provider routing, retry and fallback, Bucket4j rate limiting, Redis caching, and circuit breaker controls.',
            stack: ['Java', 'Spring WebFlux', 'Python', 'FastAPI', 'Redis', 'Bucket4j'],
            links: [
                { label: 'Repository', url: 'https://github.com/dungca1512/ai-gateway' }
            ]
        },
        {
            name: 'Research Agent',
            period: '2025',
            summary: 'LangChain + LangGraph research assistant for automated literature discovery and synthesis.',
            impact: 'Combines web search (Tavily/DuckDuckGo) and ArXiv retrieval with iterative query expansion to generate structured reports.',
            stack: ['Python', 'LangChain', 'LangGraph', 'ArXiv', 'Gemini API'],
            links: [
                { label: 'Repository', url: 'https://github.com/dungca1512/research-agent' }
            ]
        },
        {
            name: 'Whisper Finetune JA',
            period: '2026',
            summary: 'Fine-tuning pipeline for Whisper Tiny focused on Japanese ASR with ReazonSpeech data.',
            impact: 'Includes end-to-end scripts for setup, training, evaluation, and export to faster-whisper (CTranslate2) for deployment.',
            stack: ['Python', 'Whisper', 'ReazonSpeech', 'Hugging Face', 'ASR'],
            links: [
                { label: 'Repository', url: 'https://github.com/dungca1512/whisper-finetune-ja' }
            ]
        },
        {
            name: 'NewsPulse Reco Engine',
            period: '2025',
            summary: 'Vietnamese news intelligence platform for crawling, processing, semantic retrieval, and trend detection.',
            impact: 'Design spans Scala crawler + Spark ETL + Kafka pipeline, embedding service, clustering/trending engines, and Spring API.',
            stack: ['Scala', 'Kafka', 'Spark', 'Python Embeddings', 'Elasticsearch', 'Spring Boot'],
            links: [
                { label: 'Repository', url: 'https://github.com/dungca1512/newspulse-reco-engine' }
            ]
        }
    ],

    playbook: [
        {
            title: 'Start from reliability goals',
            description: 'Define latency targets and fallback behavior first, then design model routing and retry strategy around those constraints.'
        },
        {
            title: 'Blend probabilistic + deterministic logic',
            description: 'Use generative models where they shine, then enforce validators, parsing rules, and schema checks before outputs are trusted.'
        },
        {
            title: 'Instrument every critical path',
            description: 'Trace requests, model responses, and agent transitions so failures can be reproduced and debugged fast.'
        },
        {
            title: 'Design for graceful degradation',
            description: 'Treat provider downtime and weak model outputs as normal conditions with predefined fallback paths.'
        },
        {
            title: 'Keep humans in control',
            description: 'Critical actions need explicit approval points and logs that make each decision path auditable.'
        }
    ],

    writing: [
        {
            year: '2026',
            title: 'Whisper Tiny Japanese Finetune Notes',
            summary: 'Training and export workflow for Japanese ASR fine-tuning with reproducible scripts and deployment-ready artifacts.',
            tags: ['ASR', 'Whisper', 'Fine-tuning'],
            url: 'https://github.com/dungca1512/whisper-finetune-ja'
        },
        {
            year: '2025',
            title: 'Research Agent Workflow Design',
            summary: 'How iterative web + ArXiv search loops are orchestrated to produce citation-friendly technical reports.',
            tags: ['LangChain', 'LangGraph', 'Research Automation'],
            url: 'https://github.com/dungca1512/research-agent'
        },
        {
            year: '2025',
            title: 'AI Gateway Architecture Snapshot',
            summary: 'A practical breakdown of provider routing, resilience controls, and unified API patterns for LLM products.',
            tags: ['LLM Infra', 'WebFlux', 'System Design'],
            url: 'https://github.com/dungca1512/ai-gateway'
        }
    ],

    contacts: [
        { label: 'Email', url: 'mailto:dungca1512@gmail.com' },
        { label: 'GitHub', url: 'https://github.com/dungca1512' },
        { label: 'LinkedIn', url: 'https://www.linkedin.com/in/dungca/' }
    ]
};
