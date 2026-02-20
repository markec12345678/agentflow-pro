/**
 * Tourism prompts and substitutePrompt unit tests
 */
import { PROMPTS } from "@/data/prompts";
import { substitutePrompt } from "@/lib/tourism/substitute-prompt";

describe("PROMPTS tourism category", () => {
  const tourismPrompts = PROMPTS.filter((p) => p.category === "tourism");

  it("returns expected tourism prompts", () => {
    expect(tourismPrompts.length).toBeGreaterThanOrEqual(4);
    const names = tourismPrompts.map((p) => p.name);
    expect(names).toContain("Booking.com Opis Nastanitve");
    expect(names).toContain("Airbnb Storytelling Opis");
    expect(names).toContain("Vodič po Destinaciji");
    expect(names).toContain("Sezonska Kampanja");
  });

  it("includes Instagram Travel Caption", () => {
    const names = tourismPrompts.map((p) => p.name);
    expect(names).toContain("Instagram Travel Caption");
  });

  it("each prompt has id, name, category, prompt, description", () => {
    for (const p of tourismPrompts) {
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("name");
      expect(p).toHaveProperty("category", "tourism");
      expect(typeof p.prompt).toBe("string");
      expect(typeof p.description).toBe("string");
    }
  });

  it("airbnb-story has tip, osebe, ton in variables", () => {
    const p = tourismPrompts.find((x) => x.id === "airbnb-story");
    expect(p?.variables).toEqual(
      expect.arrayContaining(["tip", "osebe", "ton"])
    );
  });

  it("seasonal-campaign has ton and ponudba in variables", () => {
    const p = tourismPrompts.find((x) => x.id === "seasonal-campaign");
    expect(p?.variables).toContain("ton");
    expect(p?.variables).toContain("ponudba");
  });

  it("instagram-travel has ton, lokacija, tip, jezik aligned with prompt", () => {
    const p = tourismPrompts.find((x) => x.id === "instagram-travel");
    expect(p?.variables).toEqual(["ton", "lokacija", "tip", "jezik"]);
    expect(p?.prompt).toContain("{ton}");
    expect(p?.prompt).toContain("{lokacija}");
    expect(p?.prompt).toContain("{tip}");
    expect(p?.prompt).toContain("{jezik}");
  });

  it("booking-description uses {ton} not inline type", () => {
    const p = tourismPrompts.find((x) => x.id === "booking-description");
    expect(p?.prompt).not.toContain("{ton:");
    expect(p?.prompt).toContain("{ton}");
  });
});

describe("substitutePrompt", () => {
  it("replaces {name} with value", () => {
    expect(substitutePrompt("Hello {name}", { name: "Apartma Bela" })).toBe(
      "Hello Apartma Bela"
    );
  });

  it("replaces multiple placeholders", () => {
    expect(
      substitutePrompt("Nastanitev: {name}, {location}", {
        name: "Vila Kolpa",
        location: "Črnomelj",
      })
    ).toBe("Nastanitev: Vila Kolpa, Črnomelj");
  });

  it("missing key yields empty string", () => {
    expect(substitutePrompt("Hello {name}", {})).toBe("Hello ");
    expect(substitutePrompt("{a}{b}", { a: "x" })).toBe("x");
  });

  it("multiple occurrences of same placeholder replaced", () => {
    expect(
      substitutePrompt("{x} and {x}", { x: "test" })
    ).toBe("test and test");
  });

  it("preserves unchanged text", () => {
    const template = "Fixed text with {var} in middle.";
    expect(substitutePrompt(template, { var: "value" })).toBe(
      "Fixed text with value in middle."
    );
  });
});
