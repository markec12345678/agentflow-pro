/**
 * Tourism publish helpers – format content for copy-paste to Booking, Airbnb, Instagram
 */

/**
 * Formats content for Booking.com.
 * Limits: max 5000 chars, no HTML, no markdown symbols.
 */
export function formatForBooking(content: string): string {
  return content
    .slice(0, 4900) // Varni buffer
    .replace(/<[^>]*>/g, "") // Remove HTML
    .replace(/\*\*/g, "") // Remove markdown bold
    .replace(/\*/g, "") // Remove markdown italic
    .trim();
}

/**
 * Formats content for Airbnb.
 * Allows more formatting; max 2 consecutive line breaks.
 */
export function formatForAirbnb(content: string): string {
  return content
    .slice(0, 4900)
    .replace(/\n{3,}/g, "\n\n") // Max 2 line breaks
    .trim();
}

/**
 * Generates Instagram hashtags from location and accommodation type.
 * Max 10 hashtags.
 */
export function generateHashtags(location: string, type: string): string[] {
  const base = location
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(" ")
    .filter(Boolean);
  return [
    `#${type.toLowerCase()}`,
    `#${base.join("")}`,
    ...base.map((b) => `#${b}`),
    "#Slovenia",
    "#TravelSlovenia",
    "#VisitSlovenia",
  ].slice(0, 10);
}
