---
title: "RepoRevenant — Forgotten Code Deserves a Second Life"
published: false
description: "An open-source AI forensic platform that investigates, diagnoses, and resurrects abandoned Python repositories using local open-weight models — with zero cloud leakage."
tags: hacktoberfest, opensource, ai, python
cover_image: https://raw.githubusercontent.com/divyanshigupta786/Repo-Revenant/main/public/cover.jpg
---

<!-- 📋 PRE-PUBLISH CHECKLIST
  ✅ Cover Image      — Set above in front-matter (cover_image).
  ✅ Social Share     — Share on X/Twitter, LinkedIn, and your local dev community.
  ✅ Spark Discussion — Leave a note asking readers: "Have you ever had a repo you thought was beyond saving?"
  ✅ AI Disclosure    — Enabled via Advanced Options before publishing.
  ✅ Publish / Draft  — Remove `published: false` above when ready to go live.
-->

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 4: Ghost in the Machine](https://dev.to/challenges/hacktoberfest-week4-2026-10-26)*

---

## What I Built

**RepoRevenant** is an open-source, AI-powered software forensics and repository resurrection platform.

> *"Forgotten code deserves a second life."*

Software projects are abandoned every day — not because their core ideas were wrong, but because language runtimes move on. A repository written in 2017 often fails silently on Python 3.12+ because of PEP 594 removals (`imp`, `cgi`, `pipes`), `collections.abc` drift, and print-statement syntax errors.

RepoRevenant enforces a strict **epistemic hierarchy** — the AI is never trusted blindly:

| Tier | Source | Can Declare Resurrection? |
|:---|:---|:---|
| **Observed Facts** — AST errors, dependency scans | Python `ast`, GitPython | No (establishes baseline) |
| **AI Hypotheses** — root-cause diagnosis | Local Open-Weight LLM (Llama 3, Mistral) | No (unverified) |
| **Proposed Repairs** — unified diffs | AI Agent Engine + Unified Patcher | No (pending human approval) |
| **Human Approval** — developer consent | Interactive Review UI | Prerequisite |
| **Verified Outcome** — post-patch test suite exit code 0 | Ephemeral Pytest Sandbox | **YES — Empirical Proof** |

The theme "Ghost in the Machine" maps directly: the ghost is the dormant intelligence trapped inside an abandoned codebase. RepoRevenant is the medium that calls it back.

---

## Demo

🔗 **Live Demo**: [reporevenant.vercel.app](https://reporevenant.vercel.app) *(read-only sample repos)*

The live deployment runs the frontend on Vercel proxied to a secured backend exposing two controlled sample repositories:
- `sample-pyvault` — a legacy secrets manager with PEP 594 `imp` and `cgi` violations
- `sample-math-matrix` — a 2016 linear algebra library with `collections.Mapping` drift

**Local full-power run:**
```bash
git clone https://github.com/divyanshigupta786/Repo-Revenant.git
cd Repo-Revenant
npm install
python -m venv .venv && .venv\Scripts\activate
pip install -r backend/requirements.txt
npm run backend   # FastAPI on :8000
npm run dev       # Next.js on :3000
```

---

## Code

{% github divyanshigupta786/Repo-Revenant %}

**Key source files:**

- [`backend/app/main.py`](https://github.com/divyanshigupta786/Repo-Revenant/blob/main/backend/app/main.py) — FastAPI forensic daemon (7-stage pipeline)
- [`backend/app/engine/`](https://github.com/divyanshigupta786/Repo-Revenant/blob/main/backend/app/engine) — AST analyzer, AI agent engine, unified patcher
- [`backend/app/db.py`](https://github.com/divyanshigupta786/Repo-Revenant/blob/main/backend/app/db.py) — SQLite schema (investigations, findings, patches, test runs)
- [`components/HeroAnimations.jsx`](https://github.com/divyanshigupta786/Repo-Revenant/blob/main/components/HeroAnimations.jsx) — Three.js resurrection core + Anime.js timelines

---

## How I Built It

RepoRevenant is a **7-stage forensic pipeline** built around fully local, replaceable open-weight models:

### Backend — Python / FastAPI
1. **Intake** — Validates HTTPS Git URLs with SSRF protection (blocks RFC 1918 IPs, `169.254.169.254`)
2. **Inspector** — Parses `requirements.txt`/`setup.py`, discovers test suites, scans language composition
3. **Analyzer** — Deterministic Python AST pass: flags PEP 594 removals, `collections.abc` drift, Python 2 print statements — *no AI needed for facts*
4. **Verifier** — Executes baseline `pytest` in an isolated temporary sandbox (env-scrubbed, 30s timeout)
5. **AI Engine** — Sends AST evidence + source snippets to local Ollama (`llama3:8b`, `mistral:7b`, `codellama:7b`) for contextual root-cause hypotheses and repair synthesis
6. **Patcher** — Validates AI-generated diffs with `ast.parse()`, creates rollback backups, applies with human approval
7. **Reporter** — Exports Resurrection Certificates as `.md`, telemetry as `.json`, diffs as `.patch`

### Frontend — Next.js / Three.js
- **Three.js Resurrection Core** — 3D WebGL scene of fragmented archival nodes reconnecting
- **Anime.js** — Coordinated entrance timelines
- **Lenis** — Accessible smooth scroll (`prefers-reduced-motion` compliant)
- **Ctrl+K Command Palette** — Navigate views, trigger investigations, switch inference providers

### Open-Weight AI Models Used
| Model | Role |
|:---|:---|
| `llama3:8b` (Ollama) | Primary diagnosis + repair synthesis |
| `mistral:7b` (Ollama) | Alternate repair synthesis |
| `codellama:7b` (Ollama) | Code-specialized repair fallback |
| Built-in Heuristic Expert | Air-gapped deterministic fallback (zero neural API) |

---

## Why Does Open Innovation Matter?

If RepoRevenant were built on a closed API, it would be **fundamentally unusable for its own purpose.**

Abandoned repositories often contain **private intellectual property, proprietary algorithms, and trade secrets** — the exact code an organization cannot afford to send to a third-party cloud endpoint for "repair." The ability to run `llama3:8b` locally via Ollama means:

1. **Zero cloud leakage** — source code is analyzed on the host machine; nothing leaves
2. **Air-gapped operation** — the deterministic expert engine operates with zero neural API calls in restricted environments
3. **Swappable models** — the `MODEL_PROVIDER` env var lets developers substitute any OpenAI-compatible local endpoint. Llama 3 today, a future specialized code-repair model tomorrow
4. **Auditability** — because both the models and the forensic engine are open-source, every diagnostic decision can be traced, reproduced, and challenged

A closed API wouldn't just be a privacy risk — it would be a **trust violation** against the very repositories users are trying to resurrect.

---

## My Agent Session

*Session saved via DevRelay — link coming after final verification run.*

<!-- If you have a DevRelay session link, embed it here:
{% agent_session YOUR_SESSION_ID %}
-->

---

## The Spirit of It

There's a particular kind of sadness to an abandoned repository.

Someone cared enough to write it — to name it, to structure it, to leave comments explaining why. Then life happened: they moved on, the company pivoted, the project "finished." Five years later, `python setup.py install` explodes with `ModuleNotFoundError: No module named 'imp'`, and all that careful work becomes invisible.

RepoRevenant started from a single observation: **the code still knows what it wanted to do.** The AST is still there. The test assertions still describe the intended behavior. The ghost is still in the machine.

Watching the Three.js resurrection scene — fragmented archival nodes slowly pulling back together as the post-patch test suite returns exit code 0 — that's the moment it lands. Not because the AI did something magic, but because the code was never actually broken. It just needed someone to listen to it again.

---

## Prize Categories

- 🏆 **Ghost in the Machine** — *Core challenge category*
- 🤖 **Best Use of Open-Weight / Local AI** — Ollama + Llama 3 / Mistral / CodeLlama, fully replaceable
- 🔒 **Best Privacy-Preserving AI Application** — Zero cloud leakage, air-gapped deterministic fallback
- 🛠️ **Best Developer Tooling** — Forensic pipeline, unified diff reviewer, Resurrection Certificate export

---

<!-- 
  👋 Hey reader! Have you ever had a repo you thought was completely beyond saving?
  Drop your story in the comments — I'd love to hear it.
-->

<!-- Team Submissions: Please pick one member to publish the submission and credit teammates by listing their DEV usernames directly in the body of the post. -->

<!-- Thanks for participating! -->
