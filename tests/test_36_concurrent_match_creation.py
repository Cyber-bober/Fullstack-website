import pytest
import requests
import concurrent.futures
import time
from datetime import datetime, timedelta, timezone

BASE = "http://localhost:3000"


def login(u, p):
    s = requests.Session()
    csrf = s.get(f"{BASE}/api/auth/csrf").json()["csrfToken"]
    s.post(f"{BASE}/api/auth/callback/credentials", json={
        "username": u,
        "password": p,
        "csrfToken": csrf,
    })
    return s


def get_teams(session):
    """Получить список команд из API"""
    teams_response = session.get(f"{BASE}/api/teams").json()
    if isinstance(teams_response, dict) and "data" in teams_response:
        return teams_response["data"]
    return teams_response if isinstance(teams_response, list) else []


def get_matches(session):
    """Получить список матчей из API"""
    r = session.get(f"{BASE}/api/matches").json()
    if isinstance(r, dict) and "data" in r:
        return r["data"]
    return r if isinstance(r, list) else []


def future_date(days_offset: int, hour: int = 14) -> str:
    """Вернуть ISO-дату в будущем (завтра, послезавтра и т.д.)"""
    dt = datetime.now(timezone.utc) + timedelta(days=days_offset)
    return dt.replace(hour=hour, minute=0, second=0, microsecond=0).isoformat()


