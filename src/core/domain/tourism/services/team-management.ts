/**
 * AgentFlow Pro - Team Management
 * RBAC, member invitations, and permission management
 */

import { prisma } from "@/database/schema";

export type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export interface Permission {
  resource: string;
  actions: string[];
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [
    { resource: "*", actions: ["*"] }, // All permissions
  ],
  ADMIN: [
    { resource: "reservations", actions: ["create", "read", "update", "delete"] },
    { resource: "calendar", actions: ["create", "read", "update", "delete"] },
    { resource: "reports", actions: ["read"] },
    { resource: "guests", actions: ["create", "read", "update"] },
    { resource: "content", actions: ["create", "read", "update", "delete"] },
  ],
  MEMBER: [
    { resource: "reservations", actions: ["read", "update"] },
    { resource: "calendar", actions: ["read"] },
    { resource: "guests", actions: ["read", "update"] },
    { resource: "content", actions: ["read"] },
  ],
  VIEWER: [
    { resource: "reservations", actions: ["read"] },
    { resource: "calendar", actions: ["read"] },
    { resource: "reports", actions: ["read"] },
  ],
};

export interface TeamMember {
  id: string;
  userId: string;
  email: string;
  name?: string;
  role: Role;
  invitedAt: Date;
  joinedAt?: Date;
  lastActiveAt?: Date;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: Role;
  invitedBy: string;
  expiresAt: Date;
  status: "pending" | "accepted" | "declined" | "expired";
}

/**
 * Get team members for property
 */
export async function getTeamMembers(propertyId: string): Promise<TeamMember[]> {
  const team = await prisma.team.findUnique({
    where: { propertyId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!team) {
    return [];
  }

  return team.members.map(member => ({
    id: member.id,
    userId: member.userId,
    email: member.user.email,
    name: member.user.name,
    role: member.role as Role,
    invitedAt: member.createdAt,
    joinedAt: member.createdAt,
    lastActiveAt: undefined,
  }));
}

/**
 * Invite team member
 */
export async function inviteTeamMember(data: {
  propertyId: string;
  email: string;
  role: Role;
  invitedBy: string;
}): Promise<TeamInvitation> {
  const { propertyId, email, role, invitedBy } = data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // Check if already in team
    const team = await prisma.team.findUnique({
      where: { propertyId },
      include: { members: true },
    });

    const alreadyMember = team?.members.some(m => m.userId === existingUser.id);
    if (alreadyMember) {
      throw new Error("User is already a team member");
    }
  }

  // Create invitation
  const invitation = await prisma.teamInvitation.create({
    data: {
      propertyId,
      email,
      role,
      invitedBy,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: "pending",
    },
  });

  // Send invitation email (in production)
  await sendInvitationEmail({
    email,
    role,
    propertyName: await getPropertyName(propertyId),
    invitationId: invitation.id,
  });

  return invitation;
}

/**
 * Accept invitation
 */
export async function acceptInvitation(
  invitationId: string,
  userId: string
): Promise<void> {
  const invitation = await prisma.teamInvitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation || invitation.status !== "pending") {
    throw new Error("Invalid or expired invitation");
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.teamInvitation.update({
      where: { id: invitationId },
      data: { status: "expired" },
    });
    throw new Error("Invitation has expired");
  }

  // Add to team
  await prisma.teamMember.create({
    data: {
      teamId: invitation.propertyId, // Assuming teamId = propertyId for simplicity
      userId,
      role: invitation.role,
    },
  });

  // Update invitation
  await prisma.teamInvitation.update({
    where: { id: invitationId },
    data: { status: "accepted" },
  });
}

/**
 * Remove team member
 */
export async function removeTeamMember(
  propertyId: string,
  memberId: string
): Promise<void> {
  await prisma.teamMember.delete({
    where: {
      id: memberId,
      teamId: propertyId,
    },
  });
}

/**
 * Update member role
 */
export async function updateMemberRole(
  propertyId: string,
  memberId: string,
  newRole: Role
): Promise<void> {
  await prisma.teamMember.update({
    where: {
      id: memberId,
      teamId: propertyId,
    },
    data: { role: newRole },
  });
}

/**
 * Check if user has permission
 */
export async function hasPermission(
  userId: string,
  propertyId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const team = await prisma.team.findUnique({
    where: { propertyId },
    include: {
      members: {
        where: { userId },
      },
    },
  });

  if (!team || team.members.length === 0) {
    return false;
  }

  const member = team.members[0];
  const role = member.role as Role;
  const permissions = ROLE_PERMISSIONS[role];

  // Check permissions
  for (const permission of permissions) {
    if (permission.resource === "*" || permission.resource === resource) {
      if (permission.actions.includes("*") || permission.actions.includes(action)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get user's properties
 */
export async function getUserProperties(userId: string): Promise<string[]> {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });

  return memberships.map(m => m.teamId);
}

/**
 * Send invitation email
 */
async function sendInvitationEmail(data: {
  email: string;
  role: string;
  propertyName: string;
  invitationId: string;
}): Promise<void> {
  // In production, send actual email
  logger.info(`[Invitation Email] To: ${data.email}, Role: ${data.role}, Property: ${data.propertyName}`);
}

/**
 * Get property name
 */
async function getPropertyName(propertyId: string): Promise<string> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { name: true },
  });
  return property?.name || "Unknown Property";
}

/**
 * Log user activity
 */
export async function logActivity(data: {
  userId: string;
  propertyId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  await prisma.activityLog.create({
    data: {
      userId: data.userId,
      propertyId: data.propertyId,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      metadata: data.metadata || {},
      timestamp: new Date(),
    },
  });
}

/**
 * Get activity logs
 */
export async function getActivityLogs(
  propertyId: string,
  options?: {
    userId?: string;
    action?: string;
    from?: Date;
    to?: Date;
    limit?: number;
  }
): Promise<any[]> {
  const where: any = { propertyId };

  if (options?.userId) {
    where.userId = options.userId;
  }

  if (options?.action) {
    where.action = options.action;
  }

  if (options?.from || options?.to) {
    where.timestamp = {};
    if (options?.from) where.timestamp.gte = options.from;
    if (options?.to) where.timestamp.lte = options.to;
  }

  const logs = await prisma.activityLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: options?.limit || 100,
  });

  return logs;
}
