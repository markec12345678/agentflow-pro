/**
 * Verifier schemas - validateResearchOutput, validateContentOutput, etc.
 */
import {
  validateResearchOutput,
  validateContentOutput,
  validateCodeOutput,
  validateDeployOutput,
} from "@/verifier/schemas";

describe("verifier schemas", () => {
  describe("validateResearchOutput", () => {
    it("returns error when not object", () => {
      expect(validateResearchOutput(null)).toContain("Output must be an object");
      expect(validateResearchOutput("str")).toContain("Output must be an object");
      expect(validateResearchOutput([])).toContain("Output must be an object");
    });

    it("returns empty when valid", () => {
      expect(
        validateResearchOutput({
          urls: ["a"],
          scrapedData: [{}],
          searchResults: [{}],
        })
      ).toEqual([]);
    });

    it("returns errors for missing/invalid fields", () => {
      const r = validateResearchOutput({});
      expect(r.some((e) => e.includes("urls"))).toBe(true);
      expect(r.some((e) => e.includes("scrapedData"))).toBe(true);
      expect(r.some((e) => e.includes("searchResults"))).toBe(true);
    });
  });

  describe("validateContentOutput", () => {
    it("returns error when not object", () => {
      expect(validateContentOutput(null)).toContain("Output must be an object");
    });

    it("returns empty when has blog", () => {
      expect(validateContentOutput({ blog: "x" })).toEqual([]);
    });

    it("returns empty when has keywords", () => {
      expect(validateContentOutput({ keywords: [] })).toEqual([]);
    });

    it("returns error when none of blog/social/email/keywords", () => {
      const r = validateContentOutput({ foo: "bar" });
      expect(r.some((e) => e.includes("at least one of: blog, social, email, keywords"))).toBe(true);
    });
  });

  describe("validateCodeOutput", () => {
    it("returns empty when has files", () => {
      expect(validateCodeOutput({ files: [] })).toEqual([]);
    });

    it("returns empty when has pullRequest", () => {
      expect(validateCodeOutput({ pullRequest: {} })).toEqual([]);
    });

    it("returns error when none of files/suggestions/pullRequest", () => {
      const r = validateCodeOutput({});
      expect(r.some((e) => e.includes("at least one of: files, suggestions, pullRequest"))).toBe(true);
    });
  });

  describe("validateDeployOutput", () => {
    it("returns empty when has deployUrl", () => {
      expect(validateDeployOutput({ deployUrl: "https://x.com" })).toEqual([]);
    });

    it("returns empty when has error", () => {
      expect(validateDeployOutput({ error: "failed" })).toEqual([]);
    });

    it("returns error when none of deployUrl/status/envVars/error", () => {
      const r = validateDeployOutput({});
      expect(r.some((e) => e.includes("at least one of: deployUrl, status, envVars, error"))).toBe(true);
    });
  });
});
