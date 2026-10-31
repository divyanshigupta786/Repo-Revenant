'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Terminal, AlertTriangle, CheckCircle2, Clock, Lock, ArrowRight } from 'lucide-react';

export default function VerificationMonitorPage() {
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
          Sandbox Verification Monitor
        </h1>
        <p className="text-xs font-mono text-[#717C8D]">
          Isolated subprocess execution environments, test logs, exit codes, and regression tracking.
        </p>
      </div>

      {/* Security Principles Banner */}
      <div className="p-5 rounded-xl bg-[#11151D] border border-[#202735] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[#080A0F] border border-[#202735] text-[#68F0D0] shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[#F0F2F5] font-semibold block mb-1">Environment Scrubbing</span>
            <p className="text-[#A4ADBB] text-[11px] leading-relaxed">
              All credentials, API keys, and sensitive environment variables are stripped prior to executing subprocess test runners.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[#080A0F] border border-[#202735] text-[#80D8FF] shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[#F0F2F5] font-semibold block mb-1">Strict Timeout Bounds</span>
            <p className="text-[#A4ADBB] text-[11px] leading-relaxed">
              Every sandbox run is strictly limited to 30 seconds to prevent resource exhaustion, infinite loops, or hanging workers.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[#080A0F] border border-[#202735] text-[#69D99A] shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[#F0F2F5] font-semibold block mb-1">Ephemeral Temp Sandboxes</span>
            <p className="text-[#A4ADBB] text-[11px] leading-relaxed">
              Target code executes in ephemeral temporary directories (<code className="text-[#80D8FF]">tempfile.mkdtemp</code>) and is fully destroyed after execution.
            </p>
          </div>
        </div>
      </div>

      {/* Verification Logs Table */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-[#717C8D] bg-[#11151D] rounded-xl border border-[#202735]">
            Loading verification telemetry...
          </div>
        ) : investigations.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-[#717C8D] bg-[#11151D] rounded-xl border border-[#202735]">
            No verification sessions recorded yet. Launch an investigation to view test telemetry.
          </div>
        ) : (
          investigations.map((inv) => (
            <div key={inv.id} className="p-5 rounded-xl bg-[#11151D] border border-[#202735] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#202735]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-[#80D8FF]">{inv.repo_name}</span>
                  <span className="text-xs font-mono text-[#717C8D]">({inv.id})</span>
                  <span className={inv.resurrection_verified ? 'badge-verified' : 'badge-warning'}>
                    {inv.resurrection_verified ? 'POST-PATCH TEST PASSED' : 'UNVERIFIED / PENDING'}
                  </span>
                </div>

                <Link
                  href={`/app/investigations/${inv.id}`}
                  className="text-xs font-mono text-[#68F0D0] hover:underline flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>Investigation Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                {/* Baseline Box */}
                <div className="p-3.5 rounded-lg bg-[#080A0F] border border-[#202735] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#F0B86A] font-semibold flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Baseline Test (Pre-Patch)</span>
                    </span>
                    <span className="text-[10px] text-[#717C8D]">
                      Exit: <strong className={inv.baseline_verification?.exit_code === 0 ? 'text-[#69D99A]' : 'text-[#FF7777]'}>{inv.baseline_verification?.exit_code ?? 'N/A'}</strong>
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A4ADBB]">
                    {inv.baseline_verification?.summary || 'Not executed'}
                  </p>
                </div>

                {/* Final Post-Patch Box */}
                <div className="p-3.5 rounded-lg bg-[#080A0F] border border-[#202735] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#69D99A] font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Sandbox Test (Post-Patch)</span>
                    </span>
                    <span className="text-[10px] text-[#717C8D]">
                      Exit: <strong className="text-[#69D99A]">{inv.final_verification?.exit_code ?? 'N/A'}</strong>
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A4ADBB]">
                    {inv.final_verification?.summary || 'Not executed'}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
