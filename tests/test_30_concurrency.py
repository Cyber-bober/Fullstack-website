import pytest, requests, threading, time
BASE = "http://localhost:3000"

class TestConcurrency:
    def test_concurrent_reads_same_endpoint(self):
        results = []
        def fetch():
            r = requests.get(f"{BASE}/api/teams")
            results.append(r.status_code)
        threads = [threading.Thread(target=fetch) for _ in range(10)]
        for t in threads: t.start()
        for t in threads: t.join()
        assert all(r == 200 for r in results)

    def test_concurrent_reads_different_endpoints(self):
        results = {}
        def fetch(url):
            r = requests.get(f"{BASE}{url}")
            results[url] = r.status_code
        urls = ["/api/teams", "/api/news", "/api/matches", "/api/livestream"]
        threads = [threading.Thread(target=fetch, args=(url,)) for url in urls]
        for t in threads: t.start()
        for t in threads: t.join()
        assert all(s == 200 for s in results.values())

    def test_concurrent_registrations(self, unique_id):
        def register(i):
            return requests.post(f"{BASE}/api/auth/register", json={"username": f"cc{unique_id}_{i}", "password": "123456", "fullName": f"User{i}"})
        threads = [threading.Thread(target=register, args=(i,)) for i in range(5)]
        for t in threads: t.start()
        for t in threads: t.join()

    def test_concurrent_read_write_no_crash(self, admin_session, unique_id):
        errors = []
        def read(): 
            try: requests.get(f"{BASE}/api/teams")
            except Exception as e: errors.append(e)
        def write():
            try: admin_session.post(f"{BASE}/api/teams/create", json={"name": f"CC{unique_id}"})
            except Exception as e: errors.append(e)
        threads = [threading.Thread(target=read) for _ in range(5)] + [threading.Thread(target=write)]
        for t in threads: t.start()
        for t in threads: t.join()
        assert len(errors) == 0

    def test_concurrent_same_username_registration(self, unique_id):
        def register():
            return requests.post(f"{BASE}/api/auth/register", json={"username": f"same{unique_id}", "password": "123456", "fullName": "Test"})
        t1 = threading.Thread(target=register)
        t2 = threading.Thread(target=register)
        t1.start(); t2.start()
        t1.join(); t2.join()

    def test_concurrent_team_create_delete(self, admin_session, unique_id):
        errors = []
        def create_delete(i):
            try:
                r = admin_session.post(f"{BASE}/api/teams/create", json={"name": f"CD{unique_id}_{i}"})
                if r.status_code == 201:
                    admin_session.delete(f"{BASE}/api/teams?id={r.json()['id']}")
            except Exception as e: errors.append(e)
        threads = [threading.Thread(target=create_delete, args=(i,)) for i in range(5)]
        for t in threads: t.start()
        for t in threads: t.join()
        assert len(errors) == 0

    def test_concurrent_chat_messages(self, registered_user, admin_session, unique_id):
        s = requests.Session()
        csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
        s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "123456", "csrfToken": csrf})
        r = admin_session.get(f"{BASE}/api/users/search?q=admin_vlad")
        admin = next((u for u in r.json() if u["username"] == "admin_vlad"), None)
        if not admin: pytest.skip("Admin not found")
        def send(i):
            s.post(f"{BASE}/api/chat/messages", json={"receiverId": admin["id"], "text": f"Concurrent {i}"})
        threads = [threading.Thread(target=send, args=(i,)) for i in range(10)]
        for t in threads: t.start()
        for t in threads: t.join()

    def test_concurrent_profile_updates(self, registered_user):
        def update(i):
            s = requests.Session()
            csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
            s.post(f"{BASE}/api/auth/callback/credentials", json={"username": registered_user["username"], "password": "123456", "csrfToken": csrf})
            s.post(f"{BASE}/api/profile/update", json={"city": f"City{i}"})
        threads = [threading.Thread(target=update, args=(i,)) for i in range(5)]
        for t in threads: t.start()
        for t in threads: t.join()

    def test_concurrent_news_create_delete(self, admin_session, unique_id):
        def create_delete(i):
            r = admin_session.post(f"{BASE}/api/news", json={"title": f"CC{unique_id}_{i}", "content": "Concurrent news test content"})
            if r.status_code == 201:
                admin_session.delete(f"{BASE}/api/news/{r.json()['id']}")
        threads = [threading.Thread(target=create_delete, args=(i,)) for i in range(5)]
        for t in threads: t.start()
        for t in threads: t.join()

    def test_race_condition_role_change(self, admin_session, registered_user):
        r = admin_session.get(f"{BASE}/api/users/search?q={registered_user['username']}")
        users = r.json()
        user = next((u for u in users if u["username"] == registered_user["username"]), None)
        if not user: pytest.skip("User not found")
        def change_role(role):
            admin_session.patch(f"{BASE}/api/users/{user['id']}/role", json={"role": role})
        t1 = threading.Thread(target=change_role, args=("EDITOR",))
        t2 = threading.Thread(target=change_role, args=("CAPTAIN",))
        t1.start(); t2.start()
        t1.join(); t2.join()
