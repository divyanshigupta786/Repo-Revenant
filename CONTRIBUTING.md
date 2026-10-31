# Contributing to RepoRevenant

Thank you for your interest in contributing to **RepoRevenant: The Open-Source AI Agent That Resurrects Abandoned Software**.

RepoRevenant is built for the *Ghost in the Machine* open-source challenge to bring neglected code back to life using local open-weight AI and deterministic AST analysis.

---

## Code of Conduct

We are dedicated to providing a respectful, harassment-free experience for everyone. Please be considerate, collaborative, and constructive.

---

## Architectural Principles to Uphold

1. **JavaScript & JSX Only on Frontend**: Do not submit TypeScript (`.ts` or `.tsx`) files.
2. **Epistemic Discipline**: Never present an AI prediction as empirical proof. Only tests passing with exit code 0 declare resurrection.
3. **Local-First & Zero Egress**: Never send user code to external cloud APIs without explicit user consent.
4. **Isolated Sandboxing**: Never execute untrusted code directly on the host. Always scrub environment variables and enforce execution timeouts.
5. **Human Approval**: Code changes must never be force-merged onto user files without review.

---

## Areas Where Contributions Are Welcomed

### 1. New Deterministic AST Detectors
In `backend/app/engine/analyzer.py`:
- PEP 632: `distutils` deprecation and setuptools migration.
- PEP 654: `except*` and ExceptionGroup handling.
- Node.js CommonJS `require()` to ESM `import` rot.
- Outdated dependency pinned manifests.

### 2. Patch Synthesis Rules
In `backend/app/engine/ai_agent.py`:
- Improving heuristic expert rules.
- Expanding structured prompt engineering for local open-weight models.

### 3. Isolated Sandboxing Runtimes
In `backend/app/engine/verifier.py`:
- Support for container runtimes (gVisor, Firecracker microVMs, Docker non-root).

---

## Development Setup

```bash
# 1. Install frontend dependencies
npm install

# 2. Set up Python backend environment
python -m venv .venv
source .venv/bin/activate # On Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt

# 3. Run Backend Tests
python -m pytest backend/tests -v

# 4. Verify Production Build
npm run build
```

---

## Pull Request Process

1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/pep632-distutils-detector
   ```
2. Write unit tests for your changes in `backend/tests/`.
3. Verify that all tests pass: `python -m pytest backend/tests -v`.
4. Ensure the Next.js frontend builds cleanly: `npm run build`.
5. Submit your pull request with a descriptive title and evidence of verification.

Thank you for helping resurrect forgotten code!
