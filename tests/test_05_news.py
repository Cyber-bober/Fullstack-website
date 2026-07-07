import pytest, requests
BASE = "http://localhost:3000"

class TestNewsCRUD:
    def test_get_news_200(self):
        r = requests.get(f"{BASE}/api/news")
        assert r.status_code == 200
        assert "data" in r.json()

    def test_create_news_201(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE}/api/news", json={"title": f"N{unique_id}", "content": "Valid content for news"})
        assert r.status_code == 201

    def test_create_news_empty_title_400(self, admin_session):
        assert admin_session.post(f"{BASE}/api/news", json={"title": "", "content": "Valid"}).status_code == 400

    def test_create_news_empty_content_400(self, admin_session):
        assert admin_session.post(f"{BASE}/api/news", json={"title": "T", "content": ""}).status_code == 400

    def test_create_news_short_title_400(self, admin_session):
        assert admin_session.post(f"{BASE}/api/news", json={"title": "AB", "content": "Valid content"}).status_code == 400

    def test_create_news_short_content_400(self, admin_session):
        assert admin_session.post(f"{BASE}/api/news", json={"title": "Valid", "content": "Short"}).status_code == 400

    def test_create_news_unauthorized_401(self):
        assert requests.post(f"{BASE}/api/news", json={"title": "T", "content": "Valid content"}).status_code == 401

    def test_delete_news_200(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE}/api/news", json={"title": f"Del{unique_id}", "content": "Valid content"})
        assert r.status_code == 201
        news_id = r.json()["id"]
    
        r = admin_session.delete(f"{BASE}/api/news?id={news_id}")
        assert r.status_code == 200

    def test_news_pagination_200(self):
        r = requests.get(f"{BASE}/api/news?page=1&limit=5")
        assert r.status_code == 200
        assert r.json()["meta"]["limit"] == 5

    def test_news_search_200(self):
        assert requests.get(f"{BASE}/api/news?q=test").status_code == 200
