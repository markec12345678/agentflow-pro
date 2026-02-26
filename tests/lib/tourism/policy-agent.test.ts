import { runPolicyAgent } from "@/lib/tourism/policy-agent";

describe("runPolicyAgent", () => {
  it("returns isPolicyRelevant false for unrelated questions", () => {
    const result = runPolicyAgent({ question: "What time is check-in?" });
    expect(result.isPolicyRelevant).toBe(false);
    expect(result.policyContext).toBe("");
    expect(result.reason).toBe("");
  });

  it("returns isPolicyRelevant true for cancellation keywords", () => {
    const result = runPolicyAgent({
      question: "Can I cancel my reservation?",
    });
    expect(result.isPolicyRelevant).toBe(true);
    expect(result.policyContext.length).toBeGreaterThan(0);
  });

  it("returns isPolicyRelevant true for supplement keywords", () => {
    const result = runPolicyAgent({
      question: "Is there an extra fee for early check-in?",
    });
    expect(result.isPolicyRelevant).toBe(true);
    expect(result.reason).toContain("Dodatki");
  });

  it("returns free cancellation when 7+ days before checkIn", () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 10);
    const result = runPolicyAgent({
      question: "Odpoved rezervacije",
      reservation: {
        checkIn: checkIn.toISOString(),
        checkOut: new Date(checkIn.getTime() + 86400000 * 2).toISOString(),
        status: "confirmed",
      },
    });
    expect(result.isPolicyRelevant).toBe(true);
    expect(result.allowed).toBe(true);
    expect(result.reason).toContain("brezplačna");
  });

  it("returns 50% penalty when 3-6 days before checkIn", () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 5);
    const result = runPolicyAgent({
      question: "cancel booking",
      reservation: {
        checkIn: checkIn.toISOString(),
        checkOut: new Date(checkIn.getTime() + 86400000 * 2).toISOString(),
        status: "confirmed",
      },
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("50");
  });

  it("returns no refund when less than 3 days before checkIn", () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 1);
    const result = runPolicyAgent({
      question: "preklic",
      reservation: {
        checkIn: checkIn.toISOString(),
        checkOut: new Date(checkIn.getTime() + 86400000 * 2).toISOString(),
        status: "confirmed",
      },
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("brez povračila");
  });

  it("uses custom policyRules when provided", () => {
    const result = runPolicyAgent({
      question: "pravila odpovedi",
      policyRules: ["Custom rule 1", "Custom rule 2"],
    });
    expect(result.isPolicyRelevant).toBe(true);
    expect(result.policyContext).toContain("Custom rule 1");
    expect(result.policyContext).toContain("Custom rule 2");
  });
});
