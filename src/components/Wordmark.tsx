import React from 'react';

export function Wordmark() {
  return (
    <div className="inline-flex items-center gap-2 group cursor-pointer select-none">
      <span className="flex items-center justify-center w-7 h-7 rounded-[4px] bg-ink text-paper text-sm font-bold shadow-xs">
        P
      </span>
      <span className="font-display text-xl font-semibold tracking-tight text-ink group-hover:text-ink-hover transition-colors">
        PrepMate <span className="text-xs font-sans uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 ml-1">AI</span>
      </span>
    </div>
  );
}
