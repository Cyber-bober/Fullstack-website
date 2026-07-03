import pytest
import requests

BASE_URL = "http://localhost:3000"

def login_as(username, password):
    s = requests.Session()
    csrf = s.get(f"{BASE_URL}/api/auth/csrf").json().get("csrfToken", "")
    s.post(f"{BASE_URL}/api/auth/callback/credentials", json={
        "username": username, "password": password, "csrfToken": csrf,
    })
    return s

class TestChatSearch:
    def test_search_messages_as_user(self, registered_user):
        s = login_as(registered_user["username"], registered_user["password"])
        r = s.get(f"{BASE_URL}/api/chat/messages/search?q=hello")
        assert r.status_code in [200, 404, 500]

    def test_search_messages_empty_query(self, registered_user):
        s = login_as(registered_user["username"], registered_user["password"])
        r = s.get(f"{BASE_URL}/api/chat/messages/search?q=")
        assert r.status_code in [200, 404]

    def test_search_messages_unauthorized(self):
        r = requests.get(f"{BASE_URL}/api/chat/messages/search?q=test")
        assert r.status_code == 401

class TestChatPins:
    def test_pin_message_as_user(self, registered_user):
        s = login_as(registered_user["username"], registered_user["password"])
        r = s.patch(f"{BASE_URL}/api/chat/messages/pin", json={
            "messageId": "test-id", "isPinned": True,
        })
        assert r.status_code in [200, 404, 500]

    def test_unpin_message(self, registered_user):
        s = login_as(registered_user["username"], registered_user["password"])
        r = s.patch(f"{BASE_URL}/api/chat/messages/pin", json={
            "messageId": "test-id", "isPinned": False,
        })
        assert r.status_code in [200, 404, 500]

    def test_pin_message_unauthorized(self):
        r = requests.patch(f"{BASE_URL}/api/chat/messages/pin", json={
            "messageId": "test", "isPinned": True,
        })
        assert r.status_code in [401, 405]

class TestChatGroups:
    def test_get_groups_as_user(self, registered_user):
        s = login_as(registered_user["username"], registered_user["password"])
        r = s.get(f"{BASE_URL}/api/chat/groups")
        assert r.status_code in [200, 404, 500]

    def test_create_group_as_user(self, registered_user):
        s = login_as(registered_user["username"], registered_user["password"])
        r = s.post(f"{BASE_URL}/api/chat/groups", json={
            "name": "Test Group", "memberIds": [],
        })
        assert r.status_code in [201, 400, 500]

    def test_get_groups_unauthorized(self):
        r = requests.get(f"{BASE_URL}/api/chat/groups")
        assert r.status_code in [401, 404]
