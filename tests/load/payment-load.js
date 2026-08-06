// k6 load test — run with: k6 run tests/load/payment-load.js
// Exercises the public exchange-rate endpoint and the authenticated payment quote route.
import http from 'k6/http';
import { check } from 'k6';

const API_URL = __ENV.API_URL || 'http://localhost:4000';
const TOKEN = __ENV.TOKEN || '';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // ramp up
    { duration: '1m', target: 50 },   // steady
    { duration: '30s', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  const rates = http.get(`${API_URL}/payments/rates`);
  check(rates, { 'rates 200': (r) => r.status === 200 });

  if (TOKEN) {
    const quote = http.post(
      `${API_URL}/payments/quote`,
      JSON.stringify({ amount: '10', asset: 'XLM', destination: 'GDEMO' }),
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` } },
    );
    check(quote, { 'quote 201|200': (r) => r.status === 200 || r.status === 201 });
  }
}
