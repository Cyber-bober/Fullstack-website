import pytest
import requests
import time

BASE_URL = "http://localhost:3000"

def login_as(username, password):
    s = requests.Session()
    csrf = s.get(f"{BASE_URL}/api/auth/csrf").json().get("csrfToken", "")
    r = s.post(f"{BASE_URL}/api/auth/callback/credentials", json={
        "username": username, "password": password, "csrfToken": csrf,
    })
    return s, r.status_code == 200

class TestChatAuth:
    def test_get_conversations_unauthorized(self):
        r = requests.get(f"{BASE_URL}/api/chat/conversations")
        assert r.status_code == 401

    def test_get_messages_unauthorized(self):
        r = requests.get(f"{BASE_URL}/api/chat/messages?userId=test")
        assert r.status_code == 401

    def test_send_message_unauthorized(self):
        r = requests.post(f"{BASE_URL}/api/chat/messages", json={
            "receiverId": "test", "text": "Hello",
        })
        assert r.status_code == 401

class TestChatConversations:
    def test_get_conversations_as_user(self, registered_user):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok
        r = s.get(f"{BASE_URL}/api/chat/conversations")
        assert r.status_code == 200

    def test_get_conversations_as_admin(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/chat/conversations")
        assert r.status_code == 200

class TestChatMessages:
    def test_send_message(self, registered_user, admin_session, unique_id):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok

        # Найти ID админа через админскую сессию
        r = admin_session.get(f"{BASE_URL}/api/users/search?q=admin_vlad")
        users = r.json()
        admin = next((u for u in users if u.get("username") == "admin_vlad"), None)
        if not admin: pytest.skip("Admin not found")

        r = s.post(f"{BASE_URL}/api/chat/messages", json={
            "receiverId": admin["id"],
            "text": f"Hello {unique_id}",
        })
        assert r.status_code in [200, 201]

    def test_get_messages(self, registered_user, admin_session):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok

        r = admin_session.get(f"{BASE_URL}/api/users/search?q=admin_vlad")
        users = r.json()
        admin = next((u for u in users if u.get("username") == "admin_vlad"), None)
        if not admin: pytest.skip("Admin not found")

        r = s.get(f"{BASE_URL}/api/chat/messages?userId={admin['id']}")
        assert r.status_code == 200

    def test_send_empty_message(self, registered_user, admin_session):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok

        r = admin_session.get(f"{BASE_URL}/api/users/search?q=admin_vlad")
        users = r.json()
        admin = next((u for u in users if u.get("username") == "admin_vlad"), None)
        if not admin: pytest.skip("Admin not found")

        r = s.post(f"{BASE_URL}/api/chat/messages", json={
            "receiverId": admin["id"], "text": "",
        })
        assert r.status_code == 400

class TestChatSearch:
    def test_search_users(self, registered_user):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok
        r = s.get(f"{BASE_URL}/api/users/search?q=admin")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_search_empty(self, registered_user):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok
        r = s.get(f"{BASE_URL}/api/users/search?q=")
        assert r.status_code == 200

    def test_search_unauthorized(self):
        r = requests.get(f"{BASE_URL}/api/users/search?q=admin")
        assert r.status_code == 401
