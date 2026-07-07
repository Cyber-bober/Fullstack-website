import pytest, requests, time
BASE = "http://localhost:3000"

class TestRecovery:
    def test_server_responds_after_many_requests(self):
        for _ in range(50):
            r = requests.get(f"{BASE}/api/teams")
            assert r.status_code == 200

    def test_api_stable_after_invalid_requests(self):
        for _ in range(20):
            requests.post(f"{BASE}/api/auth/register", json={"username": "", "password": "", "fullName": ""})
        r = requests.get(f"{BASE}/api/teams")
        assert r.status_code == 200

    def test_api_stable_after_sqli_attempts(self):
        for _ in range(10):
            requests.get(f"{BASE}/api/teams?q='; DROP TABLE teams;--")
        r = requests.get(f"{BASE}/api/teams")
        assert r.status_code == 200

    def test_api_stable_after_xss_attempts(self):
        for _ in range(10):
            requests.get(f"{BASE}/api/news?q=<script>alert(1)</script>")
        r = requests.get(f"{BASE}/api/news")
        assert r.status_code == 200

    def test_api_stable_after_large_payloads(self, admin_session):
        for _ in range(5):
            admin_session.post(f"{BASE}/api/news", json={"title": "Test", "content": "A" * 50000})
        r = requests.get(f"{BASE}/api/news")
        assert r.status_code == 200

    def test_api_stable_after_404_flood(self):
        for _ in range(30):
            requests.get(f"{BASE}/api/nonexistent-{_}")
        r = requests.get(f"{BASE}/api/teams")
        assert r.status_code == 200

    def test_login_stable_after_bruteforce(self, registered_user):
        for _ in range(15):
            s = requests.Session()
            csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
            s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": f"wrong{_}", "csrfToken": csrf})
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        r = s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "123456", "csrfToken": csrf})
        assert r.status_code == 200

    def test_register_stable_after_flood(self, unique_id):
        for i in range(15):
            requests.post(f"{BASE}/api/auth/register", json={"username": f"flood{unique_id}_{i}", "password": "123456", "fullName": "Test"})
        r = requests.get(f"{BASE}/api/teams")
        assert r.status_code == 200

    def test_cache_persists_after_flood(self):
        for _ in range(20):
            requests.get(f"{BASE}/api/teams")
        r = requests.get(f"{BASE}/api/teams")
        assert r.status_code == 200

    def test_api_consistent_after_mixed_requests(self, admin_session, registered_user):
        requests.get(f"{BASE}/api/teams")
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "123456", "csrfToken": csrf})
        requests.get(f"{BASE}/api/news")
        admin_session.get(f"{BASE}/api/admin/users")
        r = requests.get(f"{BASE}/api/teams")
        assert r.status_code == 200

    def test_long_running_stability(self):
        for _ in range(100):
            r = requests.get(f"{BASE}/api/teams")
            if r.status_code != 200:
                break
        assert r.status_code == 200

    def test_concurrent_reads_and_writes(self, admin_session, unique_id):
        import concurrent.futures
        def read():
            return requests.get(f"{BASE}/api/teams").status_code
        def write():
            return admin_session.post(f"{BASE}/api/teams/create", json={"name": f"CW{unique_id}"}).status_code
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as e:
            futures = [e.submit(read) for _ in range(8)] + [e.submit(write) for _ in range(2)]
            results = [f.result() for f in futures]
        assert 200 in results
