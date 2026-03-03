const PORTFOLIO_DATA = {
    github: {
        username: 'dungca1512',
        dataFile: 'github-data.json',
        excludeFromAnalytics: ['dungca1512', 'dungca1512.github.io']
    },

    profile: {
        name: 'Công Anh Dũng',
        avatarUrl: 'profile.jpeg',
        location: {
            en: 'Hanoi, Vietnam',
            vi: 'Hà Nội, Việt Nam'
        },
        status: {
            en: 'Open to AI/ML Engineer opportunities',
            vi: 'Sẵn sàng cho các cơ hội AI/ML Engineer mới'
        }
    },

    i18n: {
        nav: {
            projects: { en: 'Projects', vi: 'Dự án' },
            caseStudy: { en: 'Case Study', vi: 'Nghiên cứu tình huống' },
            analytics: { en: 'Analytics', vi: 'Phân tích' },
            expertise: { en: 'Expertise', vi: 'Năng lực' },
            writing: { en: 'Writing', vi: 'Bài viết' },
            contact: { en: 'Contact', vi: 'Liên hệ' }
        },
        common: {
            hireMe: { en: 'Hire Me', vi: 'Liên hệ hợp tác' },
            repository: { en: 'Repository', vi: 'Mã nguồn' },
            stars: { en: 'Stars', vi: 'Sao' },
            forks: { en: 'Forks', vi: 'Fork' },
            updated: { en: 'Updated', vi: 'Cập nhật' }
        },
        hero: {
            eyebrow: { en: 'AI/ML ENGINEER', vi: 'AI/ML ENGINEER' },
            title: {
                en: 'Building reliable AI products that ship, scale, and deliver business outcomes.',
                vi: 'Xây dựng sản phẩm AI đáng tin cậy, triển khai thực chiến, mở rộng ổn định và tạo kết quả kinh doanh rõ ràng.'
            },
            lead: {
                en: 'I design production systems that combine LLM reasoning, deterministic engineering, and clean DevOps.',
                vi: 'Tôi thiết kế hệ thống AI vận hành thực tế, kết hợp năng lực suy luận của LLM với kỹ thuật phần mềm chặt chẽ và DevOps bài bản.'
            },
            primaryCta: { en: 'View Projects', vi: 'Xem dự án' },
            secondaryCta: { en: 'GitHub', vi: 'GitHub' }
        },
        panel: {
            title: { en: 'Current Mission', vi: 'Mục tiêu hiện tại' },
            heading: {
                en: 'Production AI systems with measurable reliability.',
                vi: 'Xây dựng hệ thống AI vận hành thực tế với độ tin cậy đo lường được.'
            }
        },
        impact: {
            kicker: { en: 'Impact', vi: 'Kết quả' },
            title: {
                en: 'Engineering with outcomes, not demos.',
                vi: 'Làm kỹ thuật dựa trên kết quả thực tế, không dừng ở demo.'
            }
        },
        analytics: {
            kicker: { en: 'Data Snapshot', vi: 'Dữ liệu tổng quan' },
            title: {
                en: 'GitHub activity and repository signals.',
                vi: 'Tổng quan hoạt động và tín hiệu kỹ thuật từ GitHub.'
            },
            liveLabel: { en: 'Live GitHub Snapshot', vi: 'Ảnh chụp GitHub theo thời gian thực' },
            languageMix: { en: 'Language Mix', vi: 'Cơ cấu ngôn ngữ' },
            languageChart: { en: 'Language Distribution', vi: 'Phân bố ngôn ngữ' },
            yearlyChart: { en: 'Repository Updates by Year', vi: 'Cập nhật repo theo năm' },
            velocityChart: { en: 'Update Velocity (12 Months)', vi: 'Tốc độ cập nhật (12 tháng)' },
            freshnessChart: { en: 'Repository Freshness', vi: 'Mức độ cập nhật gần đây' },
            topRepos: { en: 'Most Active Repositories', vi: 'Repo hoạt động nhiều nhất' },
            kpiActive90: { en: 'Updated <= 90 Days', vi: 'Cập nhật <= 90 ngày' },
            kpiLanguage: { en: 'Language Diversity', vi: 'Độ đa dạng ngôn ngữ' },
            kpiStars: { en: 'Total Stars', vi: 'Tổng sao' },
            kpiFresh30: { en: 'Fresh <= 30 Days', vi: 'Cập nhật <= 30 ngày' },
            repoCount: { en: 'repos', vi: 'repo' },
            days30: { en: 'Updated <= 30 days', vi: 'Cập nhật <= 30 ngày' },
            days90: { en: 'Updated 31-90 days', vi: 'Cập nhật 31-90 ngày' },
            days180: { en: 'Updated 91-180 days', vi: 'Cập nhật 91-180 ngày' },
            older: { en: 'Updated > 180 days', vi: 'Cập nhật > 180 ngày' },
            tableRepo: { en: 'Repository', vi: 'Repo' },
            tableLanguage: { en: 'Language', vi: 'Ngôn ngữ' },
            tableUpdated: { en: 'Last Update', vi: 'Cập nhật gần nhất' },
            tableStars: { en: 'Stars', vi: 'Sao' },
            noData: { en: 'Loading GitHub data...', vi: 'Đang tải dữ liệu GitHub...' },
            unknown: { en: 'Unknown', vi: 'Không xác định' }
        },
        expertise: {
            kicker: { en: 'Core Expertise', vi: 'Năng lực cốt lõi' },
            title: {
                en: 'How I approach AI product engineering.',
                vi: 'Cách tôi triển khai kỹ thuật cho sản phẩm AI.'
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
            kicker: { en: 'Flagship Case Study', vi: 'Nghiên cứu tình huống tiêu biểu' },
            label: { en: 'From architecture to execution', vi: 'Từ kiến trúc đến triển khai' }
        },
        playbook: {
            kicker: { en: 'Engineering Playbook', vi: 'Nguyên tắc triển khai' },
            title: {
                en: 'Execution principles for production AI.',
                vi: 'Các nguyên tắc khi xây dựng hệ thống AI vận hành thực tế.'
            }
        },
        writing: {
            kicker: { en: 'Writing', vi: 'Bài viết' },
            title: {
                en: 'Notes on architecture, ML systems, and agent design.',
                vi: 'Ghi chép về kiến trúc, hệ thống ML và thiết kế agent.'
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
                vi: 'Tôi sẵn sàng cho các vị trí AI Engineer và cơ hội hợp tác kỹ thuật, tập trung vào hệ LLM vận hành thực tế, nền tảng ML và ứng dụng AI thông minh.'
            },
            footer: {
                en: 'Built for AI/ML engineering opportunities.',
                vi: 'Portfolio này được xây dựng cho các cơ hội nghề nghiệp AI/ML Engineering.'
            }
        }
    },

    heroTrust: [
        { en: 'LLM Platform Engineering', vi: 'Kỹ thuật nền tảng LLM' },
        { en: 'ASR Fine-tuning', vi: 'Tinh chỉnh ASR' },
        { en: 'RAG + Research Agents', vi: 'RAG + Agent nghiên cứu' },
        { en: 'Streaming Data Systems', vi: 'Hệ thống dữ liệu streaming' }
    ],

    focus: [
        {
            en: 'Productizing whisper-finetune-ja-train with reproducible training configs and checkpoint tracking for Japanese ASR',
            vi: 'Hoàn thiện `whisper-finetune-ja-train` với cấu hình huấn luyện tái lập được và theo dõi checkpoint cho ASR tiếng Nhật.'
        },
        {
            en: 'Expanding TensorTonic-Solutions to sharpen tensor optimization and model reasoning fundamentals',
            vi: 'Mở rộng `TensorTonic-Solutions` để rèn luyện tối ưu tensor và tư duy mô hình nền tảng.'
        },
        {
            en: 'Evolving ai-gateway with stronger observability and cost-aware fallback policies across providers',
            vi: 'Nâng cấp `ai-gateway` với quan sát tốt hơn và chính sách fallback theo chi phí giữa các provider.'
        }
    ],

    metrics: [
        {
            source: 'stats.publicRepos',
            fallback: '58',
            label: {
                en: 'Public repositories on GitHub',
                vi: 'Repository công khai trên GitHub'
            }
        },
        {
            source: 'stats.nonForkRepos',
            fallback: '47',
            label: {
                en: 'Owned repositories (non-fork)',
                vi: 'Repo tự phát triển (không tính fork)'
            }
        },
        {
            source: 'stats.recentRepos',
            fallback: '15',
            label: {
                en: 'Repositories updated during 2025-2026',
                vi: 'Repository được cập nhật trong giai đoạn 2025-2026'
            }
        },
        {
            source: 'stats.followers',
            fallback: '3',
            label: {
                en: 'GitHub followers',
                vi: 'Người theo dõi trên GitHub'
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
                vi: 'Trừu tượng hóa nhà cung cấp, API tương thích OpenAI, fallback/retry và các cơ chế tăng độ tin cậy cho lưu lượng LLM.'
            }
        },
        {
            icon: '02',
            title: {
                en: 'Research Automation Agents',
                vi: 'Agent tự động hóa nghiên cứu'
            },
            description: {
                en: 'LangChain and LangGraph workflows that combine iterative search, ArXiv retrieval, and citation-ready reporting.',
                vi: 'Thiết kế luồng LangChain/LangGraph kết hợp tìm kiếm lặp, truy xuất ArXiv và tạo báo cáo có trích dẫn.'
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
                vi: 'Xây pipeline ASR và dịch máy với quy trình huấn luyện, đánh giá và triển khai thực tế.'
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
                vi: 'Xây AI Gateway theo chuẩn vận hành thực tế bằng Java Spring WebFlux + Python FastAPI để hợp nhất truy cập mô hình AI qua một API duy nhất.'
            },
            outcome: {
                en: 'Outcome: unified 4 backends (OpenAI, Gemini, Claude, local worker) and implemented 6 reliability controls (routing, fallback/retry, rate-limit, cache, circuit-breaker, observability).',
                vi: 'Kết quả: hợp nhất 4 backend (OpenAI, Gemini, Claude, local worker) và triển khai 6 cơ chế đảm bảo độ tin cậy (routing, fallback/retry, rate-limit, cache, circuit-breaker, observability).'
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
                vi: 'Xây trợ lý nghiên cứu bằng LangChain + LangGraph để tự động tìm kiếm và tổng hợp tài liệu.'
            },
            outcome: {
                en: 'Outcome: operationalized a 4-step loop (decompose -> search -> synthesize -> report) with 2 retrieval channels (Web + ArXiv).',
                vi: 'Kết quả: vận hành hóa vòng lặp 4 bước (phân rã -> tìm kiếm -> tổng hợp -> báo cáo) với 2 kênh truy xuất (Web + ArXiv).'
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
                vi: 'Xây pipeline tinh chỉnh Whisper Tiny cho ASR tiếng Nhật với dữ liệu ReazonSpeech.'
            },
            outcome: {
                en: 'Outcome: built 8 core training/deployment scripts (train, config, data, model, trainer, export, inference, setup) for reproducible ASR experiments.',
                vi: 'Kết quả: hoàn thiện bộ 8 script huấn luyện/triển khai cốt lõi (train, config, data, model, trainer, export, inference, setup) giúp thí nghiệm ASR tái lập được.'
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
            repo: 'whisper-finetune-ja-train',
            name: 'Whisper JA Train Pipeline',
            period: '2026',
            summary: {
                en: 'Training-focused repository for Japanese Whisper fine-tuning experiments with clean run configuration and iteration flow.',
                vi: 'Repository tập trung huấn luyện cho thí nghiệm tinh chỉnh Whisper tiếng Nhật với cấu hình chạy rõ ràng và vòng lặp tối ưu.'
            },
            outcome: {
                en: 'Outcome: separated model training workflow from downstream packaging to speed up experiments and keep ASR training runs consistent.',
                vi: 'Kết quả: tách riêng luồng huấn luyện khỏi phần đóng gói downstream để tăng tốc thử nghiệm và giữ các lần chạy ASR ổn định.'
            },
            stack: ['Python', 'Whisper', 'Hugging Face', 'ASR Training'],
            links: [
                {
                    label: { en: 'Repository', vi: 'Mã nguồn' },
                    url: 'https://github.com/dungca1512/whisper-finetune-ja-train'
                }
            ]
        },
        {
            repo: 'newspulse-reco-engine',
            name: 'NewsPulse Reco Engine',
            period: '2025',
            summary: {
                en: 'Vietnamese news intelligence platform for crawling, processing, semantic retrieval, and trend detection.',
                vi: 'Phát triển nền tảng phân tích tin tức tiếng Việt gồm thu thập dữ liệu, xử lý, truy xuất ngữ nghĩa và phát hiện xu hướng.'
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
            vi: 'AI Gateway: thiết kế hạ tầng LLM đa nhà cung cấp, ưu tiên độ ổn định'
        },
        subtitle: {
            en: 'How I converted fragmented model integrations into a unified, fault-tolerant platform.',
            vi: 'Cách tôi chuyển từ các tích hợp mô hình rời rạc sang một nền tảng thống nhất và chịu lỗi tốt.'
        },
        repoUrl: 'https://github.com/dungca1512/ai-gateway',
        highlights: [
            {
                en: 'Unified 4 model backends under one API contract',
                vi: 'Hợp nhất 4 backend mô hình dưới một chuẩn API duy nhất'
            },
            {
                en: 'Implemented 6 reliability controls for production traffic',
                vi: 'Triển khai 6 cơ chế tăng độ tin cậy cho lưu lượng thực tế'
            },
            {
                en: 'Separated gateway concerns (Java) from AI worker concerns (Python)',
                vi: 'Tách rõ trách nhiệm giữa gateway (Java) và AI worker (Python)'
            }
        ],
        blocks: [
            {
                title: { en: 'Problem', vi: 'Bài toán' },
                text: {
                    en: 'Teams needed one stable API across multiple LLM providers, but each provider had different request/response semantics and failure patterns.',
                    vi: 'Đội ngũ cần một API ổn định để làm việc với nhiều nhà cung cấp LLM, nhưng mỗi bên lại có định dạng request/response và kiểu lỗi khác nhau.'
                }
            },
            {
                title: { en: 'Architecture', vi: 'Kiến trúc' },
                text: {
                    en: 'Built a Java Spring WebFlux gateway for routing, resilience, and policy control, plus a Python FastAPI worker for local model and embedding tasks.',
                    vi: 'Thiết kế gateway Java Spring WebFlux để xử lý routing, resilience và policy control; đồng thời dùng worker Python FastAPI cho mô hình nội bộ và tác vụ embedding.'
                }
            },
            {
                title: { en: 'Trade-offs', vi: 'Đánh đổi kỹ thuật' },
                text: {
                    en: 'Prioritized reliability and observability over minimal complexity. Added more moving parts, but gained consistent behavior during provider instability.',
                    vi: 'Ưu tiên độ tin cậy và khả năng quan sát thay vì tối giản tuyệt đối. Hệ thống có nhiều thành phần hơn nhưng ổn định hơn khi provider gặp sự cố.'
                }
            },
            {
                title: { en: 'Result', vi: 'Kết quả' },
                text: {
                    en: 'Delivered a reusable gateway baseline for future AI products, reducing integration overhead and standardizing production controls.',
                    vi: 'Xây dựng được nền tảng gateway có thể tái sử dụng cho các sản phẩm AI tiếp theo, giảm chi phí tích hợp và chuẩn hóa cơ chế kiểm soát production.'
                }
            },
            {
                title: { en: "What I'd improve next", vi: 'Bước cải tiến tiếp theo' },
                text: {
                    en: 'Add per-provider latency dashboards, token-cost analytics, and automated fallback policy tuning based on live traffic signals.',
                    vi: 'Bổ sung dashboard độ trễ theo từng nhà cung cấp, phân tích chi phí token và tự động tinh chỉnh chính sách fallback dựa trên tín hiệu lưu lượng thực tế.'
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
                vi: 'Xác định mục tiêu độ trễ và hành vi fallback trước, rồi mới thiết kế chiến lược routing/retry theo các ràng buộc đó.'
            }
        },
        {
            title: {
                en: 'Blend probabilistic + deterministic logic',
                vi: 'Kết hợp AI tạo sinh với logic xác định'
            },
            description: {
                en: 'Use generative models where they shine, then enforce validators, parsing rules, and schema checks before outputs are trusted.',
                vi: 'Dùng mô hình sinh ở phần phù hợp, sau đó kiểm soát bằng validator, quy tắc parse và kiểm tra schema trước khi tin cậy kết quả.'
            }
        },
        {
            title: {
                en: 'Instrument every critical path',
                vi: 'Gắn quan sát cho mọi luồng quan trọng'
            },
            description: {
                en: 'Trace requests, model responses, and agent transitions so failures can be reproduced and debugged fast.',
                vi: 'Theo vết request, phản hồi mô hình và các trạng thái chuyển của agent để tái hiện lỗi và debug nhanh.'
            }
        },
        {
            title: {
                en: 'Design for graceful degradation',
                vi: 'Thiết kế để suy giảm an toàn'
            },
            description: {
                en: 'Treat provider downtime and weak model outputs as normal conditions with predefined fallback paths.',
                vi: 'Xem downtime của provider và đầu ra yếu là tình huống bình thường, luôn có đường fallback định nghĩa sẵn.'
            }
        },
        {
            title: {
                en: 'Keep humans in control',
                vi: 'Giữ con người trong vòng kiểm soát'
            },
            description: {
                en: 'Critical actions need explicit approval points and logs that make each decision path auditable.',
                vi: 'Các hành động quan trọng cần điểm phê duyệt rõ ràng và log đủ chi tiết để kiểm toán toàn bộ luồng quyết định.'
            }
        }
    ],

    writing: [
        {
            year: '2026',
            title: {
                en: 'Whisper JA Training Runbook',
                vi: 'Runbook huấn luyện Whisper JA'
            },
            summary: {
                en: 'Notes on training-first workflow design, experiment iteration, and checkpoint hygiene for Japanese ASR.',
                vi: 'Ghi chú về thiết kế luồng huấn luyện ưu tiên thực nghiệm, vòng lặp thử nghiệm và quản lý checkpoint cho ASR tiếng Nhật.'
            },
            tags: ['ASR', 'Training Pipeline', 'Whisper'],
            url: 'https://github.com/dungca1512/whisper-finetune-ja-train'
        },
        {
            year: '2026',
            title: {
                en: 'Whisper Tiny Japanese Finetune Notes',
                vi: 'Ghi chú tinh chỉnh Whisper Tiny cho tiếng Nhật'
            },
            summary: {
                en: 'Training and export workflow for Japanese ASR fine-tuning with reproducible scripts and deployment-ready artifacts.',
                vi: 'Quy trình huấn luyện và xuất mô hình cho ASR tiếng Nhật với script tái lập được và artifact sẵn sàng triển khai.'
            },
            tags: ['ASR', 'Whisper', 'Fine-tuning'],
            url: 'https://github.com/dungca1512/whisper-finetune-ja'
        },
        {
            year: '2025',
            title: {
                en: 'Research Agent Workflow Design',
                vi: 'Thiết kế luồng cho Research Agent'
            },
            summary: {
                en: 'How iterative web + ArXiv search loops are orchestrated to produce citation-friendly technical reports.',
                vi: 'Cách điều phối vòng lặp tìm kiếm Web + ArXiv để tạo báo cáo kỹ thuật có trích dẫn rõ ràng.'
            },
            tags: ['LangChain', 'LangGraph', 'Research Automation'],
            url: 'https://github.com/dungca1512/research-agent'
        },
        {
            year: '2025',
            title: {
                en: 'AI Gateway Architecture Snapshot',
                vi: 'Tổng quan kiến trúc AI Gateway'
            },
            summary: {
                en: 'A practical breakdown of provider routing, resilience controls, and unified API patterns for LLM products.',
                vi: 'Phân tích thực tế về định tuyến nhà cung cấp, các cơ chế resilience và mẫu API thống nhất cho sản phẩm LLM.'
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
