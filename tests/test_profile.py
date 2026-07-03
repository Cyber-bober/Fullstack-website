import pytest
import requests

BASE_URL = "http://localhost:3000"

def login_as(username, password):
    s = requests.Session()
    csrf = s.get(f"{BASE_URL}/api/auth/csrf").json().get("csrfToken", "")
    r = s.post(f"{BASE_URL}/api/auth/callback/credentials", json={
        "username": username, "password": password, "csrfToken": csrf,
    })
    return s, r.status_code == 200

class TestProfileAccess:
    def test_get_my_profile_as_user(self, registered_user):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok
        r = s.get(f"{BASE_URL}/api/profile/me")
        assert r.status_code in [200, 404]

    def test_get_profile_unauthorized(self):
        r = requests.get(f"{BASE_URL}/api/profile/me")
        assert r.status_code == 401

class TestProfileUpdate:
    def test_update_profile_must_work(self, registered_user):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok
        r = s.post(f"{BASE_URL}/api/profile/update", json={"city": "New City"})
        assert r.status_code == 200, f"API profile/update not working: {r.status_code}"

class TestPasswordChange:
    def test_change_password_must_work(self, registered_user):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok
        r = s.post(f"{BASE_URL}/api/profile/change-password", json={
            "current": "123456", "new": "654321",
        })
        assert r.status_code == 200, f"API change-password not working: {r.status_code}"
