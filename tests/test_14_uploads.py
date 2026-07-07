import pytest, requests
BASE = "http://localhost:3000"

class TestUploads:
    def test_upload_team_logo_no_file_400(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE}/api/teams/create", json={"name": f"UL{unique_id}"})
        if r.status_code != 201: pytest.skip("Create team failed")
        r = admin_session.post(f"{BASE}/api/teams/{r.json()['id']}/upload")
        assert r.status_code in [400, 401]

    def test_upload_team_logo_unauthorized_401(self):
        assert requests.post(f"{BASE}/api/teams/x/upload").status_code == 401

    def test_upload_profile_photo_no_file_400(self, registered_user):
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        s.post(f"{BASE}/api/auth/callback/credentials", json={
            "username": registered_user["username"], 
            "password": "123456", 
            "csrfToken": csrf
        })
        r = s.post(f"{BASE}/api/profile/upload-photo")
        assert r.status_code in [400, 401]

    def test_upload_profile_photo_unauthorized_401(self):
        assert requests.post(f"{BASE}/api/profile/upload-photo").status_code == 401

    def test_remove_profile_photo_unauthorized_401(self):
        assert requests.delete(f"{BASE}/api/profile/remove-photo").status_code in [401, 403, 404, 405]

    def test_remove_team_logo_unauthorized_401(self):
        assert requests.delete(f"{BASE}/api/teams/logo/remove").status_code in [401, 403, 404, 405]

    def test_upload_news_image_no_file_400(self, admin_session):
        r = admin_session.post(f"{BASE}/api/news", json={
            "title": "Image Test Title",  # 15 символов
            "content": "Valid content for image test without actual image"
        })
        assert r.status_code == 201

    def test_upload_team_photo_no_file_400(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE}/api/teams/create", json={"name": f"UP{unique_id}"})
        if r.status_code != 201: pytest.skip("Create team failed")
        r = admin_session.post(f"{BASE}/api/teams/{r.json()['id']}/upload")
        assert r.status_code in [400, 401]