class TestConcurrentMatchCreation:
    def test_two_admins_create_match_simultaneously(self, admin_session):
        """Тест: 2 админа одновременно создают матч"""

        teams = get_teams(admin_session)
        if len(teams) < 4:
            pytest.skip("Need at least 4 teams")

        admin1 = login("admin_vlad", "admin123")
        admin2 = login("admin_sergey", "admin123")

        match1_data = {
            "homeTeamId": teams[0]["id"],
            "awayTeamId": teams[1]["id"],
            "date": future_date(1, 14),
        }
        match2_data = {
            "homeTeamId": teams[2]["id"],
            "awayTeamId": teams[3]["id"],
            "date": future_date(2, 18),
        }

        def create_match(session, data):
            try:
                response = session.post(f"{BASE}/api/matches", json=data)
                return response.status_code, response.json() if response.status_code == 201 else None
            except Exception:
                return 500, None

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            future1 = executor.submit(create_match, admin1, match1_data)
            future2 = executor.submit(create_match, admin2, match2_data)
            status1, result1 = future1.result()
            status2, result2 = future2.result()

        assert status1 == 201, f"Admin 1 failed: {status1}"
        assert status2 == 201, f"Admin 1 failed: {status2}"
        assert result1 is not None, "Admin 1 result is None"
        assert result2 is not None, "Admin 2 result is None"

        matches = get_matches(admin_session)
        match_ids = [m["id"] for m in matches]
        assert result1["id"] in match_ids, "Match 1 not found in database"
        assert result2["id"] in match_ids, "Match 2 not found in database"

        admin_session.delete(f"{BASE}/api/matches?id={result1['id']}")
        admin_session.delete(f"{BASE}/api/matches?id={result2['id']}")

    def test_multiple_admins_create_matches_simultaneously(self, admin_session):
        """Тест: несколько админов одновременно создают матчи (стресс-тест)"""

        teams = get_teams(admin_session)
        max_matches = min(len(teams) // 2, 10)
        if max_matches < 2:
            pytest.skip(f"Need at least 4 teams, got {len(teams)}")

        admin_sessions = []
        for i in range(max_matches):
            if i % 2 == 0:
                admin = login("admin_vlad", "admin123")
            else:
                admin = login("admin_sergey", "admin123")
            admin_sessions.append(admin)

        matches_data = []
        for i in range(max_matches):
            match_data = {
                "homeTeamId": teams[i * 2]["id"],
                "awayTeamId": teams[i * 2 + 1]["id"],
                "date": future_date(3 + i, 14 + (i % 8)),
            }
            matches_data.append(match_data)

        def create_match(args):
            admin, data = args
            try:
                response = admin.post(f"{BASE}/api/matches", json=data)
                return response.status_code, response.json() if response.status_code == 201 else None
            except Exception:
                return 500, None

        start_time = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_matches) as executor:
            futures = [
                executor.submit(create_match, (admin_sessions[i], matches_data[i]))
                for i in range(max_matches)
            ]
            results = [f.result() for f in futures]
        duration = time.time() - start_time

        success_count = sum(1 for status, _ in results if status == 201)
        assert success_count == max_matches, f"Only {success_count}/{max_matches} matches created"
        assert duration < 5.0, f"Too slow: {duration:.2f}s"

        print(f"{max_matches} matches created in {duration:.2f}s")

        for status, result in results:
            if status == 201 and result and "id" in result:
                admin_session.delete(f"{BASE}/api/matches?id={result['id']}")

    def test_concurrent_read_write_no_race_condition(self, admin_session):
        """Тест: конкурентное чтение и запись без race condition"""

        teams = get_teams(admin_session)
        if len(teams) < 2:
            pytest.skip("Need at least 2 teams")

        match_data = {
            "homeTeamId": teams[0]["id"],
            "awayTeamId": teams[1]["id"],
            "date": future_date(5, 14),
        }

        create_response = admin_session.post(f"{BASE}/api/matches", json=match_data)
        assert create_response.status_code == 201, f"Failed to create match: {create_response.status_code}"
        match_id = create_response.json()["id"]

        def read_matches():
            try:
                return admin_session.get(f"{BASE}/api/matches").status_code
            except Exception:
                return 500

        def delete_match():
            time.sleep(0.1)
            try:
                return admin_session.delete(f"{BASE}/api/matches?id={match_id}").status_code
            except Exception:
                return 500

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            future_read = executor.submit(read_matches)
            future_delete = executor.submit(delete_match)
            read_status = future_read.result()
            delete_status = future_delete.result()

        assert read_status == 200, f"Read failed: {read_status}"
        assert delete_status == 200, f"Delete failed: {delete_status}"

        matches = get_matches(admin_session)
        match_ids = [m["id"] for m in matches]
        assert match_id not in match_ids, "Match should be deleted"

    def test_concurrent_news_creation(self, admin_session):
        """Тест: конкурентное создание новостей"""

        admin1 = login("admin_vlad", "admin123")
        admin2 = login("admin_sergey", "admin123")

        timestamp = int(time.time())
        news1_data = {
            "title": f"Concurrent News 1 {timestamp}",
            "content": "Content for concurrent news 1 - this is a test",
        }
        news2_data = {
            "title": f"Concurrent News 2 {timestamp}",
            "content": "Content for concurrent news 2 - this is a test",
        }

        def create_news(session, data):
            try:
                response = session.post(f"{BASE}/api/news", json=data)
                return response.status_code, response.json() if response.status_code == 201 else None
            except Exception:
                return 500, None

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            future1 = executor.submit(create_news, admin1, news1_data)
            future2 = executor.submit(create_news, admin2, news2_data)
            status1, result1 = future1.result()
            status2, result2 = future2.result()

        assert status1 == 201, f"News 1 failed: {status1}"
        assert status2 == 201, f"News 2 failed: {status2}"

        if result1 and "id" in result1:
            admin_session.delete(f"{BASE}/api/news?id={result1['id']}")
        if result2 and "id" in result2:
            admin_session.delete(f"{BASE}/api/news?id={result2['id']}")

    def test_concurrent_team_creation(self, admin_session):
        """Тест: конкурентное создание команд"""

        admin1 = login("admin_vlad", "admin123")
        admin2 = login("admin_sergey", "admin123")

        timestamp = int(time.time())
        team1_data = {"name": f"ConcurrentTeam1_{timestamp}"}
        team2_data = {"name": f"ConcurrentTeam2_{timestamp}"}

        def create_team(session, data):
            try:
                response = session.post(f"{BASE}/api/teams/create", json=data)
                return response.status_code, response.json() if response.status_code == 201 else None
            except Exception:
                return 500, None

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            future1 = executor.submit(create_team, admin1, team1_data)
            future2 = executor.submit(create_team, admin2, team2_data)
            status1, result1 = future1.result()
            status2, result2 = future2.result()

        assert status1 == 201, f"Team 1 failed: {status1}"
        assert status2 == 201, f"Team 2 failed: {status2}"

        if result1 and "id" in result1:
            admin_session.delete(f"{BASE}/api/teams?id={result1['id']}")
        if result2 and "id" in result2:
            admin_session.delete(f"{BASE}/api/teams?id={result2['id']}")
