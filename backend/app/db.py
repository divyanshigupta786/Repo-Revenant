"""
SQLite Database Layer for RepoRevenant
Provides durable local persistence for investigations, findings, patches,
test runs, and forensic timeline events.
"""
import os
import sqlite3
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from .models import (
    InvestigationReport, Finding, PatchProposal, VerificationResult,
    TimelineEvent, StageEnum, FindingCategory, Severity
)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "reporevenant.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db():
    """Initialize database tables, indexes, and constraints."""
    with get_connection() as conn:
        cursor = conn.cursor()
        
        # Investigations table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS investigations (
                id TEXT PRIMARY KEY,
                repo_name TEXT NOT NULL,
                repo_url_or_path TEXT NOT NULL,
                status TEXT NOT NULL,
                current_stage TEXT NOT NULL DEFAULT 'intake',
                created_at TEXT NOT NULL,
                completed_at TEXT,
                total_duration_seconds REAL DEFAULT 0.0,
                health_score_before INTEGER DEFAULT 0,
                health_score_after INTEGER DEFAULT 0,
                resurrection_verified INTEGER DEFAULT 0,
                summary TEXT DEFAULT '',
                files_inspected INTEGER DEFAULT 0,
                lines_of_code INTEGER DEFAULT 0,
                detected_languages TEXT DEFAULT '[]',
                dependencies TEXT DEFAULT '[]',
                unresolved_issues TEXT DEFAULT '[]',
                workspace_dir TEXT
            );
        """)

        # Findings table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS findings (
                id TEXT NOT NULL,
                investigation_id TEXT NOT NULL,
                category TEXT NOT NULL,
                severity TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                file_path TEXT NOT NULL,
                line_number INTEGER,
                evidence TEXT NOT NULL,
                detection_method TEXT DEFAULT 'deterministic_ast',
                ai_hypothesis TEXT,
                confidence REAL DEFAULT 1.0,
                verified INTEGER DEFAULT 0,
                recommended_action TEXT NOT NULL,
                PRIMARY KEY (investigation_id, id),
                FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE
            );
        """)

        # Patches table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS patches (
                id TEXT NOT NULL,
                investigation_id TEXT NOT NULL,
                file_path TEXT NOT NULL,
                original_code TEXT NOT NULL,
                proposed_code TEXT NOT NULL,
                unified_diff TEXT NOT NULL,
                rationale TEXT NOT NULL,
                evidence_ids TEXT DEFAULT '[]',
                status TEXT DEFAULT 'proposed',
                applied_at TEXT,
                PRIMARY KEY (investigation_id, id),
                FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE
            );
        """)

        # Test Runs table (Baseline and Final Sandbox Verifications)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS test_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                investigation_id TEXT NOT NULL,
                stage TEXT NOT NULL,
                command TEXT NOT NULL,
                exit_code INTEGER NOT NULL,
                duration_seconds REAL NOT NULL,
                passed INTEGER NOT NULL,
                summary TEXT NOT NULL,
                stdout TEXT,
                stderr TEXT,
                total_tests INTEGER DEFAULT 0,
                passed_tests INTEGER DEFAULT 0,
                failed_tests INTEGER DEFAULT 0,
                FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE
            );
        """)

        # Investigation Events (Timeline)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS timeline_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                investigation_id TEXT NOT NULL,
                sequence_number INTEGER DEFAULT 0,
                timestamp TEXT NOT NULL,
                stage TEXT NOT NULL,
                level TEXT NOT NULL,
                message TEXT NOT NULL,
                details TEXT,
                FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE
            );
        """)

        # Indexes for fast lookup
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_findings_inv ON findings(investigation_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_patches_inv ON patches(investigation_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_inv ON timeline_events(investigation_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_test_runs_inv ON test_runs(investigation_id);")
        
        conn.commit()


def save_investigation(report: InvestigationReport, workspace_dir: Optional[str] = None):
    """Upsert an entire investigation report and related entities."""
    with get_connection() as conn:
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO investigations (
                id, repo_name, repo_url_or_path, status, current_stage, created_at,
                completed_at, total_duration_seconds, health_score_before, health_score_after,
                resurrection_verified, summary, files_inspected, lines_of_code,
                detected_languages, dependencies, unresolved_issues, workspace_dir
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                status=excluded.status,
                current_stage=excluded.current_stage,
                completed_at=excluded.completed_at,
                total_duration_seconds=excluded.total_duration_seconds,
                health_score_before=excluded.health_score_before,
                health_score_after=excluded.health_score_after,
                resurrection_verified=excluded.resurrection_verified,
                summary=excluded.summary,
                files_inspected=excluded.files_inspected,
                lines_of_code=excluded.lines_of_code,
                detected_languages=excluded.detected_languages,
                dependencies=excluded.dependencies,
                unresolved_issues=excluded.unresolved_issues,
                workspace_dir=COALESCE(excluded.workspace_dir, investigations.workspace_dir);
        """, (
            report.id,
            report.repo_name,
            report.repo_url_or_path,
            report.status,
            report.status,
            report.created_at,
            report.completed_at,
            report.total_duration_seconds,
            report.health_score_before,
            report.health_score_after,
            1 if report.resurrection_verified else 0,
            report.summary,
            report.files_inspected,
            report.lines_of_code,
            json.dumps(report.detected_languages),
            json.dumps(report.dependencies),
            json.dumps(report.unresolved_issues),
            workspace_dir
        ))

        # Save findings
        for f in report.findings:
            cursor.execute("""
                INSERT INTO findings (
                    id, investigation_id, category, severity, title, description,
                    file_path, line_number, evidence, detection_method, ai_hypothesis,
                    confidence, verified, recommended_action
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(investigation_id, id) DO UPDATE SET
                    ai_hypothesis=excluded.ai_hypothesis,
                    verified=excluded.verified;
            """, (
                f.id,
                report.id,
                f.category.value if hasattr(f.category, 'value') else str(f.category),
                f.severity.value if hasattr(f.severity, 'value') else str(f.severity),
                f.title,
                f.description,
                f.file_path,
                f.line_number,
                f.evidence,
                f.detection_method,
                f.ai_hypothesis,
                f.confidence,
                1 if f.verified else 0,
                f.recommended_action
            ))

        # Save patches
        for p in report.patches:
            cursor.execute("""
                INSERT INTO patches (
                    id, investigation_id, file_path, original_code, proposed_code,
                    unified_diff, rationale, evidence_ids, status, applied_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(investigation_id, id) DO UPDATE SET
                    status=excluded.status,
                    applied_at=excluded.applied_at;
            """, (
                p.id,
                report.id,
                p.file_path,
                p.original_code,
                p.proposed_code,
                p.unified_diff,
                p.rationale,
                json.dumps(p.evidence_ids),
                p.status,
                p.applied_at
            ))

        # Save test runs (replace existing for stage)
        if report.baseline_verification:
            b = report.baseline_verification
            cursor.execute("DELETE FROM test_runs WHERE investigation_id=? AND stage='baseline'", (report.id,))
            cursor.execute("""
                INSERT INTO test_runs (
                    investigation_id, stage, command, exit_code, duration_seconds,
                    passed, summary, stdout, stderr, total_tests, passed_tests, failed_tests
                ) VALUES (?, 'baseline', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                report.id, b.command, b.exit_code, b.duration_seconds,
                1 if b.passed else 0, b.summary, b.stdout, b.stderr,
                b.total_tests, b.passed_tests, b.failed_tests
            ))

        if report.final_verification:
            v = report.final_verification
            cursor.execute("DELETE FROM test_runs WHERE investigation_id=? AND stage='post_patch'", (report.id,))
            cursor.execute("""
                INSERT INTO test_runs (
                    investigation_id, stage, command, exit_code, duration_seconds,
                    passed, summary, stdout, stderr, total_tests, passed_tests, failed_tests
                ) VALUES (?, 'post_patch', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                report.id, v.command, v.exit_code, v.duration_seconds,
                1 if v.passed else 0, v.summary, v.stdout, v.stderr,
                v.total_tests, v.passed_tests, v.failed_tests
            ))

        # Save timeline events
        cursor.execute("DELETE FROM timeline_events WHERE investigation_id=?", (report.id,))
        for idx, ev in enumerate(report.timeline):
            cursor.execute("""
                INSERT INTO timeline_events (
                    investigation_id, sequence_number, timestamp, stage, level, message, details
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                report.id,
                idx,
                ev.timestamp,
                ev.stage.value if hasattr(ev.stage, 'value') else str(ev.stage),
                ev.level,
                ev.message,
                json.dumps(ev.details) if ev.details else None
            ))

        conn.commit()


def load_investigation(inv_id: str) -> Optional[InvestigationReport]:
    """Retrieve full investigation report from SQLite."""
    with get_connection() as conn:
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM investigations WHERE id = ?", (inv_id,))
        row = cursor.fetchone()
        if not row:
            return None

        # Load findings
        cursor.execute("SELECT * FROM findings WHERE investigation_id = ?", (inv_id,))
        finding_rows = cursor.fetchall()
        findings = [
            Finding(
                id=f["id"],
                category=FindingCategory(f["category"]),
                severity=Severity(f["severity"]),
                title=f["title"],
                description=f["description"],
                file_path=f["file_path"],
                line_number=f["line_number"],
                evidence=f["evidence"],
                detection_method=f["detection_method"],
                ai_hypothesis=f["ai_hypothesis"],
                confidence=f["confidence"],
                verified=bool(f["verified"]),
                recommended_action=f["recommended_action"]
            )
            for f in finding_rows
        ]

        # Load patches
        cursor.execute("SELECT * FROM patches WHERE investigation_id = ?", (inv_id,))
        patch_rows = cursor.fetchall()
        patches = [
            PatchProposal(
                id=p["id"],
                file_path=p["file_path"],
                original_code=p["original_code"],
                proposed_code=p["proposed_code"],
                unified_diff=p["unified_diff"],
                rationale=p["rationale"],
                evidence_ids=json.loads(p["evidence_ids"] or "[]"),
                status=p["status"],
                applied_at=p["applied_at"]
            )
            for p in patch_rows
        ]

        # Load test runs
        cursor.execute("SELECT * FROM test_runs WHERE investigation_id = ?", (inv_id,))
        test_rows = cursor.fetchall()
        baseline_ver = None
        final_ver = None
        for t in test_rows:
            vr = VerificationResult(
                stage=t["stage"],
                command=t["command"],
                exit_code=t["exit_code"],
                duration_seconds=t["duration_seconds"],
                passed=bool(t["passed"]),
                summary=t["summary"],
                stdout=t["stdout"] or "",
                stderr=t["stderr"] or "",
                total_tests=t["total_tests"],
                passed_tests=t["passed_tests"],
                failed_tests=t["failed_tests"]
            )
            if t["stage"] == "baseline":
                baseline_ver = vr
            elif t["stage"] == "post_patch":
                final_ver = vr

        # Load timeline
        cursor.execute("SELECT * FROM timeline_events WHERE investigation_id = ? ORDER BY sequence_number ASC", (inv_id,))
        event_rows = cursor.fetchall()
        timeline = []
        for e in event_rows:
            try:
                stage_val = StageEnum(e["stage"])
            except ValueError:
                stage_val = StageEnum.INTAKE
            timeline.append(TimelineEvent(
                timestamp=e["timestamp"],
                stage=stage_val,
                level=e["level"],
                message=e["message"],
                details=json.loads(e["details"]) if e["details"] else None
            ))

        return InvestigationReport(
            id=row["id"],
            repo_name=row["repo_name"],
            repo_url_or_path=row["repo_url_or_path"],
            status=row["status"],
            created_at=row["created_at"],
            completed_at=row["completed_at"],
            total_duration_seconds=row["total_duration_seconds"],
            health_score_before=row["health_score_before"],
            health_score_after=row["health_score_after"],
            resurrection_verified=bool(row["resurrection_verified"]),
            summary=row["summary"],
            findings=findings,
            patches=patches,
            baseline_verification=baseline_ver,
            final_verification=final_ver,
            timeline=timeline,
            files_inspected=row["files_inspected"],
            lines_of_code=row["lines_of_code"],
            detected_languages=json.loads(row["detected_languages"] or "[]"),
            dependencies=json.loads(row["dependencies"] or "[]"),
            unresolved_issues=json.loads(row["unresolved_issues"] or "[]")
        )


def list_all_investigations() -> List[InvestigationReport]:
    """Retrieve all investigations ordered by created_at DESC."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM investigations ORDER BY created_at DESC")
        ids = [r["id"] for r in cursor.fetchall()]
    
    results = []
    for inv_id in ids:
        inv = load_investigation(inv_id)
        if inv:
            results.append(inv)
    return results


def get_workspace_dir(inv_id: str) -> Optional[str]:
    """Retrieve workspace directory path for investigation."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT workspace_dir FROM investigations WHERE id = ?", (inv_id,))
        row = cursor.fetchone()
        return row["workspace_dir"] if row else None
