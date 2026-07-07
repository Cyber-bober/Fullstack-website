import pytest, requests
BASE = "http://localhost:3000"

def login(u, p):
    s = requests.Session()
    csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
    s.post(f"{BASE}/api/auth/callback/credentials", json={"username": u, "password": p, "csrfToken": csrf})
    return s

class TestUserSearch:
    def test_search_by_username_200(self, registered_user):
        s = login(registered_user["username"], "123456")
        r = s.get(f"{BASE}/api/users/search?q=admin")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_search_by_fullname_200(self, registered_user):
        s = login(registered_user["username"], "123456")
        r = s.get(f"{BASE}/api/users/search?q=Влад")
        assert r.status_code == 200

    def test_search_empty_query_200(self, registered_user):
        s = login(registered_user["username"], "123456")
        assert s.get(f"{BASE}/api/users/search?q=").status_code == 200

    def test_search_short_query_200(self, registered_user):
        s = login(registered_user["username"], "123456")
        r = s.get(f"{BASE}/api/users/search?q=a")
        assert r.status_code in [200, 400]

    def test_search_unauthorized_401(self):
        assert requests.get(f"{BASE}/api/users/search?q=admin").status_code == 401

    def test_search_special_chars_200(self, registered_user):
        s = login(registered_user["username"], "123456")
        r = s.get(f"{BASE}/api/users/search?q=%20%3Cscript%3E")
        assert r.status_code in [200, 400]
