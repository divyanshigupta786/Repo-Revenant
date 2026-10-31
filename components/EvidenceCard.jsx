'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, FileSearch, Lightbulb } from 'lucide-react';

export default function EvidenceCard({ finding }) {
  const getSeverityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return (
          <span className="badge-critical flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>CRITICAL</span>
          </span>
        );
      case 'warning':
        return (
          <span className="badge-warning flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>WARNING</span>
          </span>
        );
      default:
        return (
          <span className="badge-spectral flex items-center gap-1">
            <Info className="w-3 h-3" />
            <span>INFO</span>
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-[#202735] bg-[#11151D] p-5 transition-all hover:border-[#80D8FF]/40 shadow-sm space-y-3.5">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[#80D8FF] bg-[#080A0F] px-2 py-0.5 rounded border border-[#202735]">
            {finding.id}
          </span>
          {getSeverityBadge(finding.severity)}
          <span className="text-[11px] font-mono text-[#717C8D] uppercase tracking-wider">
            {finding.category}
          </span>
        </div>

        {finding.verified ? (
          <span className="badge-verified flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>REMEDIATION VERIFIED</span>
          </span>
        ) : (
          <span className="text-[10px] font-mono text-[#F0B86A] bg-[#080A0F] px-2 py-0.5 rounded border border-[#F0B86A]/20">
            UNRESOLVED
          </span>
        )}
      </div>

      {/* Title & Description */}
      <div>
        <h4 className="font-display font-semibold text-base text-[#F0F2F5] mb-1">
          {finding.title}
        </h4>
        <p className="text-xs text-[#A4ADBB] leading-relaxed">
          {finding.description}
        </p>
      </div>

      {/* Code Snippet / Evidence */}
      {finding.evidence && (
        <div className="rounded-lg bg-[#080A0F] border border-[#202735] p-3 text-xs font-mono space-y-1.5">
          <div className="flex items-center justify-between text-[#717C8D] pb-1.5 border-b border-[#202735]/70 text-[11px]">
            <span className="text-[#80D8FF] flex items-center gap-1.5 truncate">
              <FileSearch className="w-3.5 h-3.5 shrink-0" />
              <span>{finding.file_path} {finding.line_number && `(Line ${finding.line_number})`}</span>
            </span>
            <span className="uppercase text-[10px] tracking-wider shrink-0 ml-2">
              {finding.detection_method}
            </span>
          </div>
          <code className="text-[#FF7777] block font-mono overflow-x-auto whitespace-pre pt-0.5">
            {finding.evidence}
          </code>
        </div>
      )}

      {/* AI Diagnostic Hypothesis if available */}
      {finding.ai_hypothesis && (
        <div className="p-3 rounded-lg bg-[#171D27]/60 border border-[#202735] text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[#F0B86A] font-medium mb-1">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>AI Root Cause Hypothesis</span>
          </div>
          <p className="text-[#A4ADBB] leading-relaxed text-[11px]">
            {finding.ai_hypothesis}
          </p>
        </div>
      )}

      {/* Recommended Action */}
      <div className="flex items-start gap-2 pt-2 border-t border-[#202735] text-xs">
        <span className="font-mono text-[#68F0D0] font-semibold whitespace-nowrap">
          Action:
        </span>
        <span className="text-[#F0F2F5] leading-relaxed">
          {finding.recommended_action}
        </span>
      </div>
    </div>
  );
}
