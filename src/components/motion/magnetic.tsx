'use client';

import { useEffect, useRef, type ReactNode } from 'react';

type MagneticProps = {
  children: ReactNode;
  className?: string;
  /** Bán kính hút, tính bằng px quanh tâm phần tử. */
  radius?: number;
  /** Quãng đường tối đa phần tử bị kéo lệch. Quá 12px thì con trỏ và nút lệch nhau
   * đủ để bấm trượt — hiệu ứng trở thành lỗi dùng được. */
  strength?: number;
};

export function Magnetic({ children, className, radius = 80, strength = 10 }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Hai cửa chặn, cả hai đều bắt buộc: chuột thật (touch không có con trỏ để hút),
    // và người không tắt chuyển động.
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!finePointer.matches || reduced.matches) return;

    let raf = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const tick = () => {
      // Lerp thay vì gán thẳng: gán thẳng làm nút giật theo từng sự kiện chuột.
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;
      el.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
      if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const distance = Math.hypot(dx, dy);
      const pull = distance > radius ? 0 : (1 - distance / radius) * strength;
      targetX = distance === 0 ? 0 : (dx / distance) * pull;
      targetY = distance === 0 ? 0 : (dy / distance) * pull;
      start();
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      start();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onLeave, { passive: true });
    window.addEventListener('blur', onLeave);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onLeave);
      window.removeEventListener('blur', onLeave);
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = '';
    };
  }, [radius, strength]);

  return (
    <span
      ref={ref}
      className={className}
      style={{ display: 'inline-block', willChange: 'transform' }}
    >
      {children}
    </span>
  );
}
