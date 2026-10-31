"""
Tests for SQLite persistence layer (backend.app.db)
"""
import pytest
from backend.app.models import (
    InvestigationReport, Finding, FindingCategory, Severity,
    PatchProposal, VerificationResult, TimelineEvent, StageEnum
)
from backend.app.db import save_investigation, load_investigation, list_all_investigations


def test_sqlite_investigation_persistence(tmp_path):
    inv_id = "test-db-persist-01"
    
    report = InvestigationReport(
        id=inv_id,
        repo_name="TestRepo",
        repo_url_or_path="https://github.com/example/testrepo.git",
        status="completed",
        created_at="2026-10-31 10:00:00",
        completed_at="2026-10-31 10:02:15",
        total_duration_seconds=135.0,
        health_score_before=30,
        health_score_after=100,
        resurrection_verified=True,
        summary="All tests passing.",
        files_inspected=12,
        lines_of_code=1450,
        detected_languages=["Python", "Markdown"],
        dependencies=["pytest"],
        unresolved_issues=[],
        findings=[
            Finding(
                id="FIND-001",
                category=FindingCategory.DEPRECATION,
                severity=Severity.CRITICAL,
                title="PEP 594 imp removal",
                description="imp module removed in Python 3.12",
                file_path="src/engine.py",
                line_number=14,
                evidence="import imp",
                recommended_action="Replace with importlib"
            )
        ],
        patches=[
            PatchProposal(
                id="PAT-001",
                file_path="src/engine.py",
                original_code="import imp\n",
                proposed_code="import importlib\n",
                unified_diff="--- a/src/engine.py\n+++ b/src/engine.py\n@@ -1 +1 @@\n-import imp\n+import importlib\n",
                rationale="Use importlib instead of imp.",
                evidence_ids=["FIND-001"],
                status="verified"
            )
        ],
        baseline_verification=VerificationResult(
            stage="baseline",
            command="pytest",
            exit_code=1,
            duration_seconds=2.4,
            passed=False,
            summary="1 failed, 0 passed",
            stdout="ModuleNotFoundError: No module named 'imp'",
            stderr=""
        ),
        final_verification=VerificationResult(
            stage="post_patch",
            command="pytest",
            exit_code=0,
            duration_seconds=1.8,
            passed=True,
            summary="1 passed in 0.1s",
            stdout="1 passed in 0.1s",
            stderr=""
        ),
        timeline=[
            TimelineEvent(
                timestamp="10:00:01",
                stage=StageEnum.INTAKE,
                level="info",
                message="Intake started"
            )
        ]
    )

    # Save to SQLite
    save_investigation(report, workspace_dir=str(tmp_path))

    # Reload from SQLite
    loaded = load_investigation(inv_id)
    assert loaded is not None
    assert loaded.id == inv_id
    assert loaded.repo_name == "TestRepo"
    assert loaded.resurrection_verified is True
    assert loaded.health_score_after == 100
    assert len(loaded.findings) == 1
    assert loaded.findings[0].id == "FIND-001"
    assert len(loaded.patches) == 1
    assert loaded.patches[0].id == "PAT-001"
    assert loaded.baseline_verification is not None
    assert loaded.baseline_verification.passed is False
    assert loaded.final_verification is not None
    assert loaded.final_verification.passed is True
    assert len(loaded.timeline) >= 1
