/** The chrome dictionary — everything the layout/nav/section-heads/404 page
 *  need that is not one of the typed content arrays in `src/content/*`.
 *
 *  Sourcing, per controller ruling (see task-3-report.md for the full
 *  breakdown):
 *   - `nav.{expertise,projects,experience,writing,contact}`, `common.{hireMe,
 *     repository}` and `sections.<name>.{eyebrow,title}` for expertise, work,
 *     experience, writing, contact come from `PORTFOLIO_DATA.i18n` verbatim
 *     (kicker -> eyebrow is a property rename only, the text is untouched).
 *   - `sections.capabilities.{eyebrow,title}` comes from `i18n.playbook`,
 *     because `i18n.skills` has no title, only a `label`.
 *   - `common.downloadCv` reuses `PORTFOLIO_DATA.contacts[0].label` verbatim
 *     (identical text, different key name).
 *   - `sections.hero.lead` is `i18n.hero.lead` verbatim; `sections.contact.lead`
 *     is `i18n.contact.text` verbatim.
 *   - `sections.{expertise,work,experience,capabilities,writing}.lead` are the
 *     five drafted leads from section-leads.md, authorized by controller
 *     ruling R23 — the only strings in this dictionary not read directly out
 *     of `data.js`.
 *   - The case-study band reads its own block titles straight off
 *     `CASE_STUDY.blocks[]`, which already carries all five bilingual
 *     ("Problem", "Architecture", "Trade-offs", "Result", "What I'd improve
 *     next"). There are deliberately no problem/approach/result keys here:
 *     three renamed aliases would duplicate two of those five and silently
 *     drop the other three.
 */
