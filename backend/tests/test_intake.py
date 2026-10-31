"""
Tests for Intake Security
"""
import pytest
from backend.app.engine.intake import is_safe_remote_url, is_safe_local_path


def test_reject_unsafe_protocols():
    safe, err = is_safe_remote_url("file:///etc/passwd")
    assert not safe
    assert "Unsupported URL scheme" in err

    safe, err = is_safe_remote_url("ssh://git@github.com/repo.git")
    assert not safe


def test_reject_ssrf_internal_ips():
    safe, err = is_safe_remote_url("http://127.0.0.1:8080/repo.git")
    assert not safe
    assert "blocked" in err.lower() or "prohibited" in err.lower()

    safe, err = is_safe_remote_url("https://169.254.169.254/meta-data")
    assert not safe
    assert "prohibited" in err.lower()


def test_allow_safe_public_url():
    safe, err = is_safe_remote_url("https://github.com/torvalds/linux.git")
    assert safe
    assert err is None
