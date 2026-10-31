'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import ResurrectionCore3D from '../components/ResurrectionCore3D';
import LenisScroll from '../components/LenisScroll';
import {
  ArrowRight,
  Shield,
  FileCheck2,
  Cpu,
  Terminal,
  AlertTriangle,
  CheckCircle,
  Lock,
  Search,
  BookOpen,
  Sparkles,
  Play,
  Download,
  ExternalLink,
  GitBranch,
  Check
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [repoInput, setRepoInput] = useState('sample-pyvault');
  const [launching, setLaunching] = useState(false);
  const [activeTab, setActiveTab] = useState('findings');

  const handleInvestigate = async (e) => {
    e?.preventDefault();
    if (!repoInput.trim()) return;
    setLaunching(true);
    try {
      const isSample = repoInput.startsWith('sample-');
      const res = await fetch('/api/backend/investigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_source: repoInput,
          source_type: isSample ? 'sample' : repoInput.startsWith('http') ? 'git' : 'local',
          run_auto_verification: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/app/investigations/${data.id}`);
      } else {
        router.push('/app');
      }
    } catch {
      router.push('/app');
    }
  };

  return (
    <div className="min-h-screen bg-[#080A0F] archival-grid relative selection:bg-[#68F0D0] selection:text-[#080A0F]">
      <LenisScroll />
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto spectral-glow-radial">
        {/* Eyebrow */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#131720] border border-[#242B38] text-[11px] font-mono text-[#72E6CE] uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-[#72E6CE] animate-pulse" />
            AI-POWERED REPOSITORY RESURRECTION
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-center font-display font-bold text-5xl sm:text-7xl tracking-tight text-[#F1F3F6] mb-6 leading-[1.06]">
          <span className="block">Forgotten code.</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#72E6CE] via-[#91BDF7] to-[#65C995]">
            A second life.
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-center text-base sm:text-lg text-[#A0A8B6] leading-relaxed mb-8 max-w-2xl mx-auto">
          Investigate abandoned repositories, uncover hidden issues, propose targeted repairs, and verify every change with an AI agent that values evidence over assumptions.
        </p>

        {/* Search Bar / Launch */}
        <div className="max-w-2xl mx-auto mb-6">
          <form
            onSubmit={handleInvestigate}
            className="p-2 rounded-xl bg-[#131720] border border-[#242B38] flex flex-col sm:flex-row items-stretch gap-2 shadow-2xl focus-within:border-[#72E6CE] transition-all"
          >
            <div className="flex items-center gap-2.5 px-3 py-2 flex-1">
              <Search className="w-4 h-4 text-[#91BDF7] shrink-0" />
              <input
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="Git HTTPS URL or sample-pyvault..."
                className="bg-transparent outline-none text-[#F1F3F6] placeholder-[#6F7888] w-full text-sm font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={launching}
              className="btn-primary whitespace-nowrap px-6 py-2.5 text-sm font-mono"
            >
              {launching ? 'Launching…' : 'Investigate a repository →'}
            </button>
          </form>

          {/* Quick-fill chips & Explore secondary */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[#6F7888]">Try:</span>
              {[
                { label: '⚡ PyVault (PEP 594)', value: 'sample-pyvault' },
                { label: '⚡ MatrixCalc (ABCs)', value: 'sample-math-matrix' },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setRepoInput(s.value)}
                  className={`px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                    repoInput === s.value
                      ? 'bg-[#191F2A] text-[#72E6CE] border-[#72E6CE]'
                      : 'bg-[#131720] text-[#A0A8B6] border-[#242B38] hover:text-[#F1F3F6]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <Link
              href="/#how-it-works"
              className="text-[#91BDF7] hover:text-[#72E6CE] transition-colors flex items-center gap-1"
            >
              <span>Explore how it works</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Three Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-[#A0A8B6] mb-14">
          {[
            { icon: Shield, label: 'Evidence-first analysis.' },
            { icon: Cpu, label: 'Human-approved patches.' },
            { icon: CheckCircle, label: 'Verifiable results.' },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#131720]/80 border border-[#242B38]">
              <Icon className="w-3.5 h-3.5 text-[#72E6CE]" />
              {label}
            </span>
          ))}
        </div>

        {/* 3D Scene */}
        <div className="max-w-4xl mx-auto">
          <ResurrectionCore3D />
        </div>
      </section>

      {/* ── WHAT IT FIXES ── */}
      <section id="problem" className="py-24 border-t border-[#202735] bg-[#0B0E14]/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-mono uppercase tracking-widest text-[#F0B86A] mb-3 font-semibold">The Bit-Rot Crisis</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#F0F2F5] mb-4">
              Why abandoned code still matters
            </h2>
            <p className="text-[#A4ADBB] max-w-xl mx-auto">
              Libraries stop running not because the logic is wrong — but because Python 3.12 removed APIs, abstract base classes moved, and test runners changed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: AlertTriangle,
                color: '#F0B86A',
                title: 'Stdlib Removals',
                body: 'PEP 594 purged imp, cgi, pipes, distutils in Python 3.12. Code importing them crashes instantly with ModuleNotFoundError.',
                tag: '→ Automated import translation',
              },
              {
                icon: AlertTriangle,
                color: '#FF7777',
                title: 'ABC Drift',
                body: 'Mapping, Iterable, Callable moved from collections to collections.abc. Direct access now raises AttributeError on Python 3.10+.',
                tag: '→ AST subtree modernization',
              },
              {
                icon: Terminal,
                color: '#68F0D0',
                title: 'Broken Dependencies',
                body: 'Standalone mock instead of unittest.mock, unpinned transitive packages — installs fail before a single line of app code runs.',
                tag: '→ Manifest remediation',
              },
            ].map((c) => (
              <div key={c.title} className="card-archival p-6 flex flex-col gap-4">
                <div className="w-9 h-9 rounded-lg bg-[#171D27] border border-[#293140] flex items-center justify-center shrink-0" style={{ color: c.color }}>
                  <c.icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-base text-[#F0F2F5] mb-1.5">{c.title}</h3>
                  <p className="text-sm text-[#A4ADBB] leading-relaxed">{c.body}</p>
                </div>
                <span className="text-[11px] font-mono text-[#68F0D0] mt-auto pt-3 border-t border-[#202735]">{c.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 border-t border-[#202735] px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-mono uppercase tracking-widest text-[#68F0D0] mb-3 font-semibold">8-Stage Pipeline</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#F0F2F5] mb-4">
              How RepoRevenant restores code
            </h2>
            <p className="text-[#A4ADBB] max-w-xl mx-auto">
              Evidence-driven. Never trust an AI claim alone — every repair must pass a sandboxed test before it's declared a resurrection.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Safe Intake', desc: 'Validates source, blocks SSRF, copies into isolated workspace.' },
              { step: '02', title: 'Inspection', desc: 'Maps language, dependencies, manifests, and test suites.' },
              { step: '03', title: 'AST Forensics', desc: 'Deterministic parser finds PEP 594 removals, ABC drift, syntax errors.' },
              { step: '04', title: 'Baseline Test', desc: 'Runs existing test suite before any patch to confirm decay.' },
              { step: '05', title: 'AI Synthesis', desc: 'Open-weight LLM proposes explanations for each finding.' },
              { step: '06', title: 'Patch Generation', desc: 'Unified diffs produced for each decay. Human reviews before apply.' },
              { step: '07', title: 'Sandbox Verify', desc: 'Patch applied in ephemeral dir. Tests re-run. Exit code 0 required.' },
              { step: '08', title: 'Certificate', desc: 'Resurrection certificate, Markdown report, and .patch export.' },
            ].map((s, i) => (
              <div key={s.step} className="p-5 rounded-xl bg-[#11151D] border border-[#202735] flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#68F0D0] bg-[#0D2924] border border-[#68F0D0]/30 px-2 py-0.5 rounded">{s.step}</span>
                  {i < 7 && <span className="text-[#293140] text-[10px]">→</span>}
                </div>
                <h4 className="font-display font-semibold text-sm text-[#F0F2F5]">{s.title}</h4>
                <p className="text-[12px] text-[#A4ADBB] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE DEMO / CASE FILES ── */}
      <section id="demo" className="py-24 border-t border-[#202735] bg-[#0B0E14]/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-mono uppercase tracking-widest text-[#69D99A] mb-3 font-semibold">Real Forensics</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#F0F2F5] mb-4">
              Sample resurrections ready to inspect
            </h2>
          </div>

          {/* Certificate Preview */}
          <div className="terminal-window shadow-2xl max-w-3xl mx-auto">
            <div className="terminal-header">
              <div className="terminal-dots">
                <span className="terminal-dot bg-[#FF7777]" />
                <span className="terminal-dot bg-[#F3C969]" />
                <span className="terminal-dot bg-[#69D99A]" />
              </div>
              <span className="text-[11px] font-mono text-[#717C8D]">pyvault-resurrection-certificate.rev</span>
              <span className="text-[11px] font-mono text-[#69D99A] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#69D99A]" />
                Verified
              </span>
            </div>

            {/* Mini header */}
            <div className="px-5 py-4 border-b border-[#202735] flex items-center justify-between bg-[#11151D]/60">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="badge-verified">RESURRECTED</span>
                  <span className="text-xs font-mono text-[#80D8FF]">PyVault v0.4.1</span>
                </div>
                <p className="text-[11px] font-mono text-[#717C8D]">Health: <span className="text-[#FF7777]">40</span> → <span className="text-[#69D99A] font-bold">100/100</span> · Post-patch exit code: 0</p>
              </div>
              <Link href="/app" className="btn-outline-teal text-xs py-1.5 px-3 font-mono flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5" />
                Try Live
              </Link>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#202735] text-[11px] font-mono bg-[#0B0E14]">
              {['findings', 'diff', 'test'].map((t, i) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-2.5 border-b-2 transition-colors cursor-pointer capitalize ${
                    activeTab === t
                      ? 'border-[#68F0D0] text-[#68F0D0]'
                      : 'border-transparent text-[#717C8D] hover:text-[#F0F2F5]'
                  }`}
                >
                  {i + 1}. {t === 'findings' ? 'Findings' : t === 'diff' ? 'Diff Patch' : 'Sandbox Proof'}
                </button>
              ))}
            </div>

            {/* Tab body */}
            <div className="p-5 font-mono text-xs text-[#F0F2F5] min-h-[180px] bg-[#080A0F]/60">
              {activeTab === 'findings' && (
                <div className="space-y-2.5">
                  {[
                    { id: 'FIND-001', msg: 'PEP 594: imp module removed — vault.py:29 → import importlib', done: true },
                    { id: 'FIND-002', msg: 'collections.Mapping moved to collections.abc — vault.py:32', done: true },
                  ].map((f) => (
                    <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0B0E14] border border-[#202735]">
                      <div className="flex items-center gap-2">
                        <span className="badge-critical text-[10px]">{f.id}</span>
                        <span className="text-[#A4ADBB] text-[11px]">{f.msg}</span>
                      </div>
                      {f.done && <span className="text-[#69D99A] text-[11px] shrink-0">✓ Fixed</span>}
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'diff' && (
                <div className="diff-container p-3 space-y-0.5">
                  <div className="diff-line header">--- a/pyvault/vault.py</div>
                  <div className="diff-line header">+++ b/pyvault/vault.py</div>
                  <div className="diff-line header">@@ -28,4 +28,5 @@</div>
                  <div className="diff-line del">-import imp</div>
                  <div className="diff-line add">+import importlib</div>
                  <div className="diff-line add">+import types</div>
                  <div className="diff-line del">-from collections import Mapping</div>
                  <div className="diff-line add">+from collections.abc import Mapping</div>
                </div>
              )}
              {activeTab === 'test' && (
                <div className="p-3 rounded-lg bg-[#0B0E14] border border-[#202735]">
                  <div className="flex items-center justify-between text-[#69D99A] font-bold pb-2 border-b border-[#202735] mb-2">
                    <span>$ pytest -v --tb=short</span>
                    <span>EXIT CODE: 0 ✓</span>
                  </div>
                  <pre className="text-[#A4ADBB] text-[11px] leading-relaxed">{`tests/test_vault.py::test_vault_init            PASSED  [ 50%]
tests/test_vault.py::test_vault_store_retrieve  PASSED  [100%]

2 passed in 0.08s — verified in isolated sandbox`}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── EPISTEMIC TABLE ── */}
      <section id="evidence" className="py-24 border-t border-[#202735] px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-mono uppercase tracking-widest text-[#80D8FF] mb-3 font-semibold">Epistemic Boundaries</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#F0F2F5] mb-4">
              Facts vs hypotheses vs verified outcomes
            </h2>
            <p className="text-[#A4ADBB] max-w-xl mx-auto">
              AI explanations are always labelled as hypotheses. Only a test suite exit code 0 in an isolated sandbox can declare a resurrection.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#293140] bg-[#11151D]">
            <table className="min-w-full text-left text-sm font-sans">
              <thead className="bg-[#171D27] text-[#80D8FF] font-mono text-[11px] uppercase tracking-wider border-b border-[#293140]">
                <tr>
                  {['Tier', 'Nature', 'Source', 'Declares Resurrection?'].map((h) => (
                    <th key={h} className="py-3.5 px-5 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202735] text-[#A4ADBB] text-sm">
                {[
                  { tier: 'Observed Facts', nature: 'AST parsing, subprocess exit codes', src: 'Python AST · GitPython', verdict: 'No — documents baseline', vc: '#FF7777' },
                  { tier: 'AI Hypotheses', nature: 'Plausible root-cause explanations', src: 'Open-weight LLM', verdict: 'No — unverified assumption', vc: '#FF7777' },
                  { tier: 'Proposed Repairs', nature: 'Unified diff modifications', src: 'AI Engine + Patcher', verdict: 'No — pending execution', vc: '#FF7777' },
                  { tier: 'Human Approval', nature: 'Developer consent to apply patch', src: 'Interactive review UI', verdict: 'Prerequisite to apply', vc: '#F0B86A' },
                  { tier: 'Verified Outcome', nature: 'Post-patch sandbox exit code 0', src: 'Isolated pytest sandbox', verdict: 'YES — Empirical proof', vc: '#69D99A', highlight: true },
                ].map((row) => (
                  <tr key={row.tier} className={row.highlight ? 'bg-[#69D99A]/5 border-l-4 border-l-[#69D99A]' : 'hover:bg-[#171D27]/40 transition-colors'}>
                    <td className={`py-3.5 px-5 font-mono font-semibold ${row.highlight ? 'text-[#69D99A]' : 'text-[#F0F2F5]'}`}>{row.tier}</td>
                    <td className="py-3.5 px-5">{row.nature}</td>
                    <td className="py-3.5 px-5 font-mono text-xs text-[#80D8FF]">{row.src}</td>
                    <td className="py-3.5 px-5 font-semibold" style={{ color: row.vc }}>{row.verdict}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 border-t border-[#202735] bg-[#0B0E14] px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#171D27] text-[11px] font-mono text-[#68F0D0] mb-6 border border-[#293140]">
            <Sparkles className="w-3.5 h-3.5" />
            Hacktober Ghost-in-the-Machine Entry
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-5xl text-[#F0F2F5] mb-5">
            Ready to resurrect abandoned software?
          </h2>
          <p className="text-[#A4ADBB] mb-8 max-w-lg mx-auto">
            Launch the forensic dashboard, investigate a sample repo, and see the resurrection certificate in under 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/app" className="btn-primary w-full sm:w-auto text-sm px-8 py-3">
              Launch Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="/llms.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full sm:w-auto text-sm px-6 py-3 font-mono flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-[#80D8FF]" />
              Read llms.txt
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 border-t border-[#202735] bg-[#080A0F] text-xs font-mono text-[#717C8D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sm text-[#F0F2F5]">REPOREVENANT</span>
            <span>·</span>
            <span>&quot;Forgotten code deserves a second life.&quot;</span>
          </div>
          <div className="flex items-center gap-6 text-[#A4ADBB]">
            <Link href="/app" className="hover:text-[#F0F2F5] transition-colors">Dashboard</Link>
            <Link href="/app/explorer" className="hover:text-[#F0F2F5] transition-colors">Explorer</Link>
            <Link href="/app/settings" className="hover:text-[#F0F2F5] transition-colors">Settings</Link>
            <a href="/llms.txt" className="hover:text-[#F0F2F5] transition-colors">llms.txt</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
