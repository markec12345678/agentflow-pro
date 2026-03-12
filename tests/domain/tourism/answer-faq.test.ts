/**
 * AnswerFaqUseCase unit tests
 */

import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { createAnswerFaqUseCase, type FaqEntryForMatch } from "@/domain/tourism/use-cases/answer-faq";
import type { IFaqLogRepository } from "@/domain/tourism/ports/faq-log-repository";
import type { IGuestRetrieval } from "@/domain/tourism/ports/guest-retrieval.port";
import type { IPolicyAgent } from "@/domain/tourism/ports/policy-agent.port";
import type { IGuestCopyAgent } from "@/domain/tourism/ports/copy-agent.port";

const sampleFaqs: FaqEntryForMatch[] = [
  {
    question: "Kdaj je check-in?",
    answer: "Check-in je med 15:00 in 20:00.",
    category: "čas",
    keywords: ["check-in", "check-out", "ura", "kdaj"],
  },
  {
    question: "Ali je WiFi na voljo?",
    answer: "Da, brezplačen WiFi je na voljo.",
    category: "storitve",
    keywords: ["wifi", "internet"],
  },
];

const mockFaqLogRepo: IFaqLogRepository = {
  log: vi.fn().mockResolvedValue(undefined),
};

const mockGuestRetrieval: IGuestRetrieval = {
  retrieve: vi.fn().mockResolvedValue({
    property: { id: "p1", name: "Test", location: "Ljubljana", type: "apartment", capacity: 4, description: "Nice" },
    reservations: [{ checkIn: "2025-06-01", checkOut: "2025-06-05", status: "confirmed" }],
  }),
};

const mockPolicyAgent: IPolicyAgent = {
  check: vi.fn().mockReturnValue({
    allowed: null,
    reason: "",
    policyContext: "",
    isPolicyRelevant: false,
  }),
};

const mockCopyAgent: IGuestCopyAgent = {
  run: vi.fn().mockResolvedValue({ answer: "Mock answer from agent", confidence: 0.85 }),
};

describe("createAnswerFaqUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPolicyAgent.check.mockReturnValue({
      allowed: null,
      reason: "",
      policyContext: "",
      isPolicyRelevant: false,
    });
  });

  it("returns keyword match when question matches FAQ", async () => {
    const answerFaq = createAnswerFaqUseCase({
      faqLogRepo: mockFaqLogRepo,
      guestRetrieval: mockGuestRetrieval,
      policyAgent: mockPolicyAgent,
      copyAgent: mockCopyAgent,
    });

    const result = await answerFaq({
      question: "Kdaj je check-in?",
      faqs: sampleFaqs,
      propertyIdForLog: null,
    });

    expect(result.source).toBe("keyword");
    expect(result.answer).toBe("Check-in je med 15:00 in 20:00.");
    expect(result.confidence).toBe(0.8);
    expect(result.category).toBe("čas");
    expect(mockFaqLogRepo.log).toHaveBeenCalledTimes(1);
    expect(mockGuestRetrieval.retrieve).not.toHaveBeenCalled();
    expect(mockCopyAgent.run).not.toHaveBeenCalled();
  });

  it("returns keyword match for partial match", async () => {
    const answerFaq = createAnswerFaqUseCase({
      faqLogRepo: mockFaqLogRepo,
      guestRetrieval: mockGuestRetrieval,
      policyAgent: mockPolicyAgent,
      copyAgent: mockCopyAgent,
    });

    const result = await answerFaq({
      question: "Kdaj je WiFi check-in?",
      faqs: sampleFaqs,
      propertyIdForLog: null,
    });

    expect(result.source).toBe("keyword");
    expect(result.answer).toBeDefined();
    expect(result.confidence).toBe(0.8);
    expect(mockFaqLogRepo.log).toHaveBeenCalledTimes(1);
  });

  it("returns fallback when no match and no multi-agent", async () => {
    const answerFaq = createAnswerFaqUseCase({
      faqLogRepo: mockFaqLogRepo,
      guestRetrieval: mockGuestRetrieval,
      policyAgent: mockPolicyAgent,
      copyAgent: mockCopyAgent,
    });

    const result = await answerFaq({
      question: "Some random question xyz123",
      faqs: sampleFaqs,
      propertyIdForLog: null,
    });

    expect(result.source).toBe("fallback");
    expect(result.confidence).toBe(0);
    expect(result.answer).toContain("kontaktirajte nas");
    expect(result.contactInfo).toBeDefined();
    expect(mockFaqLogRepo.log).toHaveBeenCalledTimes(1);
    expect(mockGuestRetrieval.retrieve).not.toHaveBeenCalled();
  });

  it("calls multi-agent flow when useMultiAgent and propertyId and apiKey", async () => {
    const answerFaq = createAnswerFaqUseCase({
      faqLogRepo: mockFaqLogRepo,
      guestRetrieval: mockGuestRetrieval,
      policyAgent: mockPolicyAgent,
      copyAgent: mockCopyAgent,
    });

    mockPolicyAgent.check.mockReturnValue({
      allowed: null,
      reason: "test",
      policyContext: "policy",
      isPolicyRelevant: true,
    });

    const result = await answerFaq({
      question: "Custom question?",
      propertyId: "prop-1",
      useMultiAgent: true,
      faqs: sampleFaqs,
      propertyIdForLog: "prop-1",
      apiKey: "sk-test-key",
      kgBackend: undefined,
    });

    expect(result.source).toBe("multi-agent");
    expect(result.answer).toBe("Mock answer from agent");
    expect(result.confidence).toBe(0.85);
    expect(mockGuestRetrieval.retrieve).toHaveBeenCalledWith({
      propertyId: "prop-1",
      guestId: undefined,
      userId: undefined,
      kgBackend: undefined,
    });
    expect(mockPolicyAgent.check).toHaveBeenCalled();
    expect(mockCopyAgent.run).toHaveBeenCalled();
    expect(mockFaqLogRepo.log).toHaveBeenCalledTimes(1);
  });
});
