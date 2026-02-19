/**
 * Booking.com Affiliate link builder
 * User stores their affiliate ID (aid) in UserApiKey provider: booking_affiliate
 * Format: numeric aid or "aid=123456" - we normalize to aid param
 */

import { getUserApiKeys } from "@/lib/user-keys";
import { getBookingAffiliateDefault } from "@/config/env";

const BOOKING_BASE = "https://www.booking.com";

export type AffiliateLinkParams = {
  aid?: string;
  destType?: string;
  destId?: string;
  checkin?: string;
  checkout?: string;
  groupAdults?: number;
  groupChildren?: number;
  noRooms?: number;
  sbTravelPurpose?: "leisure" | "business";
};

function normalizeAid(aid: string): string {
  const trimmed = aid.trim();
  const match = trimmed.match(/aid=(\d+)/);
  return match ? match[1] : trimmed.replace(/\D/g, "");
}

export function buildAffiliateUrl(
  params: AffiliateLinkParams,
  userAid?: string | null
): string {
  const aid = userAid ? normalizeAid(userAid) : normalizeAid(getBookingAffiliateDefault());
  if (!aid) return BOOKING_BASE;

  const search = new URLSearchParams();
  search.set("aid", aid);
  if (params.destType) search.set("dest_type", params.destType);
  if (params.destId) search.set("dest_id", params.destId);
  if (params.checkin) search.set("checkin", params.checkin);
  if (params.checkout) search.set("checkout", params.checkout);
  if (params.groupAdults != null) search.set("group_adults", String(params.groupAdults));
  if (params.groupChildren != null) search.set("group_children", String(params.groupChildren));
  if (params.noRooms != null) search.set("no_rooms", String(params.noRooms));
  if (params.sbTravelPurpose) search.set("sb_travel_purpose", params.sbTravelPurpose);

  return `${BOOKING_BASE}?${search.toString()}`;
}

export async function getAffiliateLinkForUser(
  userId: string,
  params: AffiliateLinkParams
): Promise<string> {
  const keys = await getUserApiKeys(userId, { masked: false });
  const userAid = keys.booking_affiliate?.trim();
  return buildAffiliateUrl(params, userAid);
}
