'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Play,
  RefreshCw,
  FolderSearch,
  CheckCircle2,
  Clock,
  Plus,
  GitPullRequest
} from 'lucide-react';

export default function DashboardOverview() {
  const router = useRouter();
  const formRef = useRef(null);
  const [investigations, setInvestigations] = useState([]);
  const [sampleRepos, setSampleRepos] = useState([]);
  const [selectedSample, setSelectedSample] = useState('sample-pyvault');
  const [repoInput, setRepoInput] = useState('');
  const [launching, setLaunching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchTelemetry = async () => {
    try {
      const invRes = await fetch('/api/backend/investigations').catch(() =>
        fetch('http://127.0.0.1:8000/api/investigations')
      );
      if (invRes.ok) setInvestigations((await invRes.json()) || []);

      const sampleRes = await fetch('/api/backend/sample-repos').catch(() =>
        fetch('http://127.0.0.1:8000/api/sample-repos')
      );
      if (sampleRes.ok) setSampleRepos((await sampleRes.json()) || []);
    } catch {}
  };

  useEffect(() => {
    fetchTelemetry();
    const iv = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(iv);
  }, []);

  const launchInvestigation = async (source, type = 'sample') => {
    if (!source) return;
    setLaunching(true);
    setErrorMsg('');
    try {
      let res;
      try {
        res = await fetch('/api/backend/investigations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo_source: source, source_type: type, run_auto_verification: true }),
        });
      } catch {
        res = await fetch('http://127.0.0.1:8000/api/investigations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo_source: source, source_type: type, run_auto_verification: true }),
        });
      }
      if (res.ok) {
        const data = await res.json();
        router.push(`/app/investigations/${data.id}`);
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || 'Failed to start investigation.');
      }
    } catch (e) {
      setErrorMsg(`Connection error: ${e.message}`);
    } finally {
      setLaunching(false);
    }
  };

  const verifiedCount = investigations.filter((i) => i.resurrection_verified).length;
  const totalFindings = investigations.reduce((a, i) => a + (i.findings?.length || 0), 0);
  
  // Pending patch approvals count
  const pendingPatches = useMemo(() => {
    const list = [];
    investigations.forEach((inv) => {
      (inv.patches || []).forEach((p) => {
        if (p.status === 'proposed' || p.status === 'pending') {
          list.push({ ...p, repoName: inv.repo_name, invId: inv.id });
        }
      });
    });
    return list;
  }, [investigations]);

  const scrollToLaunch = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-[#F1F3F6] tracking-tight mb-1">
            Workspace Overview
          </h1>
          <p className="text-xs font-mono text-[#6F7888]">
            Active repository investigations, detected rot, and verified repairs.
          </p>
        </div>

        <button
          onClick={scrollToLaunch}
          className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 font-mono self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Investigation</span>
        </button>
      </div>

      {/* 2. Summary Metrics (Restrained horizontal metrics row) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-[#131720] border border-[#242B38] text-xs font-mono">
        <div className="p-3 border-b sm:border-b-0 sm:border-r border-[#242B38]">
          <span className="text-[#6F7888] uppercase tracking-wider text-[10px] block mb-1">
            Total Investigations
          </span>
          <span className="font-display font-bold text-2xl text-[#F1F3F6]">
            {investigations.length}
          </span>
        </div>

        <div className="p-3 border-b sm:border-b-0 lg:border-r border-[#242B38]">
          <span className="text-[#6F7888] uppercase tracking-wider text-[10px] block mb-1">
            Issues Detected
          </span>
          <span className="font-display font-bold text-2xl text-[#E8B968]">
            {totalFindings}
          </span>
        </div>

        <div className="p-3 border-b sm:border-b-0 sm:border-r border-[#242B38]">
          <span className="text-[#6F7888] uppercase tracking-wider text-[10px] block mb-1">
            Patches Awaiting Approval
          </span>
          <span className="font-display font-bold text-2xl text-[#91BDF7]">
            {pendingPatches.length}
          </span>
        </div>

        <div className="p-3">
          <span className="text-[#6F7888] uppercase tracking-wider text-[10px] block mb-1">
            Verified Repairs
          </span>
          <span className="font-display font-bold text-2xl text-[#65C995]">
            {verifiedCount}
          </span>
        </div>
      </div>

      {/* 3. Pending Actions (Only shown when pending approvals exist) */}
      {pendingPatches.length > 0 && (
        <div className="p-4 rounded-xl bg-[#191F2A] border border-[#E8B968]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <GitPullRequest className="w-4 h-4 text-[#E8B968] shrink-0" />
            <div>
              <span className="text-[#F1F3F6] font-semibold block">
                {pendingPatches.length} {pendingPatches.length === 1 ? 'patch' : 'patches'} awaiting developer review
              </span>
              <span className="text-[#A0A8B6] text-[11px]">
                Requires human sign-off before applying and verifying in sandbox.
              </span>
            </div>
          </div>
          <Link
            href={`/app/investigations/${pendingPatches[0].invId}?tab=patches`}
            className="btn-outline-teal text-xs py-1.5 px-3 whitespace-nowrap self-start sm:self-auto"
          >
            Review Pending Patches
          </Link>
        </div>
      )}

      {/* 4. Launch Form */}
      <div ref={formRef} className="p-5 sm:p-6 rounded-xl bg-[#131720] border border-[#242B38] space-y-4">
        <div>
          <h2 className="font-mono text-xs uppercase tracking-wider text-[#A0A8B6] font-semibold mb-1 flex items-center gap-2">
            <FolderSearch className="w-4 h-4 text-[#72E6CE]" />
            <span>Launch New Investigation</span>
          </h2>
          <p className="text-xs text-[#6F7888]">
            Select a built-in abandoned repository benchmark or provide a Git HTTPS URL.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-[#ED7777]/10 border border-[#ED7777]/30 text-xs text-[#ED7777] font-mono">
            {errorMsg}
          </div>
        )}

        {/* Sample selector chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sampleRepos.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSample(s.id)}
              className={`text-left p-3.5 rounded-lg border cursor-pointer transition-all ${
                selectedSample === s.id
                  ? 'bg-[#191F2A] border-[#72E6CE]'
                  : 'bg-[#0B0D12] border-[#242B38] hover:border-[#6F7888]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-bold text-[#91BDF7]">{s.name}</span>
                <span className="text-[10px] font-mono text-[#E8B968]">Since {s.abandoned_since}</span>
              </div>
              <p className="text-xs text-[#A0A8B6] leading-relaxed mb-1.5">{s.description}</p>
              <span className="text-[10px] font-mono text-[#6F7888]">Rot: {s.decay_types?.join(', ')}</span>
            </button>
          ))}
        </div>

        {/* Action button & custom URL */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <button
            onClick={() => launchInvestigation(selectedSample, 'sample')}
            disabled={launching}
            className="btn-primary w-full sm:w-auto text-xs py-2.5 px-4 font-mono flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {launching ? (
              <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Launching…</span></>
            ) : (
              <><Play className="w-3.5 h-3.5" /><span>Resurrect {selectedSample}</span></>
            )}
          </button>

          <span className="text-xs font-mono text-[#6F7888]">or</span>

          <div className="flex-1 w-full flex items-center gap-2 p-1.5 rounded-lg bg-[#0B0D12] border border-[#242B38] focus-within:border-[#72E6CE] transition-colors">
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="https://github.com/owner/abandoned-repo.git"
              className="bg-transparent outline-none px-2.5 py-1 text-xs font-mono text-[#F1F3F6] placeholder-[#6F7888] w-full"
            />
            <button
              onClick={() => launchInvestigation(repoInput, repoInput.startsWith('http') ? 'git' : 'local')}
              disabled={launching || !repoInput.trim()}
              className="btn-secondary text-xs py-1.5 px-3 font-mono shrink-0 cursor-pointer disabled:opacity-50"
            >
              Analyze
            </button>
          </div>
        </div>
      </div>

      {/* 5. Recent Investigations Data Table */}
      <div className="rounded-xl bg-[#131720] border border-[#242B38] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#242B38] bg-[#0E1117] flex items-center justify-between">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#F1F3F6]">
            Recent Investigations
          </h3>
          <span className="text-[10px] font-mono text-[#6F7888]">Live Polling</span>
        </div>

        {investigations.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-[#6F7888]">
            No investigations yet. Launch a sample above to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0B0D12]/50 text-[#6F7888] text-[10px] uppercase border-b border-[#242B38]">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Repository</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 font-medium">Findings</th>
                  <th className="px-5 py-2.5 font-medium">Created</th>
                  <th className="px-5 py-2.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242B38]">
                {investigations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#191F2A]/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#91BDF7]">{inv.id}</span>
                        <span className="text-[#F1F3F6] font-semibold">{inv.repo_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {inv.resurrection_verified ? (
                        <span className="badge-verified">RESURRECTED</span>
                      ) : inv.status === 'completed' ? (
                        <span className="badge-warning">ANALYZED</span>
                      ) : inv.status === 'cancelled' ? (
                        <span className="badge-critical">CANCELLED</span>
                      ) : (
                        <span className="badge-spectral uppercase">{inv.status}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[#A0A8B6]">
                      {inv.findings?.length || 0} issues
                    </td>
                    <td className="px-5 py-3.5 text-[#6F7888] text-[11px]">
                      {inv.created_at}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/app/investigations/${inv.id}`}
                        className="btn-outline-teal text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
