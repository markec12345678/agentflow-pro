/**
 * Infrastructure: PII removal before sending data to LLM
 */

import type { IDataSanitizer } from "@/domain/ai";

const REDACTED_EMAIL = "[REDACTED_EMAIL]";
const REDACTED_PHONE = "[REDACTED_PHONE]";
const REDACTED_CARD = "[REDACTED_CARD]";

/** Email pattern */
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/** Phone: +386 XX XXX XXX, 00386..., +country code followed by digits */
const PHONE_RE = /(\+386|00386|0\d{1,2})[\s.-]?[0-9]{3}[\s.-]?[0-9]{3}[\s.-]?[0-9]{2,3}\b|\+\d{1,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}/g;

/** Credit card (4 groups of 4 digits, optional spaces/dashes) */
const CARD_RE = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;

export class DataSanitizer implements IDataSanitizer {
  sanitize(text: string): string {
    if (!text || typeof text !== "string") return text;
    let out = text;
    out = out.replace(EMAIL_RE, REDACTED_EMAIL);
    out = out.replace(PHONE_RE, REDACTED_PHONE);
    out = out.replace(CARD_RE, REDACTED_CARD);
    return out;
  }
}
