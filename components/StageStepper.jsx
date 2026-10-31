'use client';

import React from 'react';
import { Check, Loader2, Circle, AlertCircle } from 'lucide-react';

const STAGES = [
  { key: 'intake', label: 'Intake', desc: 'SSRF & Containment' },
  { key: 'inspection', label: 'Inspection', desc: 'Manifests & AST' },
  { key: 'analysis', label: 'Analysis', desc: 'Deterministic Rot' },
  { key: 'baseline_verification', label: 'Baseline', desc: 'Pre-Patch Tests' },
  { key: 'ai_diagnosis', label: 'AI Diagnosis', desc: 'Root Cause' },
  { key: 'patch_synthesis', label: 'Synthesis', desc: 'Unified Diff' },
  { key: 'verification', label: 'Verify', desc: 'Post-Patch Sandbox' },
];

export default function StageStepper({ currentStage, isCompleted, isFailed }) {
  const isCancelled = currentStage === 'cancelled';

  const stageAliasMap = {
    queued: 'intake',
    inspecting: 'inspection',
    analyzing: 'analysis',
    running_baseline: 'baseline_verification',
    diagnosing: 'ai_diagnosis',
    proposing_patch: 'patch_synthesis',
    awaiting_approval: 'patch_synthesis',
    applying_patch: 'verification',
    verifying: 'verification',
  };

  const normalizedStage = stageAliasMap[currentStage] || currentStage;

  const getStageIndex = (stageKey) => {
    return STAGES.findIndex((s) => s.key === stageKey);
  };

  const currentIndex = isCompleted ? STAGES.length : getStageIndex(normalizedStage);

  return (
    <div className="w-full bg-[#11151D] border border-[#202735] rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-[#202735]/70">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#68F0D0] animate-pulse" />
          <h3 className="font-mono text-xs uppercase tracking-wider text-[#A4ADBB] font-medium">
            Forensic Pipeline Progression
          </h3>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#171D27] text-[#80D8FF] border border-[#202735]">
          {isCompleted
            ? 'COMPLETE • 7/7'
            : isCancelled
            ? 'CANCELLED'
            : isFailed
            ? 'FAILED'
            : `STAGE ${Math.max(1, Math.min(7, currentIndex + 1))} OF 7`}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {STAGES.map((stage, idx) => {
          let status = 'pending';
          if (isCompleted || idx < currentIndex) {
            status = 'completed';
          } else if (idx === currentIndex) {
            status = isFailed ? 'failed' : 'active';
          }

          return (
            <div
              key={stage.key}
              className={`relative rounded-lg px-2.5 py-2 border transition-all ${
                status === 'completed'
                  ? 'bg-[#171D27]/70 border-[#69D99A]/30 text-[#F0F2F5]'
                  : status === 'active'
                  ? 'bg-[#171D27] border-[#68F0D0] text-[#FFFFFF] shadow-[0_0_12px_rgba(104,240,208,0.12)]'
                  : status === 'failed'
                  ? 'bg-[#171D27] border-[#FF7777]/60 text-[#FF7777]'
                  : 'bg-[#080A0F]/50 border-[#202735]/60 text-[#717C8D]'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {status === 'completed' && <Check className="w-3.5 h-3.5 text-[#69D99A] shrink-0" />}
                {status === 'active' && <Loader2 className="w-3.5 h-3.5 text-[#68F0D0] animate-spin shrink-0" />}
                {status === 'failed' && <AlertCircle className="w-3.5 h-3.5 text-[#FF7777] shrink-0" />}
                {status === 'pending' && <Circle className="w-3 h-3 text-[#717C8D]/60 shrink-0" />}

                <span className="font-mono text-[11px] font-semibold leading-none truncate">
                  {idx + 1}. {stage.label}
                </span>
              </div>
              <p className="text-[10px] font-mono text-[#717C8D] truncate pl-5">
                {stage.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

