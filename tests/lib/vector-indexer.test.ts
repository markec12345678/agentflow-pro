import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";

/**
 * vector-indexer.ts – Fire-and-forget indexing for Qdrant
 */
import {
  indexOnboarding,
  indexUserTemplate,
  indexBlogPost,
} from "@/lib/vector-indexer";

const mockIndexDocuments = vi.fn();

vi.mock("@/vector/QdrantService", () => ({
  indexDocuments: (...args: unknown[]) => mockIndexDocuments(...args),
}));


describe("vector-indexer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIndexDocuments.mockResolvedValue({ indexed: 1 });
    delete process.env.OPENAI_API_KEY;
  });

  describe("indexOnboarding", () => {
    it("does not call indexDocuments when row has no text", () => {
      indexOnboarding("o1", {});
      indexOnboarding("o2", { brandVoiceSummary: "  ", styleGuide: null });
      expect(mockIndexDocuments).not.toHaveBeenCalled();
    });

    it("does not call indexDocuments when no API key", () => {
      indexOnboarding("o1", { brandVoiceSummary: "hello" });
      expect(mockIndexDocuments).not.toHaveBeenCalled();
    });

    it("calls indexDocuments with text and key", () => {
      process.env.OPENAI_API_KEY = "sk-test";
      indexOnboarding("o1", {
        brandVoiceSummary: "Voice",
        styleGuide: "Guide",
      });
      expect(mockIndexDocuments).toHaveBeenCalledWith(
        [
          {
            id: "onboarding_o1",
            text: "Voice\n\nGuide",
            metadata: { type: "onboarding" },
          },
        ],
        "sk-test"
      );
    });

    it("uses openaiKey param when provided", () => {
      indexOnboarding(
        "o1",
        { companyKnowledge: "Knowledge" },
        "custom-key"
      );
      expect(mockIndexDocuments).toHaveBeenCalledWith(
        [{ id: "onboarding_o1", text: "Knowledge", metadata: { type: "onboarding" } }],
        "custom-key"
      );
    });

    it("serializes object companyKnowledge as JSON", () => {
      indexOnboarding("o1", { companyKnowledge: { foo: "bar" } }, "key");
      expect(mockIndexDocuments).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: "onboarding_o1",
            text: '{"foo":"bar"}',
            metadata: { type: "onboarding" },
          }),
        ]),
        "key"
      );
    });
  });

  describe("indexUserTemplate", () => {
    it("does not call indexDocuments when no text", () => {
      indexUserTemplate("t1", {});
      expect(mockIndexDocuments).not.toHaveBeenCalled();
    });

    it("calls indexDocuments when text and key present", () => {
      indexUserTemplate(
        "t1",
        { name: "Tpl", basePrompt: "Prompt", content: "Body" },
        "key"
      );
      expect(mockIndexDocuments).toHaveBeenCalledWith(
        [
          {
            id: "template_t1",
            text: "Tpl\n\nPrompt\n\nBody",
            metadata: { type: "userTemplate" },
          },
        ],
        "key"
      );
    });
  });

  describe("indexBlogPost", () => {
    it("does not call indexDocuments when no text", () => {
      indexBlogPost("b1", { title: "  " });
      expect(mockIndexDocuments).not.toHaveBeenCalled();
    });

    it("calls indexDocuments when text and key present", () => {
      indexBlogPost(
        "b1",
        { title: "Title", brief: "Brief", fullContent: "Content" },
        "key"
      );
      expect(mockIndexDocuments).toHaveBeenCalledWith(
        [
          {
            id: "post_b1",
            text: "Title\n\nBrief\n\nContent",
            metadata: { type: "blogPost" },
          },
        ],
        "key"
      );
    });
  });
});
