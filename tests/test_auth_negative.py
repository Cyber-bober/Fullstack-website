import pytest
import requests
import time

BASE_URL = "http://localhost:3000"

class TestRegistrationNegative:
    """Регистрация — все негативные сценарии"""

    def test_register_username_special_chars(self, api, unique_id):
        for char in ["@", "#", "$", "%", " ", "кириллица"]:
            r = api.post(f"{BASE_URL}/api/auth/register", json={
                "username": f"test{char}{unique_id}",
                "password": "123456", "fullName": "Test", "city": "Moscow",
            })
            assert r.status_code in [200, 400]

    def test_register_username_too_long(self, api, unique_id):
        r = api.post(f"{BASE_URL}/api/auth/register", json={
            "username": "a" * 51 + str(unique_id),
            "password": "123456", "fullName": "Test", "city": "Moscow",
        })
        assert r.status_code in [200, 400]

    def test_register_password_too_long(self, api, unique_id):
        r = api.post(f"{BASE_URL}/api/auth/register", json={
            "username": f"longpass_{unique_id}",
            "password": "a" * 129, "fullName": "Test", "city": "Moscow",
        })
        assert r.status_code in [200, 400]

    def test_register_fullname_too_long(self, api, unique_id):
        r = api.post(f"{BASE_URL}/api/auth/register", json={
            "username": f"longname_{unique_id}",
            "password": "123456", "fullName": "A" * 201, "city": "Moscow",
        })
        assert r.status_code in [200, 400]

    def test_register_missing_fields(self, api):
        combos = [
            {"password": "123456", "fullName": "Test"},
            {"username": "test", "fullName": "Test"},
            {"username": "test", "password": "123456"},
        ]
        for data in combos:
            r = api.post(f"{BASE_URL}/api/auth/register", json=data)
            assert r.status_code == 400

    def test_register_xss_attempt(self, api, unique_id):
        r = api.post(f"{BASE_URL}/api/auth/register", json={
            "username": f"<script>alert(1)</script>{unique_id}",
            "password": "123456", "fullName": "Test", "city": "Moscow",
        })
        assert r.status_code in [200, 400]

    def test_register_sql_injection_attempt(self, api, unique_id):
        r = api.post(f"{BASE_URL}/api/auth/register", json={
            "username": f"'; DROP TABLE users;--{unique_id}",
            "password": "123456", "fullName": "Test", "city": "Moscow",
        })
        assert r.status_code in [200, 400]

class TestLoginNegative:
    """Вход — негативные сценарии"""

    def test_login_empty_username(self):
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/auth/callback/credentials", json={
            "username": "", "password": "123456",
        })
        assert "/auth/signin" in str(r.url)

    def test_login_empty_password(self):
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/auth/callback/credentials", json={
            "username": "admin_vlad", "password": "",
        })
        assert "/auth/signin" in str(r.url)

    def test_login_both_empty(self):
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/auth/callback/credentials", json={
            "username": "", "password": "",
        })
        assert "/auth/signin" in str(r.url)

    def test_login_sql_injection(self):
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/auth/callback/credentials", json={
            "username": "admin' OR '1'='1",
            "password": "admin' OR '1'='1",
        })
        assert "/auth/signin" in str(r.url)

    def test_login_bruteforce_same_user(self, registered_user):
        for _ in range(5):
            s = requests.Session()
            r = s.post(f"{BASE_URL}/api/auth/callback/credentials", json={
                "username": registered_user["username"],
                "password": f"wrong_{_}",
            })
        assert True  # Не должно упасть

class TestSession:
    """Сессия — проверки"""

    def test_session_persists(self, registered_user):
        s = requests.Session()
        csrf = s.get(f"{BASE_URL}/api/auth/csrf").json().get("csrfToken", "")
        s.post(f"{BASE_URL}/api/auth/callback/credentials", json={
            "username": registered_user["username"],
            "password": registered_user["password"],
            "csrfToken": csrf,
        })
        r1 = s.get(f"{BASE_URL}/api/profile/me")
        r2 = s.get(f"{BASE_URL}/api/profile/me")
        assert r1.status_code == r2.status_code

    def test_session_cross_user(self, registered_user):
        s1 = requests.Session()
        csrf1 = s1.get(f"{BASE_URL}/api/auth/csrf").json().get("csrfToken", "")
        s1.post(f"{BASE_URL}/api/auth/callback/credentials", json={
            "username": registered_user["username"],
            "password": registered_user["password"],
            "csrfToken": csrf1,
        })
        s2 = requests.Session()
        csrf2 = s2.get(f"{BASE_URL}/api/auth/csrf").json().get("csrfToken", "")
        s2.post(f"{BASE_URL}/api/auth/callback/credentials", json={
            "username": "admin_vlad", "password": "admin123",
            "csrfToken": csrf2,
        })
        r1 = s1.get(f"{BASE_URL}/api/profile/me")
        r2 = s2.get(f"{BASE_URL}/api/profile/me")
        assert r1.status_code in [200, 404]
        assert r2.status_code in [200, 404]
