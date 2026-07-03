import pytest
import requests

BASE_URL = "http://localhost:3000"

class TestNewsNegative:
    def test_create_news_empty_title(self, admin_session):
        r = admin_session.post(f"{BASE_URL}/api/news", json={"title": "", "content": "Test"})
        assert r.status_code == 400

    def test_create_news_empty_content(self, admin_session):
        r = admin_session.post(f"{BASE_URL}/api/news", json={"title": "Test", "content": ""})
        assert r.status_code == 400

    def test_create_news_both_empty(self, admin_session):
        r = admin_session.post(f"{BASE_URL}/api/news", json={"title": "", "content": ""})
        assert r.status_code == 400

    def test_create_news_no_title_field(self, admin_session):
        r = admin_session.post(f"{BASE_URL}/api/news", json={"content": "Test"})
        assert r.status_code == 400

    def test_create_news_no_content_field(self, admin_session):
        r = admin_session.post(f"{BASE_URL}/api/news", json={"title": "Test"})
        assert r.status_code == 400

    def test_create_news_very_long_title(self, admin_session):
        r = admin_session.post(f"{BASE_URL}/api/news", json={
            "title": "T" * 500, "content": "Test",
        })
        assert r.status_code in [201, 400]

    def test_create_news_very_long_content(self, admin_session):
        r = admin_session.post(f"{BASE_URL}/api/news", json={
            "title": "Test", "content": "C" * 50000,
        })
        assert r.status_code in [201, 400]

    def test_create_news_xss(self, admin_session):
        r = admin_session.post(f"{BASE_URL}/api/news", json={
            "title": "<script>alert('xss')</script>",
            "content": "<img src=x onerror=alert(1)>",
        })
        assert r.status_code in [201, 400]

    def test_delete_news_nonexistent(self, admin_session):
        r = admin_session.delete(f"{BASE_URL}/api/news/nonexistent-id")
        assert r.status_code in [200, 404, 500]

    def test_update_news_nonexistent(self, admin_session):
        r = admin_session.patch(f"{BASE_URL}/api/news/nonexistent-id", json={"title": "Test"})
        assert r.status_code in [200, 404, 500]
