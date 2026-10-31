'use client';

import React, { useState, useEffect, useMemo } from 'react';
import EvidenceCard from '../../../components/EvidenceCard';
import { AlertCircle, Filter, Search, ShieldAlert, Layers } from 'lucide-react';

export default function FindingsIndexPage() {
  const [findings, setFindings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/backend/investigations')
      .then((r) => r.json())
      .then((invs) => {
        const allF = [];
        (invs || []).forEach((inv) => {
          (inv.findings || []).forEach((f) => {
            allF.push({ ...f, repoName: inv.repo_name });
          });
        });
        setFindings(allF);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    return {
      all: findings.length,
      critical: findings.filter((f) => f.severity?.toLowerCase() === 'critical').length,
      warning: findings.filter((f) => f.severity?.toLowerCase() === 'warning').length,
      info: findings.filter((f) => f.severity?.toLowerCase() === 'info').length,
    };
  }, [findings]);

  const filtered = useMemo(() => {
    return findings.filter((f) => {
      const matchFilter = filter === 'all' || f.severity?.toLowerCase() === filter;
      if (!matchFilter) return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        f.id?.toLowerCase().includes(q) ||
        f.title?.toLowerCase().includes(q) ||
        f.file_path?.toLowerCase().includes(q) ||
        f.category?.toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q)
      );
    });
  }, [findings, filter, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-[#F0F2F5] tracking-tight mb-1">
          Aggregated Findings Index
        </h1>
        <p className="text-xs font-mono text-[#717C8D]">
          Comprehensive deterministic AST findings and code rot detected across investigated repositories.
        </p>
      </div>

      {/* Search & Severity Filter Bar */}
      <div className="p-3 rounded-xl bg-[#11151D] border border-[#202735] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-[#717C8D] shrink-0" />
          <input
            type="text"
            placeholder="Search findings by title, file path, ID, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-[#F0F2F5] placeholder-[#717C8D]"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto">
          {[
            { id: 'all', label: `All (${counts.all})` },
            { id: 'critical', label: `Critical (${counts.critical})` },
            { id: 'warning', label: `Warning (${counts.warning})` },
            { id: 'info', label: `Info (${counts.info})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer uppercase ${
                filter === tab.id
                  ? 'bg-[#171D27] text-[#68F0D0] border border-[#68F0D0]'
                  : 'text-[#A4ADBB] hover:text-[#F0F2F5]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Findings List */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-[#717C8D] bg-[#11151D] rounded-xl border border-[#202735]">
          Loading findings index...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center space-y-2 bg-[#11151D] rounded-xl border border-[#202735]">
          <Layers className="w-8 h-8 text-[#293140] mx-auto" />
          <p className="text-xs font-mono text-[#717C8D]">
            {findings.length === 0
              ? 'No findings recorded yet. Launch an investigation to detect AST issues.'
              : 'No findings match the current search or severity filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((f, i) => (
            <EvidenceCard key={`${f.id}-${i}`} finding={f} />
          ))}
        </div>
      )}
    </div>
  );
}
