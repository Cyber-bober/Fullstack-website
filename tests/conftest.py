import pytest
import requests
import time

BASE_URL = "http://localhost:3000"

@pytest.fixture(scope="session")
def api():
    for _ in range(30):
        try:
            requests.get(f"{BASE_URL}/api/auth/session", timeout=2)
            return requests.Session()
        except:
            time.sleep(2)
    raise Exception("Server not running")

@pytest.fixture
def unique_id():
    return int(time.time() * 1000000)

@pytest.fixture
def registered_user(api, unique_id):
    username = f"test_user_{unique_id}"
    r = api.post(f"{BASE_URL}/api/auth/register", json={
        "username": username, "password": "123456", "fullName": "Test User", "city": "Moscow",
    })
    assert r.status_code in [200, 201], f"Register failed: {r.text}"
    return {"username": username, "password": "123456"}

@pytest.fixture
def admin_session():
    session = requests.Session()
    csrf = session.get(f"{BASE_URL}/api/auth/csrf")
    csrf_token = csrf.json().get("csrfToken", "")
    r = session.post(f"{BASE_URL}/api/auth/callback/credentials", 
        json={"username": "admin_vlad", "password": "admin123", "csrfToken": csrf_token},
        headers={"Content-Type": "application/json"}
    )
    assert r.status_code == 200, f"Admin login failed: {r.status_code}"
    return session

@pytest.fixture
def created_team(admin_session, unique_id):
    """Создаёт команду и возвращает её ID"""
    r = admin_session.post(f"{BASE_URL}/api/teams/create", json={"name": f"Team_{unique_id}"})
    assert r.status_code in [201, 400], f"Create team failed: {r.text}"
    if r.status_code == 201:
        return r.json().get("id")
    return None

@pytest.fixture
def created_match(admin_session, unique_id):
    """Создаёт матч и возвращает его ID"""
    teams = admin_session.get(f"{BASE_URL}/api/teams").json()
    data = teams.get("data", [])
    if len(data) >= 2:
        r = admin_session.post(f"{BASE_URL}/api/matches", json={
            "homeTeamId": data[0]["id"],
            "awayTeamId": data[1]["id"],
            "date": "2025-12-01T18:00:00.000Z",
            "venue": f"Stadium_{unique_id}",
        })
        if r.status_code == 201:
            return r.json().get("id")
    return None
