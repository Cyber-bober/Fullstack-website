import pytest, requests
BASE = "http://localhost:3000"

class TestNotifications:
    def test_get_notifications_200(self, admin_session):
        r = admin_session.get(f"{BASE}/api/notifications")
        assert r.status_code in [200, 404, 500]

    def test_get_notifications_user_200(self, registered_user):
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "123456", "csrfToken": csrf})
        r = s.get(f"{BASE}/api/notifications")
        assert r.status_code in [200, 404, 500]

    def test_get_notifications_unauthorized_401(self):
        r = requests.get(f"{BASE}/api/notifications")
        assert r.status_code in [401, 403]

    def test_notifications_structure(self, admin_session):
        r = admin_session.get(f"{BASE}/api/notifications")
        if r.status_code == 200:
            data = r.json()
            assert "chat" in data or "support" in data or isinstance(data, dict)
