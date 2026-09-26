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
    writing: 'Ghi chép',
    contact: 'Liên hệ',
    theme: { label: 'Giao diện', dark: 'Tối', light: 'Sáng', system: 'Theo hệ thống' },
  },
  common: {
    hireMe: 'Liên hệ hợp tác',
    downloadCv: 'Tải CV',
    readBlog: 'Đọc blog',
    repository: 'Mã nguồn',
    demo: 'Bản chạy thử',
    present: 'Hiện tại',
    /* The labels on the page's collapsed panels. They are written as a promise
       of what is inside, not as a bare "Xem thêm": a summary line that does not
       say what it hides is a line nobody opens. `{count}` is filled in at the
       call site from the list's own length — a hardcoded "4" here goes stale
       the moment a project is added or dropped, and nothing would say so. */
    moreProjects: 'Xem thêm {count} dự án',
    caseStudyDetail: 'Xem chi tiết: bài toán, kiến trúc, đánh đổi và kết quả',
    measuredOutcome: 'Kết quả đo được',
    /* `{names}` carries the companies into the summary line on purpose. A
       recruiter scanning a timeline is often scanning for brand names, and a
       fold that hides them would cost exactly the reader it was meant to
       serve. The prose folds; the names stay on the surface. */
    earlierRoles: 'Xem {count} vai trò trước đó: {names}',
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
      /* This lead now has to cover the toolbox and the playbook as well: the
         band it used to introduce was one of TWO answering "what can he do",
         and they have been merged into this one. */
      lead: 'Bốn mảng tôi làm sâu, bộ công cụ dùng hằng ngày, và năm nguyên tắc quyết định cách tôi dùng chúng.',
      toolbox: 'Bộ công cụ dùng hằng ngày',
    },
    work: {
      eyebrow: 'Dự án tiêu biểu',
      title: 'Các dự án hạ tầng, ML serving và platform engineering tiêu biểu.',
      lead: 'Chín hệ thống đã chạy thật, kèm một ca cụ thể mổ xẻ từ vấn đề tới kết quả đo được.',
    },
    experience: {
      eyebrow: 'Kinh nghiệm',
      title: 'Ba năm xây dựng và vận hành hệ thống AI trong môi trường thực tế.',
      lead: 'Ba năm qua ba nơi, kể từ đầu: phân tích hội thoại ở FPT Smart Cloud, kỹ sư AI ở AMELA, tới sở hữu hạ tầng AI/ML ở eUp Group.',
      /* The two ends of the time axis. `axisStart` is the year the first role
         began, kept as copy rather than derived from EXPERIENCE: the axis is
         the reader's orientation, and pinning it here means a role added at
         either end is a deliberate edit to the label too. */
      axisStart: '2023',
      axisNow: 'Hiện tại',
    },
    /* No longer a band of its own — its contents moved into `expertise`,
       which was answering the same question one band earlier. `title` stays
       because it is the line the owner asked for by name, and it now labels
       the collapsed panel the five principles live in. `eyebrow` and `lead`
       went with the band: the eyebrow named a section that no longer exists,
       and the lead's job was taken over by `expertise.lead`. */
    capabilities: {
      title: 'Các nguyên tắc vận hành hạ tầng AI thực chiến.',
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
      eyebrow: 'Ghi chép kỹ thuật',
      title: 'Hạ tầng, MLOps và những bài học tối ưu chi phí.',
      lead: 'Những thứ tôi đã thử, đã hỏng và đã sửa — chủ yếu quanh chi phí GPU, phục vụ LLM và vận hành.',
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
