/**
 * Use Case: Get FAQs
 * 
 * Get frequently asked questions.
 */

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface GetFAQsInput {
  propertyId?: string
  category?: string
  searchQuery?: string
  limit?: number
}

export interface GetFAQsOutput {
  faqs: FAQDTO[]
  total: number
}

export interface FAQDTO {
  id: string
  question: string
  answer: string
  category: string
  helpful: number
  notHelpful: number
  propertyId?: string
}

// ============================================================================
// Use Case Class
// ============================================================================

export class GetFAQs {
  constructor(
    private faqRepository: FAQRepository
  ) {}

  /**
   * Get FAQs
   */
  async execute(input: GetFAQsInput): Promise<GetFAQsOutput> {
    const { propertyId, category, searchQuery, limit = 50 } = input

    // 1. Get FAQs
    const faqs = await this.faqRepository.find({
      propertyId,
      category,
      searchQuery,
      limit
    })

    // 2. Get total count
    const total = await this.faqRepository.count({
      propertyId,
      category,
      searchQuery
    })

    // 3. Map to DTO
    const faqDTOs = faqs.map(this.mapToDTO)

    return {
      faqs: faqDTOs,
      total
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private mapToDTO(faq: any): FAQDTO {
    return {
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      helpful: faq.helpful,
      notHelpful: faq.notHelpful,
      propertyId: faq.propertyId
    }
  }
}

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface FAQRepository {
  find(options?: {
    propertyId?: string
    category?: string
    searchQuery?: string
    limit?: number
  }): Promise<any[]>

  count(options?: {
    propertyId?: string
    category?: string
    searchQuery?: string
  }): Promise<number>
}
