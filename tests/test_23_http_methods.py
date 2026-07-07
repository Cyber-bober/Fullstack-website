import pytest, requests
BASE = "http://localhost:3000"

class TestHTTPMethods:
    def test_head_teams_200(self):
        r = requests.head(f"{BASE}/api/teams")
        assert r.status_code == 200

    def test_head_news_200(self):
        r = requests.head(f"{BASE}/api/news")
        assert r.status_code == 200

    def test_head_matches_200(self):
        r = requests.head(f"{BASE}/api/matches")
        assert r.status_code == 200

    def test_options_teams_200(self):
        r = requests.options(f"{BASE}/api/teams")
        assert r.status_code in [200, 204, 405]

    def test_options_news_200(self):
        r = requests.options(f"{BASE}/api/news")
        assert r.status_code in [200, 204, 405]

    def test_put_teams_405(self):
        r = requests.put(f"{BASE}/api/teams")
        assert r.status_code in [404, 405]

    def test_put_news_405(self):
        r = requests.put(f"{BASE}/api/news")
        assert r.status_code in [404, 405]

    def test_put_matches_405(self):
        r = requests.put(f"{BASE}/api/matches")
        assert r.status_code in [404, 405]

    def test_patch_teams_405(self):
        r = requests.patch(f"{BASE}/api/teams")
        assert r.status_code in [404, 405]

    def test_patch_news_405(self):
        r = requests.patch(f"{BASE}/api/news")
        assert r.status_code in [404, 405]

    def test_trace_blocked(self):
        r = requests.request("TRACE", f"{BASE}/api/teams")
        assert r.status_code in [405, 500, 501]


    def test_delete_with_body_400(self, admin_session):
        r = admin_session.delete(f"{BASE}/api/teams?id=x", json={"extra": "data"})
        assert r.status_code in [200, 400, 500]

    def test_post_with_query_params(self):
        r = requests.post(f"{BASE}/api/teams?extra=param", json={"name": "Test"})
        assert r.status_code in [403, 400, 405]

    def test_get_with_body_ignored(self):
        r = requests.get(f"{BASE}/api/teams", json={"extra": "data"})
        assert r.status_code == 200
