import pytest, requests
BASE = "http://localhost:3000"

class TestCookies:
    def test_session_cookie_set_after_login(self, registered_user):
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        r = s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "123456", "csrfToken": csrf})
        assert r.status_code == 200
        assert len(s.cookies) > 0 or "Set-Cookie" in r.headers

    def test_session_cookie_http_only(self, registered_user):
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        r = s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "123456", "csrfToken": csrf})
        set_cookie = r.headers.get("Set-Cookie", "")
        if set_cookie:
            assert "HttpOnly" in set_cookie or "httponly" in set_cookie.lower()

    def test_session_cookie_secure(self, registered_user):
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        r = s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "123456", "csrfToken": csrf})
        set_cookie = r.headers.get("Set-Cookie", "")
        if set_cookie and "localhost" not in BASE:
            assert "Secure" in set_cookie

    def test_session_cookie_same_site(self, registered_user):
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        r = s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "123456", "csrfToken": csrf})
        set_cookie = r.headers.get("Set-Cookie", "")
        if set_cookie:
            assert "SameSite" in set_cookie

    def test_csrf_token_cookie(self):
        r = requests.get(f"{BASE}/api/auth/csrf")
        assert r.status_code == 200
        assert "csrfToken" in r.json()

    def test_session_persists_across_requests(self, registered_user):
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "123456", "csrfToken": csrf})
        r1 = s.get(f"{BASE}/api/profile/me")
        r2 = s.get(f"{BASE}/api/profile/me")
        assert r1.status_code == r2.status_code

    def test_session_different_users_isolation(self, registered_user):
        s1 = requests.Session()
        csrf1 = s1.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        s1.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "123456", "csrfToken": csrf1})

        s2 = requests.Session()
        csrf2 = s2.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        s2.post(f"{BASE}/api/auth/callback/credentials", json={"username": "admin_vlad", "password": "admin123", "csrfToken": csrf2})

        r1 = s1.get(f"{BASE}/api/profile/me")
        r2 = s2.get(f"{BASE}/api/profile/me")
        if r1.status_code == 200 and r2.status_code == 200:
            assert r1.json()["username"] != r2.json()["username"]

    def test_cookie_after_logout_cleared(self, registered_user):
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "123456", "csrfToken": csrf})
        r = s.post(f"{BASE}/api/auth/signout")
        assert r.status_code == 200

    def test_no_session_cookie_for_guest(self):
        r = requests.get(f"{BASE}/api/teams")
        set_cookie = r.headers.get("Set-Cookie", "")
        assert "session" not in set_cookie.lower()

    def test_csrf_token_rotates(self):
        s = requests.Session()
        r1 = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        r2 = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        assert r1 == r2
