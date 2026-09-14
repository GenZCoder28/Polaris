import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.main import app
from backend.database import Base, get_db
from backend.models import Expedition, PersonnelExpedition

# SQLite in-memory engine for fast testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_create_expedition_success():
    payload = {
        "expedition_id": "EXP-2026-TEST",
        "expedition_name": "Test Cryosphere Campaign",
        "expedition_code": "TEST-45",
        "expedition_year": 2026,
        "target_region": "Larsemann Hills",
        "lead_organization": "NCPOR",
        "expedition_leader": "Dr. Test Leader",
        "start_date": "2026-11-01",
        "end_date": "2027-03-01",
        "status": "Planned"
    }
    response = client.post("/api/expeditions", json=payload, headers={"x-user-role": "Expedition Manager"})
    assert response.status_code == 201
    data = response.json()
    assert data["expedition_id"] == "EXP-2026-TEST"
    assert data["status"] == "Planned"

def test_create_duplicate_expedition_id():
    payload = {
        "expedition_id": "EXP-DUP-1",
        "expedition_name": "Test First",
        "expedition_code": "CODE-1",
        "expedition_year": 2026,
        "target_region": "Larsemann Hills",
        "lead_organization": "NCPOR",
        "expedition_leader": "Leader A",
        "start_date": "2026-11-01",
        "end_date": "2027-03-01",
        "status": "Planned"
    }
    client.post("/api/expeditions", json=payload, headers={"x-user-role": "Expedition Manager"})
    
    # Duplicate ID
    payload2 = {**payload, "expedition_code": "CODE-2"}
    response = client.post("/api/expeditions", json=payload2, headers={"x-user-role": "Expedition Manager"})
    assert response.status_code == 409
    assert "Expedition ID already exists" in response.json()["detail"]

def test_date_validation_end_before_start():
    payload = {
        "expedition_id": "EXP-INVALID-DATES",
        "expedition_name": "Invalid Dates Mission",
        "expedition_code": "INVALID-1",
        "expedition_year": 2026,
        "target_region": "Maitri Station",
        "lead_organization": "NCPOR",
        "expedition_leader": "Leader B",
        "start_date": "2027-03-01",
        "end_date": "2026-11-01",
        "status": "Planned"
    }
    response = client.post("/api/expeditions", json=payload, headers={"x-user-role": "Expedition Manager"})
    assert response.status_code == 422 or response.status_code == 400

def test_status_transition_workflow():
    payload = {
        "expedition_id": "EXP-WF-1",
        "expedition_name": "Workflow Mission",
        "expedition_code": "WF-01",
        "expedition_year": 2026,
        "target_region": "Bharati Station",
        "lead_organization": "NCPOR",
        "expedition_leader": "Leader C",
        "start_date": "2026-11-01",
        "end_date": "2027-03-01",
        "status": "Planned"
    }
    client.post("/api/expeditions", json=payload, headers={"x-user-role": "Expedition Manager"})

    # Valid: Planned -> Approved
    res = client.put("/api/expeditions/EXP-WF-1", json={"status": "Approved"}, headers={"x-user-role": "Expedition Manager"})
    assert res.status_code == 200
    assert res.json()["status"] == "Approved"

    # Invalid: Approved -> Planned (not allowed)
    res_bad = client.put("/api/expeditions/EXP-WF-1", json={"status": "Planned"}, headers={"x-user-role": "Expedition Manager"})
    assert res_bad.status_code == 400
    assert "Invalid status transition" in res_bad.json()["detail"]

def test_viewer_permission_denied():
    payload = {
        "expedition_id": "EXP-VIEWER-TEST",
        "expedition_name": "Unauthorized Test",
        "expedition_code": "NOAUTH-1",
        "expedition_year": 2026,
        "target_region": "Schirmacher Oasis",
        "lead_organization": "NCPOR",
        "expedition_leader": "Leader D",
        "start_date": "2026-11-01",
        "end_date": "2027-03-01",
        "status": "Planned"
    }
    # Viewer tries to create
    res = client.post("/api/expeditions", json=payload, headers={"x-user-role": "VIEWER"})
    assert res.status_code == 403
    assert "Expedition Manager role required" in res.json()["detail"]
