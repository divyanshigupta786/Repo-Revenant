# RepoRevenant: Development & Testing Guide

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python**: v3.10 to v3.14
- **Git**

---

## Local Setup

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/example/reporevenant.git
cd reporevenant

# Frontend dependencies
npm install

# Backend dependencies
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r backend/requirements.txt
```

---

## Running the Development Servers

### Terminal 1: Python FastAPI Backend
```bash
npm run backend
# Runs uvicorn on http://127.0.0.1:8000 with auto-reload
```

### Terminal 2: Next.js Frontend
```bash
npm run dev
# Runs Next.js App Router on http://localhost:3000
```

---

## Running Automated Tests

### Backend Unit & Integration Tests (pytest)
```bash
python -m pytest backend/tests -v
```
Tests cover:
- SSRF prevention & intake protocol allowlists (`test_intake.py`)
- Python AST deprecation & syntax detection (`test_analyzer.py`)
- Unified diff generation & path containment validation (`test_patcher.py`)
- SQLite persistence & entity relations (`test_db.py`)
- API endpoints, models probe, and file explorer (`test_api.py`)
- Complete end-to-end resurrection workflow with defective sample repo (`test_resurrection_flow.py`)

### Production Frontend Build
```bash
npm run build
```
Verifies Next.js App Router compilation, static page generation, font optimization, and bundling.
