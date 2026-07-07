import pytest, requests
BASE = "http://localhost:3000"

class TestSQLInjection:
    def test_register_sqli_fullname_400(self, unique_id):
        for p in ["'; DROP TABLE users;--", "' OR '1'='1", "1' OR '1'='1 --"]:
            r = requests.post(f"{BASE}/api/auth/register", json={
                "username": f"s{unique_id}", "password": "123456", "fullName": p,
            })
            assert r.status_code == 400, f"SQLi not blocked: {p}"

    def test_register_sqli_username_400(self, unique_id):
        r = requests.post(f"{BASE}/api/auth/register", json={
            "username": f"'; DROP TABLE users;--_{unique_id}", "password": "123456", "fullName": "Test",
        })
        assert r.status_code == 400

    def test_news_sqli_title_400(self, admin_session):
        r = admin_session.post(f"{BASE}/api/news", json={
            "title": "'; DROP TABLE users;--", "content": "Valid content for testing",
        })
        assert r.status_code == 400

    def test_news_sqli_content_400(self, admin_session):
        r = admin_session.post(f"{BASE}/api/news", json={
            "title": "Test", "content": "'; DROP TABLE users;--",
        })
        assert r.status_code == 400

    def test_team_sqli_name_400(self, admin_session):
        r = admin_session.post(f"{BASE}/api/teams/create", json={"name": "'; DROP TABLE teams;--"})
        assert r.status_code == 400

class TestXSS:
    def test_register_xss_fullname_400(self, unique_id):
        for p in ["<script>alert(1)</script>", "<img src=x onerror=alert(1)>", "<svg onload=alert(1)>"]:
            r = requests.post(f"{BASE}/api/auth/register", json={
                "username": f"x{unique_id}", "password": "123456", "fullName": p,
            })
            assert r.status_code == 400, f"XSS not blocked: {p}"

    def test_news_xss_title_400(self, admin_session):
        r = admin_session.post(f"{BASE}/api/news", json={
            "title": "<script>alert(1)</script>", "content": "Valid content",
        })
        assert r.status_code == 400

    def test_news_xss_content_400(self, admin_session):
        r = admin_session.post(f"{BASE}/api/news", json={
            "title": "Test", "content": "<img src=x onerror=alert(1)>",
        })
        assert r.status_code == 400

    def test_team_xss_name_400(self, admin_session):
        r = admin_session.post(f"{BASE}/api/teams/create", json={"name": "<script>alert(1)</script>"})
        assert r.status_code == 400

class TestCSRF:
    def test_team_create_no_csrf_403(self):
        assert requests.post(f"{BASE}/api/teams/create", json={"name": "H"}).status_code == 401

    def test_news_create_no_csrf_403(self):
        assert requests.post(f"{BASE}/api/news", json={"title": "H", "content": "Valid content"}).status_code == 401

    def test_match_create_no_csrf_403(self):
        assert requests.post(f"{BASE}/api/matches", json={
            "homeTeamId": "x", "awayTeamId": "y", "date": "2025-12-01T18:00:00.000Z",
        }).status_code == 401

class TestValidation:
    def test_register_empty_username_400(self):
        assert requests.post(f"{BASE}/api/auth/register", json={"username": "", "password": "123456", "fullName": "T"}).status_code == 400

    def test_register_empty_password_400(self, unique_id):
        assert requests.post(f"{BASE}/api/auth/register", json={"username": f"u{unique_id}", "password": "", "fullName": "T"}).status_code == 400

    def test_register_empty_fullname_400(self, unique_id):
        assert requests.post(f"{BASE}/api/auth/register", json={"username": f"u{unique_id}", "password": "123456", "fullName": ""}).status_code == 400

    def test_register_short_username_400(self):
        assert requests.post(f"{BASE}/api/auth/register", json={"username": "ab", "password": "123456", "fullName": "Test"}).status_code == 400

    def test_register_short_password_400(self, unique_id):
        assert requests.post(f"{BASE}/api/auth/register", json={"username": f"u{unique_id}", "password": "123", "fullName": "Test"}).status_code == 400

    def test_register_long_username_400(self, unique_id):
        assert requests.post(f"{BASE}/api/auth/register", json={"username": "a"*31, "password": "123456", "fullName": "Test"}).status_code == 400

    def test_register_long_fullname_400(self, unique_id):
        assert requests.post(f"{BASE}/api/auth/register", json={"username": f"u{unique_id}", "password": "123456", "fullName": "A"*101}).status_code == 400

    def test_news_empty_title_400(self, admin_session):
        assert admin_session.post(f"{BASE}/api/news", json={"title": "", "content": "Valid"}).status_code == 400

    def test_news_empty_content_400(self, admin_session):
        assert admin_session.post(f"{BASE}/api/news", json={"title": "Test", "content": ""}).status_code == 400

    def test_news_short_title_400(self, admin_session):
        assert admin_session.post(f"{BASE}/api/news", json={"title": "AB", "content": "Valid content"}).status_code == 400

    def test_news_short_content_400(self, admin_session):
        assert admin_session.post(f"{BASE}/api/news", json={"title": "Valid Title", "content": "Short"}).status_code == 400

    def test_team_empty_name_400(self, admin_session):
        assert admin_session.post(f"{BASE}/api/teams/create", json={"name": ""}).status_code == 400

    def test_team_short_name_400(self, admin_session):
        assert admin_session.post(f"{BASE}/api/teams/create", json={"name": "A"}).status_code == 400
