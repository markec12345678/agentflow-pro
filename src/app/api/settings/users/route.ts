import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface User {
  id: string;
  name: string;
  email: string;
  role: "receptor" | "director" | "admin";
  status: "active" | "inactive" | "pending";
  lastLogin: string | null;
  createdAt: string;
  twoFactorEnabled: boolean;
  permissions: string[];
}

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

/**
 * GET /api/settings/users
 * Get all users with their roles and permissions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // Get all users (in real implementation, this would fetch from database)
    const mockUsers: User[] = [
      {
        id: "1",
        name: "Janez Novak",
        email: "janez.novak@hotel-alpina.si",
        role: "admin",
        status: "active",
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        twoFactorEnabled: true,
        permissions: ["all"]
      },
      {
        id: "2",
        name: "Maja Horvat",
        email: "maja.horvat@hotel-alpina.si",
        role: "director",
        status: "active",
        lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        twoFactorEnabled: false,
        permissions: ["manage_properties", "view_reports", "manage_reservations"]
      },
      {
        id: "3",
        name: "Peter Kovačič",
        email: "peter.kovacic@hotel-alpina.si",
        role: "receptor",
        status: "active",
        lastLogin: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        twoFactorEnabled: false,
        permissions: ["manage_reservations", "view_calendar"]
      },
      {
        id: "4",
        name: "Ana Zupan",
        email: "ana.zupan@hotel-alpina.si",
        role: "receptor",
        status: "inactive",
        lastLogin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        twoFactorEnabled: true,
        permissions: ["manage_reservations", "view_calendar"]
      }
    ];

    return NextResponse.json({
      success: true,
      data: { users: mockUsers }
    });

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/users
 * Create a new user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { user } = body;

    if (!user || !user.name || !user.email || !user.role) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Name, email, and role are required' } },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_EMAIL', message: 'Invalid email format' } },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["receptor", "director", "admin"];
    if (!validRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ROLE', message: 'Invalid role' } },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_EXISTS', message: 'User with this email already exists' } },
        { status: 409 }
      );
    }

    // Create new user (in real implementation)
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: user.name,
      email: user.email,
      role: user.role,
      status: "pending",
      lastLogin: null,
      createdAt: new Date().toISOString(),
      twoFactorEnabled: false,
      permissions: getPermissionsForRole(user.role)
    };

    console.log('Created new user:', newUser);

    // Log activity
    await logActivity(userId, "User Created", `Created new user: ${user.name}`, request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || "unknown");

    return NextResponse.json({
      success: true,
      data: { user: newUser }
    });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

function getPermissionsForRole(role: string): string[] {
  switch (role) {
    case "admin":
      return ["all"];
    case "director":
      return ["manage_properties", "view_reports", "manage_reservations", "manage_users"];
    case "receptor":
      return ["manage_reservations", "view_calendar", "view_guests"];
    default:
      return [];
  }
}

async function logActivity(userId: string, action: string, details: string, ipAddress: string) {
  // In real implementation, this would be stored in database
  console.log('Activity log:', {
    userId,
    action,
    details,
    ipAddress,
    timestamp: new Date().toISOString()
  });
}
}
