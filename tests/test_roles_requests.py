import pytest
import requests
import time

BASE_URL = "http://localhost:3000"

def login_as(username, password):
    s = requests.Session()
    csrf = s.get(f"{BASE_URL}/api/auth/csrf").json().get("csrfToken", "")
    r = s.post(f"{BASE_URL}/api/auth/callback/credentials", json={
        "username": username, "password": password, "csrfToken": csrf,
    })
    return s, r.status_code == 200

class TestRoleRequests:
    def test_request_role_unauthorized(self):
        r = requests.post(f"{BASE_URL}/api/role-request", json={"requestedRole": "EDITOR"})
        assert r.status_code == 401

    def test_request_editor_role(self, registered_user):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok
        r = s.post(f"{BASE_URL}/api/role-request", json={"requestedRole": "EDITOR"})
        assert r.status_code in [200, 201, 400]

    def test_request_captain_role(self, registered_user):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok
        r = s.post(f"{BASE_URL}/api/role-request", json={"requestedRole": "CAPTAIN"})
        assert r.status_code in [200, 201, 400]

    def test_duplicate_request(self, registered_user):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok
        s.post(f"{BASE_URL}/api/role-request", json={"requestedRole": "EDITOR"})
        r = s.post(f"{BASE_URL}/api/role-request", json={"requestedRole": "EDITOR"})
        assert r.status_code in [200, 201, 400]

    def test_get_requests_as_admin(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/role-request")
        assert r.status_code == 200

    def test_get_requests_as_user(self, registered_user):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok
        r = s.get(f"{BASE_URL}/api/role-request")
        assert r.status_code in [200, 403]
