const PORTFOLIO_DATA = {
    github: {
        username: 'dungca1512',
        dataFile: 'github-data.json'
    },

    profile: {
        name: 'Công Anh Dũng',
        avatarUrl: 'https://avatars.githubusercontent.com/dungca1512?v=4',
        location: {
            en: 'Hanoi, Vietnam',
            vi: 'Hà Nội, Việt Nam'
        },
        status: {
            en: 'Open to AI/ML Engineer opportunities',
            vi: 'Đang mở cho cơ hội AI/ML Engineer'
        }
    },

    i18n: {
        nav: {
            projects: { en: 'Projects', vi: 'Dự án' },
            caseStudy: { en: 'Case Study', vi: 'Case Study' },
            expertise: { en: 'Expertise', vi: 'Năng lực' },
            writing: { en: 'Writing', vi: 'Bài viết' },
            contact: { en: 'Contact', vi: 'Liên hệ' }
        },
        common: {
            hireMe: { en: 'Hire Me', vi: 'Liên hệ tuyển dụng' },
            repository: { en: 'Repository', vi: 'Mã nguồn' },
            stars: { en: 'Stars', vi: 'Sao' },
            forks: { en: 'Forks', vi: 'Fork' },
            updated: { en: 'Updated', vi: 'Cập nhật' }
        },
        hero: {
            eyebrow: { en: 'AI/ML ENGINEER', vi: 'AI/ML ENGINEER' },
            title: {
                en: 'Building reliable AI products that ship, scale, and deliver business outcomes.',
                vi: 'Xây dựng sản phẩm AI đáng tin cậy, có thể triển khai, mở rộng và tạo kết quả kinh doanh.'
            },
            lead: {
                en: 'I design production systems that combine LLM reasoning, deterministic engineering, and clean DevOps.',
                vi: 'Tôi thiết kế hệ thống production kết hợp sức mạnh LLM, tư duy kỹ thuật xác định và DevOps thực chiến.'
            },
            primaryCta: { en: 'View Projects', vi: 'Xem dự án' },
            secondaryCta: { en: 'GitHub', vi: 'GitHub' }
        },
        panel: {
            title: { en: 'Current Mission', vi: 'Mục tiêu hiện tại' },
            heading: {
                en: 'Production AI systems with measurable reliability.',
                vi: 'Hệ thống AI production với độ tin cậy đo lường được.'
            }
        },
        impact: {
            kicker: { en: 'Impact', vi: 'Kết quả' },
            title: {
                en: 'Engineering with outcomes, not demos.',
                vi: 'Làm kỹ thuật theo kết quả thực, không dừng ở demo.'
            }
        },
        expertise: {
            kicker: { en: 'Core Expertise', vi: 'Năng lực cốt lõi' },
            title: {
                en: 'How I approach AI product engineering.',
                vi: 'Cách tôi tiếp cận bài toán kỹ thuật sản phẩm AI.'
            }
        },
        projects: {
            kicker: { en: 'Selected Work', vi: 'Dự án tiêu biểu' },
            title: {
                en: 'Portfolio projects in AI, ML, and system design.',
                vi: 'Các dự án AI, ML và thiết kế hệ thống tiêu biểu.'
            }
        },
        caseStudy: {
            kicker: { en: 'Flagship Case Study', vi: 'Case Study tiêu biểu' },
            label: { en: 'From architecture to execution', vi: 'Từ kiến trúc đến triển khai' }
        },
        playbook: {
            kicker: { en: 'Engineering Playbook', vi: 'Playbook kỹ thuật' },
            title: {
                en: 'Execution principles for production AI.',
                vi: 'Nguyên tắc triển khai cho AI production.'
            }
        },
        writing: {
            kicker: { en: 'Writing', vi: 'Bài viết' },
            title: {
                en: 'Notes on architecture, ML systems, and agent design.',
                vi: 'Ghi chép về kiến trúc, hệ ML và thiết kế agent.'
            }
        },
        contact: {
            kicker: { en: 'Contact', vi: 'Liên hệ' },
            title: {
                en: 'Building an AI product or platform?',
                vi: 'Bạn đang xây dựng sản phẩm hoặc nền tảng AI?'
            },
            text: {
                en: 'I am available for AI engineering roles and technical collaborations focused on production LLM systems, ML platforms, and intelligent applications.',
                vi: 'Tôi đang mở cho các vị trí AI Engineer và hợp tác kỹ thuật xoay quanh LLM production, ML platform và ứng dụng AI thông minh.'
            },
            footer: {
                en: 'Built for AI/ML engineering opportunities.',
                vi: 'Thiết kế cho cơ hội nghề nghiệp AI/ML Engineering.'
            }
        }
    },

    heroTrust: [
        { en: 'LLM Platform Engineering', vi: 'Kỹ thuật nền tảng LLM' },
        { en: 'ASR Fine-tuning', vi: 'Fine-tune ASR' },
        { en: 'RAG + Research Agents', vi: 'RAG + Research Agent' },
        { en: 'Streaming Data Systems', vi: 'Hệ dữ liệu streaming' }
    ],

    focus: [
        {
            en: 'Shipping ai-gateway for multi-provider LLM routing with fallback, rate-limit, and cache layers',
            vi: 'Triển khai ai-gateway cho định tuyến đa provider với fallback, rate-limit và cache'
        },
        {
            en: 'Building research-agent workflows with LangChain + LangGraph for web and ArXiv research automation',
            vi: 'Xây dựng research-agent bằng LangChain + LangGraph cho tự động hoá nghiên cứu web và ArXiv'
        },
        {
            en: 'Training and exporting Whisper Tiny for Japanese ASR using ReazonSpeech data',
            vi: 'Huấn luyện và export Whisper Tiny cho ASR tiếng Nhật với dữ liệu ReazonSpeech'
        }
    ],

    metrics: [
        {
            source: 'stats.publicRepos',
            fallback: '56',
            label: {
                en: 'Public repositories on GitHub',
                vi: 'Repository public trên GitHub'
            }
        },
        {
            source: 'stats.nonForkRepos',
            fallback: '45',
            label: {
                en: 'Owned repositories (non-fork)',
                vi: 'Repository tự sở hữu (không tính fork)'
            }
        },
        {
            source: 'stats.recentRepos',
            fallback: '13',
            label: {
                en: 'Repositories updated during 2025-2026',
                vi: 'Repository được cập nhật trong 2025-2026'
            }
        },
        {
            source: 'stats.followers',
            fallback: '3',
            label: {
                en: 'GitHub followers',
                vi: 'Follower trên GitHub'
            }
        }
    ],

    expertise: [
        {
            icon: '01',
            title: {
                en: 'LLM Platform Engineering',
                vi: 'Kỹ thuật nền tảng LLM'
            },
            description: {
                en: 'Provider abstraction, OpenAI-compatible APIs, fallback and retry patterns, and reliability controls for LLM traffic.',
                vi: 'Trừu tượng hoá provider, API tương thích OpenAI, fallback/retry và các cơ chế tăng độ tin cậy cho lưu lượng LLM.'
            }
        },
        {
            icon: '02',
            title: {
                en: 'Research Automation Agents',
                vi: 'Agent tự động hoá nghiên cứu'
            },
            description: {
                en: 'LangChain and LangGraph workflows that combine iterative search, ArXiv retrieval, and citation-ready reporting.',
                vi: 'Workflow với LangChain/LangGraph kết hợp tìm kiếm lặp, truy xuất ArXiv và tạo báo cáo có trích dẫn.'
            }
        },
        {
            icon: '03',
            title: {
                en: 'Applied Speech/NLP Systems',
                vi: 'Hệ thống Speech/NLP ứng dụng'
            },
            description: {
                en: 'ASR fine-tuning and translation pipelines with practical training, evaluation, and deployment workflows.',
                vi: 'Fine-tune ASR và pipeline dịch với quy trình huấn luyện, đánh giá và triển khai thực tế.'
            }
        }
    ],

    projects: [
        {
            repo: 'ai-gateway',
            name: 'AI Gateway',
            period: '2025',
            summary: {
                en: 'Production-style gateway using Java Spring WebFlux and Python FastAPI to unify AI model access behind one API.',
                vi: 'Gateway theo phong cách production dùng Java Spring WebFlux + Python FastAPI để gom truy cập model AI về một API thống nhất.'
            },
            outcome: {
                en: 'Outcome: unified 4 backends (OpenAI, Gemini, Claude, local worker) and implemented 6 reliability controls (routing, fallback/retry, rate-limit, cache, circuit-breaker, observability).',
                vi: 'Kết quả: hợp nhất 4 backend (OpenAI, Gemini, Claude, local worker) và triển khai 6 cơ chế tin cậy (routing, fallback/retry, rate-limit, cache, circuit-breaker, observability).'
            },
            stack: ['Java', 'Spring WebFlux', 'Python', 'FastAPI', 'Redis', 'Bucket4j'],
            links: [
                {
                    label: { en: 'Repository', vi: 'Mã nguồn' },
                    url: 'https://github.com/dungca1512/ai-gateway'
                }
            ]
        },
        {
            repo: 'research-agent',
            name: 'Research Agent',
            period: '2025',
            summary: {
                en: 'LangChain + LangGraph research assistant for automated literature discovery and synthesis.',
                vi: 'Research assistant dùng LangChain + LangGraph cho tìm kiếm và tổng hợp tài liệu tự động.'
            },
            outcome: {
                en: 'Outcome: operationalized a 4-step loop (decompose -> search -> synthesize -> report) with 2 retrieval channels (Web + ArXiv).',
                vi: 'Kết quả: vận hành hoá vòng lặp 4 bước (decompose -> search -> synthesize -> report) với 2 kênh truy xuất (Web + ArXiv).'
            },
            stack: ['Python', 'LangChain', 'LangGraph', 'ArXiv', 'Gemini API'],
            links: [
                {
                    label: { en: 'Repository', vi: 'Mã nguồn' },
                    url: 'https://github.com/dungca1512/research-agent'
                }
            ]
        },
        {
            repo: 'whisper-finetune-ja',
            name: 'Whisper Finetune JA',
            period: '2026',
            summary: {
                en: 'Fine-tuning pipeline for Whisper Tiny focused on Japanese ASR with ReazonSpeech data.',
                vi: 'Pipeline fine-tune Whisper Tiny cho ASR tiếng Nhật với dữ liệu ReazonSpeech.'
            },
            outcome: {
                en: 'Outcome: built 8 core training/deployment scripts (train, config, data, model, trainer, export, inference, setup) for reproducible ASR experiments.',
                vi: 'Kết quả: xây dựng bộ 8 script huấn luyện/triển khai cốt lõi (train, config, data, model, trainer, export, inference, setup) cho thí nghiệm ASR tái lập được.'
            },
            stack: ['Python', 'Whisper', 'ReazonSpeech', 'Hugging Face', 'ASR'],
            links: [
                {
                    label: { en: 'Repository', vi: 'Mã nguồn' },
                    url: 'https://github.com/dungca1512/whisper-finetune-ja'
                }
            ]
        },
        {
            repo: 'newspulse-reco-engine',
            name: 'NewsPulse Reco Engine',
            period: '2025',
            summary: {
                en: 'Vietnamese news intelligence platform for crawling, processing, semantic retrieval, and trend detection.',
                vi: 'Nền tảng phân tích tin tức tiếng Việt cho crawling, xử lý, truy xuất ngữ nghĩa và phát hiện xu hướng.'
            },
            outcome: {
                en: 'Outcome: designed a 7-module architecture spanning Scala crawler + Spark ETL + Kafka stream + embeddings + clustering/trending + Spring API.',
                vi: 'Kết quả: thiết kế kiến trúc 7 module gồm Scala crawler + Spark ETL + Kafka stream + embeddings + clustering/trending + Spring API.'
            },
            stack: ['Scala', 'Kafka', 'Spark', 'Python Embeddings', 'Elasticsearch', 'Spring Boot'],
            links: [
                {
                    label: { en: 'Repository', vi: 'Mã nguồn' },
                    url: 'https://github.com/dungca1512/newspulse-reco-engine'
                }
            ]
        }
    ],

    caseStudy: {
        title: {
            en: 'AI Gateway: architecting resilient multi-provider LLM infrastructure',
            vi: 'AI Gateway: kiến trúc hạ tầng LLM đa provider có độ bền cao'
        },
        subtitle: {
            en: 'How I converted fragmented model integrations into a unified, fault-tolerant platform.',
            vi: 'Cách tôi chuyển từ tích hợp model rời rạc sang một nền tảng thống nhất, chịu lỗi tốt.'
        },
        repoUrl: 'https://github.com/dungca1512/ai-gateway',
        highlights: [
            {
                en: 'Unified 4 model backends under one API contract',
                vi: 'Hợp nhất 4 backend model dưới một contract API'
            },
            {
                en: 'Implemented 6 reliability controls for production traffic',
                vi: 'Triển khai 6 cơ chế độ tin cậy cho lưu lượng production'
            },
            {
                en: 'Separated gateway concerns (Java) from AI worker concerns (Python)',
                vi: 'Tách rõ concern gateway (Java) và AI worker (Python)'
            }
        ],
        blocks: [
            {
                title: { en: 'Problem', vi: 'Bài toán' },
                text: {
                    en: 'Teams needed one stable API across multiple LLM providers, but each provider had different request/response semantics and failure patterns.',
                    vi: 'Team cần một API ổn định cho nhiều LLM provider, nhưng mỗi provider có format request/response và kiểu lỗi khác nhau.'
                }
            },
            {
                title: { en: 'Architecture', vi: 'Kiến trúc' },
                text: {
                    en: 'Built a Java Spring WebFlux gateway for routing, resilience, and policy control, plus a Python FastAPI worker for local model and embedding tasks.',
                    vi: 'Xây gateway Java Spring WebFlux cho routing, resilience, policy control; đồng thời dùng Python FastAPI worker cho local model và embedding.'
                }
            },
            {
                title: { en: 'Trade-offs', vi: 'Đánh đổi kỹ thuật' },
                text: {
                    en: 'Prioritized reliability and observability over minimal complexity. Added more moving parts, but gained consistent behavior during provider instability.',
                    vi: 'Ưu tiên reliability và observability hơn sự tối giản. Hệ thống nhiều thành phần hơn nhưng hành vi ổn định khi provider gặp sự cố.'
                }
            },
            {
                title: { en: 'Result', vi: 'Kết quả' },
                text: {
                    en: 'Delivered a reusable gateway baseline for future AI products, reducing integration overhead and standardizing production controls.',
                    vi: 'Tạo baseline gateway tái sử dụng cho các sản phẩm AI tiếp theo, giảm overhead tích hợp và chuẩn hoá kiểm soát production.'
                }
            },
            {
                title: { en: "What I'd improve next", vi: 'Bước cải tiến tiếp theo' },
                text: {
                    en: 'Add per-provider latency dashboards, token-cost analytics, and automated fallback policy tuning based on live traffic signals.',
                    vi: 'Bổ sung dashboard độ trễ theo provider, phân tích chi phí token và tự động tuning fallback policy dựa trên tín hiệu traffic thực.'
                }
            }
        ]
    },

    playbook: [
        {
            title: {
                en: 'Start from reliability goals',
                vi: 'Bắt đầu từ mục tiêu độ tin cậy'
            },
            description: {
                en: 'Define latency targets and fallback behavior first, then design model routing and retry strategy around those constraints.',
                vi: 'Xác định mục tiêu latency và fallback trước, sau đó mới thiết kế routing/retry theo các ràng buộc đó.'
            }
        },
        {
            title: {
                en: 'Blend probabilistic + deterministic logic',
                vi: 'Kết hợp logic xác suất và xác định'
            },
            description: {
                en: 'Use generative models where they shine, then enforce validators, parsing rules, and schema checks before outputs are trusted.',
                vi: 'Dùng mô hình sinh ở phần phù hợp, sau đó chặn bằng validator, parsing rule và schema check trước khi tin cậy kết quả.'
            }
        },
        {
            title: {
                en: 'Instrument every critical path',
                vi: 'Quan sát hoá mọi luồng quan trọng'
            },
            description: {
                en: 'Trace requests, model responses, and agent transitions so failures can be reproduced and debugged fast.',
                vi: 'Trace request, model response và luồng chuyển agent để tái hiện lỗi và debug nhanh.'
            }
        },
        {
            title: {
                en: 'Design for graceful degradation',
                vi: 'Thiết kế cho degrade an toàn'
            },
            description: {
                en: 'Treat provider downtime and weak model outputs as normal conditions with predefined fallback paths.',
                vi: 'Xem downtime provider và output yếu là tình huống bình thường, có fallback định nghĩa sẵn.'
            }
        },
        {
            title: {
                en: 'Keep humans in control',
                vi: 'Giữ con người trong vòng kiểm soát'
            },
            description: {
                en: 'Critical actions need explicit approval points and logs that make each decision path auditable.',
                vi: 'Hành động quan trọng cần điểm phê duyệt rõ ràng và log đủ để audit toàn bộ quyết định.'
            }
        }
    ],

    writing: [
        {
            year: '2026',
            title: {
                en: 'Whisper Tiny Japanese Finetune Notes',
                vi: 'Ghi chú fine-tune Whisper Tiny tiếng Nhật'
            },
            summary: {
                en: 'Training and export workflow for Japanese ASR fine-tuning with reproducible scripts and deployment-ready artifacts.',
                vi: 'Quy trình huấn luyện và export cho ASR tiếng Nhật với script tái lập được và artifact sẵn sàng triển khai.'
            },
            tags: ['ASR', 'Whisper', 'Fine-tuning'],
            url: 'https://github.com/dungca1512/whisper-finetune-ja'
        },
        {
            year: '2025',
            title: {
                en: 'Research Agent Workflow Design',
                vi: 'Thiết kế workflow cho Research Agent'
            },
            summary: {
                en: 'How iterative web + ArXiv search loops are orchestrated to produce citation-friendly technical reports.',
                vi: 'Cách điều phối vòng lặp tìm kiếm Web + ArXiv để tạo báo cáo kỹ thuật có trích dẫn.'
            },
            tags: ['LangChain', 'LangGraph', 'Research Automation'],
            url: 'https://github.com/dungca1512/research-agent'
        },
        {
            year: '2025',
            title: {
                en: 'AI Gateway Architecture Snapshot',
                vi: 'Snapshot kiến trúc AI Gateway'
            },
            summary: {
                en: 'A practical breakdown of provider routing, resilience controls, and unified API patterns for LLM products.',
                vi: 'Phân tích thực tế về routing provider, kiểm soát resilience và pattern API thống nhất cho sản phẩm LLM.'
            },
            tags: ['LLM Infra', 'WebFlux', 'System Design'],
            url: 'https://github.com/dungca1512/ai-gateway'
        }
    ],

    contacts: [
        {
            label: { en: 'Download CV', vi: 'Tải CV' },
            url: 'CV_CongAnhDung.pdf',
            download: true
        },
        {
            label: { en: 'Book a Call', vi: 'Đặt lịch trao đổi' },
            url: 'mailto:dungca1512@gmail.com?subject=Book%20a%20call%20with%20Cong%20Anh%20Dung'
        },
        {
            label: { en: 'Email', vi: 'Email' },
            url: 'mailto:dungca1512@gmail.com'
        },
        {
            label: { en: 'GitHub', vi: 'GitHub' },
            url: 'https://github.com/dungca1512'
        },
        {
            label: { en: 'LinkedIn', vi: 'LinkedIn' },
            url: 'https://www.linkedin.com/in/dungca/'
        }
    ]
};
