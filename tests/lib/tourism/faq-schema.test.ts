import {
  generateFaqSchema,
  generateFaqSchemaString,
  type FaqEntry,
} from "@/lib/tourism/faq-schema";

describe("faq-schema", () => {
  const sampleFaqs: FaqEntry[] = [
    { question: "Q1?", answer: "A1", category: "cat1" },
    { question: "Q2?", answer: "A2" },
  ];

  it("generateFaqSchema returns FAQPage schema object", () => {
    const schema = generateFaqSchema(sampleFaqs);
    expect(schema).toHaveProperty("@context", "https://schema.org");
    expect(schema).toHaveProperty("@type", "FAQPage");
    expect(schema).toHaveProperty("mainEntity");
    expect((schema as { mainEntity: unknown[] }).mainEntity).toHaveLength(2);
  });

  it("generateFaqSchema maps each FAQ to Question schema", () => {
    const schema = generateFaqSchema(sampleFaqs);
    const main = (schema as { mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }> })
      .mainEntity;
    expect(main[0]).toEqual({
      "@type": "Question",
      name: "Q1?",
      acceptedAnswer: { "@type": "Answer", text: "A1" },
    });
    expect(main[1].name).toBe("Q2?");
    expect(main[1].acceptedAnswer.text).toBe("A2");
  });

  it("generateFaqSchemaString returns JSON string", () => {
    const str = generateFaqSchemaString(sampleFaqs);
    expect(typeof str).toBe("string");
    const parsed = JSON.parse(str);
    expect(parsed["@type"]).toBe("FAQPage");
    expect(parsed.mainEntity).toHaveLength(2);
  });

  it("generateFaqSchema handles empty array", () => {
    const schema = generateFaqSchema([]);
    expect((schema as { mainEntity: unknown[] }).mainEntity).toEqual([]);
  });
});
