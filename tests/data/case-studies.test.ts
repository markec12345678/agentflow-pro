import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { CASE_STUDIES, getCaseStudyById } from "@/data/case-studies";

describe("case-studies", () => {
  it("CASE_STUDIES has entries", () => {
    expect(CASE_STUDIES.length).toBeGreaterThan(0);
  });

  it("getCaseStudyById returns study for valid id", () => {
    const first = CASE_STUDIES[0];
    expect(getCaseStudyById(first.id)).toEqual(first);
  });

  it("getCaseStudyById returns undefined for invalid id", () => {
    expect(getCaseStudyById("invalid")).toBeUndefined();
  });
});
