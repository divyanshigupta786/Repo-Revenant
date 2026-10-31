"""
Tests for Patch Engine
"""
import pytest
import os
import tempfile
from backend.app.engine.patcher import generate_unified_diff, validate_path_containment, apply_patch_proposal, PatchSecurityError
from backend.app.models import PatchProposal


def test_unified_diff_generation():
    orig = "def old_func():\n    return 1\n"
    prop = "def old_func():\n    return 2\n"
    diff = generate_unified_diff("test.py", orig, prop)
    assert "--- a/test.py" in diff
    assert "+++ b/test.py" in diff
    assert "-    return 1" in diff
    assert "+    return 2" in diff


def test_path_traversal_rejection():
    with tempfile.TemporaryDirectory() as tmp_dir:
        with pytest.raises(PatchSecurityError):
            validate_path_containment(tmp_dir, "../outside.py")

        with pytest.raises(PatchSecurityError):
            validate_path_containment(tmp_dir, "foo/../../bar.py")


def test_apply_patch_validates_syntax():
    with tempfile.TemporaryDirectory() as tmp_dir:
        patch = PatchProposal(
            id="P-001",
            file_path="good.py",
            original_code="x = 1\n",
            proposed_code="def broken_syntax(\n",
            unified_diff="",
            rationale="Test"
        )
        applied, err = apply_patch_proposal(tmp_dir, patch)
        assert not applied
        assert "SyntaxError" in err
