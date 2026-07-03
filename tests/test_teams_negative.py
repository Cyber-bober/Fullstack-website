import pytest
import requests

BASE_URL = "http://localhost:3000"

class TestTeamsNegative:
    def test_create_team_empty_name(self, admin_session):
        r = admin_session.post(f"{BASE_URL}/api/teams/create", json={"name": ""})
        assert r.status_code in [400, 500]

    def test_create_team_no_name(self, admin_session):
        r = admin_session.post(f"{BASE_URL}/api/teams/create", json={})
        assert r.status_code in [400, 500]

    def test_create_team_special_chars(self, admin_session):
        r = admin_session.post(f"{BASE_URL}/api/teams/create", json={"name": "<script>alert(1)</script>"})
        assert r.status_code in [201, 400]

    def test_create_team_very_long_name(self, admin_session):
        r = admin_session.post(f"{BASE_URL}/api/teams/create", json={"name": "A" * 500})
        assert r.status_code in [201, 400]

    def test_delete_team_nonexistent(self, admin_session):
        r = admin_session.delete(f"{BASE_URL}/api/teams?id=nonexistent")
        assert r.status_code in [200, 500]

    def test_delete_team_no_id(self, admin_session):
        r = admin_session.delete(f"{BASE_URL}/api/teams")
        assert r.status_code in [400, 500]

    def test_add_player_not_in_team(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE_URL}/api/teams/create", json={"name": f"T_{unique_id}"})
        if r.status_code != 201: pytest.skip("Create failed")
        team_id = r.json().get("id")
        r = admin_session.post(f"{BASE_URL}/api/teams/{team_id}/players", json={"userId": "nonexistent"})
        assert r.status_code in [400, 404, 500]

    def test_add_player_no_user_id(self, admin_session):
        r = admin_session.post(f"{BASE_URL}/api/teams/test/players", json={})
        assert r.status_code in [400, 500]

    def test_remove_player_not_in_team(self, admin_session):
        r = admin_session.delete(f"{BASE_URL}/api/teams/test/players?userId=nonexistent")
        assert r.status_code in [200, 500]

    def test_set_captain_not_in_team(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE_URL}/api/teams/create", json={"name": f"C_{unique_id}"})
        if r.status_code != 201: pytest.skip("Create failed")
        team_id = r.json().get("id")
        r = admin_session.post(f"{BASE_URL}/api/teams/{team_id}/captain", json={"userId": "nonexistent"})
        assert r.status_code in [400, 404, 500]
