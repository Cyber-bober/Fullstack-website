import requests
import time

BASE = "http://localhost:3000"

class TestAPI:
    """Все HTTP-методы"""
    
    def test_get_teams(self):
        r = requests.get(f"{BASE}/api/teams")
        assert r.status_code == 200
        assert "data" in r.json()

    def test_get_news(self):
        r = requests.get(f"{BASE}/api/news")
        assert r.status_code == 200

    def test_get_matches(self):
        r = requests.get(f"{BASE}/api/matches")
        assert r.status_code == 200

    def test_post_register(self):
        r = requests.post(f"{BASE}/api/auth/register", json={
            "username": f"api_test_{int(time.time())}",
            "password": "123456",
            "fullName": "API Test",
            "city": "Moscow",
        })
        assert r.status_code in [200, 201]

    def test_delete_unauthorized(self):
        r = requests.delete(f"{BASE}/api/teams?id=test")
        assert r.status_code in [401, 403, 405]
