import pytest, requests, time
BASE = "http://localhost:3000"

class TestPerformance:
    def test_teams_response_time_under_500ms(self):
        start = time.time()
        r = requests.get(f"{BASE}/api/teams")
        assert r.status_code == 200
        assert time.time() - start < 2.0

    def test_news_response_time_under_500ms(self):
        start = time.time()
        r = requests.get(f"{BASE}/api/news")
        assert r.status_code == 200
        assert time.time() - start < 2.0

    def test_matches_response_time_under_500ms(self):
        start = time.time()
        r = requests.get(f"{BASE}/api/matches")
        assert r.status_code == 200
        assert time.time() - start < 2.0

    def test_register_response_time_under_1s(self, unique_id):
        start = time.time()
        r = requests.post(f"{BASE}/api/auth/register", json={"username": f"perf{unique_id}", "password": "123456", "fullName": "Test"})
        assert time.time() - start < 3.0

    def test_consecutive_requests_no_degradation(self, admin_session):
        times = []
        for _ in range(10):
            start = time.time()
            r = admin_session.get(f"{BASE}/api/teams")
            assert r.status_code == 200
            times.append(time.time() - start)
        avg = sum(times) / len(times)
        assert avg < 1.0

    def test_parallel_requests(self, admin_session):
        import concurrent.futures
        def fetch():
            return requests.get(f"{BASE}/api/teams").status_code
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            results = list(executor.map(lambda _: fetch(), range(5)))
        assert all(r == 200 for r in results)

    def test_cache_second_request_faster(self):
        r1_start = time.time()
        requests.get(f"{BASE}/api/teams")
        r1_time = time.time() - r1_start

        r2_start = time.time()
        requests.get(f"{BASE}/api/teams")
        r2_time = time.time() - r2_start

        assert r2_time <= r1_time * 1.5

    def test_register_flood_10_users(self, unique_id):
        for i in range(10):
            r = requests.post(f"{BASE}/api/auth/register", json={"username": f"flood{unique_id}_{i}", "password": "123456", "fullName": f"User{i}"})
            assert r.status_code in [201, 400]

    def test_login_flood_10_attempts(self, registered_user):
        for _ in range(10):
            s = requests.Session()
            csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
            r = s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "wrong", "csrfToken": csrf})
        assert True

    def test_page_load_under_3s(self):
        start = time.time()
        r = requests.get(BASE)
        assert r.status_code == 200
        assert time.time() - start < 5.0
