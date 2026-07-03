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

class TestNewsPublic:
    """Публичный доступ к новостям"""

    def test_get_news_public(self):
        r = requests.get(f"{BASE_URL}/api/news")
        assert r.status_code == 200
        data = r.json()
        assert "data" in data
        assert "meta" in data

    def test_get_news_pagination(self):
        r = requests.get(f"{BASE_URL}/api/news?page=1&limit=5")
        assert r.status_code == 200
        meta = r.json().get("meta", {})
        assert meta.get("page") == 1
        assert meta.get("limit") == 5

    def test_get_news_search(self):
        r = requests.get(f"{BASE_URL}/api/news?q=test")
        assert r.status_code == 200

    def test_get_news_empty_search(self):
        r = requests.get(f"{BASE_URL}/api/news?q=xyz_not_found_123")
        assert r.status_code == 200

class TestNewsCreate:
    """Создание новостей"""

    def test_create_news_as_admin(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE_URL}/api/news", json={
            "title": f"News {unique_id}",
            "content": "Test content for news creation",
        })
        assert r.status_code == 201

    def test_create_news_as_editor(self, unique_id):
        s, ok = login_as("editor", "123456")
        assert ok
        r = s.post(f"{BASE_URL}/api/news", json={
            "title": f"Editor News {unique_id}",
            "content": "Editor test content",
        })
        assert r.status_code == 201

    def test_create_news_empty_title(self, admin_session):
        r = admin_session.post(f"{BASE_URL}/api/news", json={
            "title": "",
            "content": "Content",
        })
        assert r.status_code == 400

    def test_create_news_empty_content(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE_URL}/api/news", json={
            "title": f"Title {unique_id}",
            "content": "",
        })
        assert r.status_code == 400

    def test_create_news_as_user(self, registered_user):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok
        r = s.post(f"{BASE_URL}/api/news", json={
            "title": "User News",
            "content": "Should fail",
        })
        assert r.status_code == 403

    def test_create_news_unauthorized(self):
        r = requests.post(f"{BASE_URL}/api/news", json={
            "title": "No auth",
            "content": "Should fail",
        })
        assert r.status_code in [401, 403]

class TestNewsEdit:
    """Редактирование новостей"""

    def test_edit_news_as_admin(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE_URL}/api/news", json={
            "title": f"Edit Me {unique_id}",
            "content": "Original content",
        })
        if r.status_code != 201: pytest.skip("Create failed")
        news_id = r.json().get("id")

        r = admin_session.patch(f"{BASE_URL}/api/news/{news_id}", json={
            "title": f"Edited {unique_id}",
            "content": "Updated content",
        })
        assert r.status_code == 200

    def test_edit_nonexistent_news(self, admin_session):
        r = admin_session.patch(f"{BASE_URL}/api/news/nonexistent-id", json={
            "title": "Test",
        })
        assert r.status_code in [404, 500]

class TestNewsDelete:
    """Удаление новостей"""

    def test_delete_news_as_admin(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE_URL}/api/news", json={
            "title": f"Delete Me {unique_id}",
            "content": "To be deleted",
        })
        if r.status_code != 201: pytest.skip("Create failed")
        news_id = r.json().get("id")

        r = admin_session.delete(f"{BASE_URL}/api/news/{news_id}")
        assert r.status_code in [200, 204]

        r = requests.get(f"{BASE_URL}/api/news/{news_id}")
        assert r.status_code in [404, 405]

    def test_delete_news_as_user(self, registered_user, unique_id):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok
        r = s.delete(f"{BASE_URL}/api/news/some-id")
        assert r.status_code in [401, 403, 404]
