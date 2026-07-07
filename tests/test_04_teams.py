import pytest, requests
BASE = "http://localhost:3000"

class TestTeamsCRUD:
    def test_get_teams_200(self):
        r = requests.get(f"{BASE}/api/teams")
        assert r.status_code == 200
        assert "data" in r.json()

    def test_get_team_by_id_200(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE}/api/teams/create", json={"name": f"V{unique_id}"})
        assert r.status_code == 201
        assert requests.get(f"{BASE}/api/teams/{r.json()['id']}").status_code == 200

    def test_get_nonexistent_team_404(self):
        assert requests.get(f"{BASE}/api/teams/nonexistent").status_code == 404

    def test_create_team_201(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE}/api/teams/create", json={"name": f"T{unique_id}"})
        assert r.status_code == 201

    def test_create_team_empty_name_400(self, admin_session):
        assert admin_session.post(f"{BASE}/api/teams/create", json={"name": ""}).status_code == 400

    def test_create_team_no_name_400(self, admin_session):
        assert admin_session.post(f"{BASE}/api/teams/create", json={}).status_code == 400

    def test_create_team_unauthorized_401(self):
        assert requests.post(f"{BASE}/api/teams/create", json={"name": "H"}).status_code == 401

    def test_delete_team_200(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE}/api/teams/create", json={"name": f"D{unique_id}"})
        assert r.status_code == 201
        assert admin_session.delete(f"{BASE}/api/teams?id={r.json()['id']}").status_code == 200

    def test_delete_team_no_id_400(self, admin_session):
        assert admin_session.delete(f"{BASE}/api/teams").status_code == 400

    def test_delete_team_unauthorized_401(self):
        assert requests.delete(f"{BASE}/api/teams?id=x").status_code == 401

    def test_teams_pagination_200(self):
        r = requests.get(f"{BASE}/api/teams?page=1&limit=5")
        assert r.status_code == 200
        assert r.json()["meta"]["limit"] == 5

    def test_teams_search_200(self):
        assert requests.get(f"{BASE}/api/teams?q=Spar").status_code == 200
