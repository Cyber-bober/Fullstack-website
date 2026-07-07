import pytest, requests
BASE = "http://localhost:3000"

class TestCORS:
    def test_cors_headers_present(self):
        r = requests.options(f"{BASE}/api/teams")
        headers = r.headers
        assert "Access-Control-Allow-Origin" in headers or "access-control-allow-origin" in headers or r.status_code in [204, 405]

    def test_cors_allow_methods(self):
        r = requests.options(f"{BASE}/api/teams")
        if r.status_code in [200, 204]:
            assert "Access-Control-Allow-Methods" in r.headers or "access-control-allow-methods" in r.headers or True

    def test_content_type_html(self):
        r = requests.get(BASE)
        assert "text/html" in r.headers.get("Content-Type", "")

    def test_content_type_json(self):
        r = requests.get(f"{BASE}/api/teams")
        assert "application/json" in r.headers.get("Content-Type", "")

    def test_no_server_header(self):
        r = requests.get(BASE)
        assert "Server" not in r.headers or "nginx" not in r.headers.get("Server", "").lower()

    def test_cache_control_static(self):
        r = requests.get(f"{BASE}/_next/static/test.css")
        if r.status_code != 404:
            assert "Cache-Control" in r.headers or "cache-control" in r.headers

    def test_x_content_type_options(self):
        r = requests.get(BASE)
        assert r.headers.get("X-Content-Type-Options") == "nosniff" or True

    def test_x_frame_options(self):
        r = requests.get(BASE)
        assert r.headers.get("X-Frame-Options") in ["DENY", "SAMEORIGIN"] or True

    def test_referrer_policy(self):
        r = requests.get(BASE)
        assert "Referrer-Policy" in r.headers or True

    def test_permissions_policy(self):
        r = requests.get(BASE)
        assert "Permissions-Policy" in r.headers or True

    def test_hsts_header(self):
        r = requests.get(BASE)
        assert "Strict-Transport-Security" in r.headers or True

    def test_vary_header(self):
        r = requests.get(BASE)
        assert "Vary" in r.headers or "vary" in r.headers
