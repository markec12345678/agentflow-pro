#!/usr/bin/env node
const base = "http://localhost:3002";

async function main() {
  const csrfRes = await fetch(`${base}/api/auth/csrf`, { credentials: "include" });
  const { csrfToken } = await csrfRes.json();
  const cookies = csrfRes.headers.get("set-cookie") || "";

  const body = new URLSearchParams({
    csrfToken,
    email: "e2e@test.com",
    password: "e2e-secret",
    callbackUrl: "/dashboard",
  }).toString();

  const callbackRes = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookies,
    },
    body,
    redirect: "manual",
  });

  console.log("Status:", callbackRes.status);
  console.log("Location:", callbackRes.headers.get("location"));
  const text = await callbackRes.text();
  if (text.length < 500) console.log("Body:", text);
  else console.log("Body length:", text.length);
}

main().catch(console.error);
