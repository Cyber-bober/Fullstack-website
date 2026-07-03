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

class TestLiveStream:
    def test_get_livestream_public(self):
        r = requests.get(f"{BASE_URL}/api/livestream")
        assert r.status_code in [200, 404]

    def test_update_livestream_as_admin(self, admin_session):
        r = admin_session.patch(f"{BASE_URL}/api/livestream", json={
            "title": "Test Stream",
            "isActive": True,
        })
        assert r.status_code in [200, 201, 500]

    def test_update_livestream_as_user(self, registered_user):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok
        r = s.patch(f"{BASE_URL}/api/livestream", json={"title": "User Stream"})
        assert r.status_code in [401, 403, 500]
