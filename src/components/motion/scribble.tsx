import type { ReactNode } from 'react';

/** Nét vẽ tay vòng quanh nút khi rê chuột (§3.8). Thuần CSS — `stroke-dashoffset` chạy
 * bằng `transition` trên `:hover`, nên không cần state và không có gì phải dọn khi gỡ. */
export function Scribble({ children }: { children: ReactNode }) {
  return (
    <span className="group/cta relative inline-flex">
      {children}
      <svg
        aria-hidden="true"
        viewBox="0 0 200 64"
        preserveAspectRatio="none"
        fill="none"
        className="text-ink-primary scribble pointer-events-none absolute -inset-x-3 -inset-y-2 size-auto h-[calc(100%+1rem)] w-[calc(100%+1.5rem)]"
      >
        <path
          d="M28 10c-14 2-24 10-24 20 0 12 16 22 44 25 30 3 78 3 110-2 22-3 38-11 38-21 0-11-14-19-40-22-30-3-84-4-116 0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
