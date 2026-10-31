'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [backendAlive, setBackendAlive] = useState(false);
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

  const navLinks = [
    { href: '/#how-it-works', label: 'How it works' },
    { href: '/#problem', label: 'Features' },
    { href: '/#demo', label: 'Documentation' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#0B0D12]/90 border-b border-[#242B38]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Left: Brand */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
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

        {/* Center: Nav */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-mono font-medium text-[#A0A8B6]">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-[#72E6CE] transition-colors py-1">
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right: GitHub & Launch App */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex text-xs font-mono text-[#A0A8B6] hover:text-[#F1F3F6] transition-colors py-1.5 px-2"
          >
            GitHub
          </a>

          <Link
            href="/app"
            className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5 font-mono"
          >
            <span>Launch Application</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg bg-[#11151D] border border-[#293140] text-[#A4ADBB] hover:text-[#F0F2F5] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#0B0E14] border-b border-[#293140] px-4 py-4 space-y-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-md text-sm text-[#A4ADBB] hover:bg-[#171D27] hover:text-[#68F0D0] transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/app"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-between px-3 py-2 rounded-md text-sm bg-[#171D27] text-[#68F0D0] font-semibold mt-2"
          >
            <span>Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </header>
  );
}
