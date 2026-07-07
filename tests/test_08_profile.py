import pytest, requests
BASE = "http://localhost:3000"

def login(u, p):
    s = requests.Session()
    csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
    s.post(f"{BASE}/api/auth/callback/credentials", json={"username": u, "password": p, "csrfToken": csrf})
    return s

class TestProfile:
    def test_get_me_200(self, registered_user):
        s = login(registered_user["username"], "123456")
        assert s.get(f"{BASE}/api/profile/me").status_code == 200

    def test_get_me_unauthorized_401(self):
        assert requests.get(f"{BASE}/api/profile/me").status_code == 401

    def test_update_profile_200(self, registered_user):
        s = login(registered_user["username"], "123456")
        assert s.post(f"{BASE}/api/profile/update", json={"city": "New City"}).status_code == 200

    def test_change_password_200(self, registered_user):
        s = login(registered_user["username"], "123456")
        assert s.post(f"{BASE}/api/profile/change-password", json={"current": "123456", "new": "654321"}).status_code == 200
