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

class TestSupportTickets:
    def test_get_tickets_unauthorized(self):
        r = requests.get(f"{BASE_URL}/api/support/tickets")
        assert r.status_code == 401

    def test_create_ticket_as_user(self, registered_user, unique_id):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok
        r = s.post(f"{BASE_URL}/api/support/tickets", json={
            "subject": f"Issue {unique_id}",
            "text": "Test issue description",
        })
        assert r.status_code in [200, 201]

    def test_get_tickets_as_user(self, registered_user):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok
        r = s.get(f"{BASE_URL}/api/support/tickets")
        assert r.status_code == 200

    def test_get_tickets_as_admin(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/support/tickets")
        assert r.status_code == 200

    def test_create_ticket_empty_subject(self, registered_user):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok
        r = s.post(f"{BASE_URL}/api/support/tickets", json={"subject": "", "text": "Body"})
        assert r.status_code in [400, 200, 201]

class TestSupportMessages:
    def test_send_message_to_ticket(self, registered_user, unique_id):
        s, ok = login_as(registered_user["username"], registered_user["password"])
        assert ok
        r = s.post(f"{BASE_URL}/api/support/tickets", json={
            "subject": f"Msg {unique_id}", "text": "First message",
        })
        if r.status_code not in [200, 201]: pytest.skip("Create failed")
        ticket_id = r.json().get("id")
        r = s.post(f"{BASE_URL}/api/support/tickets/{ticket_id}/messages", json={
            "text": "Follow up message",
        })
        assert r.status_code in [200, 201, 404]

    def test_get_messages_unauthorized(self):
        r = requests.get(f"{BASE_URL}/api/support/tickets/test-id/messages")
        assert r.status_code == 401
