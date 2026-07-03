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

class TestMatchesFilters:
    """Фильтрация матчей по статусу"""

    def test_get_upcoming_matches(self):
        r = requests.get(f"{BASE_URL}/api/matches?status=upcoming")
        assert r.status_code == 200

    def test_get_live_matches(self):
        r = requests.get(f"{BASE_URL}/api/matches?status=live")
        assert r.status_code == 200

    def test_get_finished_matches(self):
        r = requests.get(f"{BASE_URL}/api/matches?status=finished")
        assert r.status_code == 200

    def test_get_matches_invalid_status(self):
        r = requests.get(f"{BASE_URL}/api/matches?status=invalid")
        assert r.status_code == 200

    def test_get_matches_pagination(self):
        r = requests.get(f"{BASE_URL}/api/matches?page=1&limit=5")
        assert r.status_code == 200
        meta = r.json().get("meta", {})
        assert meta.get("limit") == 5

class TestMatchesCreate:
    """Создание матчей — расширенные проверки"""

    def test_create_match_without_date(self, admin_session):
        teams = admin_session.get(f"{BASE_URL}/api/teams").json()
        data = teams.get("data", [])
        if len(data) < 2: pytest.skip("Need 2 teams")
        r = admin_session.post(f"{BASE_URL}/api/matches", json={
            "homeTeamId": data[0]["id"],
            "awayTeamId": data[1]["id"],
        })
        assert r.status_code in [400, 201, 500]

    def test_create_match_with_venue(self, admin_session, unique_id):
        teams = admin_session.get(f"{BASE_URL}/api/teams").json()
        data = teams.get("data", [])
        if len(data) < 2: pytest.skip("Need 2 teams")
        r = admin_session.post(f"{BASE_URL}/api/matches", json={
            "homeTeamId": data[0]["id"],
            "awayTeamId": data[1]["id"],
            "date": f"2025-12-{10+(unique_id%20):02d}T18:00:00.000Z",
            "venue": f"Grand Stadium {unique_id}",
        })
        assert r.status_code == 201
        match_data = r.json()
        assert match_data.get("venue") == f"Grand Stadium {unique_id}"

    def test_create_match_as_editor(self, unique_id):
        s, ok = login_as("editor", "123456")
        if not ok: pytest.skip("Editor login failed")
        teams = s.get(f"{BASE_URL}/api/teams").json()
        data = teams.get("data", [])
        if len(data) < 2: pytest.skip("Need 2 teams")
        r = s.post(f"{BASE_URL}/api/matches", json={
            "homeTeamId": data[0]["id"],
            "awayTeamId": data[1]["id"],
            "date": f"2025-11-{10+(unique_id%20):02d}T20:00:00.000Z",
        })
        assert r.status_code == 201

    def test_create_match_as_user(self, registered_user):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok
        r = s.post(f"{BASE_URL}/api/matches", json={
            "homeTeamId": "x", "awayTeamId": "y", "date": "2025-12-01T18:00:00.000Z",
        })
        assert r.status_code == 403

class TestMatchesUpdate:
    """Обновление матча (счёт, статус)"""

    def test_update_match_score(self, admin_session, unique_id):
        teams = admin_session.get(f"{BASE_URL}/api/teams").json()
        data = teams.get("data", [])
        if len(data) < 2: pytest.skip("Need 2 teams")
        r = admin_session.post(f"{BASE_URL}/api/matches", json={
            "homeTeamId": data[0]["id"],
            "awayTeamId": data[1]["id"],
            "date": f"2025-10-{10+(unique_id%20):02d}T18:00:00.000Z",
        })
        if r.status_code != 201: pytest.skip("Create failed")
        match_id = r.json().get("id")

        r = admin_session.patch(f"{BASE_URL}/api/matches?id={match_id}", json={
            "score": "2:1",
            "status": "FINISHED",
        })
        assert r.status_code == 200

    def test_update_match_as_user(self, registered_user):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok
        r = s.patch(f"{BASE_URL}/api/matches?id=test", json={"score": "1:0"})
        assert r.status_code in [401, 403, 404]

class TestMatchesDeleteVerify:
    """Удаление с проверкой что матч исчез"""

    def test_delete_and_verify(self, admin_session, unique_id):
        teams = admin_session.get(f"{BASE_URL}/api/teams").json()
        data = teams.get("data", [])
        if len(data) < 2: pytest.skip("Need 2 teams")
        r = admin_session.post(f"{BASE_URL}/api/matches", json={
            "homeTeamId": data[0]["id"],
            "awayTeamId": data[1]["id"],
            "date": f"2025-09-{10+(unique_id%20):02d}T18:00:00.000Z",
        })
        if r.status_code != 201: pytest.skip("Create failed")
        match_id = r.json().get("id")

        r = admin_session.delete(f"{BASE_URL}/api/matches?id={match_id}")
        assert r.status_code in [200, 204]

        r = admin_session.get(f"{BASE_URL}/api/matches")
        ids = [m["id"] for m in r.json().get("data", [])]
        assert match_id not in ids

class TestMatchEvents:
    """События матча (текстовая трансляция)"""

    def test_get_match_events(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/match-events?matchId=test")
        assert r.status_code in [200, 404]

    def test_create_match_event_as_admin(self, admin_session, unique_id):
        teams = admin_session.get(f"{BASE_URL}/api/teams").json()
        data = teams.get("data", [])
        if len(data) < 2: pytest.skip("Need 2 teams")
        r = admin_session.post(f"{BASE_URL}/api/matches", json={
            "homeTeamId": data[0]["id"],
            "awayTeamId": data[1]["id"],
            "date": f"2025-08-{10+(unique_id%20):02d}T18:00:00.000Z",
        })
        if r.status_code != 201: pytest.skip("Create failed")
        match_id = r.json().get("id")

        r = admin_session.post(f"{BASE_URL}/api/match-events", json={
            "matchId": match_id,
            "minute": 45,
            "text": "GOAL! 1:0",
        })
        assert r.status_code == 201

    def test_create_match_event_as_user(self, registered_user):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok
        r = s.post(f"{BASE_URL}/api/match-events", json={
            "matchId": "test",
            "minute": 10,
            "text": "Foul",
        })
        assert r.status_code in [401, 403]
