"""
RepoRevenant Deterministic Forensic Analyzer
Analyzes Python source files using Python's Abstract Syntax Tree (AST) to detect syntax errors,
removed modules, deprecated collections imports, broken idioms, and manifest rots.
"""
import ast
import os
import re
from typing import List, Dict, Any, Optional
from ..models import Finding, FindingCategory, Severity

DEPRECATED_MODULES = {
    "imp": {
        "title": "Deprecated module 'imp' removed in Python 3.12+",
        "severity": Severity.CRITICAL,
        "category": FindingCategory.DEPRECATION,
        "replacement": "importlib or importlib.util",
        "description": "The 'imp' module was deprecated since Python 3.4 and completely removed in Python 3.12. Code attempting to import 'imp' will raise ModuleNotFoundError."
    },
    "cgi": {
        "title": "Deprecated standard module 'cgi' removed in Python 3.13",
        "severity": Severity.CRITICAL,
        "category": FindingCategory.DEPRECATION,
        "replacement": "urllib.parse or multipart libraries",
        "description": "PEP 594 removed the 'cgi' module in Python 3.13."
    },
    "pipes": {
        "title": "Deprecated module 'pipes' removed in Python 3.13",
        "severity": Severity.CRITICAL,
        "category": FindingCategory.DEPRECATION,
        "replacement": "subprocess or shlex",
        "description": "The 'pipes' module was removed in Python 3.13 in favor of 'subprocess'."
    },
    "distutils": {
        "title": "Deprecated build tool 'distutils' removed in Python 3.12+",
        "severity": Severity.WARNING,
        "category": FindingCategory.DEPRECATION,
        "replacement": "setuptools or packaging",
        "description": "Standard library distutils was deprecated in 3.10 and removed in 3.12."
    }
}

COLLECTIONS_ABC_CLASSES = {
    "Mapping", "MutableMapping", "Iterable", "Callable", "Sequence",
    "MutableSequence", "Set", "MutableSet", "Container", "Hashable"
}


class ASTForensicVisitor(ast.NodeVisitor):
    def __init__(self, file_path: str, code_lines: List[str]):
        self.file_path = file_path
        self.code_lines = code_lines
        self.findings: List[Finding] = []
        self._finding_counter = 1

    def _add_finding(self, category: FindingCategory, severity: Severity, title: str,
                     description: str, line_no: int, evidence: str, recommended_action: str):
        fid = f"REV-{category.value.upper()[:3]}-{len(self.findings) + 1:03d}"
        self.findings.append(Finding(
            id=fid,
            category=category,
            severity=severity,
            title=title,
            description=description,
            file_path=self.file_path,
            line_number=line_no,
            evidence=evidence.strip(),
            detection_method="deterministic_ast",
            confidence=1.0,
            recommended_action=recommended_action
        ))

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            base_mod = alias.name.split(".")[0]
            if base_mod in DEPRECATED_MODULES:
                info = DEPRECATED_MODULES[base_mod]
                evidence = self.code_lines[node.lineno - 1] if node.lineno <= len(self.code_lines) else f"import {alias.name}"
                self._add_finding(
                    category=info["category"],
                    severity=info["severity"],
                    title=info["title"],
                    description=info["description"],
                    line_no=node.lineno,
                    evidence=evidence,
                    recommended_action=f"Replace '{base_mod}' with '{info['replacement']}'"
                )
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        module = node.module or ""
        # Check from imp import ...
        base_mod = module.split(".")[0]
        if base_mod in DEPRECATED_MODULES:
            info = DEPRECATED_MODULES[base_mod]
            evidence = self.code_lines[node.lineno - 1] if node.lineno <= len(self.code_lines) else f"from {module} import ..."
            self._add_finding(
                category=info["category"],
                severity=info["severity"],
                title=info["title"],
                description=info["description"],
                line_no=node.lineno,
                evidence=evidence,
                recommended_action=f"Migrate imports from '{module}' to '{info['replacement']}'"
            )
            
        # Check from collections import Mapping (deprecated, now collections.abc)
        if module == "collections":
            for alias in node.names:
                if alias.name in COLLECTIONS_ABC_CLASSES:
                    evidence = self.code_lines[node.lineno - 1] if node.lineno <= len(self.code_lines) else f"from collections import {alias.name}"
                    self._add_finding(
                        category=FindingCategory.DEPRECATION,
                        severity=Severity.CRITICAL,
                        title=f"Import of '{alias.name}' from collections (removed in Python 3.10+)",
                        description=f"Importing {alias.name} directly from 'collections' raises AttributeError in modern Python. It was moved to 'collections.abc'.",
                        line_no=node.lineno,
                        evidence=evidence,
                        recommended_action=f"Change import to: 'from collections.abc import {alias.name}'"
                    )
        self.generic_visit(node)

    def visit_Attribute(self, node: ast.Attribute):
        # Detect collections.Mapping
        if isinstance(node.value, ast.Name) and node.value.id == "collections":
            if node.attr in COLLECTIONS_ABC_CLASSES:
                evidence = self.code_lines[node.lineno - 1] if node.lineno <= len(self.code_lines) else f"collections.{node.attr}"
                self._add_finding(
                    category=FindingCategory.DEPRECATION,
                    severity=Severity.CRITICAL,
                    title=f"Direct access to 'collections.{node.attr}'",
                    description=f"'collections.{node.attr}' was moved to 'collections.abc.{node.attr}'. Direct access fails with AttributeError on Python 3.10+.",
                    line_no=node.lineno,
                    evidence=evidence,
                    recommended_action=f"Update reference to 'collections.abc.{node.attr}'"
                )
        self.generic_visit(node)


