'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FolderTree,
  FileCode,
  Search,
  Terminal,
  FileText,
  AlertTriangle,
  Layers,
  ChevronRight,
  ExternalLink,
  Code,
  ShieldAlert,
  Copy,
  Check
} from 'lucide-react';
import Link from 'next/link';

function ExplorerContent() {
  const searchParams = useSearchParams();
  const initialInv = searchParams.get('inv');

  const [investigations, setInvestigations] = useState([]);
  const [selectedInvId, setSelectedInvId] = useState(initialInv || '');
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFile, setActiveFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [copiedFile, setCopiedFile] = useState(false);

  // Fetch investigations list on mount
  useEffect(() => {
    fetch('/api/backend/investigations')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.length > 0) {
          setInvestigations(data);
          if (!selectedInvId || !data.some((d) => d.id === selectedInvId)) {
            setSelectedInvId(data[0].id);
          }
        } else {
          setSelectedInvId('sample-pyvault');
        }
      })
      .catch(() => {
        if (!selectedInvId) setSelectedInvId('sample-pyvault');
      });
  }, [selectedInvId]);

  // If query param changes, update selectedInvId
  useEffect(() => {
    if (initialInv) {
      setSelectedInvId(initialInv);
    }
  }, [initialInv]);

  // Fetch files when selected investigation changes
  useEffect(() => {
    if (!selectedInvId) return;
    setLoadingFiles(true);
    setActiveFile(null);
    setFileData(null);

    fetch(`/api/backend/investigations/${selectedInvId}/files`)
      .then((r) => r.json())
      .then((res) => {
        const fileList = res.files || [];
        setFiles(fileList);
        if (fileList.length > 0) {
          const firstPy = fileList.find((f) => f.path.endsWith('.py')) || fileList[0];
          setActiveFile(firstPy.path);
        }
      })
      .catch(() => {
        setFiles([]);
      })
      .finally(() => {
        setLoadingFiles(false);
      });
  }, [selectedInvId]);

  // Fetch active file content
  useEffect(() => {
    if (!selectedInvId || !activeFile) return;
    setLoadingContent(true);

    fetch(`/api/backend/investigations/${selectedInvId}/files/content?path=${encodeURIComponent(activeFile)}`)
      .then((r) => r.json())
      .then((res) => {
        setFileData(res);
      })
      .catch(() => {
        setFileData(null);
      })
      .finally(() => {
        setLoadingContent(false);
      });
  }, [selectedInvId, activeFile]);

  const handleCopyContent = () => {
    if (!fileData?.content) return;
    navigator.clipboard.writeText(fileData.content);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const filteredFiles = files.filter((f) =>
    f.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header & Investigation Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-[#F0F2F5] tracking-tight mb-1">
            Repository File & AST Explorer
          </h1>
          <p className="text-xs font-mono text-[#717C8D]">
            Inspect isolated sandbox filesystem trees, view bounded source text, and trace AST findings.
          </p>
        </div>

        {/* Investigation Picker */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-[#A4ADBB] whitespace-nowrap">
            Workspace:
          </label>
          <select
            value={selectedInvId}
            onChange={(e) => setSelectedInvId(e.target.value)}
            className="bg-[#11151D] border border-[#202735] text-xs font-mono text-[#80D8FF] px-3 py-1.5 rounded-lg outline-none focus:border-[#68F0D0]"
          >
            {investigations.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.repo_name} ({inv.id})
              </option>
            ))}
            {investigations.length === 0 && (
              <option value="sample-pyvault">PyVault Sample Workspace</option>
            )}
          </select>
        </div>
      </div>

      {/* Main Two-Pane Explorer View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[680px]">
        {/* Left Pane: File Tree */}
        <div className="lg:col-span-4 rounded-xl bg-[#11151D] border border-[#202735] flex flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="p-3 border-b border-[#202735] flex items-center gap-2">
            <Search className="w-4 h-4 text-[#717C8D] shrink-0" />
            <input
              type="text"
              placeholder="Filter repository files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-xs font-mono text-[#F0F2F5] placeholder-[#717C8D]"
            />
          </div>

          {/* Files List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingFiles ? (
              <div className="p-8 text-center text-xs font-mono text-[#717C8D]">
                Inspecting workspace filesystem...
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-[#717C8D]">
                No files matching query in this workspace.
              </div>
            ) : (
              filteredFiles.map((file) => {
                const isActive = activeFile === file.path;
                const hasFindings = file.finding_count > 0;

                return (
                  <button
                    key={file.path}
                    onClick={() => setActiveFile(file.path)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#171D27] text-[#68F0D0] border border-[#202735]'
                        : 'text-[#A4ADBB] hover:bg-[#080A0F] hover:text-[#F0F2F5]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#68F0D0]' : 'text-[#80D8FF]'}`} />
                      <span className="truncate">{file.path}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {hasFindings && (
                        <span className="badge-critical text-[10px] px-1.5 py-0.2" title={`${file.finding_count} AST findings detected`}>
                          {file.finding_count} {file.finding_count === 1 ? 'rot' : 'rots'}
                        </span>
                      )}
                      <span className="text-[10px] text-[#717C8D]">{file.size}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Bottom Pane Stats */}
          <div className="p-3 border-t border-[#202735] text-[11px] font-mono text-[#717C8D] flex items-center justify-between bg-[#080A0F]/50">
            <span>{files.length} Total Files</span>
            <span>Bounded Preview (Max 512 KB)</span>
          </div>
        </div>

        {/* Right Pane: Source Code Viewer with Findings Annotations */}
        <div className="lg:col-span-8 rounded-xl bg-[#080A0F] border border-[#202735] flex flex-col overflow-hidden">
          {/* File Header */}
          <div className="h-11 px-4 border-b border-[#202735] bg-[#11151D] flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs">
              <Code className="w-3.5 h-3.5 text-[#68F0D0]" />
              <span className="text-[#F0F2F5] font-semibold">{activeFile || 'No file selected'}</span>
              {fileData && (
                <span className="text-[#717C8D] text-[11px]">
                  • {fileData.total_lines} lines
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {fileData?.content && (
                <button
                  onClick={handleCopyContent}
                  className="text-xs font-mono text-[#A4ADBB] hover:text-[#F0F2F5] flex items-center gap-1 transition-colors"
                  title="Copy file content"
                >
                  {copiedFile ? (
                    <>
                      <Check className="w-3 h-3 text-[#69D99A]" />
                      <span className="text-[#69D99A]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}

              {selectedInvId && (
                <Link
                  href={`/app/investigations/${selectedInvId}`}
                  className="text-xs font-mono text-[#80D8FF] hover:text-[#68F0D0] flex items-center gap-1 transition-colors"
                >
                  <span>Dossier</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>

          {/* Source Code View */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-[#F0F2F5] leading-relaxed">
            {loadingContent ? (
              <div className="p-12 text-center text-xs font-mono text-[#717C8D]">
                Loading file content and mapping AST annotations...
              </div>
            ) : !fileData ? (
              <div className="p-12 text-center text-xs font-mono text-[#717C8D]">
                Select a file from the repository tree on the left.
              </div>
            ) : (
              <div className="space-y-0.5">
                {fileData.content.split('\n').map((line, idx) => {
                  const lineNum = idx + 1;
                  const findingsForLine = fileData.findings_by_line?.[lineNum] || [];
                  const isAnnotated = findingsForLine.length > 0;

                  return (
                    <div key={lineNum} className="flex flex-col">
                      <div
                        className={`flex items-start hover:bg-[#11151D] transition-colors py-0.5 rounded-sm ${
                          isAnnotated ? 'bg-[#FF7777]/10 border-l-2 border-[#FF7777]' : ''
                        }`}
                      >
                        {/* Line number gutter */}
                        <span className="w-10 shrink-0 text-right pr-4 text-[#717C8D] select-none text-[11px]">
                          {lineNum}
                        </span>

                        {/* Code text */}
                        <span className="whitespace-pre overflow-x-auto text-[#F0F2F5] font-mono">
                          {line || ' '}
                        </span>
                      </div>

                      {/* Expanded In-Line Forensic Annotation */}
                      {isAnnotated && (
                        <div className="ml-10 my-1.5 p-3 rounded-lg bg-[#11151D] border border-[#FF7777]/30 text-xs font-mono space-y-1.5">
                          {findingsForLine.map((f) => (
                            <div key={f.id} className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="badge-critical text-[10px] px-1.5 py-0.2">
                                  {f.id}
                                </span>
                                <span className="text-[#FF7777] font-semibold text-xs">
                                  {f.title}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#A4ADBB]">
                                Evidence: <code className="text-[#80D8FF] bg-[#080A0F] px-1 py-0.5 rounded">{f.evidence}</code>
                              </p>
                              <p className="text-[11px] text-[#69D99A]">
                                Remediation: {f.recommended_action}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExplorerPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs font-mono text-[#717C8D]">
          Loading Explorer workspace...
        </div>
      }
    >
      <ExplorerContent />
    </Suspense>
  );
}
