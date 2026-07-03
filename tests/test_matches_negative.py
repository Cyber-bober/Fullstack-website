import pytest
import requests
import time

BASE_URL = "http://localhost:3000"

class TestMatchesNegative:
    def test_create_match_no_home_team(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE_URL}/api/matches", json={
            "awayTeamId": "test", "date": f"2025-12-{10+(unique_id%20):02d}T18:00:00.000Z",
        })
        assert r.status_code in [400, 500]

    def test_create_match_no_away_team(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE_URL}/api/matches", json={
            "homeTeamId": "test", "date": f"2025-12-{10+(unique_id%20):02d}T18:00:00.000Z",
        })
        assert r.status_code in [400, 500]

    def test_create_match_no_date(self, admin_session):
        r = admin_session.post(f"{BASE_URL}/api/matches", json={
            "homeTeamId": "x", "awayTeamId": "y",
        })
        assert r.status_code in [400, 500]

    def test_create_match_nonexistent_teams(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE_URL}/api/matches", json={
            "homeTeamId": "nonexistent-id-12345",
            "awayTeamId": "nonexistent-id-67890",
            "date": f"2025-12-{10+(unique_id%20):02d}T18:00:00.000Z",
        })
        assert r.status_code in [400, 500]

    def test_create_match_past_date(self, admin_session, unique_id):
        teams = admin_session.get(f"{BASE_URL}/api/teams").json()
        data = teams.get("data", [])
        if len(data) < 2: pytest.skip("Need 2 teams")
        r = admin_session.post(f"{BASE_URL}/api/matches", json={
            "homeTeamId": data[0]["id"], "awayTeamId": data[1]["id"],
            "date": "2020-01-01T18:00:00.000Z",
        })
        assert r.status_code in [201, 400]

    def test_create_match_invalid_date(self, admin_session):
        teams = admin_session.get(f"{BASE_URL}/api/teams").json()
        data = teams.get("data", [])
        if len(data) < 2: pytest.skip("Need 2 teams")
        r = admin_session.post(f"{BASE_URL}/api/matches", json={
            "homeTeamId": data[0]["id"], "awayTeamId": data[1]["id"],
            "date": "not-a-date",
        })
        assert r.status_code in [400, 500]

    def test_delete_match_nonexistent(self, admin_session):
        r = admin_session.delete(f"{BASE_URL}/api/matches?id=nonexistent")
        assert r.status_code in [200, 500]

    def test_delete_match_no_id(self, admin_session):
        r = admin_session.delete(f"{BASE_URL}/api/matches")
        assert r.status_code in [400, 500]

    def test_update_match_nonexistent(self, admin_session):
        r = admin_session.patch(f"{BASE_URL}/api/matches?id=nonexistent", json={"score": "1:0"})
        assert r.status_code in [200, 500]

    def test_update_match_no_id(self, admin_session):
        r = admin_session.patch(f"{BASE_URL}/api/matches", json={"score": "1:0"})
        assert r.status_code in [400, 500]

    def test_update_match_as_user(self, registered_user):
        s = requests.Session()
        csrf = s.get(f"{BASE_URL}/api/auth/csrf").json().get("csrfToken", "")
        s.post(f"{BASE_URL}/api/auth/callback/credentials", json={
            "username": registered_user["username"],
            "password": registered_user["password"],
            "csrfToken": csrf,
        })
        r = s.patch(f"{BASE_URL}/api/matches?id=test", json={"score": "1:0"})
        assert r.status_code in [401, 403, 404]

    def test_delete_match_as_editor(self):
        s = requests.Session()
        csrf = s.get(f"{BASE_URL}/api/auth/csrf").json().get("csrfToken", "")
        s.post(f"{BASE_URL}/api/auth/callback/credentials", json={
            "username": "editor", "password": "123456",
            "csrfToken": csrf,
        })
        r = s.delete(f"{BASE_URL}/api/matches?id=test")
        assert r.status_code in [401, 403, 404]
