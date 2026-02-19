import { prisma } from "@/database/schema";

/**
 * Check if approverUserId is an admin or owner of a team that has authorUserId as a member.
 */
export async function canApproveContent(
  approverUserId: string,
  authorUserId: string
): Promise<boolean> {
  if (approverUserId === authorUserId) return false;

  const adminMembership = await prisma.teamMember.findFirst({
    where: {
      userId: approverUserId,
      role: { in: ["admin", "owner"] },
      team: {
        members: {
          some: { userId: authorUserId },
        },
      },
    },
  });

  if (adminMembership) return true;

  const ownedTeam = await prisma.team.findFirst({
    where: {
      ownerId: approverUserId,
      members: {
        some: { userId: authorUserId },
      },
    },
  });

  return !!ownedTeam;
}
