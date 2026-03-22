#!/usr/bin/env node
/**
 * Preveri dostop do baze (DATABASE_URL).
 * Zaženi: node scripts/check-database.js
 * ali: npx dotenv -e .env.local -- node scripts/check-database.js
 */

require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const url = process.env.DATABASE_URL;

console.log("\n--- Database check ---\n");

if (!url) {
  console.error("NAPAKA: DATABASE_URL ni nastavljen.");
  console.error("\nNastavi v .env.local (v root mapi projekta):");
  console.error('  DATABASE_URL="postgresql://postgres.[ref]:[geslo]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"');
  console.error("\nSupabase: Project Settings → Database → Connection string (URI)\n");
  process.exit(1);
}

if (url.startsWith("file:")) {
  console.error("NAPAKA: DATABASE_URL uporablja SQLite (file:./dev.db), projekt pa potrebuje PostgreSQL.");
  console.error("\nOdpri .env.local in zamenjaj vrstico:");
  console.error('  DATABASE_URL="postgresql://postgres.[project-ref]:[geslo]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"');
  console.error("\nSupabase Dashboard → Project Settings → Database → Connection string (URI)\n");
  process.exit(1);
}

// Preveri format (ne razkrijemo URL)
const masked = url.replace(/:[^:@]+@/, ":****@");
console.log("DATABASE_URL:", masked.substring(0, 60) + "...");

// Preveri ali geslo vsebuje posebne znake (potrebuje URL encoding)
const passMatch = url.match(/:[^:@]+@/);
if (passMatch) {
  const pass = passMatch[0].slice(1, -1);
  if (/[@#?:/\\]/.test(pass)) {
    console.warn("\nOPOZORILO: Geslo vsebuje posebne znake (@#?:/\\).");
    console.warn("Uporabi encodeURIComponent() za geslo ali spremeni geslo v Supabase.");
  }
}

let PrismaClient;
try {
  PrismaClient = require("@prisma/client").PrismaClient;
} catch {
  console.error("Prisma Client ni generiran. Zaženi: npx prisma generate");
  process.exit(1);
}

const prisma = new PrismaClient();

prisma
  .$queryRaw`SELECT 1`
  .then(() => {
    console.log("\n✓ Povezava uspešna.\n");
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error("\nNAPAKA pri povezavi:");
    console.error(err.message);
    if (err.message?.includes("ECONNREFUSED")) {
      console.error("\nMožni vzroki: napačen host/port ali baza ni dostopna.");
    }
    if (err.message?.includes("password")) {
      console.error("\nMožni vzroki: napačno geslo, posebni znaki v geslu (URL-encodaj).");
    }
    if (err.message?.includes("ENOTFOUND") || err.message?.includes("getaddrinfo")) {
      console.error("\nMožni vzroki: napačen host (preveri project-ref in region v URL).");
    }
    console.error("");
    prisma.$disconnect();
    process.exit(1);
  });
