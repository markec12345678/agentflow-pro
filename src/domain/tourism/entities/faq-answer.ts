/**
 * Domain entity: FAQ Answer (value object)
 */

export interface FaqAnswer {
  answer: string;
  confidence: number;
  category: string;
  source: string;
  matchedQuestion?: string;
  alternatives?: Array<{ question: string; answer: string }>;
  contactInfo?: { phone: string; email: string };
  faqLogId?: string;
}
