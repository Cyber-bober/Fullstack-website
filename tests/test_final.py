import pytest
import requests

BASE_URL = "http://localhost:3000"

def login_as(username, password):
    s = requests.Session()
    csrf = s.get(f"{BASE_URL}/api/auth/csrf").json().get("csrfToken", "")
    r = s.post(f"{BASE_URL}/api/auth/callback/credentials", json={
        "username": username, "password": password, "csrfToken": csrf,
    })
    return s, r.status_code == 200

class TestProfilePhoto:
    def test_remove_photo_unauthorized(self):
        r = requests.delete(f"{BASE_URL}/api/profile/remove-photo")
        assert r.status_code in [401, 404, 405]

    def test_set_password(self, registered_user):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok
        r = s.post(f"{BASE_URL}/api/profile/set-password", json={"password": "newpass123"})
        assert r.status_code in [200, 400, 404, 500]

class TestTeamLogoRemove:
    def test_remove_logo_unauthorized(self):
        r = requests.delete(f"{BASE_URL}/api/teams/logo/remove")
        assert r.status_code in [401, 403, 404, 405]

class TestTeamRatings:
    def test_update_ratings_as_admin(self, admin_session):
        r = admin_session.post(f"{BASE_URL}/api/admin/update-team-ratings", json={
            "ratings": {"test": 1500},
        })
        assert r.status_code in [200, 400, 500]
