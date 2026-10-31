'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Download, ShieldCheck, ArrowRight, Search, FileCode } from 'lucide-react';

export default function ReportsIndexPage() {
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/backend/investigations')
      .then((r) => r.json())
      .then((data) => setInvestigations(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-[#F0F2F5] tracking-tight mb-1">
          Resurrection Reports & Certificates
        </h1>
        <p className="text-xs font-mono text-[#717C8D]">
          Evidence-backed archival certificates, Markdown reports, JSON exports, and Git unified patches.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-[#717C8D] bg-[#11151D] rounded-xl border border-[#202735]">
          Loading reports archive...
        </div>
      ) : investigations.length === 0 ? (
        <div className="p-12 text-center text-xs font-mono text-[#717C8D] bg-[#11151D] rounded-xl border border-[#202735]">
          No reports generated yet. Launch an investigation to generate documentation.
        </div>
      ) : (
        <div className="space-y-4">
          {investigations.map((inv) => (
            <div
              key={inv.id}
              className="p-5 rounded-xl bg-[#11151D] border border-[#202735] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <FileText className="w-4 h-4 text-[#68F0D0]" />
                  <span className="font-mono text-sm font-bold text-[#F0F2F5]">{inv.repo_name}</span>
                  <span className="text-xs font-mono text-[#717C8D]">({inv.id})</span>
                  {inv.resurrection_verified ? (
                    <span className="badge-verified">RESURRECTED</span>
                  ) : (
                    <span className="badge-spectral uppercase">{inv.status}</span>
                  )}
                </div>
                <p className="text-xs text-[#A4ADBB] max-w-2xl">
                  {inv.summary || 'Investigation completed with telemetry recorded.'}
                </p>
              </div>

              {/* Download actions */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <a
                  href={`/api/backend/investigations/${inv.id}/export/markdown`}
                  download
                  className="btn-primary text-xs py-1.5 px-3 font-mono flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.md</span>
                </a>
                <a
                  href={`/api/backend/investigations/${inv.id}/export/json`}
                  download
                  className="btn-secondary text-xs py-1.5 px-3 font-mono flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.json</span>
                </a>
                <a
                  href={`/api/backend/investigations/${inv.id}/export/patch`}
                  download
                  className="btn-outline-teal text-xs py-1.5 px-3 font-mono flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.patch</span>
                </a>
                <Link
                  href={`/app/investigations/${inv.id}`}
                  className="p-2 rounded-lg bg-[#080A0F] border border-[#202735] text-[#A4ADBB] hover:text-[#F0F2F5] transition-colors"
                  title="View investigation dossier"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
