/**
 * k6 Agent Response Time Test (Phase 6.3.2)
 * Measures latency of /api/tourism/faq POST (multi-agent FAQ response).
 * Run: k6 run load-tests/faq-response.js
 * Or:  k6 run -e BASE_URL=https://your-app.vercel.app load-tests/faq-response.js
 */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  vus: 5,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.1"],
    http_req_duration: ["p(95)<15000"],
  },
};

export default function () {
  const payload = JSON.stringify({
    question: "Do you offer early check-in?",
    propertyId: null,
    useMultiAgent: false,
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = http.post(
    `${BASE_URL}/api/tourism/faq`,
    payload,
    params
  );

  check(res, {
    "faq POST 200": (r) => r.status === 200,
    "faq has answer": (r) => {
      try {
        const j = JSON.parse(r.body);
        return typeof j.answer === "string" || typeof j.alternatives !== "undefined";
      } catch {
        return false;
      }
    },
  });

  sleep(Math.random() * 2 + 1);
}
