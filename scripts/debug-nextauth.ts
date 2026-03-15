/**
 * Debug NextAuth initialization
 */
import { authOptions } from "../src/lib/auth-options.js";

console.log("🔍 Testing NextAuth configuration...\n");

console.log("✅ authOptions loaded");
console.log(
  "Providers:",
  authOptions.providers.map((p) => ({ id: p.id, type: p.type })),
);
console.log("Session strategy:", authOptions.session?.strategy);
console.log("JWT secret:", authOptions.jwt?.secret ? "SET" : "MISSING");
console.log("trustHost:", authOptions.trustHost);

// Test authorize function
const credentialsProvider = authOptions.providers.find(
  (p) => p.id === "credentials" || p.id === "test",
);
if (credentialsProvider) {
  console.log("\n🧪 Testing authorize function...");

  const result = await credentialsProvider.authorize({
    email: "test@agentflow.com",
    password: "test123",
  });

  console.log("Authorize result:", result);
} else {
  console.log("❌ Credentials provider not found!");
}

console.log("\n✅ Config test complete");
