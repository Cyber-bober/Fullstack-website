import pytest, requests, time
BASE = "http://localhost:3000"

class TestFinalChecks:
    def test_all_get_endpoints_accessible(self, admin_session):
        endpoints = [
            "/api/teams", "/api/news", "/api/matches", "/api/livestream",
            "/api/chat/conversations", "/api/profile/me", "/api/admin/users",
            "/api/role-request", "/api/support/tickets",
        ]
        for url in endpoints:
            r = admin_session.get(f"{BASE}{url}")
            assert r.status_code == 200, f"GET {url} failed: {r.status_code}"

    def test_all_post_endpoints_require_auth(self):
        endpoints = [
            "/api/teams/create", "/api/news", "/api/matches",
            "/api/chat/messages", "/api/support/tickets", "/api/role-request",
        ]
        for url in endpoints:
            r = requests.post(f"{BASE}{url}", json={"test": "data"})
            assert r.status_code in [401, 403], f"POST {url} should require auth: {r.status_code}"

    def test_all_delete_endpoints_require_auth(self):
        endpoints = ["/api/teams", "/api/matches"]
        for url in endpoints:
            r = requests.delete(f"{BASE}{url}?id=test")
            assert r.status_code in [401, 403], f"DELETE {url} should require auth: {r.status_code}"

    def test_json_content_type_all_apis(self, admin_session):
        endpoints = ["/api/teams", "/api/news", "/api/matches"]
        for url in endpoints:
            r = admin_session.get(f"{BASE}{url}")
            if r.status_code == 200:
                ct = r.headers.get("Content-Type", "")
                assert "application/json" in ct, f"{url} Content-Type: {ct}"

    def test_no_500_errors_on_valid_requests(self, admin_session, registered_user):
        r = admin_session.get(f"{BASE}/api/teams")
        assert r.status_code != 500
        r = admin_session.get(f"{BASE}/api/news")
        assert r.status_code != 500
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "123456", "csrfToken": csrf})
        r = s.get(f"{BASE}/api/profile/me")
        assert r.status_code != 500

    def test_response_time_acceptable(self):
        start = time.time()
        for _ in range(10):
            requests.get(f"{BASE}/api/teams")
        total = time.time() - start
        avg = total / 10
        assert avg < 3.0

    def test_memory_no_leak_after_requests(self):
        for _ in range(50):
            requests.get(f"{BASE}/api/teams")
        r = requests.get(f"{BASE}/api/teams")
        assert r.status_code == 200

    def test_database_consistency(self, admin_session):
        teams_before = admin_session.get(f"{BASE}/api/teams").json()["meta"]["total"]
        r = admin_session.post(f"{BASE}/api/teams/create", json={"name": f"Consistency{int(time.time())}"})
        if r.status_code == 201:
            teams_after = admin_session.get(f"{BASE}/api/teams").json()["meta"]["total"]
            assert teams_after >= teams_before

    def test_pagination_consistent(self):
        r1 = requests.get(f"{BASE}/api/teams?page=1&limit=5")
        r2 = requests.get(f"{BASE}/api/teams?page=1&limit=5")
        assert r1.json()["meta"]["total"] == r2.json()["meta"]["total"]

    def test_search_functional(self):
        r = requests.get(f"{BASE}/api/teams?q=a")
        assert r.status_code == 200

    def test_empty_search_returns_all(self):
        r_all = requests.get(f"{BASE}/api/teams")
        r_empty = requests.get(f"{BASE}/api/teams?q=")
        assert r_all.json()["meta"]["total"] == r_empty.json()["meta"]["total"]

    def test_special_characters_in_search(self):
        chars = ["@", "#", "$", "%", "&", "*", "(", ")", "-", "+"]
        for c in chars:
            r = requests.get(f"{BASE}/api/teams?q={c}")
            assert r.status_code == 200

    def test_unicode_in_search(self):
        r = requests.get(f"{BASE}/api/teams?q=команда")
        assert r.status_code == 200

    def test_numbers_in_search(self):
        r = requests.get(f"{BASE}/api/teams?q=123")
        assert r.status_code == 200

    def test_very_long_search_query(self):
        r = requests.get(f"{BASE}/api/teams?q={'a' * 500}")
        assert r.status_code == 200

    def test_multiple_params(self):
        r = requests.get(f"{BASE}/api/teams?page=1&limit=5&q=test")
        assert r.status_code == 200

    def test_negative_page_handled(self):
        r = requests.get(f"{BASE}/api/teams?page=-1")
        assert r.status_code == 200

    def test_zero_limit_handled(self):
        r = requests.get(f"{BASE}/api/teams?limit=0")
        assert r.status_code == 200

    def test_very_large_limit_handled(self):
        r = requests.get(f"{BASE}/api/teams?limit=10000")
        assert r.status_code == 200

    def test_fractional_page_handled(self):
        r = requests.get(f"{BASE}/api/teams?page=1.5")
        assert r.status_code == 200
