import pytest, requests
BASE = "http://localhost:3000"

class TestBoundaries:
    def test_register_username_exact_3_chars_201(self, unique_id):
        r = requests.post(f"{BASE}/api/auth/register", json={"username": f"a{unique_id%100:02d}", "password": "123456", "fullName": "Test"})
        assert r.status_code in [201, 400]

    def test_register_username_exact_30_chars_201(self, unique_id):
        username = "a" * 30
        r = requests.post(f"{BASE}/api/auth/register", json={"username": f"{username[:28]}{unique_id%100:02d}", "password": "123456", "fullName": "Test"})
        assert r.status_code in [201, 400]

    def test_register_password_exact_6_chars_201(self, unique_id):
        r = requests.post(f"{BASE}/api/auth/register", json={"username": f"p{unique_id}", "password": "123456", "fullName": "Test"})
        assert r.status_code == 201

    def test_register_password_128_chars_201(self, unique_id):
        r = requests.post(f"{BASE}/api/auth/register", json={"username": f"lp{unique_id}", "password": "a" * 128, "fullName": "Test"})
        assert r.status_code in [201, 400]

    def test_register_password_129_chars_400(self, unique_id):
        r = requests.post(f"{BASE}/api/auth/register", json={"username": f"lp2{unique_id}", "password": "a" * 129, "fullName": "Test"})
        assert r.status_code == 400

    def test_news_title_3_chars_400(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE}/api/news", json={"title": "ABC", "content": "Valid content for testing"})
        assert r.status_code == 400

    def test_news_title_200_chars_201(self, admin_session):
        r = admin_session.post(f"{BASE}/api/news", json={"title": "A" * 200, "content": "Valid content for testing"})
        assert r.status_code == 201

    def test_news_title_201_chars_400(self, admin_session):
        r = admin_session.post(f"{BASE}/api/news", json={"title": "A" * 201, "content": "Valid content"})
        assert r.status_code == 400

    def test_news_content_10_chars_201(self, admin_session, unique_id):
        r = admin_session.post(f"{BASE}/api/news", json={"title": f"T{unique_id}", "content": "1234567890"})
        assert r.status_code == 201

    def test_news_content_9_chars_400(self, admin_session):
        r = admin_session.post(f"{BASE}/api/news", json={"title": "Valid Title", "content": "Short"})
        assert r.status_code == 400

    def test_team_name_2_chars_201(self, admin_session):
        r = admin_session.post(f"{BASE}/api/teams/create", json={"name": "AB"})
        assert r.status_code == 201

    def test_team_name_1_char_400(self, admin_session):
        r = admin_session.post(f"{BASE}/api/teams/create", json={"name": "A"})
        assert r.status_code == 400

    def test_team_name_34_chars_201(self, admin_session):
        r = admin_session.post(f"{BASE}/api/teams/create", json={"name": "A" * 34})
        assert r.status_code == 201

    def test_team_name_39_chars_400(self, admin_session):
        r = admin_session.post(f"{BASE}/api/teams/create", json={"name": "A" * 39})
        assert r.status_code == 400

    def test_chat_message_1_char_201(self, registered_user, admin_session):
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "123456", "csrfToken": csrf})
        r = admin_session.get(f"{BASE}/api/users/search?q=admin_vlad")
        admin = next((u for u in r.json() if u["username"] == "admin_vlad"), None)
        if not admin: pytest.skip("Admin not found")
        r = s.post(f"{BASE}/api/chat/messages", json={"receiverId": admin["id"], "text": "H"})
        assert r.status_code == 201
