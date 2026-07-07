import pytest, requests, time
BASE = "http://localhost:3000"

class TestRegister:
    def test_register_success_201(self, unique_id):
        r = requests.post(f"{BASE}/api/auth/register", json={
            "username": f"u{unique_id}", "password": "123456", "fullName": "Test User", "city": "Moscow",
        })
        assert r.status_code == 201

    def test_register_duplicate_400(self, registered_user):
        r = requests.post(f"{BASE}/api/auth/register", json={
            "username": registered_user["username"], "password": "123456", "fullName": "Dup",
        })
        assert r.status_code == 400

class TestLogin:
    def test_login_success_200(self, registered_user):
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        r = s.post(f"{BASE}/api/auth/callback/credentials", json={
            "username": registered_user["username"], "password": "123456", "csrfToken": csrf,
        })
        assert r.status_code == 200

    def test_login_wrong_password_redirect(self, registered_user):
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        r = s.post(f"{BASE}/api/auth/callback/credentials", json={
            "username": registered_user["username"], "password": "wrong", "csrfToken": csrf,
        })
        assert "/auth/signin" in str(r.url)

    def test_login_nonexistent_redirect(self, unique_id):
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        r = s.post(f"{BASE}/api/auth/callback/credentials", json={
            "username": f"no{unique_id}", "password": "123456", "csrfToken": csrf,
        })
        assert "/auth/signin" in str(r.url)

class TestLogout:
    def test_logout_200(self, registered_user):
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        s.post(f"{BASE}/api/auth/callback/credentials", json={
            "username": registered_user["username"], "password": "123456", "csrfToken": csrf,
        })
        assert s.post(f"{BASE}/api/auth/signout").status_code == 200

class TestSession:
    def test_guest_profile_403(self):
        assert requests.get(f"{BASE}/api/profile/me").status_code == 401

    def test_guest_admin_403(self):
        assert requests.get(f"{BASE}/api/admin/users").status_code == 401

    def test_guest_chat_403(self):
        assert requests.get(f"{BASE}/api/chat/conversations").status_code == 401

    def test_guest_teams_200(self):
        assert requests.get(f"{BASE}/api/teams").status_code == 200

    def test_guest_news_200(self):
        assert requests.get(f"{BASE}/api/news").status_code == 200

    def test_guest_matches_200(self):
        assert requests.get(f"{BASE}/api/matches").status_code == 200
