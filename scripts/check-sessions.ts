import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkSessions() {
  try {
    console.log("🔍 Checking sessions in database...");

    const sessions = await prisma.session.findMany({
      take: 5,
      include: { user: true },
    });

    console.log(`📊 Found ${sessions.length} sessions`);

    if (sessions.length > 0) {
      console.log("Latest session:", JSON.stringify(sessions[0], null, 2));
    }

    // Check if test user exists
    const testUser = await prisma.user.findUnique({
      where: { email: "test@agentflow.com" },
      select: { id: true, email: true, name: true, passwordHash: true },
    });

    console.log("\n👤 Test user:", testUser ? "FOUND" : "NOT FOUND");
    if (testUser) {
      console.log("  ID:", testUser.id);
      console.log("  Email:", testUser.email);
      console.log("  Has password hash:", !!testUser.passwordHash);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSessions();