const vi = {
  meta: {
    title: 'Công Anh Dũng — AI/ML Systems Architect',
    description:
      'Dịch vụ speech (ASR, chấm phát âm và thanh điệu) và embedding trên GCP và DigitalOcean cho người dùng ở VN, JP, KR và CN. Mặc định tối ưu chi phí: chọn đúng cỡ GPU, ưu tiên inference trên CPU, tự host thay cho API trả phí.',
  },
  nav: {
    skipToContent: 'Tới nội dung chính',
    expertise: 'Năng lực',
    projects: 'Dự án',
    experience: 'Kinh nghiệm',
    analytics: 'Dữ liệu',
    writing: 'Bài viết',
    contact: 'Liên hệ',
    toggleTheme: 'Đổi giao diện sáng/tối',
  },
  common: {
    hireMe: 'Liên hệ hợp tác',
    downloadCv: 'Tải CV',
    repository: 'Mã nguồn',
    demo: 'Bản chạy thử',
    present: 'Hiện tại',
    readArticle: 'Đọc bài',
  },
  sections: {
    hero: {
      /* The <h1>. It was `SITE.name` — a name in 6rem type says who is
         speaking and nothing about what they do, and the first screen is the
         one place that has to answer the second question. These two lines are
         the claim `sections.hero.lead` then evidences: speech and embedding
         services actually serving users in four countries, not models in a
         notebook. Split across two array entries because the <h1> animates one
         line at a time, and a line break is a typographic decision this file
         should own rather than a browser guess. */
      title: ['Đưa mô hình AI', 'ra vận hành thật.'],
      trustList: 'Công nghệ và phương pháp đã làm việc cùng',
      lead: 'Dịch vụ speech (ASR, chấm phát âm và thanh điệu) và embedding trên GCP và DigitalOcean cho người dùng ở VN, JP, KR và CN. Mặc định tối ưu chi phí: chọn đúng cỡ GPU, ưu tiên inference trên CPU, tự host thay cho API trả phí.',
    },
    expertise: {
      eyebrow: 'Năng lực cốt lõi',
      title: 'Cách tôi xây dựng và vận hành hạ tầng AI.',
      lead: 'Bốn mảng tôi làm sâu, từ chọn kiến trúc và kiểm soát chi phí đến vận hành Kubernetes, phục vụ mô hình và dựng ứng dụng LLM.',
    },
    work: {
      eyebrow: 'Dự án tiêu biểu',
      title: 'Các dự án hạ tầng, ML serving và platform engineering tiêu biểu.',
      lead: 'Chín hệ thống đã chạy thật, kèm một ca cụ thể mổ xẻ từ vấn đề tới kết quả đo được.',
    },
    experience: {
      eyebrow: 'Kinh nghiệm',
      title: 'Ba năm xây dựng và vận hành hệ thống AI trong môi trường thực tế.',
      lead: 'Ba năm qua ba nơi: từ thực tập AI ở FPT Smart Cloud, sang kỹ sư AI ở AMELA, tới sở hữu hạ tầng AI/ML ở eUp Group.',
    },
    capabilities: {
      eyebrow: 'Nguyên tắc triển khai',
      title: 'Các nguyên tắc vận hành hạ tầng AI thực chiến.',
      lead: 'Công cụ tôi dùng hằng ngày, và năm nguyên tắc quyết định cách tôi dùng chúng.',
    },
    /* The labels for a band whose numbers are all computed — see
       src/lib/github-analytics.ts. Nothing here states a figure; a number
       written into this file would be a number nobody recomputes when the
       snapshot is refreshed, and it would disagree with the chart beside it
       the first time it went stale. */
    analytics: {
      eyebrow: 'Dữ liệu tổng quan',
      title: 'Tổng quan hoạt động và tín hiệu kỹ thuật từ GitHub.',
      lead: 'Toàn bộ số liệu dưới đây đọc thẳng từ GitHub API và được đóng băng tại thời điểm chụp, nên trang luôn hiện đúng thứ mà bản build nhìn thấy — không có biểu đồ nào ở đây được vẽ tay.',
      scope:
        'Phạm vi: các repo công khai có commit từ 2025 trở lại đây. Repo bài tập thời đại học được loại trừ, và phần lớn công việc production tại eUp, AMELA và FPT nằm trong repo nội bộ nên không xuất hiện ở đây.',
      snapshot: 'Ảnh chụp GitHub',
      kpiPublic: 'Repo công khai',
      kpiOwn: 'Repo tự viết, không fork',
      kpiScope: 'Trong phạm vi từ 2025',
      kpiLanguages: 'Ngôn ngữ dùng trong phạm vi',
      languageMix: 'Cơ cấu ngôn ngữ',
      velocity: 'Nhịp cập nhật theo tháng',
      freshness: 'Mức độ cập nhật gần đây',
      topRepos: 'Repo hoạt động gần đây nhất',
      days30: 'Cập nhật ≤ 30 ngày',
      days90: 'Cập nhật 31–90 ngày',
      days180: 'Cập nhật 91–180 ngày',
      older: 'Cập nhật > 180 ngày',
      tableRepo: 'Repo',
      tableLanguage: 'Ngôn ngữ',
      tableUpdated: 'Cập nhật gần nhất',
      unknown: 'Không xác định',
      repoUnit: 'repo',
    },
    writing: {
      eyebrow: 'Bài viết',
      title: 'Ghi chép về hạ tầng, MLOps và tối ưu chi phí.',
      lead: 'Sáu bài viết về những thứ tôi đã thử, đã hỏng và đã sửa — chủ yếu quanh chi phí GPU, phục vụ LLM và vận hành.',
    },
    contact: {
      eyebrow: 'Liên hệ',
      title: 'Bạn đang xây dựng hạ tầng AI hoặc nền tảng ML?',
      lead: 'Tôi sẵn sàng cho các vị trí hạ tầng AI/ML, DevOps và MLOps, tập trung vào triển khai mô hình thực tế, nền tảng Kubernetes và kiến trúc cloud tối ưu chi phí.',
    },
  },
  notFound: {
    title: 'Không tìm thấy trang',
    back: 'Về trang chủ',
  },
};

export type Dictionary = typeof vi;
export default vi;
