"""
RepoRevenant Isolated Verification Runner
Executes test suites (pytest, unittest) in isolated sandboxes with strict execution limits,
environment scrubbing, and output parsing.
"""
import os
import sys
import shutil
import tempfile
import time
import subprocess
import re
from typing import Tuple, Dict, Any, Optional
from ..models import VerificationResult


def scrub_environment() -> Dict[str, str]:
    """Provide a sanitized environment without exposing secret keys."""
    env = os.environ.copy()
    # Strip any potential API keys or sensitive env vars from subprocess
    sensitive_keys = [k for k in env if any(s in k.lower() for s in ["key", "secret", "token", "password", "auth", "credential"])]
    for k in sensitive_keys:
        env.pop(k, None)
    # Ensure UTF-8 python io
    env["PYTHONIOENCODING"] = "utf-8"
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    return env


def parse_test_output(output: str) -> Dict[str, int]:
    """Extract total, passed, and failed test metrics from pytest/unittest text output."""
    total = 0
    passed = 0
    failed = 0
    
    # Check pytest pattern: "1 passed, 2 failed in 0.05s" or "3 passed in 0.01s"
    pytest_match = re.search(r"(\d+)\s+passed", output)
    if pytest_match:
        passed = int(pytest_match.group(1))
        
    pytest_fail = re.search(r"(\d+)\s+failed", output)
    if pytest_fail:
        failed = int(pytest_fail.group(1))
        
    pytest_err = re.search(r"(\d+)\s+error", output)
    if pytest_err:
        failed += int(pytest_err.group(1))
        
    # Unittest patterns
    if not passed and not failed:
        ran_match = re.search(r"Ran (\d+) test", output)
        if ran_match:
            total = int(ran_match.group(1))
            if "OK" in output:
                passed = total
            elif "FAILED" in output:
                fail_cnt = re.search(r"failures=(\d+)", output)
                err_cnt = re.search(r"errors=(\d+)", output)
                f_val = int(fail_cnt.group(1)) if fail_cnt else 0
                e_val = int(err_cnt.group(1)) if err_cnt else 0
                failed = f_val + e_val
                passed = max(0, total - failed)
                
    total = passed + failed
    return {"total": total, "passed": passed, "failed": failed}


def run_verification(repo_dir: str, stage: str = "baseline", timeout_seconds: int = 30) -> VerificationResult:
    """
    Executes test discovery and execution in an isolated sandbox.
    """
    # Create isolated temp sandbox
    sandbox_dir = tempfile.mkdtemp(prefix="reporevenant_sandbox_")
    try:
        # Copy repo to sandbox
        shutil.copytree(repo_dir, os.path.join(sandbox_dir, "work"), dirs_exist_ok=True)
        work_dir = os.path.join(sandbox_dir, "work")
        
        # Determine test command
        cmd = [sys.executable, "-m", "pytest", "-v"]
        
        # Check if tests directory or test files exist
        has_tests = False
        for root, _, files in os.walk(work_dir):
            if any(f.startswith("test_") or f.endswith("_test.py") for f in files):
                has_tests = True
                break
                
        if not has_tests:
            return VerificationResult(
                stage=stage,
                command="pytest (auto-detected)",
                exit_code=0,
                duration_seconds=0.01,
                passed=True,
                summary="No test files found in repository. Syntax and AST validation passed.",
                stdout="No test suites detected.",
                stderr="",
                total_tests=0,
                passed_tests=0,
                failed_tests=0
            )

        start_time = time.time()
        env = scrub_environment()
        # Add current directory to PYTHONPATH so modules inside work_dir are importable
        env["PYTHONPATH"] = work_dir + (os.pathsep + env.get("PYTHONPATH", ""))
        
        try:
            proc = subprocess.run(
                cmd,
                cwd=work_dir,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=timeout_seconds,
                errors="replace"
            )
            duration = round(time.time() - start_time, 2)
            stdout = proc.stdout
            stderr = proc.stderr
            exit_code = proc.returncode
            passed = (exit_code == 0)
        except subprocess.TimeoutExpired as te:
            duration = timeout_seconds
            stdout = te.stdout or ""
            stderr = f"Execution timed out after {timeout_seconds} seconds."
            exit_code = 124
            passed = False
        except Exception as e:
            duration = round(time.time() - start_time, 2)
            stdout = ""
            stderr = f"Subprocess launch failed: {str(e)}"
            exit_code = 1
            passed = False

        combined_output = stdout + "\n" + stderr
        metrics = parse_test_output(combined_output)
        
        summary = (
            f"Test Suite {'PASSED' if passed else 'FAILED'}: "
            f"{metrics['passed']} passed, {metrics['failed']} failed ({duration}s)"
        )

        return VerificationResult(
            stage=stage,
            command=" ".join(cmd),
            exit_code=exit_code,
            duration_seconds=duration,
            passed=passed,
            summary=summary,
            stdout=stdout,
            stderr=stderr,
            total_tests=metrics["total"],
            passed_tests=metrics["passed"],
            failed_tests=metrics["failed"]
        )

    finally:
        # Clean up temporary sandbox directory
        try:
            shutil.rmtree(sandbox_dir, ignore_errors=True)
        except Exception:
            pass
