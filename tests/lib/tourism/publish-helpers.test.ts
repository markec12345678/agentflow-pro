/**
 * Tourism publish-helpers unit tests
 */
import {
  formatForBooking,
  formatForAirbnb,
  generateHashtags,
} from "../../../src/lib/tourism/publish-helpers";

describe("formatForBooking", () => {
  it("removes HTML tags", () => {
    const input = "<p>Hello</p> <b>world</b>";
    expect(formatForBooking(input)).toBe("Hello world");
  });

  it("removes markdown bold (**)", () => {
    const input = "**Bold** text";
    expect(formatForBooking(input)).toBe("Bold text");
  });

  it("removes markdown italic (*)", () => {
    const input = "*Italic* text";
    expect(formatForBooking(input)).toBe("Italic text");
  });

  it("combines HTML and markdown removal", () => {
    const input = "<p>Test **bold** and *italic*</p>";
    expect(formatForBooking(input)).toBe("Test bold and italic");
  });

  it("output length ≤ 5000 (spec: max 5000, buffer 4900)", () => {
    const long = "a".repeat(6000);
    const result = formatForBooking(long);
    expect(result.length).toBeLessThanOrEqual(5000);
    expect(result.length).toBeLessThanOrEqual(4900);
  });
});

describe("formatForAirbnb", () => {
  it("collapses 3+ consecutive line breaks to 2", () => {
    const input = "Line1\n\n\n\nLine2";
    expect(formatForAirbnb(input)).toBe("Line1\n\nLine2");
  });

  it("preserves single line break", () => {
    const input = "Line1\nLine2";
    expect(formatForAirbnb(input)).toBe("Line1\nLine2");
  });

  it("preserves double line break", () => {
    const input = "Para1\n\nPara2";
    expect(formatForAirbnb(input)).toBe("Para1\n\nPara2");
  });

  it("preserves content under 4900 chars", () => {
    const input = "Short description";
    expect(formatForAirbnb(input)).toBe("Short description");
  });

  it("trims to 4900 chars", () => {
    const long = "a".repeat(6000);
    expect(formatForAirbnb(long).length).toBeLessThanOrEqual(4900);
  });
});

describe("generateHashtags", () => {
  it("returns max 10 hashtags", () => {
    const result = generateHashtags("Bela Krajina", "apartma");
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it("returns exactly 10 when inputs yield enough tags", () => {
    const result = generateHashtags(
      "Bela Krajina Metlika Črnomelj Kolpa",
      "apartma"
    );
    expect(result.length).toBe(10);
  });

  it("includes #Slovenia, #TravelSlovenia, #VisitSlovenia", () => {
    const result = generateHashtags("Test", "apartma");
    expect(result).toContain("#Slovenia");
    expect(result).toContain("#TravelSlovenia");
    expect(result).toContain("#VisitSlovenia");
  });

  it("Bela Krajina + apartma yields expected tags", () => {
    const result = generateHashtags("Bela krajina", "apartma");
    expect(result).toContain("#apartma");
    expect(result).toContain("#Slovenia");
    expect(result).toContain("#TravelSlovenia");
    expect(result).toContain("#VisitSlovenia");
    expect(result.some((h) => h.toLowerCase().includes("bela"))).toBe(true);
  });

  it("includes type as hashtag", () => {
    const result = generateHashtags("Ljubljana", "hotel");
    expect(result.some((h) => h.toLowerCase().includes("hotel"))).toBe(true);
  });

  it("handles empty location", () => {
    const result = generateHashtags("", "apartma");
    expect(result.length).toBeGreaterThan(0);
  });
});
