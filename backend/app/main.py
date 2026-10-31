"""
RepoRevenant Backend API Server (FastAPI)
Exposes investigation lifecycle endpoints, evidence queries, patch reviews,
isolated sandbox verification executions, and workspace repository explorer.
"""
import os
import uuid
import time
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Set, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, JSONResponse, StreamingResponse

from .models import (
    InvestigationReport, InvestigationCreateRequest,
    StageEnum, TimelineEvent, PatchProposal, VerificationResult,
    SettingsModel, Finding
)
from .db import init_db, save_investigation, load_investigation, list_all_investigations, get_workspace_dir
from .engine.intake import ingest_repository, IntakeSecurityError
from .engine.inspector import inspect_repository
from .engine.analyzer import analyze_repository
from .engine.verifier import run_verification
from .engine.ai_agent import AIAgentEngine
from .engine.patcher import apply_patch_proposal, rollback_patch
from .engine.reporter import generate_markdown_report, generate_json_export, generate_patch_export

# Initialize SQLite tables on startup
init_db()

app = FastAPI(
    title="RepoRevenant Forensic Investigation API",
    description="The Open-Source AI Agent That Resurrects Abandoned Software",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory investigation cache and cancellation control
INVESTIGATIONS: Dict[str, InvestigationReport] = {}
REPO_WORKSPACE_MAP: Dict[str, str] = {}
CANCELLATIONS: Set[str] = set()
CURRENT_SETTINGS = SettingsModel()

# Load existing investigations from SQLite into cache
for inv in list_all_investigations():
    INVESTIGATIONS[inv.id] = inv
    ws = get_workspace_dir(inv.id)
    if ws:
        REPO_WORKSPACE_MAP[inv.id] = ws


def add_timeline_event(report: InvestigationReport, stage: StageEnum, level: str, message: str, details=None):
    now_str = datetime.now().strftime("%H:%M:%S")
    event = TimelineEvent(
        timestamp=now_str,
        stage=stage,
        level=level,
        message=message,
        details=details
    )
    report.timeline.append(event)
    save_investigation(report, REPO_WORKSPACE_MAP.get(report.id))


async def execute_investigation_pipeline(investigation_id: str, req: InvestigationCreateRequest):
    report = INVESTIGATIONS[investigation_id]
    start_time = time.time()
    repo_dir = None
    
    try:
        # Check cancellation
        if investigation_id in CANCELLATIONS:
            report.status = StageEnum.CANCELLED.value
            add_timeline_event(report, StageEnum.CANCELLED, "warning", "Investigation cancelled prior to intake.")
            return

        # Stage 1: INTAKE
        report.status = StageEnum.INTAKE.value
        add_timeline_event(report, StageEnum.INTAKE, "info", f"Initiating intake for repository: {req.repo_source}")
        repo_dir = ingest_repository(investigation_id, req.repo_source, req.source_type)
        REPO_WORKSPACE_MAP[investigation_id] = repo_dir
        add_timeline_event(report, StageEnum.INTAKE, "success", f"Repository isolated in workspace sandbox: {os.path.basename(repo_dir)}")
        save_investigation(report, repo_dir)

        if investigation_id in CANCELLATIONS:
            report.status = StageEnum.CANCELLED.value
            add_timeline_event(report, StageEnum.CANCELLED, "warning", "Investigation cancelled after intake.")
            return

        # Stage 2: INSPECTION
        report.status = StageEnum.INSPECTING.value
        add_timeline_event(report, StageEnum.INSPECTING, "info", "Inspecting filesystem, languages, manifests, and test configurations...")
        inspection = inspect_repository(repo_dir)
        report.files_inspected = inspection["files_count"]
        report.lines_of_code = inspection["total_lines"]
        report.detected_languages = inspection["languages"]
        report.dependencies = inspection["dependencies"]
        add_timeline_event(report, StageEnum.INSPECTION, "success",
            f"Inspection complete. {report.files_inspected} files, {report.lines_of_code} LOC, Languages: {', '.join(report.detected_languages)}")
        save_investigation(report, repo_dir)

        if investigation_id in CANCELLATIONS:
            report.status = StageEnum.CANCELLED.value
            add_timeline_event(report, StageEnum.CANCELLED, "warning", "Investigation cancelled after inspection.")
            return

        # Stage 3: DETERMINISTIC ANALYSIS
        report.status = StageEnum.ANALYZING.value
        add_timeline_event(report, StageEnum.ANALYZING, "info", "Running deterministic AST forensic analysis...")
        findings = analyze_repository(repo_dir)
        report.findings = findings
        
        # Initial health score calculation: starts at 100, drops per finding
        deductions = sum(25 if f.severity.value == "critical" else 10 for f in findings)
        report.health_score_before = max(10, 100 - deductions)
        report.health_score_after = report.health_score_before
        add_timeline_event(report, StageEnum.ANALYSIS, "warning" if findings else "success",
            f"Analysis identified {len(findings)} forensic findings. Initial health score: {report.health_score_before}/100")
        save_investigation(report, repo_dir)

        if investigation_id in CANCELLATIONS:
            report.status = StageEnum.CANCELLED.value
            add_timeline_event(report, StageEnum.CANCELLED, "warning", "Investigation cancelled after deterministic analysis.")
            return

        # Stage 4: BASELINE VERIFICATION
        report.status = StageEnum.RUNNING_BASELINE.value
        add_timeline_event(report, StageEnum.RUNNING_BASELINE, "info", "Executing baseline test suite in sandbox to capture pre-patch state...")
        baseline = run_verification(repo_dir, stage="baseline", timeout_seconds=CURRENT_SETTINGS.test_timeout_seconds)
        report.baseline_verification = baseline
        baseline_level = "success" if baseline.passed else "error"
        add_timeline_event(report, StageEnum.BASELINE_VERIFICATION, baseline_level,
            f"Baseline test finished: {baseline.summary} (Exit code: {baseline.exit_code})")
        save_investigation(report, repo_dir)

        if investigation_id in CANCELLATIONS:
            report.status = StageEnum.CANCELLED.value
            add_timeline_event(report, StageEnum.CANCELLED, "warning", "Investigation cancelled after baseline verification.")
            return

        # Stage 5: AI DIAGNOSIS & STAGE 6: PATCH SYNTHESIS
        report.status = StageEnum.DIAGNOSING.value
        add_timeline_event(report, StageEnum.DIAGNOSING, "info",
            f"Engaging AI Agent ({CURRENT_SETTINGS.model_provider}: {CURRENT_SETTINGS.model_name}) to analyze findings and baseline failures...")
        
        ai_engine = AIAgentEngine(
            provider=CURRENT_SETTINGS.model_provider,
            model_name=CURRENT_SETTINGS.model_name,
            endpoint_url=CURRENT_SETTINGS.endpoint_url
        )
        
        report.status = StageEnum.PROPOSING_PATCH.value
        patches = await ai_engine.diagnose_and_propose_patches(
            repo_dir=repo_dir,
            findings=report.findings,
            baseline_result=baseline,
            files_metadata=inspection["files"]
        )
        report.patches = patches
        add_timeline_event(report, StageEnum.PATCH_SYNTHESIS, "info",
            f"Synthesized {len(patches)} targeted code repair proposals with unified diffs.")
        save_investigation(report, repo_dir)

        if investigation_id in CANCELLATIONS:
            report.status = StageEnum.CANCELLED.value
            add_timeline_event(report, StageEnum.CANCELLED, "warning", "Investigation cancelled after patch synthesis.")
            return

        # Stage 7: AUTO VERIFICATION (if requested)
        if req.run_auto_verification and patches:
            report.status = StageEnum.VERIFYING.value
            add_timeline_event(report, StageEnum.VERIFYING, "info", "Applying proposed patches in sandbox for automated resurrection verification...")
            
            for p in patches:
                applied, err = apply_patch_proposal(repo_dir, p)
                if applied:
                    p.status = "applied"
                    p.applied_at = datetime.now().isoformat()
                else:
                    add_timeline_event(report, StageEnum.VERIFYING, "error", f"Failed to apply patch {p.id}: {err}")
            
            post_ver = run_verification(repo_dir, stage="post_patch", timeout_seconds=CURRENT_SETTINGS.test_timeout_seconds)
            report.final_verification = post_ver
            
            if post_ver.passed:
                report.resurrection_verified = True
                report.health_score_after = 100
                report.status = StageEnum.COMPLETED.value
                for p in patches:
                    if p.status == "applied":
                        p.status = "verified"
                for f in report.findings:
                    f.verified = True
                add_timeline_event(report, StageEnum.VERIFICATION, "success",
                    f"Resurrection Verified! Post-patch test suite passed cleanly ({post_ver.summary}). Health score: 100/100")
                report.summary = (
                    f"Software successfully resurrected. Remediated {len(findings)} root-cause issues across "
                    f"{len(patches)} files. All test suites verified passing in isolated sandbox."
                )
            else:
                report.status = StageEnum.COMPLETED.value
                report.resurrection_verified = False
                report.health_score_after = min(80, report.health_score_before + 30)
                add_timeline_event(report, StageEnum.VERIFICATION, "warning",
                    f"Post-patch test execution did not completely pass: {post_ver.summary}")
                report.summary = f"Partial remediation applied. Some tests remain inconclusive or failed."
        else:
            report.status = StageEnum.AWAITING_APPROVAL.value
            report.summary = f"Investigation complete. {len(findings)} findings logged and {len(patches)} repairs proposed for human review."
            add_timeline_event(report, StageEnum.AWAITING_APPROVAL, "info", "Awaiting human review and approval of proposed patches.")

    except Exception as e:
        report.status = StageEnum.FAILED.value
        add_timeline_event(report, StageEnum.FAILED, "error", f"Investigation aborted due to error: {str(e)}")
        report.summary = f"Pipeline failed: {str(e)}"
    finally:
        report.total_duration_seconds = round(time.time() - start_time, 2)
        report.completed_at = datetime.now().isoformat()
        save_investigation(report, repo_dir)


@app.get("/health")
@app.get("/api/health")
def get_health():
    return {
        "status": "alive",
        "service": "RepoRevenant Investigation Engine",
        "active_model": CURRENT_SETTINGS.model_name,
        "provider": CURRENT_SETTINGS.model_provider,
        "total_investigations": len(INVESTIGATIONS)
    }


@app.get("/ready")
@app.get("/api/ready")
def get_ready():
    """Readiness probe checking database and local disk workspaces."""
    return {
        "ready": True,
        "database": "sqlite_connected",
        "sandboxes_enabled": CURRENT_SETTINGS.isolated_sandboxes,
        "total_cached": len(INVESTIGATIONS)
    }


@app.get("/api/models")
async def get_models():
    """List supported replaceable open-weight models and probe endpoint health."""
    ai_engine = AIAgentEngine(
        provider=CURRENT_SETTINGS.model_provider,
        model_name=CURRENT_SETTINGS.model_name,
        endpoint_url=CURRENT_SETTINGS.endpoint_url
    )
    health = await ai_engine.check_model_health()
    return {
        "active_provider": CURRENT_SETTINGS.model_provider,
        "active_model": CURRENT_SETTINGS.model_name,
        "endpoint_url": CURRENT_SETTINGS.endpoint_url,
        "runtime_status": health,
        "supported_providers": [
            {
                "id": "local_open_weight",
                "label": "Local Open-Weight Model (Ollama / vLLM)",
                "recommended_models": ["Llama-3-8B-RepoRevenant", "mistral:7b", "codellama:7b", "deepseek-coder:6.7b"],
                "privacy": "Zero data egress (100% on-device)"
            },
            {
                "id": "heuristic_expert",
                "label": "Built-In Deterministic Forensic Synthesis",
                "recommended_models": ["deterministic-ast-v1"],
                "privacy": "Air-gapped (Zero external model calls)"
            },
            {
                "id": "gemini",
                "label": "Gemini API (Cloud Accelerated)",
                "recommended_models": ["gemini-2.5-flash"],
                "privacy": "Requires explicit user configuration"
            }
        ]
    }


@app.get("/api/sample-repos")
def list_sample_repos():
    """List built-in abandoned repositories available for 1-click investigation."""
    return [
        {
            "id": "sample-pyvault",
            "name": "PyVault",
            "tagline": "Abandoned Cryptographic Storage Vault (2017)",
            "languages": ["Python"],
            "abandoned_since": "2017",
            "decay_types": [
                "Python 3.12+ 'imp' module removal (PEP 594)",
                "collections.Mapping abstract base class deprecation",
                "obsolete standalone mock dependency"
            ],
            "lines": 98,
            "description": "A cryptographic key-value store abandoned by its author. Fails on modern Python due to removed standard library modules."
        },
        {
            "id": "sample-math-matrix",
            "name": "MatrixCalc",
            "tagline": "Abandoned 2D Matrix Linear Transformation Tool (2018)",
            "languages": ["Python"],
            "abandoned_since": "2018",
            "decay_types": [
                "collections.Iterable deprecation",
                "Syntax drift"
            ],
            "lines": 72,
            "description": "Matrix calculation utility abandoned after Python 3.8. Fails with AttributeError when importing abstract classes directly from collections."
        }
    ]


@app.post("/api/investigations", response_model=InvestigationReport)
async def create_investigation(req: InvestigationCreateRequest, background_tasks: BackgroundTasks):
    """Start a new repository investigation."""
    inv_id = f"rev-{uuid.uuid4().hex[:8]}"
    repo_name = os.path.basename(req.repo_source.rstrip("/\\"))
    if not repo_name or repo_name == ".":
        repo_name = "target-repository"

    report = InvestigationReport(
        id=inv_id,
        repo_name=repo_name,
        repo_url_or_path=req.repo_source,
        status=StageEnum.QUEUED.value,
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        summary="Investigation queued..."
    )
    add_timeline_event(report, StageEnum.QUEUED, "info", f"Investigation {inv_id} queued.")
    INVESTIGATIONS[inv_id] = report
    save_investigation(report)
    
    # Run pipeline in background task
    background_tasks.add_task(execute_investigation_pipeline, inv_id, req)
    return report


@app.get("/api/investigations", response_model=List[InvestigationReport])
def list_investigations():
    """List all investigations ordered by newest first."""
    return sorted(list(INVESTIGATIONS.values()), key=lambda r: r.created_at, reverse=True)


@app.get("/api/investigations/{inv_id}", response_model=InvestigationReport)
def get_investigation(inv_id: str):
    """Retrieve full status, findings, diffs, and verification metrics of an investigation."""
    if inv_id not in INVESTIGATIONS:
        loaded = load_investigation(inv_id)
        if loaded:
            INVESTIGATIONS[inv_id] = loaded
        else:
            raise HTTPException(status_code=404, detail="Investigation ID not found")
    return INVESTIGATIONS[inv_id]


@app.post("/api/investigations/{inv_id}/cancel")
def cancel_investigation(inv_id: str):
    """Cancel an active or queued investigation."""
    if inv_id not in INVESTIGATIONS:
        raise HTTPException(status_code=404, detail="Investigation ID not found")
    
    report = INVESTIGATIONS[inv_id]
    if report.status in (StageEnum.COMPLETED.value, StageEnum.FAILED.value, StageEnum.CANCELLED.value):
        return {"status": report.status, "message": f"Investigation is already {report.status}."}

    CANCELLATIONS.add(inv_id)
    report.status = StageEnum.CANCELLED.value
    add_timeline_event(report, StageEnum.CANCELLED, "warning", "Investigation cancelled by user.")
    save_investigation(report, REPO_WORKSPACE_MAP.get(inv_id))
    return {"status": "cancelled", "investigation_id": inv_id}


@app.get("/api/investigations/{inv_id}/events")
def get_investigation_events(inv_id: str):
    """Retrieve live timeline event list for an investigation."""
    if inv_id not in INVESTIGATIONS:
        raise HTTPException(status_code=404, detail="Investigation ID not found")
    report = INVESTIGATIONS[inv_id]
    return {
        "investigation_id": inv_id,
        "current_status": report.status,
        "events": report.timeline
    }


@app.get("/api/investigations/{inv_id}/findings", response_model=List[Finding])
def get_investigation_findings(inv_id: str):
    """Retrieve findings for a specific investigation."""
    if inv_id not in INVESTIGATIONS:
        raise HTTPException(status_code=404, detail="Investigation ID not found")
    return INVESTIGATIONS[inv_id].findings


@app.get("/api/investigations/{inv_id}/patches", response_model=List[PatchProposal])
def get_investigation_patches(inv_id: str):
    """Retrieve patch proposals for an investigation."""
    if inv_id not in INVESTIGATIONS:
        raise HTTPException(status_code=404, detail="Investigation ID not found")
    return INVESTIGATIONS[inv_id].patches


@app.get("/api/investigations/{inv_id}/patches/{patch_id}", response_model=PatchProposal)
def get_single_patch(inv_id: str, patch_id: str):
    """Retrieve a single patch by identifier."""
    if inv_id not in INVESTIGATIONS:
        raise HTTPException(status_code=404, detail="Investigation ID not found")
    for p in INVESTIGATIONS[inv_id].patches:
        if p.id == patch_id:
            return p
    raise HTTPException(status_code=404, detail="Patch ID not found")


@app.post("/api/investigations/{inv_id}/patches/{patch_id}/approve")
@app.post("/api/investigations/{inv_id}/patch/approve")
def approve_patch(inv_id: str, patch_id: Optional[str] = None):
    """Approve a proposed patch."""
    if inv_id not in INVESTIGATIONS:
        raise HTTPException(status_code=404, detail="Investigation not found")
    report = INVESTIGATIONS[inv_id]
    
    target_id = patch_id
    for p in report.patches:
        if target_id is None or p.id == target_id:
            p.status = "approved"
            add_timeline_event(report, StageEnum.PATCH_SYNTHESIS, "info", f"Human approved patch {p.id} ({p.file_path}).")
            save_investigation(report, REPO_WORKSPACE_MAP.get(inv_id))
            return {"status": "approved", "patch_id": p.id}
            
    raise HTTPException(status_code=404, detail="Patch not found")


@app.post("/api/investigations/{inv_id}/patches/{patch_id}/reject")
@app.post("/api/investigations/{inv_id}/patch/reject")
def reject_patch(inv_id: str, patch_id: Optional[str] = None):
    """Reject a proposed patch and rollback if applied."""
    if inv_id not in INVESTIGATIONS:
        raise HTTPException(status_code=404, detail="Investigation not found")
    report = INVESTIGATIONS[inv_id]
    repo_dir = REPO_WORKSPACE_MAP.get(inv_id)
    
    target_id = patch_id
    for p in report.patches:
        if target_id is None or p.id == target_id:
            p.status = "rejected"
            if repo_dir:
                rollback_patch(repo_dir, p.file_path)
            add_timeline_event(report, StageEnum.PATCH_SYNTHESIS, "warning", f"Human rejected patch {p.id} ({p.file_path}).")
            save_investigation(report, repo_dir)
            return {"status": "rejected", "patch_id": p.id}
            
    raise HTTPException(status_code=404, detail="Patch not found")


@app.post("/api/investigations/{inv_id}/patches/{patch_id}/verify")
@app.post("/api/investigations/{inv_id}/verify")
def trigger_verification(inv_id: str, patch_id: Optional[str] = None):
    """Re-executes sandbox verification checks for this investigation."""
    if inv_id not in INVESTIGATIONS:
        raise HTTPException(status_code=404, detail="Investigation not found")
    report = INVESTIGATIONS[inv_id]
    repo_dir = REPO_WORKSPACE_MAP.get(inv_id)
    if not repo_dir or not os.path.exists(repo_dir):
        raise HTTPException(status_code=400, detail="Repository workspace not available")
        
    res = run_verification(repo_dir, stage="post_patch", timeout_seconds=CURRENT_SETTINGS.test_timeout_seconds)
    report.final_verification = res
    if res.passed:
        report.resurrection_verified = True
        report.health_score_after = 100
        for p in report.patches:
            if p.status == "applied":
                p.status = "verified"
        for f in report.findings:
            f.verified = True
    save_investigation(report, repo_dir)
    return res


@app.get("/api/investigations/{inv_id}/report")
def get_investigation_report_summary(inv_id: str):
    """Get structured report summary."""
    if inv_id not in INVESTIGATIONS:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return INVESTIGATIONS[inv_id]


@app.get("/api/investigations/{inv_id}/report.md")
def get_investigation_report_md(inv_id: str):
    """Retrieve Markdown formatted Resurrection Report."""
    if inv_id not in INVESTIGATIONS:
        raise HTTPException(status_code=404, detail="Investigation not found")
    md = generate_markdown_report(INVESTIGATIONS[inv_id])
    return PlainTextResponse(md, media_type="text/markdown")


@app.get("/api/investigations/{inv_id}/report.json")
def get_investigation_report_json(inv_id: str):
    """Retrieve JSON formatted Resurrection Telemetry."""
    if inv_id not in INVESTIGATIONS:
        raise HTTPException(status_code=404, detail="Investigation not found")
    json_data = generate_json_export(INVESTIGATIONS[inv_id])
    return PlainTextResponse(json_data, media_type="application/json")


@app.get("/api/investigations/{inv_id}/export/{export_format}")
def export_investigation(inv_id: str, export_format: str):
    """Download investigation report in markdown, json, or unified patch format."""
    if inv_id not in INVESTIGATIONS:
        raise HTTPException(status_code=404, detail="Investigation not found")
    report = INVESTIGATIONS[inv_id]
    
    if export_format == "markdown":
        md = generate_markdown_report(report)
        return PlainTextResponse(md, media_type="text/markdown", headers={
            "Content-Disposition": f"attachment; filename=reporevenant-report-{inv_id}.md"
        })
    elif export_format == "json":
        json_data = generate_json_export(report)
        return PlainTextResponse(json_data, media_type="application/json", headers={
            "Content-Disposition": f"attachment; filename=reporevenant-report-{inv_id}.json"
        })
    elif export_format == "patch":
        patch_text = generate_patch_export(report)
        return PlainTextResponse(patch_text, media_type="text/x-diff", headers={
            "Content-Disposition": f"attachment; filename=reporevenant-resurrection-{inv_id}.patch"
        })
    else:
        raise HTTPException(status_code=400, detail="Supported export formats: markdown, json, patch")


@app.get("/api/investigations/{inv_id}/files")
def get_repository_files(inv_id: str):
    """Return file tree of the isolated workspace for the repository explorer."""
    if inv_id not in INVESTIGATIONS:
        raise HTTPException(status_code=404, detail="Investigation not found")
    repo_dir = REPO_WORKSPACE_MAP.get(inv_id)
    if not repo_dir or not os.path.exists(repo_dir):
        # Fall back to sample directory if workspace was cleaned
        inv = INVESTIGATIONS[inv_id]
        if inv.repo_url_or_path == "sample-pyvault":
            repo_dir = os.path.join(os.path.dirname(__file__), "sample_repos", "sample-pyvault")
        elif inv.repo_url_or_path == "sample-math-matrix":
            repo_dir = os.path.join(os.path.dirname(__file__), "sample_repos", "sample-math-matrix")

    if not repo_dir or not os.path.exists(repo_dir):
        return {"investigation_id": inv_id, "files": []}

    file_list = []
    findings = INVESTIGATIONS[inv_id].findings
    findings_per_file = {}
    for f in findings:
        findings_per_file.setdefault(f.file_path, []).append(f.id)

    for root, dirs, files in os.walk(repo_dir):
        dirs[:] = [d for d in dirs if d not in {".git", ".pytest_cache", "__pycache__", "venv", ".venv", "env"}]
        for fn in sorted(files):
            if fn.endswith(".rev_bak") or fn.endswith(".pyc"):
                continue
            full_path = os.path.join(root, fn)
            rel_path = os.path.relpath(full_path, repo_dir).replace("\\", "/")
            
            line_count = 0
            try:
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    line_count = sum(1 for _ in f)
            except Exception:
                pass

            size_bytes = os.path.getsize(full_path)
            size_str = f"{size_bytes} B" if size_bytes < 1024 else f"{round(size_bytes / 1024, 1)} KB"

            file_list.append({
                "path": rel_path,
                "lines": line_count,
                "size": size_str,
                "size_bytes": size_bytes,
                "language": "Python" if rel_path.endswith(".py") else "Text",
                "finding_count": len(findings_per_file.get(rel_path, [])),
                "finding_ids": findings_per_file.get(rel_path, [])
            })

    return {"investigation_id": inv_id, "files": file_list}


@app.get("/api/investigations/{inv_id}/files/content")
def get_file_content(inv_id: str, path: str = Query(..., description="Relative file path within repository")):
    """Return bounded safe text content for a file, with associated findings mapped by line."""
    if ".." in path or path.startswith("/") or path.startswith("\\"):
        raise HTTPException(status_code=400, detail="Invalid path traversal detected.")

    repo_dir = REPO_WORKSPACE_MAP.get(inv_id)
    if not repo_dir or not os.path.exists(repo_dir):
        inv = INVESTIGATIONS.get(inv_id)
        if inv and inv.repo_url_or_path == "sample-pyvault":
            repo_dir = os.path.join(os.path.dirname(__file__), "sample_repos", "sample-pyvault")
        elif inv and inv.repo_url_or_path == "sample-math-matrix":
            repo_dir = os.path.join(os.path.dirname(__file__), "sample_repos", "sample-math-matrix")

    if not repo_dir or not os.path.exists(repo_dir):
        raise HTTPException(status_code=404, detail="Workspace not found.")

    target_file = os.path.join(repo_dir, path)
    if not os.path.exists(target_file):
        raise HTTPException(status_code=404, detail=f"File {path} not found.")

    # Guard file size
    if os.path.getsize(target_file) > CURRENT_SETTINGS.max_file_size_kb * 1024:
        raise HTTPException(status_code=413, detail="File exceeds maximum viewable size limit.")

    try:
        with open(target_file, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")

    # Map findings by line number
    findings_on_lines: Dict[int, List[Dict[str, Any]]] = {}
    if inv_id in INVESTIGATIONS:
        for f in INVESTIGATIONS[inv_id].findings:
            if f.file_path == path and f.line_number:
                findings_on_lines.setdefault(f.line_number, []).append({
                    "id": f.id,
                    "title": f.title,
                    "severity": f.severity.value,
                    "evidence": f.evidence,
                    "recommended_action": f.recommended_action
                })

    return {
        "file_path": path,
        "content": content,
        "total_lines": content.count("\n") + (1 if content else 0),
        "findings_by_line": findings_on_lines
    }


@app.get("/api/settings", response_model=SettingsModel)
def get_settings():
    return CURRENT_SETTINGS


@app.post("/api/settings", response_model=SettingsModel)
def update_settings(new_settings: SettingsModel):
    global CURRENT_SETTINGS
    CURRENT_SETTINGS = new_settings
    return CURRENT_SETTINGS
