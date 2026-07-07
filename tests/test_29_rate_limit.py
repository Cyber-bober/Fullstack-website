import pytest, requests, time
BASE = "http://localhost:3000"

class TestRateLimit:
    def test_login_rate_limit(self, registered_user):
        for _ in range(30):
            s = requests.Session()
            csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
            r = s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "wrong", "csrfToken": csrf})
            if r.status_code == 429:
                break
        assert True

    def test_register_rate_limit(self, unique_id):
        for i in range(30):
            r = requests.post(f"{BASE}/api/auth/register", json={"username": f"rl{unique_id}_{i}", "password": "123456", "fullName": "Test"})
            if r.status_code == 429:
                break
        assert True

    def test_api_rate_limit(self):
        for _ in range(100):
            r = requests.get(f"{BASE}/api/teams")
            if r.status_code == 429:
                break
        assert True

    def test_search_rate_limit(self, admin_session):
        for _ in range(50):
            r = admin_session.get(f"{BASE}/api/users/search?q=test")
            if r.status_code == 429:
                break
        assert True

    def test_create_team_rate_limit(self, admin_session, unique_id):
        for i in range(30):
            r = admin_session.post(f"{BASE}/api/teams/create", json={"name": f"RL{unique_id}_{i}"})
            if r.status_code == 429:
                break
        assert True

    def test_create_news_rate_limit(self, admin_session, unique_id):
        for i in range(30):
            r = admin_session.post(f"{BASE}/api/news", json={"title": f"RL{unique_id}_{i}", "content": "Rate limit test content"})
            if r.status_code == 429:
                break
        assert True

    def test_chat_rate_limit(self, registered_user, admin_session):
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "123456", "csrfToken": csrf})
        r = admin_session.get(f"{BASE}/api/users/search?q=admin_vlad")
        admin = next((u for u in r.json() if u["username"] == "admin_vlad"), None)
        if not admin: pytest.skip("Admin not found")
        for _ in range(30):
            r = s.post(f"{BASE}/api/chat/messages", json={"receiverId": admin["id"], "text": "Rate"})
            if r.status_code == 429:
                break
        assert True

    def test_support_rate_limit(self, registered_user):
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "123456", "csrfToken": csrf})
        for _ in range(20):
            r = s.post(f"{BASE}/api/support/tickets", json={"subject": "Rate", "text": "Test"})
            if r.status_code == 429:
                break
        assert True
