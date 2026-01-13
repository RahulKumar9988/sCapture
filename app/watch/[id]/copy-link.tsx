'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <input 
        readOnly 
        value={url} 
        className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-4 py-3 sm:py-2 text-neutral-400 font-mono text-sm w-full truncate"
      />
      <button 
        onClick={handleCopy}
        className="px-6 py-2 bg-white text-black font-semibold rounded hover:bg-neutral-200 transition-colors flex items-center gap-2 min-w-[100px] justify-center"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            <span>Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span>Copy</span>
          </>
        )}
      </button>
    </div>
  );
}
