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
  },
  sections: {
    hero: {
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
