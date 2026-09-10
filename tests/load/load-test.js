import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 20 },
    { duration: '2m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.05'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = 'http://localhost:3000';

function loginAdmin() {
  const csrfResp = http.get(`${BASE_URL}/api/auth/csrf`);
  const csrfToken = csrfResp.json('csrfToken');
  
  const loginResp = http.post(`${BASE_URL}/api/auth/callback/credentials`, JSON.stringify({
    username: 'admin_vlad',
    password: 'admin123',
    csrfToken: csrfToken
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  return loginResp.cookies;
}

export default function () {
  const cookies = loginAdmin();
  const sessionToken = cookies['next-auth.session-token']?.[0]?.value || '';
  
  const getResponses = http.batch([
    ['GET', `${BASE_URL}/api/news?page=1&limit=10`],
    ['GET', `${BASE_URL}/api/livestream`],
    ['GET', `${BASE_URL}/api/teams`],
    ['GET', `${BASE_URL}/api/matches?date=2025-08-19`],
  ]);
  
  check(getResponses[0], {
    'GET /api/news status 200': (r) => r.status === 200,
    'GET /api/news has data': (r) => r.json('data') !== undefined,
  });
  
  check(getResponses[1], {
    'GET /api/livestream status 200': (r) => r.status === 200,
  });
  
  check(getResponses[2], {
    'GET /api/teams status 200': (r) => r.status === 200,
  });
  
  check(getResponses[3], {
    'GET /api/matches status 200': (r) => r.status === 200,
  });
  
  sleep(0.5);

  const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
  
  const createResp = http.post(`${BASE_URL}/api/news`, JSON.stringify({
    title: `Load Test ${uniqueId}`,
    content: `Load test content ${uniqueId}`
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': `next-auth.session-token=${sessionToken}`
    },
  });
  
  check(createResp, {
    'POST /api/news status 201': (r) => r.status === 201,
  });
  
  sleep(1);
}
