import { cn } from '@/lib/cn';

type SplitLinesProps = {
  /** Mỗi phần tử là MỘT DÒNG, không phải một từ. Tách theo từ thì mắt phải bám 9 chỗ
   * chuyển động cùng lúc, đọc mệt hơn hẳn và không đẹp hơn. */
  lines: string[];
  className?: string;
  lineClassName?: string;
  /** Trễ trước dòng đầu, để nét bút và chữ không cùng bắt đầu ở mili giây 0. */
  delay?: number;
  /** Mỗi dòng trễ hơn dòng trước từng này ms. 80 là bước so le của wigin.ai
   * (đo ngày 2026-09-26), trùng với `--stagger-step` mặc định trong motion.css. */
  step?: number;
  /** `load` cho chữ nằm sẵn trong khung nhìn (hero). Xem globals.css §3a-bis. */
  mode?: 'scroll' | 'load';
};

export function SplitLines({
  lines,
  className,
  lineClassName,
  delay = 0,
  step = 80,
  mode = 'scroll',
}: SplitLinesProps) {
  return (
    <span className={cn('block', className)}>
      {lines.map((line, i) => (
        // `overflow-hidden` là phần bắt buộc: chữ trượt lên từ dưới mép dòng của chính
        // nó, không phải từ khoảng trống bên dưới.
        <span key={line} className="block overflow-hidden pb-[0.08em]">
          <span
            className={cn(
              'block',
              mode === 'load' ? 'reveal-clip-load' : 'reveal-clip',
              lineClassName,
            )}
            style={{
              animationDelay: `${delay + i * step}ms`,
              transitionDelay: `${delay + i * step}ms`,
            }}
          >
            {line}
          </span>
        </span>
      ))}
    </span>
  );
}
