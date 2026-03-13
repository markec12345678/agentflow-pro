import { NextRequest, NextResponse } from "next/server";
import { HousekeepingOptimizationEngine } from "@/lib/hotel-specific/HousekeepingOptimizationEngine";

// Mock data - in production, this would come from your database
const MOCK_ROOMS = [
  { id: "1", roomNumber: "101", type: "standard", status: "dirty", priority: 8, guestType: "checkout" },
  { id: "2", roomNumber: "102", type: "standard", status: "dirty", priority: 9, guestType: "checkout" },
  { id: "3", roomNumber: "103", type: "deluxe", status: "clean", priority: 3, guestType: "regular" },
  { id: "4", roomNumber: "104", type: "suite", status: "dirty", priority: 10, guestType: "vip" },
];

const MOCK_STAFF = [
  { id: "1", name: "Maria Novak", role: "housekeeper", efficiency: 1.2, skills: ["deep_cleaning", "vip_service"] },
  { id: "2", name: "Ana Horvat", role: "housekeeper", efficiency: 1.0, skills: ["basic_cleaning", "restock"] },
  { id: "3", name: "Petra Zupan", role: "housekeeper", efficiency: 0.9, skills: ["basic_cleaning"] },
];

/**
 * GET /api/housekeeping
 * Get housekeeping data including room status, tasks, and staff assignments
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const includeTasks = searchParams.get("tasks") === "true";
    const includeStaff = searchParams.get("staff") === "true";

    // In production, fetch from database
    const response = {
      date,
      rooms: MOCK_ROOMS,
      tasks: includeTasks ? [] : undefined,
      staff: includeStaff ? MOCK_STAFF : undefined,
      metrics: {
        roomsCleaned: 24,
        targetRooms: 30,
        averageTimePerRoom: 28,
        staffUtilization: 87,
        guestSatisfaction: 4.6,
        costSavings: 180,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching housekeeping data:", error);
    return NextResponse.json(
      { error: "Failed to fetch housekeeping data" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/housekeeping
 * Generate optimized housekeeping schedule
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, staffIds, roomIds, constraints } = body;

    if (!date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    // Initialize the optimization engine
    const engine = new HousekeepingOptimizationEngine({
      roomTypes: [
        {
          id: "standard",
          name: "Standard Room",
          baseCleaningTime: 30,
          difficulty: "medium",
          specialRequirements: [],
          priority: 5,
        },
        {
          id: "deluxe",
          name: "Deluxe Room",
          baseCleaningTime: 40,
          difficulty: "medium",
          specialRequirements: ["premium_amenities"],
          priority: 7,
        },
        {
          id: "suite",
          name: "Suite",
          baseCleaningTime: 60,
          difficulty: "hard",
          specialRequirements: ["premium_amenities", "turndown_service"],
          priority: 10,
        },
      ],
      staffSkills: MOCK_STAFF.map((s) => ({
        id: s.id,
        name: s.name,
        efficiency: s.efficiency,
        certifiedRoomTypes: s.skills.includes("vip_service")
          ? ["standard", "deluxe", "suite"]
          : ["standard"],
        maxConcurrentTasks: 1,
        preferredAreas: ["all"],
      })),
      cleaningStandards: [],
      peakHours: [],
      guestPreferences: [],
      maintenanceIntegration: true,
    });

    // Convert mock rooms to housekeeping tasks
    const roomTasks = MOCK_ROOMS.filter(
      (room) => room.status === "dirty" || !roomIds || roomIds.includes(room.id)
    ).map((room) => ({
      id: room.id,
      roomId: room.id,
      type: "cleaning" as const,
      priority: room.priority,
      estimatedDuration: room.type === "suite" ? 60 : room.type === "deluxe" ? 40 : 30,
      status: "pending" as const,
      dueTime: "12:00",
    }));

    // Generate optimized schedule
    const schedule = await engine.generateOptimizedSchedule(
      new Date(date),
      staffIds || MOCK_STAFF.map((s) => s.id),
      roomTasks,
      constraints || {
        maxWorkingHours: 8,
        breakTimes: ["12:00-13:00"],
        priorityRooms: [],
        maintenanceTasks: [],
      }
    );

    return NextResponse.json({
      success: true,
      schedule: {
        id: schedule.id,
        date: schedule.date,
        assignments: schedule.assignments,
        totalEfficiency: schedule.totalEfficiency,
        estimatedCompletion: schedule.estimatedCompletion,
        costSavings: schedule.costSavings,
        guestSatisfactionScore: schedule.guestSatisfactionScore,
        metrics: schedule.optimizationMetrics,
      },
    });
  } catch (error) {
    console.error("Error generating housekeeping schedule:", error);
    return NextResponse.json(
      { error: "Failed to generate optimized schedule", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
