/**
 * Port: FAQ response logging
 */

export interface IFaqLogRepository {
  log(
    question: string,
    responseTimeMs: number,
    confidence: number,
    propertyId: string | null
  ): Promise<void>;
}
