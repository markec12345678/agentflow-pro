/**
 * k6 Smoke Test – AgentFlow Pro
 * Quick verification that critical endpoints respond.
 * Run: k6 run load-tests/smoke.js
 * Base URL: env BASE_URL or http://localhost:3000
 */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  vus: 5,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<2000"],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/health`);
  check(res, {
    "health status 200": (r) => r.status === 200,
    "health ok": (r) => {
      try {
        const j = JSON.parse(r.body);
        return j.ok === true || j.status === "healthy";
      } catch {
        return false;
      }
    },
  });
  sleep(0.5);

  const home = http.get(`${BASE_URL}/`);
  check(home, {
    "homepage 200": (r) => r.status === 200,
  });
  sleep(0.5);

  const faq = http.get(`${BASE_URL}/api/tourism/faq?category=prihod`);
  check(faq, {
    "faq 200": (r) => r.status === 200,
  });
  sleep(0.5);

  const resilience = http.get(`${BASE_URL}/api/health/resilience`);
  check(resilience, {
    "resilience 200": (r) => r.status === 200,
    "resilience retry configured": (r) => {
      try {
        const j = JSON.parse(r.body);
        return j.retry?.configured === true;
      } catch {
        return false;
      }
    },
  });
  sleep(1);
}
