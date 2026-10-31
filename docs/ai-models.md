# RepoRevenant: AI Model Architecture & Selection Guide

## Overview

RepoRevenant decouples repository analysis from model inference via a provider abstraction layer (`AIAgentEngine`). The system defaults to local open-weight models, supports air-gapped deterministic synthesis, and enables developer-authorized cloud acceleration.

---

## Supported Model Providers

### 1. Local Open-Weight Runtime (Ollama / vLLM / LocalAI)
- **Default Endpoint**: `http://127.0.0.1:11434`
- **Recommended Models**:
  - `Llama-3-8B-RepoRevenant` / `llama3:8b`: Excellent zero-shot reasoning for standard library deprecations and AST migrations.
  - `mistral:7b`: Strong instruction-following capability for unified diff synthesis.
  - `codellama:7b` / `deepseek-coder:6.7b`: Code-specialized open-weight models for complex refactoring.
- **Privacy Advantage**: 100% on-device inference with zero source code leaving your machine.

### 2. Built-In Deterministic Forensic Synthesis (Air-Gapped)
- **Provider Identifier**: `heuristic_expert`
- **Description**: A rule-based forensic engine that parses Python AST and applies tested, deterministic remediation recipes for:
  - PEP 594 module purges (`imp` -> `importlib` and `types.ModuleType`, `cgi`, `pipes`).
  - Abstract collections migrations (`collections.Mapping` -> `collections.abc.Mapping`).
  - Python 2 print statement conversions.
  - Obsolete `mock` manifest cleanups.
- **Use Case**: Offline environments, resource-constrained laptops without GPU, or regulated environments requiring zero-AI certifiability.

### 3. Gemini API (Developer-Authorized Cloud Acceleration)
- **Provider Identifier**: `gemini`
- **Requirements**: Requires explicit configuration and setting `GEMINI_API_KEY` in environment.
- **Model**: `gemini-2.5-flash`

---

## Configuring Local Models via Ollama

To configure and run local open-weight models with RepoRevenant:

```bash
# 1. Install Ollama from https://ollama.ai
# 2. Pull an open-weight coding model
ollama pull llama3:8b

# 3. Verify Ollama is running
curl http://127.0.0.1:11434/api/tags

# 4. In RepoRevenant Settings (/app/settings):
#    - Model Provider: local_open_weight
#    - Model Identifier: llama3:8b
#    - Endpoint URL: http://127.0.0.1:11434
```

If Ollama is stopped or the endpoint times out, RepoRevenant automatically falls back to the deterministic forensic synthesis engine, ensuring uninterrupted investigation capability.
