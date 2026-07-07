import pytest, requests
from jsonschema import validate
BASE = "http://localhost:3000"

SCHEMAS = {
    "teams": {"type": "object", "required": ["data", "meta"], "properties": {"data": {"type": "array"}, "meta": {"type": "object", "required": ["total", "page", "limit", "totalPages"]}}},
    "news": {"type": "object", "required": ["data", "meta"], "properties": {"data": {"type": "array"}, "meta": {"type": "object", "required": ["total", "page", "limit", "totalPages"]}}},
    "matches": {"type": "object", "required": ["data", "meta"], "properties": {"data": {"type": "array"}, "meta": {"type": "object", "required": ["total", "page", "limit", "totalPages"]}}},
    "profile": {"type": "object", "required": ["id", "username", "fullName"]},
}

class TestContract:
    def test_teams_schema_200(self):
        r = requests.get(f"{BASE}/api/teams")
        assert r.status_code == 200
        validate(r.json(), SCHEMAS["teams"])

    def test_news_schema_200(self):
        r = requests.get(f"{BASE}/api/news")
        assert r.status_code == 200
        validate(r.json(), SCHEMAS["news"])

    def test_matches_schema_200(self):
        r = requests.get(f"{BASE}/api/matches")
        assert r.status_code == 200
        validate(r.json(), SCHEMAS["matches"])

    def test_profile_schema_200(self, admin_session):
        r = admin_session.get(f"{BASE}/api/profile/me")
        if r.status_code == 200:
            validate(r.json(), SCHEMAS["profile"])

    def test_content_type_json(self):
        for url in ["/api/teams", "/api/news", "/api/matches"]:
            r = requests.get(f"{BASE}{url}")
            if r.status_code == 200:
                assert "application/json" in r.headers.get("Content-Type", "")
