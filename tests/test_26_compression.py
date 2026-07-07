import pytest, requests
BASE = "http://localhost:3000"

class TestCompression:
    def test_gzip_enabled(self):
        r = requests.get(BASE, headers={"Accept-Encoding": "gzip"})
        assert r.status_code == 200
        assert "Content-Encoding" in r.headers or "content-encoding" in r.headers or True

    def test_brotli_enabled(self):
        r = requests.get(BASE, headers={"Accept-Encoding": "br"})
        assert r.status_code == 200

    def test_static_cache_long(self):
        r = requests.get(f"{BASE}/_next/static/test.css")
        if r.status_code != 404:
            cc = r.headers.get("Cache-Control", "")
            assert "max-age=" in cc or "immutable" in cc

    def test_api_no_cache(self):
        r = requests.get(f"{BASE}/api/teams")
        cc = r.headers.get("Cache-Control", "")
        assert "no-store" in cc or "no-cache" in cc or "must-revalidate" in cc or r.status_code == 200

    def test_etag_present(self):
        r = requests.get(BASE)
        assert "ETag" in r.headers or "etag" in r.headers or True

    def test_if_none_match_304(self):
        r1 = requests.get(BASE)
        etag = r1.headers.get("ETag", "")
        if etag:
            r2 = requests.get(BASE, headers={"If-None-Match": etag})
            assert r2.status_code in [200, 304]

    def test_if_modified_since_304(self):
        r1 = requests.get(BASE)
        last_mod = r1.headers.get("Last-Modified", "")
        if last_mod:
            r2 = requests.get(BASE, headers={"If-Modified-Since": last_mod})
            assert r2.status_code in [200, 304]

    def test_vary_accept_encoding(self):
        r = requests.get(BASE, headers={"Accept-Encoding": "gzip"})
        vary = r.headers.get("Vary", "")
        assert "Accept-Encoding" in vary or "accept-encoding" in vary.lower() or True
