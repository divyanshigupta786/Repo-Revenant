"""
API Endpoints and Cancellation Unit Tests for RepoRevenant Backend
"""
import pytest
from starlette.testclient import TestClient
from backend.app.main import app, INVESTIGATIONS, CANCELLATIONS
from backend.app.models import InvestigationReport, StageEnum

client = TestClient(app)


def test_health_and_ready():
    r1 = client.get("/health")
    assert r1.status_code == 200
    assert r1.json()["status"] == "alive"

    r2 = client.get("/api/ready")
    assert r2.status_code == 200
    assert r2.json()["ready"] is True


def test_models_endpoint():
    resp = client.get("/api/models")
    assert resp.status_code == 200
    data = resp.json()
    assert "active_provider" in data
    assert "supported_providers" in data
    assert len(data["supported_providers"]) >= 2


def test_sample_repos_list():
    resp = client.get("/api/sample-repos")
    assert resp.status_code == 200
    repos = resp.json()
    assert len(repos) >= 2
    repo_ids = [r["id"] for r in repos]
    assert "sample-pyvault" in repo_ids
    assert "sample-math-matrix" in repo_ids


def test_investigation_creation_and_cancellation():
    # Create investigation
    create_resp = client.post("/api/investigations", json={
        "repo_source": "sample-pyvault",
        "source_type": "sample",
        "run_auto_verification": False
    })
    assert create_resp.status_code == 200
    inv = create_resp.json()
    inv_id = inv["id"]
    assert inv_id.startswith("rev-")

    # Cancel investigation
    cancel_resp = client.post(f"/api/investigations/{inv_id}/cancel")
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "cancelled"

    # Verify status changed
    get_resp = client.get(f"/api/investigations/{inv_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["status"] == "cancelled"


def test_file_explorer_endpoints():
    # Setup mock finished investigation for PyVault
    inv_id = "test-inv-explorer"
    INVESTIGATIONS[inv_id] = InvestigationReport(
        id=inv_id,
        repo_name="PyVault",
        repo_url_or_path="sample-pyvault",
        status=StageEnum.COMPLETED.value,
        created_at="2026-10-31 12:00:00"
    )

    # List files
    files_resp = client.get(f"/api/investigations/{inv_id}/files")
    assert files_resp.status_code == 200
    data = files_resp.json()
    assert "files" in data
    file_paths = [f["path"] for f in data["files"]]
    assert any("vault.py" in p for p in file_paths)

    # Read content
    content_resp = client.get(f"/api/investigations/{inv_id}/files/content", params={"path": "pyvault/vault.py"})
    assert content_resp.status_code == 200
    cdata = content_resp.json()
    assert "content" in cdata
    assert "import imp" in cdata["content"]
    assert cdata["total_lines"] > 10

    # Path traversal protection
    bad_resp = client.get(f"/api/investigations/{inv_id}/files/content", params={"path": "../../etc/passwd"})
    assert bad_resp.status_code == 400
