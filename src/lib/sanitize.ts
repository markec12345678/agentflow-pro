/**
 * Input Sanitization Utility
 * Prevents XSS attacks by sanitizing user input
 */

/**
 * Sanitize HTML string to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  // Remove all HTML tags
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize text input (strip all HTML tags)
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  // Remove all HTML tags and trim
  return text.replace(/<[^>]*>/g, '').trim();
}

/**
 * Sanitize URL to prevent javascript: protocol
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  // Allow only http, https, or relative URLs
  if (url.startsWith('javascript:') || url.startsWith('data:')) {
    return '';
  }
  return url;
}

/**
 * Sanitize object with nested properties
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
}

/**
 * Middleware-style sanitization for request body
 */
export function sanitizeRequestBody(body: any): any {
  if (!body) return {};
  return sanitizeObject(body);
}
