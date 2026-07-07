import pytest, requests
BASE = "http://localhost:3000"

def test_create_delete_match_verify(admin_session, unique_id):
    teams_response = admin_session.get(f"{BASE}/api/teams").json()
    teams = teams_response.get("data", []) if isinstance(teams_response, dict) else teams_response
    if len(teams) < 2: 
        pytest.skip("Need 2 teams")
    r = admin_session.post(f"{BASE}/api/matches", json={
        "homeTeamId": teams[0]["id"], 
        "awayTeamId": teams[1]["id"],
        "date": f"2025-07-{10+(unique_id%20):02d}T18:00:00.000Z",
    })
    assert r.status_code == 201
    match_id = r.json()["id"]
    assert admin_session.delete(f"{BASE}/api/matches?id={match_id}").status_code == 200
    r = admin_session.get(f"{BASE}/api/matches")
    data = r.json()
    matches_list = data.get("data", []) if isinstance(data, dict) else data
    ids = [m["id"] for m in matches_list]
    assert match_id not in ids
