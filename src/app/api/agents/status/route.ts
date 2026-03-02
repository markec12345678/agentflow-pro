import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

// Mock data for AI Agents since this is a UI-focused task
// In production, these would come from a database or a background process manager (Redis/BullMQ)
const AGENTS = [
  { id: "content-creator", name: "Content Creator", type: "Generator", status: "active", lastRun: new Date().toISOString(), successRate: 98, queue: 0 },
  { id: "reservation-bot", name: "Reservation Bot", type: "Automation", status: "active", lastRun: new Date(Date.now() - 5000).toISOString(), successRate: 95, queue: 2 },
  { id: "review-analyzer", name: "Review Analyzer", type: "Analysis", status: "active", lastRun: new Date(Date.now() - 3600000).toISOString(), successRate: 100, queue: 0 },
  { id: "price-optimizer", name: "Price Optimizer", type: "Financial", status: "active", lastRun: new Date(Date.now() - 1800000).toISOString(), successRate: 92, queue: 0 },
  { id: "guest-communicator", name: "Guest Communicator", type: "Communication", status: "active", lastRun: new Date(Date.now() - 60000).toISOString(), successRate: 97, queue: 1 },
  { id: "ajpes-syncer", name: "AJPES Syncer", type: "Sync", status: "paused", lastRun: new Date(Date.now() - 86400000).toISOString(), successRate: 88, queue: 15 },
  { id: "seo-expert", name: "SEO Expert", type: "Marketing", status: "active", lastRun: new Date(Date.now() - 43200000).toISOString(), successRate: 99, queue: 0 },
  { id: "security-guard", name: "Security Guard", type: "Security", status: "active", lastRun: new Date(Date.now() - 300000).toISOString(), successRate: 100, queue: 0 },
];

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Role check
    const role = session?.user?.role;
    if (role !== "admin" && role !== "director") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(AGENTS);
  } catch (error) {
    console.error("Agents API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const body = await request.json();
    const { agentId, action } = body; // action: trigger, pause, resume

    // In real app: Update agent status in DB or trigger job
    return NextResponse.json({ success: true, agentId, action });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
