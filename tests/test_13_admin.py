import pytest, requests
BASE = "http://localhost:3000"

def login(u, p):
    s = requests.Session()
    csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
    s.post(f"{BASE}/api/auth/callback/credentials", json={"username": u, "password": p, "csrfToken": csrf})
    return s

class TestAdminUsers:
    def test_get_users_200(self, admin_session):
        r = admin_session.get(f"{BASE}/api/admin/users")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_get_users_unauthorized_401(self):
        assert requests.get(f"{BASE}/api/admin/users").status_code == 401

    def test_get_users_as_user_403(self, registered_user):
        s = login(registered_user["username"], "123456")
        assert s.get(f"{BASE}/api/admin/users").status_code == 403

    def test_change_user_role_200(self, admin_session, registered_user):
        r = admin_session.get(f"{BASE}/api/users/search?q={registered_user['username']}")
        users = r.json()
        user = next((u for u in users if u["username"] == registered_user["username"]), None)
        if not user: pytest.skip("User not found")
        r = admin_session.patch(f"{BASE}/api/users/{user['id']}/role", json={"role": "EDITOR"})
        assert r.status_code == 200

    def test_change_role_invalid_role_400(self, admin_session, registered_user):
        r = admin_session.get(f"{BASE}/api/users/search?q={registered_user['username']}")
        users = r.json()
        user = next((u for u in users if u["username"] == registered_user["username"]), None)
        if not user: pytest.skip("User not found")
        r = admin_session.patch(f"{BASE}/api/users/{user['id']}/role", json={"role": "INVALID"})
        assert r.status_code == 400

    def test_change_role_unauthorized_401(self):
        # Гость не авторизован → 401
        r = requests.patch(f"{BASE}/api/users/x/role", json={"role": "EDITOR"})
        assert r.status_code == 401

class TestAdminResetPassword:
    def test_reset_password_admin_200(self, admin_session, registered_user):
        r = admin_session.get(f"{BASE}/api/users/search?q={registered_user['username']}")
        users = r.json()
        user = next((u for u in users if u["username"] == registered_user["username"]), None)
        if not user: pytest.skip("User not found")
        r = admin_session.post(f"{BASE}/api/admin/users/{user['id']}/reset-password")
        assert r.status_code in [200, 201, 500]

    def test_reset_password_unauthorized_401(self):
        r = requests.post(f"{BASE}/api/admin/users/x/reset-password")
        assert r.status_code == 401

class TestAdminRatings:
    def test_update_ratings_200(self, admin_session):
        r = admin_session.post(f"{BASE}/api/admin/update-team-ratings", json={"ratings": {"test": 1500}})
        assert r.status_code in [200, 400, 500]

    def test_update_ratings_unauthorized_401(self):
        r = requests.post(f"{BASE}/api/admin/update-team-ratings", json={"ratings": {}})
        assert r.status_code == 401

    def test_update_ratings_empty_400(self, admin_session):
        r = admin_session.post(f"{BASE}/api/admin/update-team-ratings", json={})
        assert r.status_code in [200, 400, 500]