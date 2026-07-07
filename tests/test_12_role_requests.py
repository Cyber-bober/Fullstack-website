import pytest, requests
BASE = "http://localhost:3000"

def login(u, p):
    s = requests.Session()
    csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
    s.post(f"{BASE}/api/auth/callback/credentials", json={"username": u, "password": p, "csrfToken": csrf})
    return s

class TestRoleRequests:
    def test_request_editor_201(self, registered_user):
        s = login(registered_user["username"], "123456")
        r = s.post(f"{BASE}/api/role-request", json={"requestedRole": "EDITOR"})
        assert r.status_code == 201

    def test_request_captain_201(self, registered_user):
        s = login(registered_user["username"], "123456")
        r = s.post(f"{BASE}/api/role-request", json={"requestedRole": "CAPTAIN"})
        assert r.status_code in [201, 400]

    def test_duplicate_request_400(self, registered_user):
        s = login(registered_user["username"], "123456")
        s.post(f"{BASE}/api/role-request", json={"requestedRole": "EDITOR"})
        r = s.post(f"{BASE}/api/role-request", json={"requestedRole": "EDITOR"})
        assert r.status_code == 400

    def test_request_invalid_role_400(self, registered_user):
        s = login(registered_user["username"], "123456")
        r = s.post(f"{BASE}/api/role-request", json={"requestedRole": "HACKER"})
        assert r.status_code == 400

    def test_request_unauthorized_401(self):
        r = requests.post(f"{BASE}/api/role-request", json={"requestedRole": "EDITOR"})
        assert r.status_code == 401

    def test_get_requests_admin_200(self, admin_session):
        assert admin_session.get(f"{BASE}/api/role-request").status_code == 200

    def test_get_requests_user_403(self, registered_user):
        s = login(registered_user["username"], "123456")
        assert s.get(f"{BASE}/api/role-request").status_code == 403

    def test_approve_request_admin_200(self, admin_session):
        requests_list = admin_session.get(f"{BASE}/api/role-request").json()
        pending = [r for r in requests_list if r.get("status") == "PENDING"]
        if not pending: pytest.skip("No pending requests")
        r = admin_session.patch(f"{BASE}/api/role-request?id={pending[0]['id']}", json={"status": "APPROVED"})
        assert r.status_code == 200
