import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_get_hunter_profile():
    response = client.get("/api/hunter")
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "Chandan DK"
    assert data["level"] >= 1
    assert data["rank"] in ("E", "D", "C", "B", "A", "S")

def test_get_quests():
    response = client.get("/api/quests")
    assert response.status_code == 200
    quests = response.json()
    assert isinstance(quests, list)
    assert len(quests) >= 1

def test_toggle_quest_and_allocation():
    # Fetch quests
    quests = client.get("/api/quests").json()
    first_quest = quests[0]
    initial_completed = first_quest["completed_today"]

    # Toggle
    res = client.post(f"/api/quests/{first_quest['id']}/toggle")
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["completed"] != initial_completed

    # Toggle back to restore state
    res_restore = client.post(f"/api/quests/{first_quest['id']}/toggle")
    assert res_restore.status_code == 200
    assert res_restore.json()["completed"] == initial_completed

def test_missed_login_penalty_api():
    # 1. Reset progress
    client.post("/api/hunter/reset")
    
    # 2. Get profile on 2026-09-01 (establishes last_login_date = 2026-09-01)
    res1 = client.get("/api/hunter?target_date=2026-09-01")
    assert res1.status_code == 200
    assert res1.json()["last_login_date"] == "2026-09-01"

    # 3. Simulate logging in 2 days later: 2026-09-03 (1 missed day: 2026-09-02)
    res2 = client.get("/api/hunter?target_date=2026-09-03")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["missed_days_count"] == 1
    assert data2["missed_login_penalty_applied"] == 25
    assert data2["missed_dates"] == ["2026-09-02"]
    assert data2["last_login_date"] == "2026-09-03"

    # 4. Check that transaction was logged
    tx_res = client.get("/api/history/transactions")
    assert tx_res.status_code == 200
    txs = tx_res.json()
    missed_txs = [t for t in txs if t["source"] == "MISSED_LOGIN_PENALTY"]
    assert len(missed_txs) >= 1
    assert missed_txs[0]["amount"] == -25

