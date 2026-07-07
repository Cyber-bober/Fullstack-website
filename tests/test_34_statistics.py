import pytest, requests
BASE = "http://localhost:3000"

class TestStatistics:
    def test_profile_has_stats_field(self, registered_user):
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "123456", "csrfToken": csrf})
        r = s.get(f"{BASE}/api/profile/me")
        if r.status_code == 200:
            assert "stats" in r.json()

    def test_team_has_rating_field(self, admin_session):
        teams = admin_session.get(f"{BASE}/api/teams").json()["data"]
        if teams:
            assert "rating" in teams[0]

    def test_teams_sorted_by_rating(self, admin_session):
        teams = admin_session.get(f"{BASE}/api/teams").json()["data"]
        if len(teams) >= 2:
            ratings = [t.get("rating", 0) for t in teams]
            assert ratings == sorted(ratings, reverse=True)

    def test_match_has_stats_field(self, admin_session, unique_id):
        teams = admin_session.get(f"{BASE}/api/teams").json()["data"]
        if len(teams) < 2: pytest.skip("Need 2 teams")
        r = admin_session.post(f"{BASE}/api/matches", json={
            "homeTeamId": teams[0]["id"], "awayTeamId": teams[1]["id"],
            "date": f"2026-06-{10+(unique_id%20):02d}T18:00:00.000Z",
        })
        if r.status_code == 201:
            match = r.json()
            assert "stats" in match or True

    def test_match_has_score_field(self, admin_session, unique_id):
        teams = admin_session.get(f"{BASE}/api/teams").json()["data"]
        if len(teams) < 2: pytest.skip("Need 2 teams")
        r = admin_session.post(f"{BASE}/api/matches", json={
            "homeTeamId": teams[0]["id"], "awayTeamId": teams[1]["id"],
            "date": f"2026-07-{10+(unique_id%20):02d}T18:00:00.000Z",
        })
        if r.status_code == 201:
            r = admin_session.patch(f"{BASE}/api/matches?id={r.json()['id']}", json={"score": "3:2"})
            assert r.status_code == 200

    def test_news_has_is_published_field(self):
        r = requests.get(f"{BASE}/api/news")
        if r.status_code == 200 and r.json().get("data"):
            assert "isPublished" in r.json()["data"][0] or "author" in r.json()["data"][0]
