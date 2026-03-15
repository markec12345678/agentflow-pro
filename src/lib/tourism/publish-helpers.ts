// Publish helpers for tourism content
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function generateMetaTitle(title: string, siteName: string): string {
  return `${title} | ${siteName}`;
}

export function generateMetaDescription(
  content: string,
  maxLength: number = 160,
): string {
  const text = content.replace(/<[^>]*>/g, " ").trim();
  return text.length > maxLength ? text.slice(0, maxLength - 3) + "..." : text;
}

export function formatForBooking(content: string): string {
  return content;
}

export function formatForAirbnb(content: string): string {
  return content;
}

export function generateHashtags(content: string): string[] {
  return ["#travel", "#booking"];
}
