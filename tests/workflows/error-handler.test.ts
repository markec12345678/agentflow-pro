import {
  isRetryableError,
  retryWithBackoff,
  wrapWithErrorHandler,
} from "@/workflows/error-handler";

describe("error-handler", () => {
  describe("isRetryableError", () => {
    it("returns true for timeout", () => {
      expect(isRetryableError(new Error("Request timeout"))).toBe(true);
    });
    it("returns true for 502", () => {
      expect(isRetryableError(new Error("502 Bad Gateway"))).toBe(true);
    });
    it("returns true for ECONNRESET", () => {
      expect(isRetryableError(new Error("ECONNRESET"))).toBe(true);
    });
    it("returns false for non-retryable", () => {
      expect(isRetryableError(new Error("Validation failed"))).toBe(false);
    });
    it("handles string input", () => {
      expect(isRetryableError("503 Service Unavailable")).toBe(true);
    });
  });

  describe("retryWithBackoff", () => {
    it("returns result on first success", async () => {
      const result = await retryWithBackoff(() => Promise.resolve(42));
      expect(result).toBe(42);
    });
    it("retries on retryable error then succeeds", async () => {
      let attempts = 0;
      const result = await retryWithBackoff(() => {
        attempts++;
        if (attempts < 2) throw new Error("502");
        return Promise.resolve("ok");
      });
      expect(result).toBe("ok");
      expect(attempts).toBe(2);
    });
    it("throws on non-retryable error immediately", async () => {
      let attempts = 0;
      await expect(
        retryWithBackoff(() => {
          attempts++;
          throw new Error("Invalid input");
        })
      ).rejects.toThrow("Invalid input");
      expect(attempts).toBe(1);
    });
  });

  describe("wrapWithErrorHandler", () => {
    it("returns success result", async () => {
      const wrap = wrapWithErrorHandler(async () => "done");
      const result = await wrap("n1", {});
      expect(result).toEqual({ nodeId: "n1", success: true, output: "done" });
    });
    it("returns error result on failure", async () => {
      const wrap = wrapWithErrorHandler(async () => {
        throw new Error("Agent failed");
      });
      const result = await wrap("n1", {});
      expect(result).toEqual({ nodeId: "n1", success: false, error: "Agent failed" });
    });
  });
});
