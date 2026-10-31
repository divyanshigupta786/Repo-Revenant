# RepoRevenant: Backend API Reference

Base URL: `http://127.0.0.1:8000` (or `/api/backend` via Next.js proxy)

---

## System Endpoints

### `GET /health` or `GET /api/health`
Checks service health and active model configuration.
**Response (200 OK):**
```json
{
  "status": "alive",
  "service": "RepoRevenant Investigation Engine",
  "active_model": "Llama-3-8B-RepoRevenant",
  "provider": "local_open_weight",
  "total_investigations": 4
}
```

### `GET /api/ready`
Readiness probe checking database connectivity and sandbox filesystem readiness.

### `GET /api/models`
Inspects active AI model status and probes local Ollama runtime latency.

---

## Investigation Endpoints

### `GET /api/sample-repos`
Lists built-in realistic abandoned repositories (`sample-pyvault`, `sample-math-matrix`).

### `POST /api/investigations`
Initiates a new investigation pipeline.
**Request Body:**
```json
{
  "repo_source": "sample-pyvault",
  "source_type": "sample",
  "run_auto_verification": true
}
```

### `GET /api/investigations`
Returns all investigations ordered by newest first.

### `GET /api/investigations/{id}`
Returns full telemetry, AST findings, patch proposals, and verification metrics for an investigation.

### `POST /api/investigations/{id}/cancel`
Cancels an active or queued investigation and terminates work.

### `GET /api/investigations/{id}/events`
Returns forensic timeline events.

### `GET /api/investigations/{id}/findings`
Returns all deterministic AST findings for the investigation.

### `GET /api/investigations/{id}/patches`
Returns all AI-synthesized unified diff patches.

### `POST /api/investigations/{id}/patches/{patch_id}/approve`
Human approval to apply a patch proposal.

### `POST /api/investigations/{id}/patches/{patch_id}/reject`
Rejects a patch proposal and rolls back any applied modifications.

### `POST /api/investigations/{id}/patches/{patch_id}/verify`
Re-executes sandbox verification checks.

---

## Workspace & Explorer Endpoints

### `GET /api/investigations/{id}/files`
Returns file inventory of the isolated workspace with line counts, file sizes, and linked finding counts.

### `GET /api/investigations/{id}/files/content?path={filePath}`
Returns bounded source text for a file, with findings mapped to exact line numbers.

---

## Export Endpoints

- `GET /api/investigations/{id}/export/markdown` - Complete GitHub-style Markdown report.
- `GET /api/investigations/{id}/export/json` - Machine-readable investigation telemetry.
- `GET /api/investigations/{id}/export/patch` - Standard Git unified patch file.
- `GET /api/investigations/{id}/report.md` - Raw Markdown report.
- `GET /api/investigations/{id}/report.json` - Raw JSON report.

---

## Settings Endpoints

- `GET /api/settings` - Retrieve current configuration.
- `POST /api/settings` - Update model provider, endpoint URL, timeouts, and file size limits.
