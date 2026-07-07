import pytest, requests
BASE = "http://localhost:3000"

def login(u, p):
    s = requests.Session()
    csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
    s.post(f"{BASE}/api/auth/callback/credentials", json={"username": u, "password": p, "csrfToken": csrf})
    return s

class TestChat:
    def test_conversations_200(self, registered_user):
        s = login(registered_user["username"], "123456")
        assert s.get(f"{BASE}/api/chat/conversations").status_code == 200

    def test_conversations_unauthorized_401(self):
        assert requests.get(f"{BASE}/api/chat/conversations").status_code == 401

    def test_send_message_201(self, registered_user, admin_session, unique_id):
        s = login(registered_user["username"], "123456")
        r = admin_session.get(f"{BASE}/api/users/search?q=admin_vlad")
        admin = next((u for u in r.json() if u["username"] == "admin_vlad"), None)
        if not admin: pytest.skip("Admin not found")
        r = s.post(f"{BASE}/api/chat/messages", json={"receiverId": admin["id"], "text": f"H{unique_id}"})
        assert r.status_code == 201

    def test_send_empty_message_400(self, registered_user, admin_session):
        s = login(registered_user["username"], "123456")
        r = admin_session.get(f"{BASE}/api/users/search?q=admin_vlad")
        admin = next((u for u in r.json() if u["username"] == "admin_vlad"), None)
        if not admin: pytest.skip("Admin not found")
        assert s.post(f"{BASE}/api/chat/messages", json={"receiverId": admin["id"], "text": ""}).status_code == 400

    def test_messages_unauthorized_401(self):
        assert requests.get(f"{BASE}/api/chat/messages?userId=x").status_code == 401

    def test_search_users_200(self, registered_user):
        s = login(registered_user["username"], "123456")
        assert s.get(f"{BASE}/api/users/search?q=admin").status_code == 200
