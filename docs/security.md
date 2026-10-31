# RepoRevenant: Security & Sandboxing Model

## Threat Model & Core Security Guarantees

RepoRevenant handles untrusted repositories and AI-synthesized patches. Its security model ensures that untrusted code cannot compromise the host environment.

---

## 1. Subprocess Isolation & Environment Scrubbing

When executing test suites or inspecting code:
- **Environment Variable Scrubbing**: Before launching any subprocess, the environment is stripped of all API keys, access tokens, SSH credentials, and sensitive configuration.
  ```python
  clean_env = {
      "PATH": os.environ.get("PATH", ""),
      "PYTHONPATH": repo_dir,
      "LANG": "en_US.UTF-8",
  }
  ```
- **Execution Timeout Bounds**: Every test execution is bounded by a strict 30-second timeout. Subprocesses that hang or execute infinite loops are terminated with `SIGKILL`.
- **Zero Host Mutation**: Tests execute inside temporary copies (`tempfile.mkdtemp`) or disposable workspaces. The original repository is never modified directly.

---

## 2. Server-Side Request Forgery (SSRF) Prevention

Remote repository intake (`backend/app/engine/intake.py`) enforces strict network boundary validation:
- **Protocol Allowlist**: Only `https://` schemes are permitted. Schemes like `file://`, `ftp://`, `ssh://`, or `gopher://` are rejected.
- **Private IP Blocking**: Hostnames are resolved to IP addresses prior to fetching. Private, loopback, link-local, and multicast addresses are blocked:
  - `127.0.0.0/8` (Loopback)
  - `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (RFC 1918 Private)
  - `169.254.169.254` (Cloud Metadata Services)
  - `::1`, `fc00::/7` (IPv6 Private/Loopback)

---

## 3. Path Traversal & Patch Safety

- **Path Containment Validation**:
  Every file path in proposed patches and explorer requests is validated against directory traversal attacks:
  ```python
  normalized = os.path.normpath(file_path)
  if normalized.startswith("..") or os.path.isabs(normalized):
      raise SecurityException("Path traversal attempt detected.")
  ```
- **Pre-Application Syntax Validation**:
  Python patches must pass `ast.parse()` syntax verification before they are written to disk. Corrupted or malicious code with invalid syntax is rejected immediately.
- **Human Review Requirement**:
  No patch is automatically merged into a production repository without human developer review and explicit approval.

---

## 4. Privacy & Zero-Egress

- **Local Inference by Default**: Models run via local open-weights (Ollama / vLLM / LocalAI) over `localhost:11434`.
- **Air-Gapped Option**: The built-in deterministic heuristic engine operates without external model calls, providing complete air-gapped readiness.
- **No Secret Leakage**: Forensic reports and timeline logs sanitize tokens and private repository credentials before saving to SQLite.
