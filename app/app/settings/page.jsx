'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Cpu, Shield, Save, Check, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    model_provider: 'local_open_weight',
    model_name: 'Llama-3-8B-RepoRevenant',
    endpoint_url: 'http://127.0.0.1:11434',
    max_file_size_kb: 512,
    test_timeout_seconds: 30,
    isolated_sandboxes: true,
    reduced_motion: false,
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/backend/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data) setSettings(data);
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      let res = await fetch('/api/backend/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch('http://127.0.0.1:8000/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        }).catch(() => null);
      }

      if (res && res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-[#F0F2F5] tracking-tight mb-1">
          Forensic Engine Configuration
        </h1>
        <p className="text-xs font-mono text-[#717C8D]">
          Configure replaceable open-weight models, local inference endpoints, sandbox timeouts, and containment boundaries.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Model Provider Section */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#11151D] border border-[#202735] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#202735]">
            <Cpu className="w-4 h-4 text-[#68F0D0]" />
            <h3 className="font-mono text-xs uppercase tracking-wider text-[#A4ADBB] font-semibold">
              AI Inference Backend
            </h3>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div>
              <label className="text-[#A4ADBB] block mb-1.5 font-medium">
                Model Provider & Strategy
              </label>
              <select
                value={settings.model_provider}
                onChange={(e) => setSettings({ ...settings, model_provider: e.target.value })}
                className="w-full bg-[#080A0F] border border-[#202735] text-[#80D8FF] px-3.5 py-2.5 rounded-lg outline-none focus:border-[#68F0D0] transition-colors"
              >
                <option value="local_open_weight">
                  Local Open-Weight Model (Ollama / vLLM / OpenAI-Compatible Server)
                </option>
                <option value="heuristic_expert">
                  Built-In Deterministic Forensic Synthesis (Air-Gapped / Zero External Models)
                </option>
                <option value="gemini">
                  Gemini API (Cloud Accelerated via Official SDK)
                </option>
              </select>
              <p className="text-[11px] text-[#717C8D] mt-1.5">
                Guarantees complete replaceability. When offline, automatically falls back to deterministic AST forensic rules.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-[#A4ADBB] block mb-1.5 font-medium">
                  Model Identifier
                </label>
                <input
                  type="text"
                  value={settings.model_name}
                  onChange={(e) => setSettings({ ...settings, model_name: e.target.value })}
                  placeholder="e.g. Llama-3-8B-RepoRevenant"
                  className="w-full bg-[#080A0F] border border-[#202735] text-[#F0F2F5] px-3.5 py-2.5 rounded-lg outline-none focus:border-[#68F0D0] transition-colors"
                />
              </div>

              <div>
                <label className="text-[#A4ADBB] block mb-1.5 font-medium">
                  Inference Endpoint URL
                </label>
                <input
                  type="text"
                  value={settings.endpoint_url}
                  onChange={(e) => setSettings({ ...settings, endpoint_url: e.target.value })}
                  placeholder="http://127.0.0.1:11434"
                  className="w-full bg-[#080A0F] border border-[#202735] text-[#F0F2F5] px-3.5 py-2.5 rounded-lg outline-none focus:border-[#68F0D0] transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sandbox & Privacy Controls */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#11151D] border border-[#202735] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#202735]">
            <Shield className="w-4 h-4 text-[#80D8FF]" />
            <h3 className="font-mono text-xs uppercase tracking-wider text-[#A4ADBB] font-semibold">
              Sandbox Execution & Privacy Guards
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="text-[#A4ADBB] block mb-1.5 font-medium">
                Test Suite Timeout (Seconds)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={settings.test_timeout_seconds}
                onChange={(e) => setSettings({ ...settings, test_timeout_seconds: parseInt(e.target.value) || 30 })}
                className="w-full bg-[#080A0F] border border-[#202735] text-[#F0F2F5] px-3.5 py-2.5 rounded-lg outline-none focus:border-[#68F0D0] transition-colors"
              />
              <span className="text-[10px] text-[#717C8D] mt-1 block">Terminates hanging test runners after timeout</span>
            </div>

            <div>
              <label className="text-[#A4ADBB] block mb-1.5 font-medium">
                Max Inspected File Size (KB)
              </label>
              <input
                type="number"
                min="64"
                max="5120"
                value={settings.max_file_size_kb}
                onChange={(e) => setSettings({ ...settings, max_file_size_kb: parseInt(e.target.value) || 512 })}
                className="w-full bg-[#080A0F] border border-[#202735] text-[#F0F2F5] px-3.5 py-2.5 rounded-lg outline-none focus:border-[#68F0D0] transition-colors"
              />
              <span className="text-[10px] text-[#717C8D] mt-1 block">Excludes oversized minified files or binaries</span>
            </div>
          </div>
        </div>

        {/* Save Controls */}
        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <span className="text-xs font-mono text-[#69D99A] flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>Settings updated successfully.</span>
            </span>
          ) : (
            <span className="text-xs font-mono text-[#717C8D]">
              Changes apply immediately to subsequent investigations.
            </span>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-xs py-2 px-5 font-mono flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
