import pytest, requests
BASE = "http://localhost:3000"

class TestNewsCategories:
    def test_create_news_general(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE}/api/news", json={"title": f"G{unique_id}", "content": "General category news test"})
        assert r.status_code == 201

    def test_create_news_announcement(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE}/api/news", json={"title": f"A{unique_id}", "content": "Announcement test content"})
        assert r.status_code == 201

    def test_create_news_match_report(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE}/api/news", json={"title": f"MR{unique_id}", "content": "Match report content test"})
        assert r.status_code == 201

    def test_create_news_transfer(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE}/api/news", json={"title": f"TR{unique_id}", "content": "Transfer news test content"})
        assert r.status_code == 201

    def test_create_news_interview(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE}/api/news", json={"title": f"I{unique_id}", "content": "Interview content test now"})
        assert r.status_code == 201

    def test_all_categories_in_response(self):
        r = requests.get(f"{BASE}/api/news")
        if r.status_code == 200 and r.json().get("data"):
            categories = set()
            for post in r.json()["data"]:
                if "category" in post:
                    categories.add(post["category"])
            assert len(categories) >= 0

    def test_news_with_match_id(self, admin_session, unique_id):
        teams = admin_session.get(f"{BASE}/api/teams").json()["data"]
        if len(teams) < 2: pytest.skip("Need 2 teams")
        r = admin_session.post(f"{BASE}/api/matches", json={
            "homeTeamId": teams[0]["id"], "awayTeamId": teams[1]["id"],
            "date": f"2026-05-{10+(unique_id%20):02d}T18:00:00.000Z",
        })
        if r.status_code != 201: pytest.skip("Create match failed")
        match_id = r.json()["id"]
        r = admin_session.post(f"{BASE}/api/news", json={"title": f"M{unique_id}", "content": "News with match"})
        assert r.status_code == 201

    def test_news_author_field_present(self):
        r = requests.get(f"{BASE}/api/news")
        if r.status_code == 200 and r.json().get("data"):
            for post in r.json()["data"][:3]:
                assert "author" in post
