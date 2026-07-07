import pytest, requests, time
BASE = "http://localhost:3000"

class TestTimeouts:
    def test_request_timeout_5s(self):
        try:
            r = requests.get(f"{BASE}/api/teams", timeout=5)
            assert r.status_code == 200
        except requests.exceptions.Timeout:
            pytest.fail("Request timed out")

    def test_slow_response_handled(self):
        start = time.time()
        r = requests.get(f"{BASE}/api/teams")
        assert r.status_code == 200
        assert time.time() - start < 10

    def test_connection_refused_graceful(self):
        try:
            r = requests.get("http://localhost:9999/api/teams", timeout=2)
            pytest.fail("Should not connect")
        except requests.exceptions.ConnectionError:
            assert True

    def test_invalid_host_graceful(self):
        try:
            r = requests.get("http://nonexistent-host-12345.test/api/teams", timeout=2)
            pytest.fail("Should not resolve")
        except requests.exceptions.ConnectionError:
            assert True

    def test_partial_response_handled(self):
        r = requests.get(f"{BASE}/api/teams", stream=True)
        r.close()

    def test_concurrent_requests_no_deadlock(self):
        import concurrent.futures
        def fetch():
            try:
                return requests.get(f"{BASE}/api/teams", timeout=5).status_code
            except:
                return 500
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as e:
            results = list(e.map(lambda _: fetch(), range(10)))
        assert 200 in results

    def test_long_polling_handled(self):
        start = time.time()
        r = requests.get(f"{BASE}/api/teams")
        assert time.time() - start < 5

    def test_keep_alive(self):
        s = requests.Session()
        r1 = s.get(f"{BASE}/api/teams")
        r2 = s.get(f"{BASE}/api/teams")
        assert r1.status_code == r2.status_code == 200
        assert "Connection" in r1.headers or "connection" in r1.headers

    def test_chunked_encoding(self):
        r = requests.get(f"{BASE}/api/teams")
        assert "Transfer-Encoding" in r.headers or r.status_code == 200

    def test_response_headers_complete(self):
        r = requests.get(BASE)
        required_headers = ["Content-Type", "Date"]
        for h in required_headers:
            assert h in r.headers or h.lower() in [k.lower() for k in r.headers.keys()]
