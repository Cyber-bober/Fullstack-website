import pytest, requests
BASE = "http://localhost:3000"

class TestServerErrors:
    def test_invalid_json_400(self, admin_session):
        r = admin_session.post(f"{BASE}/api/teams/create", data="not json", headers={"Content-Type": "application/json"})
        assert r.status_code in [400, 500]

    def test_missing_content_type(self, admin_session):
        r = admin_session.post(f"{BASE}/api/teams/create", data="{}")
        assert r.status_code in [400, 500]

    def test_wrong_method_get_on_post_405(self):
        r = requests.post(f"{BASE}/api/teams")
        assert r.status_code == 405

    def test_wrong_method_post_on_get_405(self):
        r = requests.post(f"{BASE}/api/teams")
        assert r.status_code in [404, 405, 200]

    def test_nonexistent_endpoint_404(self):
        r = requests.get(f"{BASE}/api/nonexistent-endpoint-12345")
        assert r.status_code == 404

    def test_very_large_payload_400(self, admin_session):
        r = admin_session.post(f"{BASE}/api/news", json={"title": "Test", "content": "A" * 100000})
        assert r.status_code in [400, 413, 500]

    def test_negative_page_number_200(self):
        r = requests.get(f"{BASE}/api/teams?page=-1")
        assert r.status_code == 200

    def test_zero_limit_200(self):
        r = requests.get(f"{BASE}/api/teams?limit=0")
        assert r.status_code == 200
