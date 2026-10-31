'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Activity,
  Layers,
  FolderTree,
  AlertCircle,
  GitPullRequest,
  ShieldCheck,
  FileText,
  Settings,
  Play,
  X,
  BookOpen,
  ArrowRight
} from 'lucide-react';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef(null);

  const COMMANDS = [
    { id: 'app', label: 'Dashboard Overview', desc: 'Main control center', icon: Activity, href: '/app' },
    { id: 'explorer', label: 'Repository Explorer', desc: 'Browse file tree & AST line annotations', icon: FolderTree, href: '/app/explorer' },
    { id: 'findings', label: 'Findings Log', desc: 'Inspect all detected deprecations and code rot', icon: AlertCircle, href: '/app/findings' },
    { id: 'patches', label: 'Patch Review', desc: 'Audit AI synthesized unified diffs', icon: GitPullRequest, href: '/app/patches' },
    { id: 'verification', label: 'Sandbox Verification', desc: 'View isolated test execution telemetry', icon: ShieldCheck, href: '/app/verification' },
    { id: 'reports', label: 'Resurrection Reports', desc: 'Download certificates, Markdown, & patches', icon: FileText, href: '/app/reports' },
    { id: 'settings', label: 'Settings & Models', desc: 'Configure local open-weight models and timeouts', icon: Settings, href: '/app/settings' },
    { id: 'sample-pyvault', label: 'Quick Investigate: PyVault', desc: '1-click sample resurrection (PEP 594 rot)', icon: Play, action: () => triggerSample('sample-pyvault') },
    { id: 'sample-matrix', label: 'Quick Investigate: MatrixCalc', desc: '1-click sample resurrection (collections rot)', icon: Play, action: () => triggerSample('sample-math-matrix') },
    { id: 'llms', label: 'Read llms.txt', desc: 'AI-readable architecture specification', icon: BookOpen, href: '/llms.txt', external: true },
    { id: 'home', label: 'Home Page', desc: 'Return to public marketing landing', icon: ArrowRight, href: '/' },
  ];

  const triggerSample = async (sampleKey) => {
    setOpen(false);
    try {
      const res = await fetch('/api/backend/investigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_source: sampleKey,
          source_type: 'sample',
          run_auto_verification: true
        })
      });
      if (res.ok) {
        const d = await res.json();
        router.push(`/app/investigations/${d.id}`);
      } else {
        router.push('/app');
      }
    } catch {
      router.push('/app');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setSearch('');
    }
  }, [open]);

  const filtered = COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase()) ||
    c.desc.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (cmd) => {
    setOpen(false);
    if (cmd.action) {
      cmd.action();
    } else if (cmd.external) {
      window.open(cmd.href, '_blank');
    } else if (cmd.href) {
      router.push(cmd.href);
    }
  };

  const handleListKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex]);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#080A0F]/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl rounded-xl bg-[#0B0E14] border border-[#293140] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleListKeyDown}
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-[#202735] flex items-center gap-3 bg-[#11151D]">
          <Search className="w-4 h-4 text-[#80D8FF] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search product actions..."
            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-mono text-[#F0F2F5] placeholder-[#717C8D]"
          />
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded text-[#717C8D] hover:text-[#F0F2F5] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-[#717C8D]">
              No commands matching &ldquo;{search}&rdquo;
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={cmd.id}
                  onClick={() => handleSelect(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full px-3 py-2.5 rounded-lg text-xs font-mono flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#171D27] text-[#68F0D0] border border-[#293140]'
                      : 'text-[#A4ADBB] hover:bg-[#11151D] hover:text-[#F0F2F5]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#68F0D0]' : 'text-[#80D8FF]'}`} />
                    <div className="truncate">
                      <span className="font-semibold block truncate text-[#F0F2F5]">
                        {cmd.label}
                      </span>
                      <span className="text-[11px] text-[#717C8D] block truncate">
                        {cmd.desc}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-[#717C8D] shrink-0 ml-2">
                    Enter ↵
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Command Footer */}
        <div className="p-2.5 border-t border-[#202735] bg-[#080A0F] text-[10px] font-mono text-[#717C8D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-[#80D8FF]">Ctrl/Cmd + K</span>
        </div>
      </div>
    </div>
  );
}
