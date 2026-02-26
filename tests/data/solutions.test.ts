import {
  SOLUTIONS,
  INDUSTRIES,
  getSolutionById,
  getIndustryBySlug,
} from "@/data/solutions";

describe("solutions", () => {
  it("SOLUTIONS has entries", () => {
    expect(SOLUTIONS.length).toBeGreaterThan(0);
  });

  it("getSolutionById returns solution for valid id", () => {
    const first = SOLUTIONS[0];
    expect(getSolutionById(first.id)).toEqual(first);
  });

  it("getSolutionById returns undefined for invalid id", () => {
    expect(getSolutionById("invalid")).toBeUndefined();
  });

  it("INDUSTRIES has tourism", () => {
    expect(INDUSTRIES.some((i) => i.id === "tourism")).toBe(true);
  });

  it("getIndustryBySlug returns industry for valid slug", () => {
    const tourism = getIndustryBySlug("tourism");
    expect(tourism?.name).toContain("Tourism");
  });

  it("getIndustryBySlug returns undefined for invalid slug", () => {
    expect(getIndustryBySlug("invalid")).toBeUndefined();
  });
});
