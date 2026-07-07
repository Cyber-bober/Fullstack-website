import pytest, requests
BASE = "http://localhost:3000"

class TestIdempotent:
    def test_get_teams_twice_same_result(self):
        r1 = requests.get(f"{BASE}/api/teams")
        r2 = requests.get(f"{BASE}/api/teams")
        assert r1.status_code == r2.status_code == 200
        assert r1.json()["meta"]["total"] == r2.json()["meta"]["total"]

    def test_get_news_twice_same_result(self):
        r1 = requests.get(f"{BASE}/api/news")
        r2 = requests.get(f"{BASE}/api/news")
        assert r1.status_code == r2.status_code == 200

    def test_get_matches_twice_same_result(self):
        r1 = requests.get(f"{BASE}/api/matches")
        r2 = requests.get(f"{BASE}/api/matches")
        assert r1.status_code == r2.status_code == 200

    def test_get_profile_twice_same(self, registered_user):
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "123456", "csrfToken": csrf})
        r1 = s.get(f"{BASE}/api/profile/me")
        r2 = s.get(f"{BASE}/api/profile/me")
        assert r1.status_code == r2.status_code
        if r1.status_code == 200:
            assert r1.json()["id"] == r2.json()["id"]

    def test_delete_same_team_twice(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE}/api/teams/create", json={"name": f"ID{unique_id}"})
        assert r.status_code == 201
        team_id = r.json()["id"]
        admin_session.delete(f"{BASE}/api/teams?id={team_id}")
        r2 = admin_session.delete(f"{BASE}/api/teams?id={team_id}")
        assert r2.status_code in [200, 500]

    def test_logout_twice(self, registered_user):
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "123456", "csrfToken": csrf})
        s.post(f"{BASE}/api/auth/signout")
        r = s.post(f"{BASE}/api/auth/signout")
        assert r.status_code in [200, 302, 404]

    def test_register_same_username_twice(self, unique_id):
        username = f"dup{unique_id}"
        requests.post(f"{BASE}/api/auth/register", json={"username": username, "password": "123456", "fullName": "Test"})
        r = requests.post(f"{BASE}/api/auth/register", json={"username": username, "password": "123456", "fullName": "Test"})
        assert r.status_code == 400

    def test_login_twice_same_session(self, registered_user):
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        r1 = s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "123456", "csrfToken": csrf})
        r2 = s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "123456", "csrfToken": csrf})
        assert r1.status_code == 200
        assert r2.status_code == 200

    def test_update_match_twice(self, admin_session, unique_id):
        teams = admin_session.get(f"{BASE}/api/teams").json()["data"]
        if len(teams) < 2: pytest.skip("Need 2 teams")
        r = admin_session.post(f"{BASE}/api/matches", json={
            "homeTeamId": teams[0]["id"], "awayTeamId": teams[1]["id"],
            "date": f"2025-06-{10+(unique_id%20):02d}T18:00:00.000Z",
        })
        if r.status_code != 201: pytest.skip("Create failed")
        match_id = r.json()["id"]
        admin_session.patch(f"{BASE}/api/matches?id={match_id}", json={"score": "1:0"})
        r = admin_session.patch(f"{BASE}/api/matches?id={match_id}", json={"score": "2:0"})
        assert r.status_code == 200

    def test_update_profile_same_data_twice(self, registered_user):
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "123456", "csrfToken": csrf})
        s.post(f"{BASE}/api/profile/update", json={"city": "Same"})
        r = s.post(f"{BASE}/api/profile/update", json={"city": "Same"})
        assert r.status_code == 200
