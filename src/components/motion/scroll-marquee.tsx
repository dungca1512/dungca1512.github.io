'use client';

import { cn } from '@/lib/cn';

type ScrollMarqueeProps = {
  items: string[];
  className?: string;
  /** px dịch chuyển trên mỗi px cuộn. */
  factor?: number;
};

/** Dải chữ chạy ngang liên tục. CSS đảm nhiệm chuyển động để dải vẫn chạy khi người dùng
 * đứng yên, không tạo một requestAnimationFrame toàn trang chỉ cho hiệu ứng trang trí. */
export function ScrollMarquee({ items, className, factor = 0.35 }: ScrollMarqueeProps) {
  const duration = Math.max(18, Math.round(12 / Math.max(factor, 0.1)));

  return (
    <div className={cn('relative overflow-hidden py-4', className)}>
      <div
        className="marquee-track flex w-max gap-10"
        style={{ '--marquee-duration': `${duration}s` } as React.CSSProperties}
      >
        {/* Hai bản sao: bản thứ hai lấp chỗ trống lúc bản thứ nhất trôi khỏi màn hình.
            `aria-hidden` để trình đọc màn hình không đọc danh sách này hai lần. */}
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            className="flex shrink-0 items-center gap-10"
            aria-hidden={copy === 1 ? 'true' : undefined}
          >
            {items.map((item) => (
              <li
                key={item}
                className="text-muted-foreground flex items-center gap-10 text-lg font-medium whitespace-nowrap"
              >
                {item}
                <span aria-hidden="true" className="bg-primary size-1.5 rounded-full" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
