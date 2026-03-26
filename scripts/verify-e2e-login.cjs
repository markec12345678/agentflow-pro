/**
 * Verify e2e@test.com exists and password e2e-secret works.
 * Run: node scripts/verify-e2e-login.js
 */
require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.user.findUnique({
    where: { email: "e2e@test.com" },
    select: { id: true, email: true, passwordHash: true },
  });
  if (!u) {
    console.log("USER_NOT_FOUND: e2e@test.com ne obstaja v bazi.");
    console.log("Zaženi: npx prisma db seed");
    process.exit(1);
  }
  const ok = bcrypt.compareSync("e2e-secret", u.passwordHash);
  if (ok) {
    console.log("OK: Uporabnik obstaja, geslo e2e-secret velja.");
  } else {
    console.log("FAIL: Geslo e2e-secret se ne ujema z hash v bazi.");
    console.log("Zaženi: npx prisma db seed (posodobi hash)");
    process.exit(1);
  }
  await prisma.$disconnect();
}
main().catch((e) => {
  console.error("Database error:", e.message);
  process.exit(1);
});
