'use client';

import { useState } from 'react';

export function ShareButton({ url, title, text }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // user cancelled the share sheet — not an error
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleShare} className="btn btn-gold">
      {copied ? 'Link copied!' : 'Share this page'}
    </button>
  );
}
