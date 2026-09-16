'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** Nhãn bám theo con trỏ khi rê vào vùng bọc (§3.3). Chỉ dựng trên chuột thật:
 * cảm ứng không có con trỏ để bám, và người tắt chuyển động thì không có gì đuổi theo.
 * Nhãn là TRANG TRÍ — thông tin "bấm vào đi đâu" đã nằm trong link phía dưới. */
export function CursorLabel({ label, children }: { label: string; children: ReactNode }) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scope = scopeRef.current;
    const chip = chipRef.current;
    if (!scope || !chip) return;

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!finePointer.matches || reduced.matches) return;

    let raf = 0;
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let visible = false;

    const tick = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      chip.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${visible ? 1 : 0.6})`;
      if (Math.abs(tx - x) > 0.2 || Math.abs(ty - y) > 0.2) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      // Chỉ hiện khi con trỏ đang ở trên một thẻ, không phải ở khe hở giữa hai thẻ.
      const overCard = (event.target as HTMLElement | null)?.closest('a') !== null;
      const rect = scope.getBoundingClientRect();
      tx = event.clientX - rect.left;
      ty = event.clientY - rect.top;
      if (overCard !== visible) {
        visible = overCard;
        chip.style.opacity = visible ? '1' : '0';
      }
      start();
    };

    const onLeave = () => {
      visible = false;
      chip.style.opacity = '0';
    };

    scope.addEventListener('pointermove', onMove, { passive: true });
    scope.addEventListener('pointerleave', onLeave, { passive: true });

    return () => {
      scope.removeEventListener('pointermove', onMove);
      scope.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={scopeRef} className="relative">
      {children}
      <div
        ref={chipRef}
        aria-hidden="true"
        className="duration-fast bg-primary text-primary-foreground shadow-raised pointer-events-none absolute top-0 left-0 z-20 -mt-5 -ml-11 hidden rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap opacity-0 transition-opacity md:block"
      >
        {label}
      </div>
    </div>
  );
}
