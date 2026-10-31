"""
RepoRevenant Inspection Engine
Discovers directory structure, detected languages, dependency manifests, and test configurations.
"""
import os
from typing import Dict, Any, List

IGNORED_DIRS = {
    ".git", ".venv", "venv", "__pycache__", "node_modules",
    ".pytest_cache", ".ruff_cache", "build", "dist", ".egg-info"
}
IGNORED_EXTENSIONS = {
    ".pyc", ".pyo", ".pyd", ".so", ".dll", ".dylib", ".exe",
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".zip", ".tar", ".gz"
}

EXTENSION_LANGUAGE_MAP = {
    ".py": "Python",
    ".js": "JavaScript",
    ".jsx": "JavaScript (React)",
    ".ts": "TypeScript",
    ".tsx": "TypeScript (React)",
    ".json": "JSON",
    ".toml": "TOML",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".md": "Markdown",
    ".rst": "reStructuredText",
    ".sh": "Shell",
    ".html": "HTML",
    ".css": "CSS",
    ".sql": "SQL",
}


def inspect_repository(repo_dir: str) -> Dict[str, Any]:
    """Inspects repository files, manifests, and test infrastructure."""
    files_list = []
    language_counts: Dict[str, int] = {}
    total_lines = 0
    dependencies = []
    has_tests = False
    test_framework = "unknown"
    test_files = []
    manifest_files = []
    
    for root, dirs, files in os.walk(repo_dir):
        # Prune ignored directories
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS and not d.endswith(".egg-info")]
        
        for file in files:
            rel_path = os.path.relpath(os.path.join(root, file), repo_dir).replace("\\", "/")
            ext = os.path.splitext(file)[1].lower()
            
            if ext in IGNORED_EXTENSIONS:
                continue
                
            abs_path = os.path.join(root, file)
            file_size = os.path.getsize(abs_path)
            
            # Count lines for text files
            line_count = 0
            if file_size < 1_000_000:  # skip huge files
                try:
                    with open(abs_path, "r", encoding="utf-8", errors="ignore") as f:
                        lines = f.readlines()
                        line_count = len(lines)
                        total_lines += line_count
                except Exception:
                    pass
            
            lang = EXTENSION_LANGUAGE_MAP.get(ext, "Plain Text")
            language_counts[lang] = language_counts.get(lang, 0) + 1
            
            # Check tests
            if "test" in file.lower() or "tests/" in rel_path.lower():
                has_tests = True
                test_files.append(rel_path)
                
            # Check manifests
            if file in ("requirements.txt", "pyproject.toml", "setup.py", "Pipfile", "package.json"):
                manifest_files.append(rel_path)
                if file == "requirements.txt":
                    try:
                        with open(abs_path, "r", encoding="utf-8", errors="ignore") as f:
                            for line in f:
                                l = line.strip()
                                if l and not l.startswith("#"):
                                    dependencies.append(l)
                    except Exception:
                        pass
                        
            files_list.append({
                "path": rel_path,
                "name": file,
                "size_bytes": file_size,
                "lines": line_count,
                "language": lang
            })

    # Determine test runner
    if any(f.endswith(".py") for f in test_files):
        test_framework = "pytest"
    elif any("package.json" in f for f in manifest_files):
        test_framework = "npm test"

    # Sort languages by prevalence
    sorted_languages = sorted(language_counts.keys(), key=lambda k: language_counts[k], reverse=True)
    
    return {
        "files_count": len(files_list),
        "total_lines": total_lines,
        "languages": sorted_languages[:5],
        "manifest_files": manifest_files,
        "dependencies": dependencies[:30],
        "has_tests": has_tests,
        "test_framework": test_framework,
        "test_files": test_files,
        "files": files_list[:150]  # bounded list for performance
    }
