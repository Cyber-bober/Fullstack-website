import pytest, requests
BASE = "http://localhost:3000"

def login(u, p):
    s = requests.Session()
    csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
    s.post(f"{BASE}/api/auth/callback/credentials", json={"username": u, "password": p, "csrfToken": csrf})
    return s

class TestSupportTickets:
    def test_get_tickets_user_200(self, registered_user):
        s = login(registered_user["username"], "123456")
        assert s.get(f"{BASE}/api/support/tickets").status_code == 200

    def test_get_tickets_admin_200(self, admin_session):
        assert admin_session.get(f"{BASE}/api/support/tickets").status_code == 200

    def test_get_tickets_unauthorized_401(self):
        assert requests.get(f"{BASE}/api/support/tickets").status_code == 401

    def test_create_ticket_201(self, registered_user, unique_id):
        s = login(registered_user["username"], "123456")
        r = s.post(f"{BASE}/api/support/tickets", json={"subject": f"Issue {unique_id}", "text": "Test issue"})
        assert r.status_code == 201

    def test_create_ticket_empty_subject_400(self, registered_user):
        s = login(registered_user["username"], "123456")
        r = s.post(f"{BASE}/api/support/tickets", json={"subject": "", "text": "Body"})
        assert r.status_code == 400

    def test_create_ticket_empty_text_400(self, registered_user):
        s = login(registered_user["username"], "123456")
        r = s.post(f"{BASE}/api/support/tickets", json={"subject": "Test", "text": ""})
        assert r.status_code == 400

    def test_create_ticket_unauthorized_401(self):
        r = requests.post(f"{BASE}/api/support/tickets", json={"subject": "Test", "text": "Body"})
        assert r.status_code == 401

class TestSupportMessages:
    def test_send_message_201(self, registered_user, unique_id):
        s = login(registered_user["username"], "123456")
        r = s.post(f"{BASE}/api/support/tickets", json={"subject": f"Msg {unique_id}", "text": "First"})
        if r.status_code != 201: pytest.skip("Create ticket failed")
        ticket_id = r.json()["id"]
        r = s.post(f"{BASE}/api/support/tickets/{ticket_id}/messages", json={"text": "Follow up"})
        assert r.status_code == 201

    def test_send_empty_message_400(self, registered_user, unique_id):
        s = login(registered_user["username"], "123456")
        r = s.post(f"{BASE}/api/support/tickets", json={"subject": f"Empty {unique_id}", "text": "First"})
        if r.status_code != 201: pytest.skip("Create ticket failed")
        r = s.post(f"{BASE}/api/support/tickets/{r.json()['id']}/messages", json={"text": ""})
        assert r.status_code == 400

    def test_get_messages_200(self, registered_user, unique_id):
        s = login(registered_user["username"], "123456")
        r = s.post(f"{BASE}/api/support/tickets", json={"subject": f"Get {unique_id}", "text": "First"})
        if r.status_code != 201: pytest.skip("Create ticket failed")
        r = s.get(f"{BASE}/api/support/tickets/{r.json()['id']}/messages")
        assert r.status_code == 200

    def test_get_messages_unauthorized_401(self):
        assert requests.get(f"{BASE}/api/support/tickets/x/messages").status_code == 401

    def test_patch_ticket_status_admin_200(self, admin_session, registered_user, unique_id):
        s = login(registered_user["username"], "123456")
        r = s.post(f"{BASE}/api/support/tickets", json={"subject": f"Status {unique_id}", "text": "Test"})
        if r.status_code != 201: pytest.skip("Create ticket failed")
        ticket_id = r.json()["id"]
        r = admin_session.patch(f"{BASE}/api/support/tickets/{ticket_id}", json={"status": "IN_PROGRESS"})
        assert r.status_code == 200
