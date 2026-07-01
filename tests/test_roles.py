import requests
import time

BASE = "http://localhost:3000"

def login(username, password):
    s = requests.Session()
    csrf = s.get(f"{BASE}/api/auth/csrf").json().get("csrfToken", "")
    r = s.post(f"{BASE}/api/auth/callback/credentials", json={
        "username": username, "password": password, "csrfToken": csrf,
    })
    return s, r.status_code == 200

class TestAdmin:
    def test_admin_login(self):
        s, ok = login("admin_vlad", "admin123")
        assert ok

    def test_admin_see_all_teams(self):
        s, _ = login("admin_vlad", "admin123")
        r = s.get(f"{BASE}/api/teams")
        assert r.status_code == 200

    def test_admin_create_team(self):
        s, _ = login("admin_vlad", "admin123")
        r = s.post(f"{BASE}/api/teams/create", json={"name": f"Team_{int(time.time())}"})
        assert r.status_code == 201

class TestUser:
    def test_user_login(self):
        s, ok = login("player1", "123456")
        assert ok

    def test_user_cannot_create_team(self):
        s, _ = login("player1", "123456")
        r = s.post(f"{BASE}/api/teams/create", json={"name": "Test"})
        assert r.status_code == 403

class TestEditor:
    def test_editor_login(self):
        s, ok = login("editor", "123456")
        assert ok

    def test_editor_create_news(self):
        s, _ = login("editor", "123456")
        r = s.post(f"{BASE}/api/news", json={"title": f"News_{int(time.time())}", "content": "Test"})
        assert r.status_code == 201

class TestCaptain:
    def test_captain_login(self):
        s, ok = login("captain", "123456")
        assert ok

    def test_captain_see_teams(self):
        s, _ = login("captain", "123456")
        r = s.get(f"{BASE}/api/teams")
        assert r.status_code == 200

class TestLogout:
    def test_logout(self):
        s, _ = login("player1", "123456")
        r = s.post(f"{BASE}/api/auth/signout")
        assert r.status_code == 200

    def test_after_logout_no_access(self):
        s, _ = login("player1", "123456")
        s.post(f"{BASE}/api/auth/signout")
        r = s.get(f"{BASE}/api/profile/me")
        assert r.status_code == 401
