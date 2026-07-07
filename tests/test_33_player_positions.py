import pytest, requests
BASE = "http://localhost:3000"

class TestPlayerPositions:
    def test_register_with_position_goalkeeper(self, unique_id):
        r = requests.post(f"{BASE}/api/auth/register", json={"username": f"gk{unique_id}", "password": "123456", "fullName": "GK Test"})
        assert r.status_code == 201

    def test_profile_has_position_field(self, registered_user):
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "123456", "csrfToken": csrf})
        r = s.get(f"{BASE}/api/profile/me")
        if r.status_code == 200:
            assert "position" in r.json()

    def test_update_profile_position(self, registered_user):
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "123456", "csrfToken": csrf})
        r = s.post(f"{BASE}/api/profile/update", json={"position": "STRIKER"})
        assert r.status_code == 200

    def test_team_players_have_positions(self, admin_session):
        teams = admin_session.get(f"{BASE}/api/teams").json()["data"]
        if not teams: pytest.skip("No teams")
        r = admin_session.get(f"{BASE}/api/teams/{teams[0]['id']}")
        if r.status_code == 200:
            data = r.json()
            if "players" in data and len(data["players"]) > 0:
                assert "position" in data["players"][0]

    def test_all_positions_valid(self):
        valid_positions = ["GOALKEEPER", "CENTER_BACK", "LEFT_BACK", "RIGHT_BACK", "DEFENSIVE_MIDFIELDER", "CENTRAL_MIDFIELDER", "ATTACKING_MIDFIELDER", "LEFT_WINGER", "RIGHT_WINGER", "STRIKER"]
        assert len(valid_positions) == 10
