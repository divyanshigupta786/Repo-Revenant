"""
RepoRevenant Forensic Report and Resurrection Certificate Generator
Generates Markdown, JSON, and unified patch exports.
Enforces strict epistemic distinction between Observed Facts, AI Hypotheses, Proposed Repairs, and Verified Outcomes.
"""
import json
from typing import Dict, Any
from ..models import InvestigationReport


def generate_markdown_report(report: InvestigationReport) -> str:
    """Generates an evidence-backed Resurrection Report in GitHub-flavored Markdown."""
    status_emoji = "RESURRECTED" if report.resurrection_verified else "INCOMPLETE / UNVERIFIED"
    badge_color = "69D99A" if report.resurrection_verified else "FF7777"
    
    md = []
    md.append(f"# REPOREVENANT RESURRECTION REPORT")
    md.append(f"**Target Repository:** `{report.repo_name}`  ")
    md.append(f"**Investigation ID:** `{report.id}`  ")
    md.append(f"**Status:** `{status_emoji}`  ")
    md.append(f"**Health Score:** `{report.health_score_before}/100` -> `{report.health_score_after}/100`  ")
    md.append(f"**Analysis Duration:** `{report.total_duration_seconds}s`  ")
    md.append(f"**Timestamp:** `{report.created_at}`\n")
    
    md.append("---")
    md.append("## 1. EXECUTIVE RESURRECTION SUMMARY")
    md.append(f"{report.summary}\n")
    
    md.append("---")
    md.append("## 2. OBSERVED FACTS (Deterministic Telemetry)")
    md.append(f"- **Files Inspected:** {report.files_inspected}")
    md.append(f"- **Total Lines of Code:** {report.lines_of_code}")
    md.append(f"- **Detected Languages:** {', '.join(report.detected_languages) if report.detected_languages else 'None'}")
    md.append(f"- **Manifest Dependencies Found:** {len(report.dependencies)}")
    md.append(f"- **Total Forensic Findings:** {len(report.findings)}\n")
    
    if report.findings:
        md.append("### Forensic Findings Log")
        md.append("| Finding ID | Category | Severity | File | Line | Title |")
        md.append("| :--- | :--- | :--- | :--- | :--- | :--- |")
        for f in report.findings:
            md.append(f"| `{f.id}` | {f.category.value} | **{f.severity.value}** | `{f.file_path}` | {f.line_number or '-'} | {f.title} |")
        md.append("")

    md.append("---")
    md.append("## 3. BASELINE VERIFICATION (Pre-Patch State)")
    if report.baseline_verification:
        b = report.baseline_verification
        md.append(f"- **Command Executed:** `{b.command}`")
        md.append(f"- **Exit Code:** `{b.exit_code}`")
        md.append(f"- **Outcome:** {'PASSED' if b.passed else 'FAILED'}")
        md.append(f"- **Execution Duration:** `{b.duration_seconds}s`")
        md.append(f"- **Tests:** `{b.passed_tests} passed`, `{b.failed_tests} failed` out of `{b.total_tests}`")
        md.append("\n```text")
        md.append(b.stdout.strip() or b.stderr.strip() or "No output captured.")
        md.append("```\n")
    else:
        md.append("_No baseline verification executed._\n")

    md.append("---")
    md.append("## 4. PROPOSED & APPROVED REPAIRS")
    if report.patches:
        for p in report.patches:
            md.append(f"### Patch: `{p.file_path}` (`{p.id}`)")
            md.append(f"- **Status:** `{p.status.upper()}`")
            md.append(f"- **Rationale:** {p.rationale}")
            md.append(f"- **Linked Evidence IDs:** {', '.join(p.evidence_ids) if p.evidence_ids else 'None'}")
            md.append("\n```diff")
            md.append(p.unified_diff.strip())
            md.append("```\n")
    else:
        md.append("_No code repairs were required or proposed._\n")

    md.append("---")
    md.append("## 5. FINAL VERIFICATION (Post-Patch Sandbox Execution)")
    if report.final_verification:
        v = report.final_verification
        md.append(f"- **Command Executed:** `{v.command}`")
        md.append(f"- **Exit Code:** `{v.exit_code}`")
        md.append(f"- **Post-Patch Outcome:** {'PASSED (VERIFIED RESURRECTION)' if v.passed else 'FAILED'}")
        md.append(f"- **Execution Duration:** `{v.duration_seconds}s`")
        md.append(f"- **Tests Passed:** `{v.passed_tests}` / `{v.total_tests}`")
        md.append("\n```text")
        md.append(v.stdout.strip() or "All checks passed cleanly.")
        md.append("```\n")
    else:
        md.append("_Verification not yet executed._\n")

    md.append("---")
    md.append("## 6. AUDIT TRAIL AND EPISTEMIC GUARANTEE")
    md.append("> [!IMPORTANT]")
    md.append("> RepoRevenant adheres to strict epistemic boundaries: AI hypotheses are never treated as proof.")
    md.append("> Software resurrection is only declared verified when sandboxed test suites compile, execute, and exit cleanly with code 0.")
    md.append("")
    md.append("### Chronological Execution Timeline")
    for ev in report.timeline:
        md.append(f"- `[{ev.timestamp}]` **[{ev.stage.value.upper()}]** ({ev.level}) {ev.message}")
    md.append("")
    
    return "\n".join(md)


def generate_json_export(report: InvestigationReport) -> str:
    """Serializes the complete investigation report to structured JSON."""
    return report.model_dump_json(indent=2)


def generate_patch_export(report: InvestigationReport) -> str:
    """Combines all unified diffs into a standard multi-file patch file."""
    patches_text = []
    for p in report.patches:
        patches_text.append(f"# RepoRevenant Patch: {p.id} for {p.file_path}")
        patches_text.append(f"# Rationale: {p.rationale}")
        patches_text.append(p.unified_diff)
        patches_text.append("\n")
    return "\n".join(patches_text)
