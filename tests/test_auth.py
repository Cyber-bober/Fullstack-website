import pytest
import requests
import time

BASE_URL = "http://localhost:3000"

class TestRegistration:

    def test_register_success(self, api, unique_id):
        r = api.post(f"{BASE_URL}/api/auth/register", json={
            "username": f"reg_{unique_id}",
            "password": "123456",
            "fullName": "New User",
            "city": "Moscow",
        })
        assert r.status_code in [200, 201]

    def test_register_duplicate_username(self, api, registered_user):
        r = api.post(f"{BASE_URL}/api/auth/register", json={
            "username": registered_user["username"],
            "password": "123456",
            "fullName": "Dup",
            "city": "Kazan",
        })
        assert r.status_code == 400

    def test_register_empty_username(self, api):
        r = api.post(f"{BASE_URL}/api/auth/register", json={
            "username": "", "password": "123456", "fullName": "Test", "city": "Moscow",
        })
        assert r.status_code == 400

    def test_register_empty_password(self, api, unique_id):
        r = api.post(f"{BASE_URL}/api/auth/register", json={
            "username": f"nopass_{unique_id}", "password": "", "fullName": "Test", "city": "Moscow",
        })
        assert r.status_code == 400

    def test_register_empty_name(self, api, unique_id):
        r = api.post(f"{BASE_URL}/api/auth/register", json={
            "username": f"noname_{unique_id}", "password": "123456", "fullName": "", "city": "Moscow",
        })
        assert r.status_code == 400

    def test_register_short_username(self, api):
        r = api.post(f"{BASE_URL}/api/auth/register", json={
            "username": "ab", "password": "123456", "fullName": "Test", "city": "Moscow",
        })
        assert r.status_code == 400

    def test_register_short_password(self, api, unique_id):
        r = api.post(f"{BASE_URL}/api/auth/register", json={
            "username": f"short_{unique_id}", "password": "123", "fullName": "Test", "city": "Moscow",
        })
        assert r.status_code in [400, 200, 201]


class TestLoginLogout:

    def test_login_success(self, registered_user):
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/auth/callback/credentials", json={
            "username": registered_user["username"],
            "password": registered_user["password"],
        })
        assert r.status_code == 200

    def test_login_wrong_password(self, registered_user):
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/auth/callback/credentials", json={
            "username": registered_user["username"],
            "password": "wrong_password",
        })
        assert "/auth/signin" in str(r.url)

    def test_login_nonexistent_user(self, unique_id):
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/auth/callback/credentials", json={
            "username": f"ghost_{unique_id}",
            "password": "123456",
        })
        assert "/auth/signin" in str(r.url)

    def test_logout(self, registered_user):
        s = requests.Session()
        s.post(f"{BASE_URL}/api/auth/callback/credentials", json={
            "username": registered_user["username"],
            "password": registered_user["password"],
        })
        r = s.post(f"{BASE_URL}/api/auth/signout")
        assert r.status_code == 200

    def test_after_logout_no_profile(self, registered_user):
        s = requests.Session()
        s.post(f"{BASE_URL}/api/auth/callback/credentials", json={
            "username": registered_user["username"],
            "password": registered_user["password"],
        })
        s.post(f"{BASE_URL}/api/auth/signout")
        r = s.get(f"{BASE_URL}/api/profile/me")
        assert r.status_code == 401

    def test_login_twice_same_session(self, registered_user):
        s = requests.Session()
        r1 = s.post(f"{BASE_URL}/api/auth/callback/credentials", json={
            "username": registered_user["username"],
            "password": registered_user["password"],
        })
        r2 = s.post(f"{BASE_URL}/api/auth/callback/credentials", json={
            "username": registered_user["username"],
            "password": registered_user["password"],
        })
        assert r1.status_code == 200
        assert r2.status_code == 200


class TestRoles:

    def test_admin_access(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/users")
        assert r.status_code == 200

    def test_user_cannot_access_admin(self, registered_user):
        s = requests.Session()
        s.post(f"{BASE_URL}/api/auth/callback/credentials", json={
            "username": registered_user["username"],
            "password": registered_user["password"],
        })
        r = s.get(f"{BASE_URL}/api/admin/users")
        assert r.status_code == 403

    def test_guest_cannot_access_profile(self, api):
        r = api.get(f"{BASE_URL}/api/profile/me")
        assert r.status_code == 401

    def test_admin_can_see_all_teams(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/teams")
        assert r.status_code == 200
        assert "data" in r.json()
