'use client';

import { useEffect, useState } from 'react';
import { Check, Copy } from './contact-icons';

type CopyButtonProps = {
  value: string;
  /** Both states are named, not just the idle one: the label is the only thing
   *  a screen reader hears, and "Copy" staying "Copy" after a click tells that
   *  user nothing happened. */
  label: string;
  copiedLabel: string;
  className?: string;
};

/** Copies `value` and says so for two seconds. The `mailto:` link beside it is
 *  still the primary path — this is for the reader on a machine with no mail
 *  client configured, where a mailto click does nothing visible at all. */
export function CopyButton({ value, label, copiedLabel, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          /* Clipboard refused (insecure context, permission): leave the
             button as it was rather than claim a copy that did not happen. */
        }
      }}
      aria-label={copied ? copiedLabel : label}
      title={copied ? copiedLabel : label}
      className={className}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      <span aria-live="polite" className="sr-only">
        {copied ? copiedLabel : ''}
      </span>
    </button>
  );
}
