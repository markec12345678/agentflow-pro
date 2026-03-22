/**
 * Trial status helpers
 */

export function isTrialActive(user: {
  trialEndsAt?: Date | string | null;
}): boolean {
  if (!user.trialEndsAt) return false;
  const endsAt =
    typeof user.trialEndsAt === "string"
      ? new Date(user.trialEndsAt)
      : user.trialEndsAt;
  return endsAt.getTime() > Date.now();
}

export function getTrialStatus(user: {
  trialEndsAt?: Date | string | null;
}): { active: boolean; endsAt: Date | null } {
  if (!user.trialEndsAt) return { active: false, endsAt: null };
  const endsAt =
    typeof user.trialEndsAt === "string"
      ? new Date(user.trialEndsAt)
      : user.trialEndsAt;
  return {
    active: endsAt.getTime() > Date.now(),
    endsAt,
  };
}
