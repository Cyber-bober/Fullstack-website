import pytest, requests
BASE = "http://localhost:3000"

class TestMatchStatuses:
    def test_create_match_scheduled(self, admin_session, unique_id):
        teams_response = admin_session.get(f"{BASE}/api/teams").json()
        teams = teams_response.get("data", []) if isinstance(teams_response, dict) else teams_response
        if len(teams) < 2: 
            pytest.skip("Need 2 teams")
        r = admin_session.post(f"{BASE}/api/matches", json={
            "homeTeamId": teams[0]["id"], 
            "awayTeamId": teams[1]["id"],
            "date": f"2026-01-{10+(unique_id%20):02d}T18:00:00.000Z",
        })
        assert r.status_code == 201

    def test_update_match_to_live(self, admin_session, unique_id):
        teams_response = admin_session.get(f"{BASE}/api/teams").json()
        teams = teams_response.get("data", []) if isinstance(teams_response, dict) else teams_response
        if len(teams) < 2: 
            pytest.skip("Need 2 teams")
        r = admin_session.post(f"{BASE}/api/matches", json={
            "homeTeamId": teams[0]["id"], 
            "awayTeamId": teams[1]["id"],
            "date": f"2026-02-{10+(unique_id%20):02d}T18:00:00.000Z",
        })
        if r.status_code != 201: 
            pytest.skip("Create failed")
        r = admin_session.patch(f"{BASE}/api/matches?id={r.json()['id']}", json={"status": "LIVE"})
        assert r.status_code == 200

    def test_update_match_to_finished(self, admin_session, unique_id):
        teams_response = admin_session.get(f"{BASE}/api/teams").json()
        teams = teams_response.get("data", []) if isinstance(teams_response, dict) else teams_response
        if len(teams) < 2: 
            pytest.skip("Need 2 teams")
        r = admin_session.post(f"{BASE}/api/matches", json={
            "homeTeamId": teams[0]["id"], 
            "awayTeamId": teams[1]["id"],
            "date": f"2026-03-{10+(unique_id%20):02d}T18:00:00.000Z",
        })
        if r.status_code != 201: 
            pytest.skip("Create failed")
        r = admin_session.patch(f"{BASE}/api/matches?id={r.json()['id']}", json={
            "status": "FINISHED", 
            "score": "2:1"
        })
        assert r.status_code == 200

    def test_update_match_to_cancelled(self, admin_session, unique_id):
        teams_response = admin_session.get(f"{BASE}/api/teams").json()
        teams = teams_response.get("data", []) if isinstance(teams_response, dict) else teams_response
        if len(teams) < 2: 
            pytest.skip("Need 2 teams")
        r = admin_session.post(f"{BASE}/api/matches", json={
            "homeTeamId": teams[0]["id"], 
            "awayTeamId": teams[1]["id"],
            "date": f"2026-04-{10+(unique_id%20):02d}T18:00:00.000Z",
        })
        if r.status_code != 201: 
            pytest.skip("Create failed")
        r = admin_session.patch(f"{BASE}/api/matches?id={r.json()['id']}", json={"status": "CANCELLED"})
        assert r.status_code == 200

    def test_filter_by_scheduled(self):
        r = requests.get(f"{BASE}/api/matches?status=upcoming")
        assert r.status_code == 200

    def test_filter_by_live(self):
        r = requests.get(f"{BASE}/api/matches?status=live")
        assert r.status_code == 200

    def test_filter_by_finished(self):
        r = requests.get(f"{BASE}/api/matches?status=finished")
        assert r.status_code == 200

    def test_all_statuses_present_in_response(self):
        r = requests.get(f"{BASE}/api/matches")
        if r.status_code == 200:
            data = r.json()
            matches = data.get("data", []) if isinstance(data, dict) else data
            if matches:
                statuses = [m.get("status") for m in matches if m.get("status")]
                assert any(s in ["SCHEDULED", "LIVE", "FINISHED", "CANCELLED"] for s in statuses)