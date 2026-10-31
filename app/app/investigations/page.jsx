'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Layers, ArrowRight, FolderSearch, RefreshCw, Search, Plus, Filter } from 'lucide-react';

const ACTIVE_STATUSES = new Set([
  'queued',
  'running',
  'inspecting',
  'analyzing',
  'running_baseline',
  'diagnosing',
  'proposing_patch',
  'awaiting_approval',
  'applying_patch',
  'verifying'
]);

function StatusBadge({ inv }) {
  if (inv.resurrection_verified) return <span className="badge-verified">RESURRECTED</span>;
  if (inv.status === 'cancelled') return <span className="badge-critical">CANCELLED</span>;
  if (inv.status === 'complete' || inv.status === 'completed') return <span className="badge-verified">COMPLETE</span>;
  if (ACTIVE_STATUSES.has(inv.status?.toLowerCase())) {
    return (
      <span className="badge-spectral flex items-center gap-1">
        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
        {inv.status?.toUpperCase()}
      </span>
    );
  }
  return <span className="badge-spectral uppercase">{inv.status}</span>;
}

export default function InvestigationsPage() {
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchInvestigations = useCallback(() => {
    fetch('/api/backend/investigations')
      .then((r) => r.json())
      .then((data) => {
        setInvestigations(data || []);
        setLoading(false);
      })
      .catch(() => {
        fetch('http://127.0.0.1:8000/api/investigations')
          .then((r) => r.json())
          .then((d) => setInvestigations(d || []))
          .finally(() => setLoading(false));
      });
  }, []);

  useEffect(() => {
    fetchInvestigations();
    const interval = setInterval(() => {
      setInvestigations((prev) => {
        const hasActive = prev.some((i) => ACTIVE_STATUSES.has(i.status?.toLowerCase()));
        if (hasActive) fetchInvestigations();
        return prev;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [fetchInvestigations]);

  const resurrected = investigations.filter((i) => i.resurrection_verified).length;
  const active = investigations.filter((i) => ACTIVE_STATUSES.has(i.status?.toLowerCase())).length;
  const cancelled = investigations.filter((i) => i.status === 'cancelled').length;

  const filtered = useMemo(() => {
    return investigations.filter((inv) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        inv.id?.toLowerCase().includes(q) ||
        inv.repo_name?.toLowerCase().includes(q) ||
        inv.status?.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'resurrected') return inv.resurrection_verified;
      if (statusFilter === 'active') return ACTIVE_STATUSES.has(inv.status?.toLowerCase());
      if (statusFilter === 'cancelled') return inv.status === 'cancelled';
      return true;
    });
  }, [investigations, searchQuery, statusFilter]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-[#F0F2F5] tracking-tight mb-1">
            Forensic Investigations Directory
          </h1>
          <p className="text-xs font-mono text-[#717C8D]">
            Historical archives, active pipelines, and evidence dossiers.
          </p>
        </div>
        <Link href="/app" className="btn-primary text-xs font-mono py-2 px-3.5 flex items-center gap-1.5 self-start sm:self-auto">
          <Plus className="w-3.5 h-3.5" />
          <span>Launch Investigation</span>
        </Link>
      </div>

      {/* Summary KPI row */}
      {investigations.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          {[
            { label: 'Total Dossiers', value: investigations.length, color: '#F0F2F5' },
            { label: 'Resurrected', value: resurrected, color: '#69D99A' },
            { label: 'Active Pipeline', value: active, color: '#68F0D0' },
            { label: 'Cancelled', value: cancelled, color: '#FF7777' },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-3.5 rounded-lg bg-[#11151D] border border-[#202735]">
              <span className="text-[#717C8D] text-[10px] uppercase block mb-1">{label}</span>
              <span style={{ color }} className="font-bold text-lg">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-xl bg-[#11151D] border border-[#202735] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-[#717C8D] shrink-0" />
          <input
            type="text"
            placeholder="Search by repository name, ID, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-[#F0F2F5] placeholder-[#717C8D]"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: `Active (${active})` },
            { id: 'resurrected', label: `Resurrected (${resurrected})` },
            { id: 'cancelled', label: `Cancelled (${cancelled})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#171D27] text-[#68F0D0] border border-[#68F0D0]'
                  : 'text-[#A4ADBB] hover:text-[#F0F2F5]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Investigations Table / List */}
      <div className="rounded-xl bg-[#11151D] border border-[#202735] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-[#717C8D] flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#68F0D0]" />
            <span>Scanning forensic archives...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Layers className="w-8 h-8 text-[#293140] mx-auto" />
            <p className="text-xs font-mono text-[#717C8D]">
              {investigations.length === 0
                ? 'No investigations recorded yet. Click Launch Investigation to begin.'
                : 'No investigations match your filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#202735] text-xs font-mono">
            {filtered.map((inv) => (
              <div
                key={inv.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#171D27]/40 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-[#80D8FF]">{inv.id}</span>
                    <span className="font-semibold text-[#F0F2F5] text-sm">{inv.repo_name}</span>
                    <StatusBadge inv={inv} />
                  </div>
                  <div className="text-[11px] text-[#A4ADBB] flex items-center gap-2 flex-wrap">
                    <span>
                      Health:{' '}
                      <strong className="text-[#FF7777]">{inv.health_score_before}/100</strong>
                      {' → '}
                      <strong className="text-[#69D99A]">{inv.health_score_after}/100</strong>
                    </span>
                    <span>•</span>
                    <span>Findings: <strong className="text-[#F0F2F5]">{inv.findings?.length || 0}</strong></span>
                    <span>•</span>
                    <span>Duration: <strong className="text-[#F0F2F5]">{inv.total_duration_seconds}s</strong></span>
                  </div>
                  <div className="text-[10px] text-[#717C8D]">{inv.created_at}</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/app/explorer?inv=${inv.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#080A0F] hover:bg-[#171D27] border border-[#202735] hover:border-[#68F0D0] text-[#A4ADBB] hover:text-[#68F0D0] transition-all text-xs"
                    title="Open workspace file explorer"
                  >
                    <FolderSearch className="w-3.5 h-3.5" />
                    <span>Explorer</span>
                  </Link>
                  <Link
                    href={`/app/investigations/${inv.id}`}
                    className="btn-outline-teal text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <span>View Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
