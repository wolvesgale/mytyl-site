'use client';

import { useState } from 'react';

export default function ContactActions({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="contact-actions">
      <a className="btn-prism" href={`mailto:${email}?subject=${encodeURIComponent('お仕事のご相談')}`}>
        <span className="btn-prism__label">メールで相談する</span>
        <span className="btn-prism__arrow" aria-hidden>→</span>
      </a>
      <button
        type="button"
        className="btn-ghost"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(email);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {}
        }}
      >
        {copied ? 'Copied ✓' : 'アドレスをコピー'}
      </button>
    </div>
  );
}
