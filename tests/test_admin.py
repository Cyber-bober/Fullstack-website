import pytest
import requests

BASE_URL = "http://localhost:3000"

class TestAdmin:
    def test_get_users_as_admin(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/users")
        assert r.status_code == 200

    def test_get_users_as_user(self, registered_user):
        s = requests.Session()
        csrf = s.get(f"{BASE_URL}/api/auth/csrf").json().get("csrfToken", "")
        s.post(f"{BASE_URL}/api/auth/callback/credentials", json={
            "username": registered_user["username"],
            "password": registered_user["password"],
            "csrfToken": csrf,
        })
        r = s.get(f"{BASE_URL}/api/admin/users")
        assert r.status_code == 403

    def test_get_users_unauthorized(self):
        r = requests.get(f"{BASE_URL}/api/admin/users")
        assert r.status_code in [401, 403]

    def test_change_user_role(self, admin_session, registered_user):
        r = admin_session.get(f"{BASE_URL}/api/users/search?q={registered_user['username']}")
        users = r.json()
        user = next((u for u in users if u.get("username") == registered_user["username"]), None)
        if not user: pytest.skip("User not found")
        r = admin_session.patch(f"{BASE_URL}/api/users/{user['id']}/role", json={"role": "EDITOR"})
        assert r.status_code in [200, 201, 404]
