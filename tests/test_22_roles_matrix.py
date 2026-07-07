import pytest, requests
BASE = "http://localhost:3000"

def login(u, p):
    s = requests.Session()
    csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
    s.post(f"{BASE}/api/auth/callback/credentials", json={"username": u, "password": p, "csrfToken": csrf})
    return s

class TestGuestAccess:
    def test_guest_teams_200(self): 
        assert requests.get(f"{BASE}/api/teams").status_code == 200
    
    def test_guest_news_200(self): 
        assert requests.get(f"{BASE}/api/news").status_code == 200
    
    def test_guest_matches_200(self): 
        assert requests.get(f"{BASE}/api/matches").status_code == 200
    
    def test_guest_livestream_200(self): 
        assert requests.get(f"{BASE}/api/livestream").status_code == 200
    
    def test_guest_profile_403(self): 
        assert requests.get(f"{BASE}/api/profile/me").status_code == 401
    
    def test_guest_admin_403(self): 
        assert requests.get(f"{BASE}/api/admin/users").status_code == 401
    
    def test_guest_chat_403(self): 
        assert requests.get(f"{BASE}/api/chat/conversations").status_code == 401
    
    def test_guest_create_team_403(self): 
        assert requests.post(f"{BASE}/api/teams/create", json={"name":"T"}).status_code == 401

class TestUserAccess:
    def test_user_profile_200(self, registered_user):
        s = login(registered_user["username"], "123456")
        assert s.get(f"{BASE}/api/profile/me").status_code == 200

    def test_user_chat_200(self, registered_user):
        s = login(registered_user["username"], "123456")
        assert s.get(f"{BASE}/api/chat/conversations").status_code == 200

    def test_user_support_200(self, registered_user):
        s = login(registered_user["username"], "123456")
        assert s.get(f"{BASE}/api/support/tickets").status_code == 200

    def test_user_admin_403(self, registered_user):
        s = login(registered_user["username"], "123456")
        assert s.get(f"{BASE}/api/admin/users").status_code == 403

    def test_user_create_team_403(self, registered_user):
        s = login(registered_user["username"], "123456")
        assert s.post(f"{BASE}/api/teams/create", json={"name":"T"}).status_code == 403

    def test_user_create_news_403(self, registered_user):
        s = login(registered_user["username"], "123456")
        r = s.post(f"{BASE}/api/news", json={"title":"T","content":"Valid content"})
        assert r.status_code == 403

    def test_user_create_match_403(self, registered_user):
        s = login(registered_user["username"], "123456")
        r = s.post(f"{BASE}/api/matches", json={"homeTeamId":"x","awayTeamId":"y","date":"2025-12-01T18:00:00.000Z"})
        assert r.status_code == 403

class TestEditorAccess:
    def test_editor_create_news_201(self, unique_id):
        s = login("editor_anna", "editor123")
        r = s.post(f"{BASE}/api/news", json={"title":f"E{unique_id}","content":"Editor content"})
        assert r.status_code == 201

    def test_editor_create_match_201(self, unique_id):
        s = login("editor_anna", "editor123")
        teams = s.get(f"{BASE}/api/teams").json()["data"]
        if len(teams) < 2: pytest.skip("Need 2 teams")
        r = s.post(f"{BASE}/api/matches", json={"homeTeamId":teams[0]["id"],"awayTeamId":teams[1]["id"],"date":f"2025-11-{10+(unique_id%20):02d}T20:00:00.000Z"})
        assert r.status_code == 201

    def test_editor_create_team_403(self):
        s = login("editor_anna", "editor123")
        assert s.post(f"{BASE}/api/teams/create", json={"name":"E"}).status_code == 403

    def test_editor_admin_403(self):
        s = login("editor_anna", "editor123")
        assert s.get(f"{BASE}/api/admin/users").status_code == 403

class TestCaptainAccess:
    def test_captain_profile_200(self):
        s = login("admin_vlad", "admin123")
        assert s.get(f"{BASE}/api/profile/me").status_code == 200

    def test_captain_teams_200(self):
        s = login("admin_vlad", "admin123")
        assert s.get(f"{BASE}/api/teams").status_code == 200

    def test_captain_create_news_403(self):
        s = login("admin_vlad", "admin123")
        r = s.post(f"{BASE}/api/news", json={
            "title": "Captain News Title",
            "content": "Valid content for captain news post"
        })
        assert r.status_code == 201

class TestAdminAccess:
    def test_admin_all_access(self, admin_session):
        endpoints = [
            ("GET", "/api/teams"),
            ("GET", "/api/news"),
            ("GET", "/api/matches"),
            ("GET", "/api/chat/conversations"),
            ("GET", "/api/admin/users"),
            ("GET", "/api/role-request"),
            ("GET", "/api/support/tickets"),
        ]
        for method, url in endpoints:
            r = admin_session.get(f"{BASE}{url}")
            assert r.status_code == 200, f"Admin {method} {url} failed: {r.status_code}"

    def test_admin_create_all(self, admin_session, unique_id):
        assert admin_session.post(f"{BASE}/api/teams/create", json={"name":f"A{unique_id}"}).status_code == 201
        assert admin_session.post(f"{BASE}/api/news", json={"title":f"A{unique_id}","content":"Admin content"}).status_code == 201