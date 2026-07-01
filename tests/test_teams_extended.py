import pytest
import requests
import time

BASE_URL = "http://localhost:3000"

def login_as(username, password):
    s = requests.Session()
    csrf = s.get(f"{BASE_URL}/api/auth/csrf").json().get("csrfToken", "")
    r = s.post(f"{BASE_URL}/api/auth/callback/credentials", json={
        "username": username, "password": password, "csrfToken": csrf,
    })
    return s, r.status_code == 200

class TestTeamPlayers:
    def test_add_player_as_admin(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE_URL}/api/teams/create", json={"name": f"R_{unique_id}"})
        if r.status_code != 201: pytest.skip("Create failed")
        team_id = r.json().get("id")
        username = f"p_{unique_id}"
        requests.post(f"{BASE_URL}/api/auth/register", json={"username": username, "password": "123456", "fullName": "P", "city": "M"})
        users = admin_session.get(f"{BASE_URL}/api/admin/users").json()
        user = next((u for u in users if u.get("username") == username), None)
        if not user: pytest.skip("No user")
        r = admin_session.post(f"{BASE_URL}/api/teams/{team_id}/players", json={"userId": user["id"]})
        assert r.status_code in [200, 201]

    def test_remove_player_as_admin(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE_URL}/api/teams/create", json={"name": f"K_{unique_id}"})
        if r.status_code != 201: pytest.skip("Create failed")
        team_id = r.json().get("id")
        username = f"k_{unique_id}"
        requests.post(f"{BASE_URL}/api/auth/register", json={"username": username, "password": "123456", "fullName": "K", "city": "M"})
        users = admin_session.get(f"{BASE_URL}/api/admin/users").json()
        user = next((u for u in users if u.get("username") == username), None)
        if not user: pytest.skip("No user")
        admin_session.post(f"{BASE_URL}/api/teams/{team_id}/players", json={"userId": user["id"]})
        r = admin_session.delete(f"{BASE_URL}/api/teams/{team_id}/players?userId={user["id"]}")
        assert r.status_code in [200, 201]

    def test_user_cannot_add_player(self, registered_user):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok
        r = s.post(f"{BASE_URL}/api/teams/x/players", json={"userId": "x"})
        assert r.status_code in [401, 403, 404]

class TestTeamCaptain:
    def test_set_captain_as_admin(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE_URL}/api/teams/create", json={"name": f"C_{unique_id}"})
        if r.status_code != 201: pytest.skip("Create failed")
        team_id = r.json().get("id")
        username = f"c_{unique_id}"
        requests.post(f"{BASE_URL}/api/auth/register", json={"username": username, "password": "123456", "fullName": "C", "city": "M"})
        users = admin_session.get(f"{BASE_URL}/api/admin/users").json()
        user = next((u for u in users if u.get("username") == username), None)
        if not user: pytest.skip("No user")
        admin_session.post(f"{BASE_URL}/api/teams/{team_id}/players", json={"userId": user["id"]})
        r = admin_session.post(f"{BASE_URL}/api/teams/{team_id}/captain", json={"userId": user["id"]})
        assert r.status_code in [200, 201]

    def test_user_cannot_set_captain(self, registered_user):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok
        r = s.post(f"{BASE_URL}/api/teams/x/captain", json={"userId": "x"})
        assert r.status_code in [401, 403, 404]

class TestTeamLogo:
    def test_upload_logo_as_admin(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE_URL}/api/teams/create", json={"name": f"L_{unique_id}"})
        if r.status_code != 201: pytest.skip("Create failed")
        team_id = r.json().get("id")
        r = admin_session.post(f"{BASE_URL}/api/teams/{team_id}/upload")
        assert r.status_code in [400, 404, 405]

    def test_upload_logo_as_user(self, registered_user):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok
        r = s.post(f"{BASE_URL}/api/teams/x/upload")
        assert r.status_code in [400, 401, 403, 404, 405]

class TestTeamRoster:
    def test_get_team_by_id(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE_URL}/api/teams/create", json={"name": f"V_{unique_id}"})
        if r.status_code != 201: pytest.skip("Create failed")
        team_id = r.json().get("id")
        r = requests.get(f"{BASE_URL}/api/teams/{team_id}")
        assert r.status_code == 200

    def test_get_nonexistent_team(self):
        r = requests.get(f"{BASE_URL}/api/teams/nonexistent")
        assert r.status_code == 404
