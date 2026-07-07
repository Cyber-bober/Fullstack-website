import pytest, requests
BASE = "http://localhost:3000"

class TestMatchesCRUD:
    def test_get_matches_200(self):
        r = requests.get(f"{BASE}/api/matches")
        assert r.status_code == 200
        data = r.json()
        # Поддержка обоих форматов ответа
        if isinstance(data, dict):
            assert "data" in data
            assert isinstance(data["data"], list)
        elif isinstance(data, list):
            assert isinstance(data, list)
        else:
            assert False, "Unexpected response format"

    def test_create_match_201(self, admin_session, unique_id):
        teams_response = admin_session.get(f"{BASE}/api/teams").json()
        teams = teams_response.get("data", []) if isinstance(teams_response, dict) else teams_response
        if len(teams) < 2: 
            pytest.skip("Need 2 teams")
        r = admin_session.post(f"{BASE}/api/matches", json={
            "homeTeamId": teams[0]["id"], 
            "awayTeamId": teams[1]["id"],
            "date": f"2025-12-{10+(unique_id%20):02d}T18:00:00.000Z",
        })
        assert r.status_code == 201

    def test_create_match_same_team_400(self, admin_session):
        teams_response = admin_session.get(f"{BASE}/api/teams").json()
        teams = teams_response.get("data", []) if isinstance(teams_response, dict) else teams_response
        if not teams: 
            pytest.skip("Need teams")
        r = admin_session.post(f"{BASE}/api/matches", json={
            "homeTeamId": teams[0]["id"], 
            "awayTeamId": teams[0]["id"],
            "date": "2025-12-01T18:00:00.000Z",
        })
        assert r.status_code == 400

    def test_create_match_unauthorized_401(self):
        r = requests.post(f"{BASE}/api/matches", json={
            "homeTeamId": "x", 
            "awayTeamId": "y", 
            "date": "2025-12-01T18:00:00.000Z"
        })
        assert r.status_code == 401

    def test_delete_match_200(self, admin_session, unique_id):
        teams_response = admin_session.get(f"{BASE}/api/teams").json()
        teams = teams_response.get("data", []) if isinstance(teams_response, dict) else teams_response
        if len(teams) < 2: 
            pytest.skip("Need 2 teams")
        r = admin_session.post(f"{BASE}/api/matches", json={
            "homeTeamId": teams[0]["id"], 
            "awayTeamId": teams[1]["id"],
            "date": f"2025-10-{10+(unique_id%20):02d}T18:00:00.000Z",
        })
        assert r.status_code == 201
        assert admin_session.delete(f"{BASE}/api/matches?id={r.json()['id']}").status_code == 200

    def test_delete_match_no_id_400(self, admin_session):
        assert admin_session.delete(f"{BASE}/api/matches").status_code == 400

    def test_delete_match_unauthorized_401(self):
        assert requests.delete(f"{BASE}/api/matches?id=x").status_code == 401

    def test_update_match_200(self, admin_session, unique_id):
        teams_response = admin_session.get(f"{BASE}/api/teams").json()
        teams = teams_response.get("data", []) if isinstance(teams_response, dict) else teams_response
        if len(teams) < 2: 
            pytest.skip("Need 2 teams")
        r = admin_session.post(f"{BASE}/api/matches", json={
            "homeTeamId": teams[0]["id"], 
            "awayTeamId": teams[1]["id"],
            "date": f"2025-09-{10+(unique_id%20):02d}T18:00:00.000Z",
        })
        assert r.status_code == 201
        r = admin_session.patch(f"{BASE}/api/matches?id={r.json()['id']}", json={
            "score": "2:1", 
            "status": "FINISHED"
        })
        assert r.status_code == 200

    def test_matches_filter_200(self):
        for s in ["upcoming", "live", "finished"]:
            assert requests.get(f"{BASE}/api/matches?status={s}").status_code == 200

    def test_matches_pagination_200(self):
        r = requests.get(f"{BASE}/api/matches?page=1&limit=5")
        assert r.status_code == 200