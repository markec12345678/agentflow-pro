/**
 * k6 Load Test – AgentFlow Pro
 * Simulates load on health and homepage. For auth endpoints, use auth token.
 * Run: k6 run load-tests/load.js
 * Options: k6 run --vus 50 --duration 60s load-tests/load.js
 */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3002";

export const options = {
  stages: [
    { duration: "30s", target: 20 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<3000"],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/health`);
  check(res, {
    "health ok": (r) => r.status === 200,
  });

  const home = http.get(`${BASE_URL}/`);
  check(home, {
    "homepage ok": (r) => r.status === 200,
  });

  const faq = http.get(`${BASE_URL}/api/tourism/faq?category=prihod`);
  check(faq, {
    "faq ok": (r) => r.status === 200,
  });

  sleep(Math.random() * 2 + 1);
}
