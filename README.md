# REPOREVENANT
> **"Forgotten code deserves a second life."**  
> *Investigate the forgotten. Repair the broken. Prove the resurrection.*

RepoRevenant is an open-source, AI-powered software investigation and repository resurrection platform built for the **"Ghost in the Machine"** open-source AI challenge.

Software projects are frequently abandoned when maintainers move on, dependencies rot, or runtime platforms advance. A codebase written in 2017 often fails on modern runtimes—not because its core algorithms are flawed, but because language syntax shifted, standard library modules were purged (such as Python's PEP 594 removal of `imp`, `cgi`, and `pipes`), and abstract base classes drifted.

RepoRevenant inspects repository structure, extracts empirical Abstract Syntax Tree (AST) evidence, isolates the code in clean temporary sandboxes, executes baseline test suites to document exact pre-patch failures, synthesizes targeted repairs using replaceable open-weight AI models, and proves the resurrection by verifying post-patch test suites pass with exit code 0.

---

## Table of Contents
1. [Product Overview](#1-product-overview)
2. [Feature List](#2-feature-list)
3. [Architecture Diagram](#3-architecture-diagram)
4. [Technology Stack](#4-technology-stack)
5. [Prerequisites](#5-prerequisites)
6. [Installation](#6-installation)
7. [Environment Variables](#7-environment-variables)
8. [Local Model Setup](#8-local-model-setup)
9. [Backend Startup](#9-backend-startup)
10. [Frontend Startup](#10-frontend-startup)
11. [Database Setup & SQLite Schema](#11-database-setup--sqlite-schema)
12. [Docker Sandbox Configuration](#12-docker-sandbox-configuration)
13. [Running Tests](#13-running-tests)
14. [Production Build](#14-production-build)
15. [Deployment Architecture](#15-deployment-architecture)
16. [Security Model](#16-security-model)
17. [Privacy Considerations](#17-privacy-considerations)
18. [Known Limitations](#18-known-limitations)
19. [Troubleshooting](#19-troubleshooting)
20. [Contribution Instructions](#20-contribution-instructions)
21. [License](#21-license)

---

## 1. Product Overview

RepoRevenant enforces a strict epistemic hierarchy: **The system never treats an AI-generated explanation as proof that a repair works.**

| Tier | Nature | Source | Can Declare Resurrection? |
| :--- | :--- | :--- | :--- |
| **Observed Facts** | Deterministic code AST errors, syntax errors, manifest dependencies | Python AST, GitPython, OS Subprocess | No (Establishes baseline) |
| **AI Hypotheses** | Contextual diagnosis of root causes | Local Open-Weight LLM (Llama 3, Mistral) | No (Unverified assumption) |
| **Proposed Repairs** | Unified diff modifications | AIAgentEngine + Unified Patcher | No (Pending human approval) |
| **Human Approval** | Developer consent to apply patch | Interactive Review UI | Prerequisite to apply |
| **Verified Outcome** | Sandboxed post-patch test suite exit code 0 | Ephemeral Pytest Sandbox Execution | **YES (Empirical Proof)** |

---

## 2. Feature List

- **Safe Remote & Local Intake**: Validates HTTPS Git URLs with SSRF protection against RFC 1918 private IPs and cloud metadata addresses (`169.254.169.254`).
- **Deterministic Python AST Analyzer**: Finds PEP 594 removed modules (`imp`, `cgi`, `pipes`), `collections.abc` drift (`Mapping`, `Iterable`), and Python 2 syntax errors without relying on language models.
- **Replaceable Open-Weight AI Integration**: Supports Ollama (`llama3:8b`, `mistral:7b`, `codellama:7b`), OpenAI-compatible runtimes, or air-gapped deterministic expert synthesis.
- **Isolated Sandbox Execution**: Executes baseline and post-patch test runs inside temporary directories with scrubbed environment variables and a strict 30-second timeout.
- **Unified Diff Reviewer & Rollback**: Visual side-by-side and unified diff viewer with single-click patch approval, rejection, and backup restoration.
- **Interactive Repository Explorer**: Browse the workspace directory tree, view bounded source code with line numbers, and inspect line-level AST finding annotations.
- **Keyboard-Accessible Command Palette (`Ctrl+K` / `Cmd+K`)**: Rapidly navigate views, trigger investigations, and access system settings.
- **Export Formats**: Download complete Resurrection Certificates in Markdown (`.md`), telemetry in JSON (`.json`), or unified Git patches (`.patch`).
- **Three.js Resurrection Core**: Interactive 3D scene representing fragmented archives reconnecting upon resurrection.

---

## 3. Architecture Diagram

```
+---------------------------------------------------------------------------------+
|                               NEXT.JS APP ROUTER                                |
|  - Three.js Resurrection Core (Dynamic WebGL Scene)                             |
|  - Anime.js Coordinated Entrance Timelines                                      |
|  - Lenis Accessible Smooth Scroll                                               |
|  - Interactive Unified Diff Viewer & Forensic Dashboard                         |
|  - Keyboard Accessible Command Palette (Ctrl+K)                                 |
+---------------------------------------+-----------------------------------------+
                                        | HTTP / JSON API Proxy (/api/backend/*)
                                        v
+---------------------------------------------------------------------------------+
|                          PYTHON FASTAPI FORENSIC DAEMON                         |
|  - Stage 1: Intake (Safe clone, SSRF protection, path containment)             |
|  - Stage 2: Inspector (Manifest parser, language scanner, test discovery)      |
|  - Stage 3: Analyzer (Deterministic Python AST detection of PEP 594 & syntax)  |
|  - Stage 4: Verifier (Isolated sandbox baseline pytest execution)              |
|  - Stage 5: AI Engine (Replaceable Open-Weight Models: Ollama / Llama 3)       |
|  - Stage 6: Patcher (Unified diff synthesis, rollback backups, AST check)      |
|  - Stage 7: Reporter (Markdown, JSON, and unified patch export)                 |
+---------------------------------------+-----------------------------------------+
                                        | Subprocess Isolation
                                        v
+---------------------------------------------------------------------------------+
|                       TEMPORARY WORKSPACE SANDBOX DIRECTORY                     |
|  - Environment Scrubbing (Stripped API keys & credentials)                      |
|  - Timeout Enforcement (Max 30s per test execution)                            |
|  - Zero Network Subprocess Policy                                               |
+---------------------------------------------------------------------------------+
```

---

## 4. Technology Stack

- **Frontend**: Next.js 16 (App Router, JavaScript/JSX only, zero TS/TSX)
- **Styling**: Tailwind CSS & CSS Custom Property Tokens (`globals.css`)
- **3D Graphics**: Three.js (dynamic import with static WebGL fallback)
- **Animation**: Anime.js v4
- **Smooth Scroll**: Lenis (with `prefers-reduced-motion` compliance)
- **Icons**: Lucide React
- **Backend**: Python 3.10+ / 3.14, FastAPI, Uvicorn, Pydantic v2
- **Persistence**: SQLite with transactional foreign keys (`reporevenant.db`)
- **Deterministic Forensics**: Python `ast`, GitPython, Pytest discovery
- **Inference**: Ollama (Open-Weight), OpenAI-compatible local endpoints, or Built-In Deterministic Heuristic Engine

---

## 5. Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python**: v3.10 to v3.14
- **Git**
- *(Optional)* **Ollama**: For local open-weight neural inference (`https://ollama.ai`)

---

## 6. Installation

```bash
# 1. Clone repository
git clone https://github.com/example/reporevenant.git
cd reporevenant

# 2. Install frontend dependencies
npm install

# 3. Create Python virtual environment and install backend requirements
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r backend/requirements.txt
```

---

## 7. Environment Variables

Copy `.env.example` to `.env`:
```env
BACKEND_HOST=127.0.0.1
BACKEND_PORT=8000
MODEL_PROVIDER=local_open_weight
MODEL_NAME=Llama-3-8B-RepoRevenant
LOCAL_LLM_ENDPOINT=http://127.0.0.1:11434
TEST_TIMEOUT_SECONDS=30
MAX_INSPECTED_FILE_SIZE_KB=512
ENABLE_ISOLATED_SANDBOXES=true
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

---

## 8. Local Model Setup

RepoRevenant defaults to local-first inference using Ollama:

```bash
# Pull an open-weight model
ollama pull llama3:8b

# Verify Ollama is serving locally
curl http://127.0.0.1:11434/api/tags
```

If Ollama is not installed or offline, RepoRevenant automatically falls back to its **Built-In Deterministic Forensic Engine**, synthesizing tested repairs for common Python deprecations with zero external dependencies.

---

## 9. Backend Startup

Run the FastAPI daemon on port 8000:
```bash
npm run backend
# Or directly:
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
Health telemetry will be accessible at `http://127.0.0.1:8000/health`.

---

## 10. Frontend Startup

Run the Next.js development server on port 3000:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 11. Database Setup & SQLite Schema

RepoRevenant uses SQLite (`reporevenant.db`) initialized automatically on startup via `backend/app/db.py`.

### Database Tables:
- `investigations`: ID, repo identity, status, duration, health scores, summary.
- `findings`: Evidence identifiers, severity, file path, line numbers, AI hypotheses.
- `patches`: Unified diffs, original code, proposed code, approval states.
- `test_runs`: Stage (baseline/post_patch), exit codes, test counts, logs.
- `timeline_events`: Sequenced event logs with timestamps.

---

## 12. Docker Sandbox Configuration

For untrusted repositories in multi-tenant environments, run test verifications in Docker:
```dockerfile
FROM python:3.12-slim
RUN useradd -m sandboxuser
USER sandboxuser
WORKDIR /workspace
ENV PYTHONDONTWRITEBYTECODE=1
CMD ["pytest", "-v"]
```
Run with memory, CPU, and network restrictions:
```bash
docker run --rm --network none --memory 512m --cpus 1.0 -v /tmp/workspace:/workspace:ro reporevenant-sandbox
```

---

## 13. Running Tests

Run the backend test suite:
```bash
python -m pytest backend/tests -v
```
All 15 tests verify:
- SSRF prevention & intake protocol allowlists
- AST deprecation & syntax detection
- Unified diff generation & path containment
- SQLite database persistence & relations
- API endpoints, readiness probe, and repository file explorer
- Full end-to-end resurrection of defective sample repositories

---

## 14. Production Build

Verify Next.js compilation:
```bash
npm run build
```
Builds static and dynamic routes with 0 TypeScript/JSX errors.

---

## 15. Deployment Architecture

- **Local Mode (Recommended)**: Frontend and backend run on `localhost`. Source code never leaves the host machine.
- **Public Demonstration Mode**: Frontend deployed on a standard Next.js hosting platform (Vercel, Node.js server), proxied to a secured backend with read-only access to controlled sample repositories (`sample-pyvault`, `sample-math-matrix`).

---

## 16. Security Model

- **SSRF Defense**: Rejects `file://`, `ftp://`, internal loopbacks (`127.0.0.0/8`), and AWS/GCP metadata endpoints (`169.254.169.254`).
- **Path Traversal Guards**: Rejects patch targets or explorer requests attempting directory escape (`..`).
- **Environment Scrubbing**: Test subprocesses execute with stripped API keys and system tokens.
- **Timeouts**: All test runs terminate after 30 seconds.
- **Syntax Validation**: Python patches are parsed with `ast.parse()` prior to disk write.

---

## 17. Privacy Considerations

- **Zero Cloud Leak**: Source code is analyzed locally.
- **Air-Gapped Mode**: The deterministic expert engine operates with zero neural API calls.
- **Data Retention**: All telemetry is stored locally in `reporevenant.db` and can be purged at any time.

---

## 18. Known Limitations

- Python standard library AST detection focuses primarily on Python 3.8 through 3.13 deprecations (PEP 594, collections drift, print statements).
- Repositories requiring native C-extensions or external database servers (e.g. PostgreSQL, Redis) require mock configurations or external Docker service containers.

---

## 19. Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `Local Engine: Offline` in navbar | FastAPI backend is not running | Run `npm run backend` in terminal |
| `Inference runtime unreachable` | Ollama service is stopped | Start Ollama (`ollama serve`) or switch to `heuristic_expert` in Settings |
| `Path traversal attempt detected` | Patch contains `..` path | Ensure all paths are relative to workspace root |
| Port 8000 already in use | Stale uvicorn process | Run `npx kill-port 8000` or stop background process |

---

## 20. Contribution Instructions

Contributions are welcome under the **Apache-2.0 License**! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for full architecture and coding guidelines.

---

## 21. License

Apache License 2.0. See [LICENSE](LICENSE) for details.
