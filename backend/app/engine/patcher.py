"""
RepoRevenant Unified Diff and Patch Engine
Generates unified diffs, validates file path containment, safely applies patches, and tests post-patch syntax.
"""
import os
import ast
import difflib
from typing import Tuple, Optional
from ..models import PatchProposal


class PatchSecurityError(Exception):
    pass


def generate_unified_diff(file_path: str, original_code: str, proposed_code: str) -> str:
    """Generate standard unified diff format compatible with patch utilities."""
    orig_lines = original_code.splitlines(keepends=True)
    prop_lines = proposed_code.splitlines(keepends=True)
    
    # Ensure newline at EOF for clean diffs
    if orig_lines and not orig_lines[-1].endswith("\n"):
        orig_lines[-1] += "\n"
    if prop_lines and not prop_lines[-1].endswith("\n"):
        prop_lines[-1] += "\n"
        
    diff = difflib.unified_diff(
        orig_lines,
        prop_lines,
        fromfile=f"a/{file_path}",
        tofile=f"b/{file_path}",
        lineterm=""
    )
    return "".join(diff)


def validate_path_containment(repo_dir: str, rel_file_path: str) -> str:
    """Ensure the target file path resides strictly inside the repository directory."""
    clean_rel = rel_file_path.replace("\\", "/").lstrip("/")
    if ".." in clean_rel.split("/"):
        raise PatchSecurityError(f"Path traversal detected: {rel_file_path}")
        
    target_abs = os.path.abspath(os.path.join(repo_dir, clean_rel))
    repo_abs = os.path.abspath(repo_dir)
    
    if not target_abs.startswith(repo_abs):
        raise PatchSecurityError(f"Target file '{clean_rel}' escapes repository boundary: {target_abs}")
        
    return target_abs


def apply_patch_proposal(repo_dir: str, patch: PatchProposal) -> Tuple[bool, Optional[str]]:
    """
    Safely writes proposed code to the target file after validating path and Python syntax.
    Returns (success, error_message).
    """
    try:
        target_path = validate_path_containment(repo_dir, patch.file_path)
    except PatchSecurityError as pe:
        return False, str(pe)

    # If it is a Python file, verify syntax prior to applying
    if target_path.endswith(".py"):
        try:
            ast.parse(patch.proposed_code, filename=patch.file_path)
        except SyntaxError as se:
            return False, f"Proposed patch introduces SyntaxError: {se.msg} at line {se.lineno}"

    # Backup original code to .bak
    backup_path = target_path + ".rev_bak"
    if os.path.exists(target_path) and not os.path.exists(backup_path):
        try:
            with open(target_path, "r", encoding="utf-8") as orig:
                with open(backup_path, "w", encoding="utf-8") as bak:
                    bak.write(orig.read())
        except Exception:
            pass

    # Write patched code
    try:
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        with open(target_path, "w", encoding="utf-8") as f:
            f.write(patch.proposed_code)
        return True, None
    except Exception as e:
        return False, f"Failed to write patch to {patch.file_path}: {str(e)}"


def rollback_patch(repo_dir: str, rel_file_path: str) -> bool:
    """Reverts a file to its backup if available."""
    try:
        target_path = validate_path_containment(repo_dir, rel_file_path)
        backup_path = target_path + ".rev_bak"
        if os.path.exists(backup_path):
            with open(backup_path, "r", encoding="utf-8") as bak:
                content = bak.read()
            with open(target_path, "w", encoding="utf-8") as f:
                f.write(content)
            os.remove(backup_path)
            return True
    except Exception:
        pass
    return False
