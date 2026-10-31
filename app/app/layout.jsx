'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Layers,
  FolderTree,
  AlertCircle,
  GitPullRequest,
  ShieldCheck,
  FileText,
  Settings,
  PlusCircle,
  ArrowLeft,
  Menu,
  X,
  Cpu
} from 'lucide-react';

const WORKSPACE_NAV = [
  { href: '/app', label: 'Overview', icon: Activity },
  { href: '/app/investigations', label: 'Investigations', icon: Layers },
  { href: '/app/explorer', label: 'File Explorer', icon: FolderTree },
];

const ANALYSIS_NAV = [
  { href: '/app/findings', label: 'Findings', icon: AlertCircle },
  { href: '/app/patches', label: 'Patches', icon: GitPullRequest },
  { href: '/app/verification', label: 'Verification', icon: ShieldCheck },
  { href: '/app/reports', label: 'Reports', icon: FileText },
];

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const [backendAlive, setBackendAlive] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch('/api/backend/health')
      .then((r) => r.json())
      .then((d) => setBackendAlive(d?.status === 'alive'))
      .catch(() =>
        fetch('http://127.0.0.1:8000/health')
          .then((r) => r.json())
          .then((d) => setBackendAlive(d?.status === 'alive'))
          .catch(() => setBackendAlive(false))
      );
  }, []);

  const SidebarContent = ({ onLinkClick }) => (
    <>
      {/* Brand */}
      <div className="h-14 px-4 border-b border-[#242B38] flex items-center justify-between shrink-0 bg-[#0E1117]">
        <Link href="/" className="flex items-center gap-2.5 group" onClick={onLinkClick}>
          <div className="w-7 h-7 rounded-lg bg-[#131720] border border-[#242B38] flex items-center justify-center group-hover:border-[#72E6CE] transition-colors">
            <svg className="w-3.5 h-3.5" viewBox="0 0 64 64" fill="none">
              <path d="M16 22L32 14L48 22L32 30L16 22Z" stroke="#91BDF7" strokeWidth="3" />
              <path d="M16 22V42L32 50V30" stroke="#72E6CE" strokeWidth="3" />
              <path d="M48 22V42L32 50V30" stroke="#72E6CE" strokeWidth="3" />
              <circle cx="32" cy="30" r="4" fill="#72E6CE" />
            </svg>
          </div>
          <span className="font-display font-bold text-sm tracking-wider text-[#F1F3F6] group-hover:text-[#72E6CE] transition-colors">
            REPOREVENANT
          </span>
        </Link>
        <Link href="/" className="text-[#6F7888] hover:text-[#A0A8B6] transition-colors" title="Back to site">
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="p-3 space-y-4 flex-1 overflow-y-auto">
        {/* Workspace section */}
        <div className="space-y-1">
          <div className="px-2.5 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-[#6F7888] font-semibold">
            Workspace
          </div>
          {WORKSPACE_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onLinkClick}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  isActive
                    ? 'bg-[#191F2A] text-[#72E6CE] border border-[#242B38]'
                    : 'text-[#A0A8B6] hover:bg-[#131720] hover:text-[#F1F3F6]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#72E6CE]' : 'text-[#6F7888]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Analysis section */}
        <div className="space-y-1">
          <div className="px-2.5 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-[#6F7888] font-semibold">
            Analysis
          </div>
          {ANALYSIS_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onLinkClick}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  isActive
                    ? 'bg-[#191F2A] text-[#72E6CE] border border-[#242B38]'
                    : 'text-[#A0A8B6] hover:bg-[#131720] hover:text-[#F1F3F6]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#72E6CE]' : 'text-[#6F7888]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom section: Settings & Model Status */}
      <div className="p-3 border-t border-[#242B38] bg-[#0E1117] shrink-0 space-y-2">
        <Link
          href="/app/settings"
          onClick={onLinkClick}
          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
            pathname === '/app/settings'
              ? 'bg-[#191F2A] text-[#72E6CE] border border-[#242B38]'
              : 'text-[#A0A8B6] hover:bg-[#131720] hover:text-[#F1F3F6]'
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-[#6F7888]" />
          <span>Settings</span>
        </Link>

        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#131720] border border-[#242B38]">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${backendAlive ? 'bg-[#65C995] animate-pulse' : 'bg-[#ED7777]'}`} />
          <span className="text-[10px] font-mono text-[#6F7888] truncate">
            {backendAlive ? 'Engine: Ready' : 'Engine: Offline'}
          </span>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#0B0D12] text-[#F1F3F6] overflow-hidden">
      {/* Desktop sidebar: exactly ~230px */}
      <aside className="hidden md:flex w-[230px] bg-[#0E1117] border-r border-[#242B38] flex-col shrink-0">
        <SidebarContent onLinkClick={undefined} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-[230px] max-w-[80vw] bg-[#0E1117] border-r border-[#242B38] flex flex-col h-full z-10 shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3.5 right-3 p-1 rounded text-[#6F7888] hover:text-[#F1F3F6]"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent onLinkClick={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 px-4 sm:px-6 bg-[#0E1117] border-b border-[#242B38] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 rounded-lg bg-[#131720] border border-[#242B38] text-[#A0A8B6] hover:text-[#F1F3F6]"
              aria-label="Open navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs text-[#6F7888] hidden sm:inline">WORKSPACE</span>
            <span className="text-[#242B38] hidden sm:inline">/</span>
            <span className="font-mono text-xs text-[#91BDF7] uppercase truncate">
              {pathname === '/app' ? 'OVERVIEW' : pathname.replace('/app/', '').replace(/\//g, ' › ')}
            </span>
          </div>

          <Link
            href="/app"
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 font-mono"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Investigation</span>
          </Link>
        </header>

        {/* Page body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0B0D12]">
          {children}
        </main>
      </div>
    </div>
  );
}
