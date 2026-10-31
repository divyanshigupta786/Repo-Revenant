'use client';

import React, { useState } from 'react';
import { Copy, Check, FileCode } from 'lucide-react';

export default function DiffViewer({ unifiedDiff, filePath }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!unifiedDiff) return;
    navigator.clipboard.writeText(unifiedDiff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!unifiedDiff) {
    return (
      <div className="p-6 text-center text-xs font-mono text-[#717C8D] bg-[#080A0F] rounded-lg border border-[#202735]">
        No diff changes available for this patch.
      </div>
    );
  }

  const lines = unifiedDiff.split('\n');

  return (
    <div className="rounded-lg border border-[#202735] bg-[#080A0F] overflow-hidden my-2">
      {/* Diff Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#11151D] border-b border-[#202735] text-xs font-mono">
        <div className="flex items-center gap-2 text-[#80D8FF]">
          <FileCode className="w-3.5 h-3.5 text-[#68F0D0]" />
          <span className="font-semibold text-[#F0F2F5] text-xs">{filePath || 'patch.diff'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#080A0F] hover:bg-[#171D27] text-[#A4ADBB] hover:text-[#F0F2F5] transition-colors border border-[#202735] text-[11px] cursor-pointer"
          title="Copy unified diff to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-[#69D99A]" />
              <span className="text-[#69D99A]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy Diff</span>
            </>
          )}
        </button>
      </div>

      {/* Diff Code Container */}
      <div className="diff-container p-2 overflow-x-auto text-xs font-mono leading-relaxed">
        {lines.map((line, idx) => {
          let lineType = 'context';
          if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) {
            lineType = 'header';
          } else if (line.startsWith('+')) {
            lineType = 'add';
          } else if (line.startsWith('-')) {
            lineType = 'del';
          }

          return (
            <div key={idx} className={`diff-line ${lineType}`}>
              <span className="w-8 select-none text-[#717C8D] text-right pr-3 opacity-60 text-[10px]">
                {idx + 1}
              </span>
              <span className="flex-1 font-mono">{line}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
