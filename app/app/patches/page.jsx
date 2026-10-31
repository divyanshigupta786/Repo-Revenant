'use client';

import React, { useState, useEffect, useMemo } from 'react';
import DiffViewer from '../../../components/DiffViewer';
import { GitPullRequest, CheckCircle2, XCircle, ArrowRight, Search, FileCode } from 'lucide-react';
import Link from 'next/link';

export default function PatchesIndexPage() {
  const [patches, setPatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/backend/investigations')
      .then((r) => r.json())
      .then((invs) => {
        const allP = [];
        (invs || []).forEach((inv) => {
          (inv.patches || []).forEach((p) => {
            allP.push({ ...p, repoName: inv.repo_name, invId: inv.id });
          });
        });
        setPatches(allP);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery) return patches;
    const q = searchQuery.toLowerCase();
    return patches.filter(
      (p) =>
        p.id?.toLowerCase().includes(q) ||
        p.file_path?.toLowerCase().includes(q) ||
        p.repoName?.toLowerCase().includes(q) ||
        p.rationale?.toLowerCase().includes(q)
      );
  }, [patches, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-[#F0F2F5] tracking-tight mb-1">
          Patch Proposals & Code Changes
        </h1>
        <p className="text-xs font-mono text-[#717C8D]">
          Inspect AI synthesized unified diffs, review approval states, and audit proposed file remediations.
        </p>
      </div>

      {/* Search Bar */}
      <div className="p-3 rounded-xl bg-[#11151D] border border-[#202735] flex items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-[#717C8D] shrink-0" />
          <input
            type="text"
            placeholder="Search patches by file path, ID, or repository name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-[#F0F2F5] placeholder-[#717C8D]"
          />
        </div>
        <span className="text-[#717C8D] shrink-0">
          {filtered.length} {filtered.length === 1 ? 'patch' : 'patches'}
        </span>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-[#717C8D] bg-[#11151D] rounded-xl border border-[#202735]">
          Loading patches catalogue...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-xs font-mono text-[#717C8D] bg-[#11151D] rounded-xl border border-[#202735]">
          {patches.length === 0
            ? 'No patches proposed yet. Initiate an investigation to synthesize patches.'
            : 'No patches match your search query.'}
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((p) => (
            <div key={`${p.invId}-${p.id}`} className="p-5 rounded-xl bg-[#11151D] border border-[#202735] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#202735]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#80D8FF]">{p.id}</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#080A0F] text-[#A4ADBB] border border-[#202735]">
                      STATUS: {p.status?.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono text-[#717C8D]">({p.repoName})</span>
                  </div>
                  <p className="text-xs text-[#A4ADBB]">
                    {p.rationale}
                  </p>
                </div>
                <Link
                  href={`/app/investigations/${p.invId}`}
                  className="btn-outline-teal text-xs py-1.5 px-3 font-mono flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                >
                  <span>Open in Investigation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <DiffViewer unifiedDiff={p.unified_diff} filePath={p.file_path} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