def analyze_repository(repo_dir: str) -> List[Finding]:
    """Deterministically analyze all supported source files in the repository."""
    all_findings: List[Finding] = []
    
    for root, dirs, files in os.walk(repo_dir):
        # Prune test caches and venvs
        dirs[:] = [d for d in dirs if d not in {".git", ".venv", "venv", "__pycache__", "build", "dist"}]
        
        for file in files:
            if not file.endswith(".py"):
                continue
                
            abs_path = os.path.join(root, file)
            rel_path = os.path.relpath(abs_path, repo_dir).replace("\\", "/")
            
            try:
                with open(abs_path, "r", encoding="utf-8") as f:
                    code = f.read()
            except UnicodeDecodeError:
                continue
                
            code_lines = code.splitlines()
            
            # 1. Parse AST to detect syntax errors
            try:
                tree = ast.parse(code, filename=rel_path)
                visitor = ASTForensicVisitor(rel_path, code_lines)
                visitor.visit(tree)
                all_findings.extend(visitor.findings)
            except SyntaxError as e:
                evidence = code_lines[e.lineno - 1] if e.lineno and e.lineno <= len(code_lines) else str(e.text or "")
                all_findings.append(Finding(
                    id=f"REV-SYN-{len(all_findings) + 1:03d}",
                    category=FindingCategory.SYNTAX,
                    severity=Severity.CRITICAL,
                    title=f"Python SyntaxError in {rel_path}",
                    description=f"Parsing error: {e.msg} at line {e.lineno}, column {e.offset}.",
                    file_path=rel_path,
                    line_number=e.lineno,
                    evidence=evidence.strip(),
                    detection_method="python_ast_parser",
                    confidence=1.0,
                    recommended_action="Correct python syntax for modern Python 3.x standards."
                ))
                
    # 2. Check manifests for outdated dependencies
    req_path = os.path.join(repo_dir, "requirements.txt")
    if os.path.exists(req_path):
        try:
            with open(req_path, "r", encoding="utf-8") as f:
                for line_idx, line in enumerate(f, 1):
                    raw = line.strip()
                    if raw.lower().startswith("mock"):
                        all_findings.append(Finding(
                            id=f"REV-DEP-{len(all_findings) + 1:03d}",
                            category=FindingCategory.DEPENDENCY,
                            severity=Severity.WARNING,
                            title="Standalone 'mock' dependency in requirements.txt",
                            description="The standalone 'mock' library is obsolete in Python 3. Standard 'unittest.mock' should be used instead.",
                            file_path="requirements.txt",
                            line_number=line_idx,
                            evidence=raw,
                            detection_method="manifest_linter",
                            confidence=0.95,
                            recommended_action="Remove standalone 'mock' from requirements.txt and use 'from unittest import mock'."
                        ))
        except Exception:
            pass
            
    return all_findings
