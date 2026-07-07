import pytest, requests, time
BASE = "http://localhost:3000"

@pytest.fixture(scope="session")
def api():
    for _ in range(30):
        try:
            requests.get(f"{BASE}/api/auth/session", timeout=2)
            return requests.Session()
        except: time.sleep(2)
    raise Exception("Server not running")

@pytest.fixture
def unique_id():
    return int(time.time() * 1000000)

@pytest.fixture
def registered_user(api, unique_id):
    username = f"t{unique_id}"
    r = api.post(f"{BASE}/api/auth/register", json={"username": username, "password": "123456", "fullName": "Test", "city": "M"})
    assert r.status_code == 201, f"Register failed: {r.text}"
    return {"username": username, "password": "123456"}

@pytest.fixture
def admin_session():
    s = requests.Session()
    csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
    r = s.post(f"{BASE}/api/auth/callback/credentials", json={"username": "admin_vlad", "password": "admin123", "csrfToken": csrf})
    assert r.status_code == 200, f"Admin login failed: {r.status_code}"
    return s

@pytest.fixture
def team_to_delete(admin_session):
    """Создаёт команду и авто-удаляет после теста"""
    r = admin_session.post(f"{BASE}/api/teams/create", json={"name": f"cleanup_{int(time.time())}"})
    team_id = r.json()["id"]
    yield team_id
    admin_session.delete(f"{BASE}/api/teams?id={team_id}")

@pytest.fixture
def news_to_delete(admin_session):
    """Создаёт новость и авто-удаляет после теста"""
    r = admin_session.post(f"{BASE}/api/news", json={"title": f"cleanup_{int(time.time())}", "content": "Auto-delete test content"})
    news_id = r.json()["id"]
    yield news_id
    admin_session.delete(f"{BASE}/api/news/{news_id}")

@pytest.fixture
def match_to_delete(admin_session):
    """Создаёт матч и авто-удаляет после теста"""
    teams = admin_session.get(f"{BASE}/api/teams").json()["data"]
    if len(teams) >= 2:
        r = admin_session.post(f"{BASE}/api/matches", json={
            "homeTeamId": teams[0]["id"], "awayTeamId": teams[1]["id"],
            "date": f"2025-07-01T18:00:00.000Z",
        })
        match_id = r.json()["id"]
        yield match_id
        admin_session.delete(f"{BASE}/api/matches?id={match_id}")
    else:
        yield None
