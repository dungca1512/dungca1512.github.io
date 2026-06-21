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
            en: 'AI/ML Systems Architect · Infrastructure & MLOps @ eUp Group',
            vi: 'AI/ML Systems Architect · Hạ tầng & MLOps @ eUp Group'
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
            eyebrow: { en: 'AI/ML SYSTEMS ARCHITECT', vi: 'AI/ML SYSTEMS ARCHITECT' },
            title: {
                en: 'I own AI infrastructure end-to-end — from cloud provisioning to production ML serving.',
                vi: 'Tôi sở hữu hạ tầng AI từ đầu đến cuối — từ provisioning cloud đến triển khai ML thực chiến.'
            },
            lead: {
                en: 'DevOps & MLOps engineer shipping ASR, TTS, pronunciation scoring, and embedding services on Kubernetes for users across VN, JP, and KR. CLI-first, cost-conscious, and framework-driven in every decision.',
                vi: 'Kỹ sư DevOps & MLOps triển khai các dịch vụ ASR, TTS, chấm phát âm và embedding trên Kubernetes cho người dùng VN, JP, KR. Định hướng CLI-first, tối ưu chi phí và ra quyết định theo framework.'
            },
            primaryCta: { en: 'View Projects', vi: 'Xem dự án' },
            secondaryCta: { en: 'GitHub', vi: 'GitHub' }
        },
        panel: {
            title: { en: 'Current Mission', vi: 'Mục tiêu hiện tại' },
            heading: {
                en: 'Reliable, cost-efficient AI infrastructure running in production.',
                vi: 'Hạ tầng AI tin cậy, tối ưu chi phí, vận hành thực tế.'
            }
        },
        impact: {
            kicker: { en: 'Impact', vi: 'Kết quả' },
            title: {
                en: 'Infrastructure ownership, measured in shipped systems.',
                vi: 'Sở hữu hạ tầng, đo bằng số hệ thống đã triển khai.'
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
                en: 'How I build and operate AI infrastructure.',
                vi: 'Cách tôi xây dựng và vận hành hạ tầng AI.'
            }
        },
        projects: {
            kicker: { en: 'Selected Work', vi: 'Dự án tiêu biểu' },
            title: {
                en: 'Infrastructure, ML serving, and platform engineering work.',
                vi: 'Các dự án hạ tầng, ML serving và platform engineering tiêu biểu.'
            }
        },
        caseStudy: {
            kicker: { en: 'Flagship Case Study', vi: 'Nghiên cứu tình huống tiêu biểu' },
            label: { en: 'From architecture to execution', vi: 'Từ kiến trúc đến triển khai' }
        },
        playbook: {
            kicker: { en: 'Engineering Playbook', vi: 'Nguyên tắc triển khai' },
            title: {
                en: 'Operating principles for production AI infrastructure.',
                vi: 'Các nguyên tắc vận hành hạ tầng AI thực chiến.'
            }
        },
        writing: {
            kicker: { en: 'Writing', vi: 'Bài viết' },
            title: {
                en: 'Notes on infrastructure, MLOps, and cost engineering.',
                vi: 'Ghi chép về hạ tầng, MLOps và tối ưu chi phí.'
            }
        },
        contact: {
            kicker: { en: 'Contact', vi: 'Liên hệ' },
            title: {
                en: 'Building AI infrastructure or an ML platform?',
                vi: 'Bạn đang xây dựng hạ tầng AI hoặc nền tảng ML?'
            },
            text: {
                en: 'I am available for AI/ML infrastructure, DevOps, and MLOps roles focused on production model serving, Kubernetes platforms, and cost-efficient cloud architecture.',
                vi: 'Tôi sẵn sàng cho các vị trí hạ tầng AI/ML, DevOps và MLOps, tập trung vào triển khai mô hình thực tế, nền tảng Kubernetes và kiến trúc cloud tối ưu chi phí.'
            },
            footer: {
                en: 'Built for AI/ML infrastructure & MLOps opportunities.',
                vi: 'Portfolio này được xây dựng cho các cơ hội nghề nghiệp về hạ tầng AI/ML & MLOps.'
            }
        }
    },

    heroTrust: [
        { en: 'Kubernetes & GitOps (GKE)', vi: 'Kubernetes & GitOps (GKE)' },
        { en: 'Production ML Serving', vi: 'Triển khai ML thực chiến' },
        { en: 'Cloud Cost Engineering', vi: 'Tối ưu chi phí hạ tầng' },
        { en: 'Multi-cloud Infrastructure', vi: 'Hạ tầng đa cloud' }
    ],

    focus: [
        {
            en: 'Migrating remaining production ML services from Docker Swarm to GKE with Helm and ArgoCD App-of-Apps',
            vi: 'Di trú các dịch vụ ML production còn lại từ Docker Swarm sang GKE bằng Helm và ArgoCD App-of-Apps.'
        },
        {
            en: 'Hardening the internal Qwen3 embedding service and its RAG code-review pipeline',
            vi: 'Củng cố dịch vụ embedding Qwen3 nội bộ và pipeline review code dựa trên RAG.'
        },
        {
            en: 'Earning AWS Solutions Architect Associate (SAA-C03) to round out multi-cloud depth',
            vi: 'Hoàn thành chứng chỉ AWS Solutions Architect Associate (SAA-C03) để củng cố chiều sâu đa cloud.'
        }
    ],

    metrics: [
        {
            source: 'stats.clustersManaged',
            fallback: '5',
            label: {
                en: 'Kubernetes clusters operated (GKE, DO, bare-metal, k3d, OrbStack)',
                vi: 'Cụm Kubernetes vận hành (GKE, DO, bare-metal, k3d, OrbStack)'
            }
        },
        {
            source: 'stats.cloudPlatforms',
            fallback: '5',
            label: {
                en: 'Cloud platforms in production (GCP, DigitalOcean, OCI, Cloudflare, AWS)',
                vi: 'Nền tảng cloud dùng thực tế (GCP, DigitalOcean, OCI, Cloudflare, AWS)'
            }
        },
        {
            source: 'stats.mlServices',
            fallback: '4',
            label: {
                en: 'Production ML services shipped (ASR, TTS, Pronunciation, Embedding)',
                vi: 'Dịch vụ ML đã triển khai (ASR, TTS, Chấm phát âm, Embedding)'
            }
        },
        {
            source: 'stats.hfModels',
            fallback: '3',
            label: {
                en: 'Japanese ASR models published on Hugging Face',
                vi: 'Mô hình ASR tiếng Nhật đã công bố trên Hugging Face'
            }
        }
    ],

    expertise: [
        {
            icon: '01',
            title: {
                en: 'Solution Architecture & Cost Engineering',
                vi: 'Kiến trúc giải pháp & Tối ưu chi phí'
            },
            description: {
                en: 'System design for ML serving, multi-criteria GPU sizing frameworks, and root-cause analysis — e.g. choosing GCP L4 over A100/H100 to avoid over-provisioning.',
                vi: 'Thiết kế hệ thống cho ML serving, framework chọn GPU đa tiêu chí và phân tích nguyên nhân gốc — ví dụ chọn GCP L4 thay vì A100/H100 để tránh over-provisioning.'
            }
        },
        {
            icon: '02',
            title: {
                en: 'Cloud & Kubernetes Infrastructure',
                vi: 'Hạ tầng Cloud & Kubernetes'
            },
            description: {
                en: 'End-to-end ownership: Terraform/Ansible provisioning, Docker, and Kubernetes on GKE, DigitalOcean, and bare-metal kubeadm — with ArgoCD GitOps and Cloudflare Tunnel.',
                vi: 'Sở hữu toàn trình: provisioning Terraform/Ansible, Docker và Kubernetes trên GKE, DigitalOcean và bare-metal kubeadm — kèm GitOps ArgoCD và Cloudflare Tunnel.'
            }
        },
        {
            icon: '03',
            title: {
                en: 'ML Serving & MLOps',
                vi: 'ML Serving & MLOps'
            },
            description: {
                en: 'Shipping ASR (faster-whisper/CTranslate2), TTS, pronunciation scoring (wav2vec2), and embedding (Qwen3) services with full CI/CT/CD pipelines and quality gates.',
                vi: 'Triển khai dịch vụ ASR (faster-whisper/CTranslate2), TTS, chấm phát âm (wav2vec2) và embedding (Qwen3) với pipeline CI/CT/CD đầy đủ và các cổng kiểm soát chất lượng.'
            }
        }
    ],

    projects: [
        {
            repo: 'pronunciation-scoring-api',
            name: 'Pronunciation Scoring API',
            period: 'eUp · 2025-2026',
            summary: {
                en: 'FastAPI service scoring Japanese pronunciation with wav2vec2 CTC forced alignment, a G2P caching layer, and GPU micro-batching for HeyJapan learners.',
                vi: 'Dịch vụ FastAPI chấm phát âm tiếng Nhật bằng wav2vec2 CTC forced alignment, lớp cache G2P và micro-batching trên GPU phục vụ người học HeyJapan.'
            },
            outcome: {
                en: 'Outcome: targeted sub-3s latency for 20 concurrent users on a single GCP L4 / RTX 4000 Ada, sized from a multi-criteria GPU cost framework instead of over-provisioning A100/H100.',
                vi: 'Kết quả: hướng tới độ trễ <3s cho 20 người dùng đồng thời trên một GPU GCP L4 / RTX 4000 Ada, chọn theo framework chi phí GPU đa tiêu chí thay vì over-provisioning A100/H100.'
            },
            stack: ['Python', 'FastAPI', 'wav2vec2', 'GPU (GCP L4)', 'Docker'],
            links: []
        },
        {
            repo: 'internal-embedding-service',
            name: 'Internal Embedding Service',
            period: 'eUp · 2025',
            summary: {
                en: 'Self-hosted Qwen3-Embedding-4B exposing an OpenAI-compatible /v1/embeddings endpoint on an RTX 4080, replacing the OpenAI Embedding API for internal workloads.',
                vi: 'Tự host Qwen3-Embedding-4B, cung cấp endpoint /v1/embeddings tương thích OpenAI trên RTX 4080, thay thế hoàn toàn OpenAI Embedding API cho workload nội bộ.'
            },
            outcome: {
                en: 'Outcome: removed an external API dependency and powered a RAG code-review pipeline (harvest -> embed -> LanceDB -> Qodo PR Agent) gated by a GitLab CI exit-code check.',
                vi: 'Kết quả: loại bỏ phụ thuộc API bên ngoài và cấp nguồn cho pipeline review code bằng RAG (harvest -> embed -> LanceDB -> Qodo PR Agent), kiểm soát bằng GitLab CI exit-code gate.'
            },
            stack: ['Qwen3-Embedding-4B', 'FastAPI', 'LanceDB', 'Docker Compose', 'GitLab CI', 'RTX 4080'],
            links: []
        },
        {
            repo: 'ai-gateway',
            name: 'AI Gateway',
            period: '2025',
            summary: {
                en: 'Reactive Spring WebFlux gateway plus a Python FastAPI worker that unify multi-provider LLM access (OpenAI, Gemini, Anthropic, DashScope) behind one API.',
                vi: 'Gateway reactive Spring WebFlux kết hợp worker Python FastAPI, hợp nhất truy cập LLM đa nhà cung cấp (OpenAI, Gemini, Anthropic, DashScope) sau một API duy nhất.'
            },
            outcome: {
                en: 'Outcome: added Resilience4j circuit breaker, bulkhead, retry, and per-request token tracking so LLM traffic degrades gracefully during provider instability.',
                vi: 'Kết quả: bổ sung circuit breaker, bulkhead, retry (Resilience4j) và theo dõi token theo từng request để lưu lượng LLM suy giảm an toàn khi provider gặp sự cố.'
            },
            stack: ['Java', 'Spring WebFlux', 'Resilience4j', 'Python', 'FastAPI', 'Redis'],
            links: [
                {
                    label: { en: 'Repository', vi: 'Mã nguồn' },
                    url: 'https://github.com/dungca1512/ai-gateway'
                }
            ]
        },
        {
            repo: 'newspulse-reco-engine',
            name: 'NewsPulse Reco Engine',
            period: '2025',
            summary: {
                en: 'Event-driven Vietnamese news platform: crawling, Spark ETL, Kafka streaming, embeddings, trend detection, and FCM push via an n8n orchestration flow.',
                vi: 'Nền tảng tin tức tiếng Việt theo hướng sự kiện: thu thập, Spark ETL, streaming Kafka, embeddings, phát hiện xu hướng và đẩy FCM qua luồng orchestration n8n.'
            },
            outcome: {
                en: 'Outcome: designed a 7-module pipeline spanning Scala crawler + Spark ETL + Kafka stream + embeddings + clustering/trending + Spring API + push notification.',
                vi: 'Kết quả: thiết kế pipeline 7 module gồm Scala crawler + Spark ETL + Kafka stream + embeddings + clustering/trending + Spring API + push notification.'
            },
            stack: ['Scala', 'Kafka', 'Spark', 'Elasticsearch', 'n8n', 'Firebase FCM'],
            links: [
                {
                    label: { en: 'Repository', vi: 'Mã nguồn' },
                    url: 'https://github.com/dungca1512/newspulse-reco-engine'
                }
            ]
        },
        {
            repo: 'whisper-finetune-ja',
            name: 'Whisper Finetune JA',
            period: '2026',
            summary: {
                en: 'Reproducible fine-tuning pipeline for Japanese Whisper ASR on ReazonSpeech data, with training, export, and inference scripts.',
                vi: 'Pipeline tinh chỉnh tái lập được cho ASR tiếng Nhật trên Whisper với dữ liệu ReazonSpeech, kèm script huấn luyện, export và inference.'
            },
            outcome: {
                en: 'Outcome: published 3 Whisper-based Japanese ASR models on Hugging Face (one LoRA variant with 40+ downloads) from a clean, repeatable training flow.',
                vi: 'Kết quả: công bố 3 mô hình ASR tiếng Nhật dựa trên Whisper trên Hugging Face (một biến thể LoRA 40+ lượt tải) từ luồng huấn luyện gọn gàng, tái lập được.'
            },
            stack: ['Python', 'Whisper', 'CTranslate2', 'ReazonSpeech', 'Hugging Face'],
            links: [
                {
                    label: { en: 'Repository', vi: 'Mã nguồn' },
                    url: 'https://github.com/dungca1512/whisper-finetune-ja'
                }
            ]
        }
    ],

    caseStudy: {
        title: {
            en: 'AI Gateway: a resilient reactive layer for multi-provider LLM traffic',
            vi: 'AI Gateway: tầng reactive chịu lỗi cho lưu lượng LLM đa nhà cung cấp'
        },
        subtitle: {
            en: 'How I turned fragmented model integrations into a unified, fault-tolerant gateway.',
            vi: 'Cách tôi chuyển các tích hợp mô hình rời rạc thành một gateway thống nhất, chịu lỗi tốt.'
        },
        repoUrl: 'https://github.com/dungca1512/ai-gateway',
        highlights: [
            {
                en: 'Reactive Spring WebFlux gateway routing OpenAI / Gemini / Anthropic / DashScope traffic',
                vi: 'Gateway reactive Spring WebFlux định tuyến lưu lượng OpenAI / Gemini / Anthropic / DashScope'
            },
            {
                en: 'Resilience4j circuit breaker, bulkhead, and retry for graceful degradation',
                vi: 'Circuit breaker, bulkhead và retry (Resilience4j) để suy giảm an toàn'
            },
            {
                en: 'Per-request token-usage tracking under one OpenAI-compatible API contract',
                vi: 'Theo dõi token theo từng request dưới một chuẩn API tương thích OpenAI'
            }
        ],
        blocks: [
            {
                title: { en: 'Problem', vi: 'Bài toán' },
                text: {
                    en: 'Teams needed one stable API across multiple LLM providers, but each had different request/response semantics, rate limits, and failure patterns.',
                    vi: 'Các đội cần một API ổn định cho nhiều nhà cung cấp LLM, nhưng mỗi bên có định dạng request/response, rate limit và kiểu lỗi khác nhau.'
                }
            },
            {
                title: { en: 'Architecture', vi: 'Kiến trúc' },
                text: {
                    en: 'A Java Spring WebFlux gateway handles routing, resilience, and policy control; a Python FastAPI worker serves local models and embedding tasks behind it.',
                    vi: 'Gateway Java Spring WebFlux xử lý routing, resilience và policy control; phía sau là worker Python FastAPI phục vụ mô hình nội bộ và tác vụ embedding.'
                }
            },
            {
                title: { en: 'Trade-offs', vi: 'Đánh đổi kỹ thuật' },
                text: {
                    en: 'Chose reliability and observability over minimal complexity — more moving parts, but consistent behavior when a provider degrades or rate-limits.',
                    vi: 'Ưu tiên độ tin cậy và khả năng quan sát thay vì tối giản — nhiều thành phần hơn nhưng ổn định khi provider suy giảm hoặc bị rate-limit.'
                }
            },
            {
                title: { en: 'Result', vi: 'Kết quả' },
                text: {
                    en: 'A reusable gateway baseline for future AI products that reduces integration overhead and standardizes production controls.',
                    vi: 'Một nền tảng gateway tái sử dụng cho các sản phẩm AI tiếp theo, giảm chi phí tích hợp và chuẩn hóa cơ chế kiểm soát production.'
                }
            },
            {
                title: { en: "What I'd improve next", vi: 'Bước cải tiến tiếp theo' },
                text: {
                    en: 'Per-provider latency dashboards, token-cost analytics, and automated fallback tuning driven by live traffic signals.',
                    vi: 'Dashboard độ trễ theo từng provider, phân tích chi phí token và tự động tinh chỉnh fallback dựa trên tín hiệu lưu lượng thực tế.'
                }
            }
        ]
    },

    playbook: [
        {
            title: {
                en: 'Decide with frameworks, not gut',
                vi: 'Quyết định theo framework, không cảm tính'
            },
            description: {
                en: 'Compare GPU and cloud options on price, data-center location, SLA, and VN-JP-KR latency together — never on raw price alone.',
                vi: 'So sánh phương án GPU và cloud trên giá, vị trí data center, SLA và độ trễ VN-JP-KR cùng lúc — không chỉ nhìn giá thuần.'
            }
        },
        {
            title: {
                en: 'Cost-conscious by default',
                vi: 'Tối ưu chi phí mặc định'
            },
            description: {
                en: 'Size hardware to the workload (wav2vec2 ~315M in FP16 fits an L4) and prove CPU-vs-GPU trade-offs with benchmarks before provisioning anything.',
                vi: 'Chọn phần cứng vừa với workload (wav2vec2 ~315M FP16 đủ trên L4) và chứng minh đánh đổi CPU-vs-GPU bằng benchmark trước khi provisioning.'
            }
        },
        {
            title: {
                en: 'CLI-first, reproducible operations',
                vi: 'CLI-first, vận hành tái lập được'
            },
            description: {
                en: 'Automate provisioning and deploys with Terraform, Ansible, and GitOps so any environment is rebuildable from code.',
                vi: 'Tự động hóa provisioning và deploy bằng Terraform, Ansible và GitOps để mọi môi trường đều dựng lại được từ code.'
            }
        },
        {
            title: {
                en: 'Ship through GitOps and quality gates',
                vi: 'Triển khai qua GitOps và cổng chất lượng'
            },
            description: {
                en: 'Deliver via ArgoCD App-of-Apps and CI exit-code gates that fail fast on corruption or regressions before they reach users.',
                vi: 'Giao hàng qua ArgoCD App-of-Apps và CI exit-code gate, fail nhanh khi có lỗi hỏng dữ liệu hoặc hồi quy trước khi tới người dùng.'
            }
        },
        {
            title: {
                en: 'Instrument and degrade gracefully',
                vi: 'Gắn quan sát và suy giảm an toàn'
            },
            description: {
                en: 'Observe every service with kube-prometheus-stack and treat provider or GPU failure as normal, with predefined fallback paths.',
                vi: 'Quan sát mọi dịch vụ bằng kube-prometheus-stack, xem lỗi provider hay GPU là bình thường và luôn có đường fallback định sẵn.'
            }
        }
    ],

    writing: [
        {
            year: '2026',
            title: {
                en: 'GPU Cost Engineering: sizing ML serving without over-provisioning',
                vi: 'Tối ưu chi phí GPU: chọn GPU cho ML serving mà không over-provisioning'
            },
            summary: {
                en: 'A multi-criteria framework (price, region, SLA, latency) for picking GPUs — and why L4 beat A100/H100 for light inference workloads.',
                vi: 'Framework đa tiêu chí (giá, vùng, SLA, độ trễ) để chọn GPU — và vì sao L4 thắng A100/H100 cho workload inference nhẹ.'
            },
            tags: ['Cost Engineering', 'GPU', 'MLOps'],
            url: 'https://github.com/dungca1512'
        },
        {
            year: '2026',
            title: {
                en: 'Pronunciation Scoring on a single L4',
                vi: 'Chấm phát âm trên một GPU L4'
            },
            summary: {
                en: 'Hitting sub-3s latency at 20 concurrency with wav2vec2 forced alignment, G2P caching, and GPU micro-batching.',
                vi: 'Đạt độ trễ <3s ở 20 người dùng đồng thời với wav2vec2 forced alignment, cache G2P và micro-batching GPU.'
            },
            tags: ['wav2vec2', 'FastAPI', 'GPU'],
            url: 'https://github.com/dungca1512'
        },
        {
            year: '2025',
            title: {
                en: 'Docker Swarm to GKE: migrating production ML services',
                vi: 'Từ Docker Swarm sang GKE: di trú dịch vụ ML production'
            },
            summary: {
                en: 'Notes on moving live ML workloads to Kubernetes with Helm, ArgoCD App-of-Apps, and a bare-metal kubeadm homelab for testing.',
                vi: 'Ghi chú về việc đưa workload ML đang chạy lên Kubernetes với Helm, ArgoCD App-of-Apps và homelab kubeadm bare-metal để thử nghiệm.'
            },
            tags: ['Kubernetes', 'GKE', 'GitOps'],
            url: 'https://github.com/dungca1512'
        },
        {
            year: '2025',
            title: {
                en: 'AI Gateway: reactive resilience for LLM traffic',
                vi: 'AI Gateway: resilience reactive cho lưu lượng LLM'
            },
            summary: {
                en: 'A practical breakdown of provider routing, Resilience4j controls, and a unified API contract for multi-provider LLM products.',
                vi: 'Phân tích thực tế về định tuyến provider, các cơ chế Resilience4j và chuẩn API thống nhất cho sản phẩm LLM đa nhà cung cấp.'
            },
            tags: ['WebFlux', 'Resilience4j', 'LLM Infra'],
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
