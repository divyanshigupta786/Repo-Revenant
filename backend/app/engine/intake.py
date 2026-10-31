"""
RepoRevenant Intake Engine
Safely ingests remote Git repositories or validated local project paths into sandboxed working directories.
"""
import os
import re
import shutil
import ipaddress
import urllib.parse
from typing import Tuple, Optional
import git

WORKSPACE_BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "workspaces"))
SAMPLE_REPOS_BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "sample_repos"))


class IntakeSecurityError(Exception):
    pass


def is_safe_remote_url(url: str) -> Tuple[bool, Optional[str]]:
    """Validate remote Git repository URL to prevent SSRF and unsafe protocols."""
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in ("https", "http"):
        return False, f"Unsupported URL scheme: {parsed.scheme}. Only HTTPS/HTTP are permitted."
    
    hostname = parsed.hostname
    if not hostname:
        return False, "Invalid or missing hostname in repository URL."
    
    # Check if host is an IP address
    try:
        ip = ipaddress.ip_address(hostname)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            return False, f"Access to private or local IP ranges ({hostname}) is strictly prohibited."
    except ValueError:
        pass  # Hostname is a domain name
    
    # Reject common internal domains
    if hostname.lower() in ("localhost", "127.0.0.1", "0.0.0.0", "internal", "metadata.google.internal"):
        return False, f"Access to internal host '{hostname}' is blocked."
        
    return True, None


def is_safe_local_path(path: str, allowed_roots: Optional[list] = None) -> Tuple[bool, Optional[str]]:
    """Verify local repository path does not traverse outside authorized workspace or samples."""
    resolved = os.path.abspath(os.path.expanduser(path))
    if not os.path.exists(resolved):
        return False, f"Path does not exist: {resolved}"
    if not os.path.isdir(resolved):
        return False, f"Path is not a directory: {resolved}"
        
    # Check if allowed
    if allowed_roots is None:
        allowed_roots = [
            SAMPLE_REPOS_BASE,
            WORKSPACE_BASE,
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")),
        ]
    
    is_allowed = any(resolved.startswith(os.path.abspath(root)) for root in allowed_roots)
    if not is_allowed:
        return False, f"Path '{resolved}' is outside permitted workspace roots."
        
    return True, None


def ingest_repository(investigation_id: str, repo_source: str, source_type: str = "sample") -> str:
    """
    Ingests the target repository into an isolated workspace directory.
    Returns the absolute path to the prepared repository workspace.
    """
    dest_dir = os.path.join(WORKSPACE_BASE, investigation_id, "repo")
    os.makedirs(dest_dir, exist_ok=True)
    
    if source_type == "sample":
        # Resolve sample repo
        sample_path = os.path.join(SAMPLE_REPOS_BASE, repo_source)
        if not os.path.exists(sample_path):
            # Fallback check if full name was given
            matched = False
            for entry in os.listdir(SAMPLE_REPOS_BASE):
                if entry == repo_source or entry.startswith(repo_source):
                    sample_path = os.path.join(SAMPLE_REPOS_BASE, entry)
                    matched = True
                    break
            if not matched:
                raise IntakeSecurityError(f"Sample repository '{repo_source}' not found in {SAMPLE_REPOS_BASE}")
        
        # Copy to destination
        if os.path.exists(dest_dir):
            shutil.rmtree(dest_dir)
        shutil.copytree(sample_path, dest_dir)
        return dest_dir

    elif source_type == "local":
        safe, err = is_safe_local_path(repo_source)
        if not safe:
            raise IntakeSecurityError(err)
        resolved_src = os.path.abspath(repo_source)
        if os.path.exists(dest_dir):
            shutil.rmtree(dest_dir)
        shutil.copytree(resolved_src, dest_dir)
        return dest_dir

    elif source_type == "git":
        safe, err = is_safe_remote_url(repo_source)
        if not safe:
            raise IntakeSecurityError(err)
        if os.path.exists(dest_dir):
            shutil.rmtree(dest_dir)
        try:
            # Clone with depth=1 to prevent massive repo downloads
            git.Repo.clone_from(repo_source, dest_dir, depth=1)
            return dest_dir
        except Exception as e:
            raise IntakeSecurityError(f"Git clone failed: {str(e)}")
    else:
        raise IntakeSecurityError(f"Unknown repository source type: {source_type}")
