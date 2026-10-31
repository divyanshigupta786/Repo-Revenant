"""
RepoRevenant Backend Configuration and Models
"""
import os
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class StageEnum(str, Enum):
    QUEUED = "queued"
    IDLE = "idle"
    INTAKE = "intake"
    INSPECTING = "inspecting"
    INSPECTION = "inspection"
    ANALYZING = "analyzing"
    ANALYSIS = "analysis"
    RUNNING_BASELINE = "running_baseline"
    BASELINE_VERIFICATION = "baseline_verification"
    DIAGNOSING = "diagnosing"
    AI_DIAGNOSIS = "ai_diagnosis"
    PROPOSING_PATCH = "proposing_patch"
    PATCH_SYNTHESIS = "patch_synthesis"
    AWAITING_APPROVAL = "awaiting_approval"
    APPLYING_PATCH = "applying_patch"
    VERIFYING = "verifying"
    VERIFICATION = "verification"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class FindingCategory(str, Enum):
    SYNTAX = "syntax"
    DEPRECATION = "deprecation"
    DEPENDENCY = "dependency"
    IMPORT = "import"
    TEST_FAILURE = "test_failure"
    CONFIG = "config"


class Severity(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


class Finding(BaseModel):
    id: str
    category: FindingCategory
    severity: Severity
    title: str
    description: str
    file_path: str
    line_number: Optional[int] = None
    evidence: str
    detection_method: str = "deterministic_ast"
    ai_hypothesis: Optional[str] = None
    confidence: float = 1.0
    verified: bool = False
    recommended_action: str


class PatchProposal(BaseModel):
    id: str
    file_path: str
    original_code: str
    proposed_code: str
    unified_diff: str
    rationale: str
    evidence_ids: List[str] = []
    status: str = "proposed"  # proposed, approved, rejected, applied, verified
    applied_at: Optional[str] = None


class VerificationResult(BaseModel):
    stage: str  # baseline or post_patch
    command: str
    exit_code: int
    duration_seconds: float
    passed: bool
    summary: str
    stdout: str
    stderr: str
    total_tests: int = 0
    passed_tests: int = 0
    failed_tests: int = 0


class TimelineEvent(BaseModel):
    timestamp: str
    stage: StageEnum
    level: str  # info, warning, error, success
    message: str
    details: Optional[Dict[str, Any]] = None


class InvestigationReport(BaseModel):
    id: str
    repo_name: str
    repo_url_or_path: str
    status: str
    created_at: str
    completed_at: Optional[str] = None
    total_duration_seconds: float = 0.0
    health_score_before: int = 0
    health_score_after: int = 0
    resurrection_verified: bool = False
    summary: str = ""
    findings: List[Finding] = []
    patches: List[PatchProposal] = []
    baseline_verification: Optional[VerificationResult] = None
    final_verification: Optional[VerificationResult] = None
    timeline: List[TimelineEvent] = []
    files_inspected: int = 0
    lines_of_code: int = 0
    detected_languages: List[str] = []
    dependencies: List[str] = []
    unresolved_issues: List[str] = []


class InvestigationCreateRequest(BaseModel):
    repo_source: str  # git url, sample key, or local path
    source_type: str = "sample"  # "sample", "git", "local"
    model_provider: Optional[str] = "local_open_weight"
    run_auto_verification: bool = True


class SettingsModel(BaseModel):
    model_provider: str = "local_open_weight"  # "local_open_weight", "ollama", "gemini", "heuristic_expert"
    model_name: str = "Llama-3-8B-RepoRevenant"
    endpoint_url: str = "http://127.0.0.1:11434"
    gemini_api_key_configured: bool = False
    max_file_size_kb: int = 512
    test_timeout_seconds: int = 30
    isolated_sandboxes: bool = True
    reduced_motion: bool = False
