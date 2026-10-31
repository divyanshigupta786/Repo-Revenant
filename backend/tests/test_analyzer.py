"""
Tests for RepoRevenant Deterministic Forensic Analyzer
"""
import pytest
import os
import tempfile
from backend.app.engine.analyzer import analyze_repository
from backend.app.models import FindingCategory, Severity


def test_analyzer_detects_deprecated_imp_and_collections():
    with tempfile.TemporaryDirectory() as tmp_dir:
        test_file = os.path.join(tmp_dir, "legacy_module.py")
        code = """import imp
from collections import Mapping

class Storage(Mapping):
    pass
"""
        with open(test_file, "w", encoding="utf-8") as f:
            f.write(code)

        findings = analyze_repository(tmp_dir)
        categories = [f.category for f in findings]
        titles = [f.title for f in findings]

        assert any("imp" in t.lower() for t in titles)
        assert any("mapping" in t.lower() for t in titles)
        assert FindingCategory.DEPRECATION in categories


def test_analyzer_detects_syntax_errors():
    with tempfile.TemporaryDirectory() as tmp_dir:
        test_file = os.path.join(tmp_dir, "syntax_rot.py")
        with open(test_file, "w", encoding="utf-8") as f:
            f.write("def broken_syntax(\n")

        findings = analyze_repository(tmp_dir)
        assert len(findings) == 1
        assert findings[0].category == FindingCategory.SYNTAX
        assert findings[0].severity == Severity.CRITICAL
