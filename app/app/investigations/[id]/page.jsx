'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import StageStepper from '../../../../components/StageStepper';
import EvidenceCard from '../../../../components/EvidenceCard';
import DiffViewer from '../../../../components/DiffViewer';
import {
  ArrowLeft,
  ShieldCheck,
  Play,
  Download,
  Terminal,
  CheckCircle2,
  XCircle,
  FileCode,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  GitBranch,
  Clock,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export default function InvestigationDetailPage() {
  const params = useParams();
  const id = params?.id;

  const [report, setReport] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFilePatch, setSelectedFilePatch] = useState(0);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const fetchInvestigation = useCallback(async () => {
    if (!id) return;
    try {
      let res = await fetch(`/api/backend/investigations/${id}`).catch(() => null);
      if (!res || !res.ok) {
        res = await fetch(`http://127.0.0.1:8000/api/investigations/${id}`).catch(() => null);
      }
      if (res && res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch {
      // Ignore poll error
    }
  }, [id]);

  useEffect(() => {
    fetchInvestigation();
    const interval = setInterval(fetchInvestigation, 2500);
    return () => clearInterval(interval);
  }, [fetchInvestigation]);

  const handleCopyId = () => {
    if (!report?.id) return;
    navigator.clipboard.writeText(report.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1800);
  };

  const handleApprovePatch = async (patchId) => {
    setActionLoading(true);
    try {
      await fetch(`/api/backend/investigations/${id}/patch/approve?patch_id=${patchId}`, {
        method: 'POST',
      }).catch(() =>
        fetch(`http://127.0.0.1:8000/api/investigations/${id}/patch/approve?patch_id=${patchId}`, {
          method: 'POST',
        })
      );
      await fetchInvestigation();
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPatch = async (patchId) => {
    setActionLoading(true);
    try {
      await fetch(`/api/backend/investigations/${id}/patch/reject?patch_id=${patchId}`, {
        method: 'POST',
      }).catch(() =>
        fetch(`http://127.0.0.1:8000/api/investigations/${id}/patch/reject?patch_id=${patchId}`, {
          method: 'POST',
        })
      );
      await fetchInvestigation();
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerVerify = async () => {
    setActionLoading(true);
    try {
      await fetch(`/api/backend/investigations/${id}/verify`, { method: 'POST' }).catch(() =>
        fetch(`http://127.0.0.1:8000/api/investigations/${id}/verify`, { method: 'POST' })
      );
      await fetchInvestigation();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelInvestigation = async () => {
    if (!confirm('Are you sure you want to cancel this investigation?')) return;
    setActionLoading(true);
    try {
      await fetch(`/api/backend/investigations/${id}/cancel`, { method: 'POST' }).catch(() =>
        fetch(`http://127.0.0.1:8000/api/investigations/${id}/cancel`, { method: 'POST' })
      );
      await fetchInvestigation();
    } finally {
      setActionLoading(false);
    }
  };

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] text-center">
        <RefreshCw className="w-6 h-6 text-[#68F0D0] animate-spin mb-3" />
        <h3 className="font-mono text-sm text-[#F0F2F5] font-semibold mb-1">
          Loading Forensic Telemetry...
        </h3>
        <p className="text-xs font-mono text-[#717C8D]">
          Connecting to sandbox workspace for <span className="text-[#80D8FF]">{id}</span>
        </p>
      </div>
    );
  }

  const filteredFindings = report.findings?.filter((f) => {
    if (severityFilter === 'all') return true;
    return f.severity?.toLowerCase() === severityFilter;
  }) || [];

  const currentPatch = report.patches?.[selectedFilePatch] || null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="rounded-xl bg-[#11151D] border border-[#202735] p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <Link
              href="/app/investigations"
              className="mt-0.5 p-2 rounded-lg bg-[#080A0F] border border-[#202735] text-[#A4ADBB] hover:text-[#68F0D0] hover:border-[#68F0D0]/40 transition-colors"
              title="Return to Directory"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-display font-bold text-xl sm:text-2xl text-[#F0F2F5] tracking-tight">
                  {report.repo_name}
                </h1>
                {report.resurrection_verified ? (
                  <span className="badge-verified">RESURRECTED & VERIFIED</span>
                ) : report.status === 'cancelled' ? (
                  <span className="badge-critical uppercase">CANCELLED</span>
                ) : report.status === 'completed' ? (
                  <span className="badge-verified uppercase">COMPLETED</span>
                ) : (
                  <span className="badge-spectral uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#68F0D0] animate-pulse" />
                    {report.status}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs font-mono text-[#717C8D] flex-wrap">
                <span className="flex items-center gap-1">
                  ID: <code className="text-[#80D8FF] font-semibold">{report.id}</code>
                  <button
                    onClick={handleCopyId}
                    className="p-1 hover:text-[#F0F2F5] transition-colors"
                    title="Copy ID"
                  >
                    {copiedId ? <Check className="w-3 h-3 text-[#69D99A]" /> : <Copy className="w-3 h-3" />}
                  </button>
                </span>
                <span>•</span>
                <span>Created {report.created_at}</span>
                <span>•</span>
                <Link
                  href={`/app/explorer?inv=${report.id}`}
                  className="text-[#68F0D0] hover:underline flex items-center gap-1"
                >
                  <span>Browse Files</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {!['completed', 'failed', 'cancelled'].includes(report.status) && (
              <button
                onClick={handleCancelInvestigation}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-lg bg-[#FF7777]/10 hover:bg-[#FF7777]/20 border border-[#FF7777]/30 text-[#FF7777] text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel Run</span>
              </button>
            )}
            <a
              href={`/api/backend/investigations/${id}/export/markdown`}
              className="btn-secondary text-xs py-1.5 px-3 font-mono flex items-center gap-1.5"
              download
            >
              <Download className="w-3.5 h-3.5" />
              <span>Report (.md)</span>
            </a>
            <a
              href={`/api/backend/investigations/${id}/export/patch`}
              className="btn-outline-teal text-xs py-1.5 px-3 font-mono flex items-center gap-1.5"
              download
            >
              <Download className="w-3.5 h-3.5" />
              <span>Patch (.patch)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Stage Stepper Pipeline */}
      <StageStepper
        currentStage={report.status}
        isCompleted={report.status === 'completed'}
        isFailed={report.status === 'failed'}
      />

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-[#202735] pb-px overflow-x-auto text-xs font-mono">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'findings', label: `Findings (${report.findings?.length || 0})` },
          { key: 'patches', label: `Code Changes (${report.patches?.length || 0})` },
          { key: 'tests', label: 'Test Telemetry' },
          { key: 'timeline', label: `Event Log (${report.timeline?.length || 0})` },
          { key: 'report', label: 'Certificate' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 font-medium whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
              activeTab === tab.key
                ? 'border-[#68F0D0] text-[#68F0D0] bg-[#11151D]/60'
                : 'border-transparent text-[#A4ADBB] hover:text-[#F0F2F5]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="p-6 rounded-xl bg-[#11151D] border border-[#202735] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#202735]">
              <h3 className="font-mono text-xs uppercase tracking-wider text-[#A4ADBB] font-semibold">
                Executive Forensic Summary
              </h3>
              <span className="text-[11px] font-mono text-[#717C8D]">
                Duration: <strong className="text-[#F0F2F5]">{report.total_duration_seconds}s</strong>
              </span>
            </div>

            <p className="text-sm text-[#F0F2F5] leading-relaxed">
              {report.summary || 'Investigation initialized. Telemetry will update in real-time.'}
            </p>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#080A0F] border border-[#202735]">
                <span className="text-[#717C8D] block text-[10px] uppercase mb-1">Health Score</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#FF7777] font-bold">{report.health_score_before}</span>
                  <span className="text-[#717C8D]">→</span>
                  <span className="text-[#69D99A] font-bold text-sm">{report.health_score_after}/100</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#080A0F] border border-[#202735]">
                <span className="text-[#717C8D] block text-[10px] uppercase mb-1">Files Inspected</span>
                <span className="text-[#F0F2F5] font-bold text-sm">{report.files_inspected || 0}</span>
              </div>

              <div className="p-3 rounded-lg bg-[#080A0F] border border-[#202735]">
                <span className="text-[#717C8D] block text-[10px] uppercase mb-1">Lines of Code</span>
                <span className="text-[#F0F2F5] font-bold text-sm">{report.lines_of_code || 0}</span>
              </div>

              <div className="p-3 rounded-lg bg-[#080A0F] border border-[#202735]">
                <span className="text-[#717C8D] block text-[10px] uppercase mb-1">Rot Findings</span>
                <span className="text-[#80D8FF] font-bold text-sm">{report.findings?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Languages & Dependencies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-[#11151D] border border-[#202735]">
              <h4 className="font-mono text-xs uppercase tracking-wider text-[#A4ADBB] mb-3 font-semibold">
                Detected Languages
              </h4>
              <div className="flex flex-wrap gap-2">
                {report.detected_languages?.length > 0 ? (
                  report.detected_languages.map((lang) => (
                    <span
                      key={lang}
                      className="px-2.5 py-1 rounded bg-[#080A0F] text-xs font-mono text-[#80D8FF] border border-[#202735]"
                    >
                      {lang}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#717C8D] font-mono">Scanning languages...</span>
                )}
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#11151D] border border-[#202735]">
              <h4 className="font-mono text-xs uppercase tracking-wider text-[#A4ADBB] mb-3 font-semibold">
                Manifest Dependencies
              </h4>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {report.dependencies?.length > 0 ? (
                  report.dependencies.map((dep) => (
                    <span
                      key={dep}
                      className="px-2 py-0.5 rounded bg-[#080A0F] text-[11px] font-mono text-[#A4ADBB] border border-[#202735]"
                    >
                      {dep}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#717C8D] font-mono">No external dependencies detected.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FINDINGS */}
      {activeTab === 'findings' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-[#11151D] border border-[#202735] text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-[#717C8D] mr-1">Severity:</span>
              {['all', 'critical', 'warning', 'info'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded cursor-pointer uppercase transition-colors text-[11px] font-semibold ${
                    severityFilter === sev
                      ? 'bg-[#171D27] text-[#68F0D0] border border-[#68F0D0]'
                      : 'text-[#A4ADBB] hover:text-[#F0F2F5]'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
            <span className="text-[#717C8D]">
              Showing {filteredFindings.length} of {report.findings?.length || 0} findings
            </span>
          </div>

          {/* Finding Cards List */}
          {filteredFindings.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-[#717C8D] bg-[#11151D] rounded-xl border border-[#202735]">
              No findings match the selected filter.
            </div>
          ) : (
            filteredFindings.map((finding) => (
              <EvidenceCard key={finding.id} finding={finding} />
            ))
          )}
        </div>
      )}

      {/* TAB 3: CODE CHANGES & UNIFIED DIFFS */}
      {activeTab === 'patches' && (
        <div className="space-y-4">
          {report.patches?.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-[#717C8D] bg-[#11151D] rounded-xl border border-[#202735]">
              No code patches proposed yet.
            </div>
          ) : (
            <>
              {/* File Selection Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto text-xs font-mono pb-1">
                {report.patches.map((patch, idx) => (
                  <button
                    key={patch.id}
                    onClick={() => setSelectedFilePatch(idx)}
                    className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                      selectedFilePatch === idx
                        ? 'bg-[#171D27] border-[#68F0D0] text-[#FFFFFF]'
                        : 'bg-[#11151D] border-[#202735] text-[#A4ADBB] hover:text-[#F0F2F5]'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-[#80D8FF]" />
                    <span>{patch.file_path}</span>
                    <span className="text-[10px] text-[#717C8D]">({patch.id})</span>
                  </button>
                ))}
              </div>

              {/* Active Patch Details & Action Bar */}
              {currentPatch && (
                <div className="p-5 rounded-xl bg-[#11151D] border border-[#202735] space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#202735]">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-[#80D8FF]">
                          {currentPatch.id}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#080A0F] text-[#A4ADBB] border border-[#202735]">
                          STATUS: {currentPatch.status?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-[#A4ADBB]">
                        {currentPatch.rationale}
                      </p>
                    </div>

                    {/* Developer Approval Buttons */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        onClick={() => handleApprovePatch(currentPatch.id)}
                        disabled={actionLoading || currentPatch.status === 'approved'}
                        className="btn-outline-teal text-xs py-1.5 px-3 font-mono flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Patch</span>
                      </button>
                      <button
                        onClick={() => handleRejectPatch(currentPatch.id)}
                        disabled={actionLoading || currentPatch.status === 'rejected'}
                        className="btn-secondary text-xs py-1.5 px-3 font-mono text-[#FF7777] flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={handleTriggerVerify}
                        disabled={actionLoading}
                        className="btn-primary text-xs py-1.5 px-3 font-mono flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Verify in Sandbox</span>
                      </button>
                    </div>
                  </div>

                  {/* Unified Diff Viewer */}
                  <DiffViewer
                    unifiedDiff={currentPatch.unified_diff}
                    filePath={currentPatch.file_path}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 4: TEST RESULTS */}
      {activeTab === 'tests' && (
        <div className="space-y-5">
          {/* Baseline Verification */}
          <div className="rounded-xl bg-[#11151D] border border-[#202735] overflow-hidden">
            <div className="p-4 bg-[#171D27]/50 border-b border-[#202735] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#F0B86A]" />
                <h4 className="font-mono text-xs uppercase font-semibold text-[#F0F2F5]">
                  Stage 4: Baseline Pre-Patch Test Execution
                </h4>
              </div>
              {report.baseline_verification && (
                <span className={report.baseline_verification.passed ? 'badge-verified' : 'badge-critical'}>
                  {report.baseline_verification.passed ? 'PASSED' : 'BASELINE ROT DETECTED'}
                </span>
              )}
            </div>

            <div className="p-5 space-y-3">
              {report.baseline_verification ? (
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 rounded-lg bg-[#080A0F] border border-[#202735] text-[#A4ADBB]">
                    Command: <code className="text-[#80D8FF]">{report.baseline_verification.command}</code> • Exit Code: <strong className={report.baseline_verification.exit_code === 0 ? 'text-[#69D99A]' : 'text-[#FF7777]'}>{report.baseline_verification.exit_code}</strong> • Duration: {report.baseline_verification.duration_seconds}s
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#080A0F] border border-[#202735] max-h-60 overflow-y-auto text-[11px] whitespace-pre text-[#A4ADBB]">
                    {report.baseline_verification.stdout || report.baseline_verification.stderr || 'No output recorded.'}
                  </div>
                </div>
              ) : (
                <p className="text-xs font-mono text-[#717C8D]">Baseline test not executed.</p>
              )}
            </div>
          </div>

          {/* Post-Patch Sandbox Verification */}
          <div className="rounded-xl bg-[#11151D] border border-[#202735] overflow-hidden">
            <div className="p-4 bg-[#171D27]/50 border-b border-[#202735] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#69D99A]" />
                <h4 className="font-mono text-xs uppercase font-semibold text-[#F0F2F5]">
                  Stage 7: Post-Patch Sandbox Verification
                </h4>
              </div>
              {report.final_verification && (
                <span className={report.final_verification.passed ? 'badge-verified' : 'badge-warning'}>
                  {report.final_verification.passed ? 'VERIFIED (PASS)' : 'UNVERIFIED / FAILING'}
                </span>
              )}
            </div>

            <div className="p-5 space-y-3">
              {report.final_verification ? (
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 rounded-lg bg-[#080A0F] border border-[#202735] text-[#A4ADBB]">
                    Command: <code className="text-[#80D8FF]">{report.final_verification.command}</code> • Exit Code: <strong className="text-[#69D99A]">{report.final_verification.exit_code}</strong> • Tests: {report.final_verification.passed_tests} passed / {report.final_verification.total_tests} total
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#080A0F] border border-[#202735] max-h-60 overflow-y-auto text-[11px] whitespace-pre text-[#69D99A]">
                    {report.final_verification.stdout || report.final_verification.stderr || 'All tests passed cleanly.'}
                  </div>
                </div>
              ) : (
                <p className="text-xs font-mono text-[#717C8D]">Post-patch verification has not run yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: EVENT TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="p-5 rounded-xl bg-[#11151D] border border-[#202735] space-y-3">
          <div className="pb-3 border-b border-[#202735]">
            <h4 className="font-mono text-xs uppercase font-semibold text-[#A4ADBB]">
              Forensic Execution Audit Trail
            </h4>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {report.timeline?.map((ev, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-[#080A0F] border border-[#202735]">
                <span className="text-[#717C8D] text-[11px] shrink-0 font-semibold">
                  [{ev.timestamp}]
                </span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${
                  ev.level === 'success' ? 'bg-[#69D99A]/10 text-[#69D99A] border border-[#69D99A]/20' :
                  ev.level === 'error' ? 'bg-[#FF7777]/10 text-[#FF7777] border border-[#FF7777]/20' :
                  ev.level === 'warning' ? 'bg-[#F0B86A]/10 text-[#F0B86A] border border-[#F0B86A]/20' :
                  'bg-[#80D8FF]/10 text-[#80D8FF] border border-[#80D8FF]/20'
                }`}>
                  {ev.stage}
                </span>
                <span className="text-[#F0F2F5] leading-relaxed">
                  {ev.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: REPORT */}
      {activeTab === 'report' && (
        <div className="p-6 rounded-xl bg-[#11151D] border border-[#202735] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#202735]">
            <div>
              <h4 className="font-display font-semibold text-base text-[#F0F2F5]">
                Resurrection Certificate
              </h4>
              <p className="text-xs font-mono text-[#717C8D]">
                Exportable evidence dossier backing all automated repair claims.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/api/backend/investigations/${id}/export/markdown`}
                download
                className="btn-primary text-xs py-1.5 px-3 font-mono"
              >
                Download .md
              </a>
              <a
                href={`/api/backend/investigations/${id}/export/json`}
                download
                className="btn-secondary text-xs py-1.5 px-3 font-mono"
              >
                Download .json
              </a>
            </div>
          </div>

          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dots">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
              </div>
              <span className="text-[11px] font-mono text-[#717C8D]">resurrection_certificate.md</span>
            </div>
            <div className="p-4 font-mono text-xs text-[#A4ADBB] whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
              {`# REPOREVENANT RESURRECTION REPORT\nTarget Repository: ${report.repo_name}\nInvestigation ID: ${report.id}\nStatus: ${report.resurrection_verified ? 'RESURRECTED' : 'UNVERIFIED'}\nHealth Score: ${report.health_score_before}/100 -> ${report.health_score_after}/100\nDuration: ${report.total_duration_seconds}s\n\nExecutive Summary:\n${report.summary}\n\nDeterministic Findings:\n${report.findings?.map(f => `- [${f.id}] ${f.category}: ${f.title} (${f.file_path}:${f.line_number || '-'})`).join('\n')}\n\nVerification Telemetry:\nBaseline: ${report.baseline_verification?.summary || 'N/A'}\nPost-Patch: ${report.final_verification?.summary || 'N/A'}`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
