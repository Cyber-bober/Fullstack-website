import pytest, requests
from jsonschema import validate
BASE = "http://localhost:3000"

META_SCHEMA = {
    "type": "object",
    "required": ["total", "page", "limit", "totalPages"],
    "properties": {
        "total": {"type": "integer"},
        "page": {"type": "integer"},
        "limit": {"type": "integer"},
        "totalPages": {"type": "integer"}
    }
}

MATCH_ITEM_SCHEMA = {
    "type": "object",
    "required": ["id", "homeTeamId", "awayTeamId", "date", "status", "homeTeam", "awayTeam"],
    "properties": {
        "id": {"type": "string"},
        "homeTeamId": {"type": "string"},
        "awayTeamId": {"type": "string"},
        "date": {"type": "string"},
        "status": {"type": "string"},
        "score": {"type": ["string", "null"]},
        "stats": {"type": ["string", "null"]},
        "venue": {"type": ["string", "null"]},
        "createdAt": {"type": "string"},
        "homeTeam": {
            "type": "object",
            "required": ["id", "name"],
            "properties": {
                "id": {"type": "string"},
                "name": {"type": "string"},
                "logoUrl": {"type": ["string", "null"]}
            }
        },
        "awayTeam": {
            "type": "object",
            "required": ["id", "name"],
            "properties": {
                "id": {"type": "string"},
                "name": {"type": "string"},
                "logoUrl": {"type": ["string", "null"]}
            }
        }
    }
}

SCHEMAS = {
    "teams": {
        "type": "object",
        "required": ["data", "meta"],
        "properties": {
            "data": {"type": "array"},
            "meta": META_SCHEMA
        }
    },
    "news": {
        "type": "object",
        "required": ["data", "meta"],
        "properties": {
            "data": {"type": "array"},
            "meta": META_SCHEMA
        }
    },
    "matches": {
        "type": "object",
        "required": ["data", "meta"],
        "properties": {
            "data": {
                "type": "array",
                "items": MATCH_ITEM_SCHEMA
            },
            "meta": META_SCHEMA
        }
    },
    "profile": {
        "type": "object",
        "required": ["id", "username", "fullName"],
        "properties": {
            "id": {"type": "string"},
            "username": {"type": "string"},
            "fullName": {"type": "string"}
        }
    },
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
        data = r.json()
        assert isinstance(data, dict), f"Ожидался объект, получен {type(data)}"
        assert "data" in data, "В ответе отсутствует поле 'data'"
        assert "meta" in data, "В ответе отсутствует поле 'meta'"
        assert isinstance(data["data"], list), f"Поле 'data' должно быть массивом, получен {type(data['data'])}"
        validate(data, SCHEMAS["matches"])

    def test_profile_schema_200(self, admin_session):
        r = admin_session.get(f"{BASE}/api/profile/me")
        if r.status_code == 200:
            validate(r.json(), SCHEMAS["profile"])

    def test_content_type_json(self):
        for url in ["/api/teams", "/api/news", "/api/matches"]:
            r = requests.get(f"{BASE}{url}")
            if r.status_code == 200:
                assert "application/json" in r.headers.get("Content-Type", "")