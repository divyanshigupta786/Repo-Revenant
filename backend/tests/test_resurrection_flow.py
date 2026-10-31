"""
End-to-End Resurrection Pipeline Verification Test
"""
import pytest
import os
import shutil
import tempfile
from backend.app.engine.intake import ingest_repository
from backend.app.engine.inspector import inspect_repository
from backend.app.engine.analyzer import analyze_repository
from backend.app.engine.verifier import run_verification
from backend.app.engine.ai_agent import AIAgentEngine
from backend.app.engine.patcher import apply_patch_proposal
from backend.app.engine.reporter import generate_markdown_report
from backend.app.models import InvestigationReport


@pytest.mark.asyncio
async def test_full_sample_pyvault_resurrection():
    investigation_id = "test-inv-001"
    
    # 1. Intake
    repo_dir = ingest_repository(investigation_id, "sample-pyvault", source_type="sample")
    assert os.path.exists(repo_dir)

    # 2. Inspect
    inspection = inspect_repository(repo_dir)
    assert inspection["files_count"] >= 3
    assert "Python" in inspection["languages"]

    # 3. Deterministic Analysis
    findings = analyze_repository(repo_dir)
    assert len(findings) >= 2  # imp, collections.Mapping, mock
    
    # 4. Baseline Verification (Must fail on Python 3.12+ because imp is missing)
    baseline = run_verification(repo_dir, stage="baseline", timeout_seconds=15)
    # The baseline should fail due to import imp / collections.Mapping
    assert not baseline.passed, "Expected baseline tests to fail on abandoned repository"

    # 5. AI Diagnosis & Patch Synthesis
    ai_engine = AIAgentEngine()
    patches = await ai_engine.diagnose_and_propose_patches(
        repo_dir=repo_dir,
        findings=findings,
        baseline_result=baseline,
        files_metadata=inspection["files"]
    )
    assert len(patches) >= 1

    # 6. Apply Patches
    for patch in patches:
        applied, err = apply_patch_proposal(repo_dir, patch)
        assert applied, f"Failed to apply patch: {err}"
        patch.status = "applied"

    # 7. Post-Patch Verification (Must now PASS!)
    post_verification = run_verification(repo_dir, stage="post_patch", timeout_seconds=15)
    assert post_verification.passed, f"Post-patch tests failed: {post_verification.stderr}\n{post_verification.stdout}"
    assert post_verification.exit_code == 0
    assert post_verification.passed_tests >= 2

    # 8. Report Generation
    report = InvestigationReport(
        id=investigation_id,
        repo_name="PyVault",
        repo_url_or_path="sample-pyvault",
        status="completed",
        created_at="2026-10-30 12:00:00",
        summary="Resurrection verified.",
        findings=findings,
        patches=patches,
        baseline_verification=baseline,
        final_verification=post_verification,
        resurrection_verified=True,
        health_score_before=40,
        health_score_after=100
    )
    md = generate_markdown_report(report)
    assert "RESURRECTED" in md
    assert "`40/100` -> `100/100`" in md
