import pytest
import requests
from jsonschema import validate, ValidationError

BASE_URL = "http://localhost:3000"

# Схемы ответов API
SCHEMAS = {
    "teams": {
        "type": "object",
        "required": ["data", "meta"],
        "properties": {
            "data": {"type": "array"},
            "meta": {
                "type": "object",
                "required": ["total", "page", "limit", "totalPages"],
                "properties": {
                    "total": {"type": "integer"},
                    "page": {"type": "integer"},
                    "limit": {"type": "integer"},
                    "totalPages": {"type": "integer"},
                }
            }
        }
    },
    "news": {
        "type": "object",
        "required": ["data", "meta"],
        "properties": {
            "data": {"type": "array"},
            "meta": {
                "type": "object",
                "required": ["total", "page", "limit", "totalPages"],
            }
        }
    },
    "matches": {
        "type": "object",
        "required": ["data", "meta"],
        "properties": {
            "data": {"type": "array"},
            "meta": {
                "type": "object",
                "required": ["total", "page", "limit", "totalPages"],
            }
        }
    },
    "profile_me": {
        "type": "object",
        "required": ["id", "username", "fullName"],
        "properties": {
            "id": {"type": "string"},
            "username": {"type": "string"},
            "fullName": {"type": "string"},
            "city": {"type": ["string", "null"]},
            "position": {"type": ["string", "null"]},
            "photos": {"type": "array"},
            "birthDate": {"type": ["string", "null"]},
        }
    },
    "conversations": {
        "type": "array",
        "items": {
            "type": "object",
            "required": ["user", "lastMessage"],
            "properties": {
                "user": {
                    "type": "object",
                    "required": ["id", "fullName", "username"],
                },
                "lastMessage": {
                    "type": ["object", "null"],
                }
            }
        }
    },
}

class TestContract:
    """Контрактные тесты — проверка структуры ответов API"""

    def test_teams_schema(self):
        r = requests.get(f"{BASE_URL}/api/teams")
        assert r.status_code == 200
        validate(r.json(), SCHEMAS["teams"])

    def test_news_schema(self):
        r = requests.get(f"{BASE_URL}/api/news")
        assert r.status_code == 200
        validate(r.json(), SCHEMAS["news"])

    def test_matches_schema(self):
        r = requests.get(f"{BASE_URL}/api/matches")
        assert r.status_code == 200
        validate(r.json(), SCHEMAS["matches"])

    def test_profile_schema(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/profile/me")
        if r.status_code == 200:
            validate(r.json(), SCHEMAS["profile_me"])

    def test_conversations_schema(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/chat/conversations")
        if r.status_code == 200:
            validate(r.json(), SCHEMAS["conversations"])

    def test_teams_response_has_required_fields(self):
        r = requests.get(f"{BASE_URL}/api/teams")
        data = r.json()
        assert "data" in data
        assert "meta" in data
        assert "total" in data["meta"]
        assert "page" in data["meta"]

    def test_news_response_has_required_fields(self):
        r = requests.get(f"{BASE_URL}/api/news")
        data = r.json()
        assert "data" in data
        if data["data"]:
            post = data["data"][0]
            assert "id" in post
            assert "title" in post
            assert "content" in post
            assert "author" in post

    def test_matches_response_has_required_fields(self):
        r = requests.get(f"{BASE_URL}/api/matches")
        data = r.json()
        if data["data"]:
            match = data["data"][0]
            assert "id" in match
            assert "homeTeam" in match
            assert "awayTeam" in match
            assert "date" in match
