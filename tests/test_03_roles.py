import pytest, requests
BASE = "http://localhost:3000"

def login(u, p):
    s = requests.Session()
    csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
    s.post(f"{BASE}/api/auth/callback/credentials", json={"username": u, "password": p, "csrfToken": csrf})
    return s

class TestAdmin:
    def test_admin_create_team_201(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE}/api/teams/create", json={"name": f"T{unique_id}"})
        assert r.status_code == 201

    def test_admin_create_news_201(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE}/api/news", json={"title": f"N{unique_id}", "content": "Valid admin content"})
        assert r.status_code == 201

    def test_admin_create_match_201(self, admin_session, unique_id):
        teams = admin_session.get(f"{BASE}/api/teams").json()["data"]
        if len(teams) < 2: pytest.skip("Need 2 teams")
        r = admin_session.post(f"{BASE}/api/matches", json={
            "homeTeamId": teams[0]["id"], "awayTeamId": teams[1]["id"],
            "date": f"2025-12-{10+(unique_id%20):02d}T18:00:00.000Z",
        })
        assert r.status_code == 201

    def test_admin_see_admin_200(self, admin_session):
        assert admin_session.get(f"{BASE}/api/admin/users").status_code == 200

class TestEditor:
    def test_editor_create_news_201(self, unique_id):
        s = login("editor_anna", "editor123")
        r = s.post(f"{BASE}/api/news", json={"title": f"E{unique_id}", "content": "Editor content test"})
        assert r.status_code == 201

    def test_editor_create_match_201(self, unique_id):
        s = login("editor_anna", "editor123")
        teams = s.get(f"{BASE}/api/teams").json()["data"]
        if len(teams) < 2: pytest.skip("Need 2 teams")
        r = s.post(f"{BASE}/api/matches", json={
            "homeTeamId": teams[0]["id"], "awayTeamId": teams[1]["id"],
            "date": f"2025-11-{10+(unique_id%20):02d}T20:00:00.000Z",
        })
        assert r.status_code == 201

    def test_editor_cannot_create_team_403(self):
        s = login("editor_anna", "editor123")
        assert s.post(f"{BASE}/api/teams/create", json={"name": "E"}).status_code == 403

class TestUser:
    def test_user_cannot_create_team_403(self, registered_user):
        s = login(registered_user["username"], "123456")
        assert s.post(f"{BASE}/api/teams/create", json={"name": "U"}).status_code == 403

    def test_user_cannot_create_news_403(self, registered_user):
        s = login(registered_user["username"], "123456")
        r = s.post(f"{BASE}/api/news", json={"title": "U", "content": "Valid content"})
        assert r.status_code == 403

    def test_user_cannot_create_match_403(self, registered_user):
        s = login(registered_user["username"], "123456")
        r = s.post(f"{BASE}/api/matches", json={"homeTeamId": "x", "awayTeamId": "y", "date": "2025-12-01T18:00:00.000Z"})
        assert r.status_code == 403

    def test_user_cannot_see_admin_403(self, registered_user):
        s = login(registered_user["username"], "123456")
        assert s.get(f"{BASE}/api/admin/users").status_code == 403