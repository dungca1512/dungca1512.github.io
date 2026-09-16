import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('max-w-content mx-auto w-full px-5 sm:px-8', className)}>{children}</div>
  );
}
