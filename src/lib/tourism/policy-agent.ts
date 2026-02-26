/**
 * AgentFlow Pro - Policy Agent (Roadmap § 2.B.4)
 * Retrieval → Policy → Copy: preverja pravila (odpovedi, doplačila) pred Copy.
 */

export interface PolicyCheckInput {
  question: string;
  reservation?: {
    checkIn: string;
    checkOut: string;
    status: string;
    totalPrice?: number;
  };
  policyRules?: string[];
}

export interface PolicyCheckResult {
  allowed: boolean | null;
  reason: string;
  policyContext: string;
  isPolicyRelevant: boolean;
}

const POLICY_KEYWORDS = [
  "odpoved",
  "cancel",
  "cancellation",
  "preklic",
  "doplačilo",
  "supplement",
  "extra",
  "dodatek",
  "pravilo",
  "policy",
  "pravila",
  "penalty",
  "kazen",
  "refund",
  "povračilo",
  "zastonj",
  "free",
  "brezplačno",
  "fee",
  "pristojbina",
];

function isPolicyRelevantQuestion(question: string): boolean {
  const q = question.toLowerCase();
  return POLICY_KEYWORDS.some((kw) => q.includes(kw.toLowerCase()));
}

/**
 * Default cancellation policy: free 7+ days before checkIn, 50% within 7 days.
 */
function getDefaultCancellationPolicy(): string[] {
  return [
    "Odpišitev brezplačna 7 ali več dni pred prihodom.",
    "Odpoved 3–6 dni pred prihodom: 50 % vrednosti rezervacije.",
    "Odpoved manj kot 3 dni pred prihodom: 100 % vrednosti (brez povračila).",
  ];
}

/**
 * Default supplement policy.
 */
function getDefaultSupplementPolicy(): string[] {
  return [
    "Dodatna postelja: po dogovoru z gostiteljem.",
    "Hišni ljubljenčki: dovoljeni le, če je nastanitev označena kot pet-friendly.",
    "Zgodnji/late check-in: morda dodatna pristojbina po dogovoru.",
  ];
}

/**
 * Policy Agent: checks rules for cancellations and supplements.
 * Returns allowed/restricted + reason for use in Copy agent context.
 */
export function runPolicyAgent(input: PolicyCheckInput): PolicyCheckResult {
  const { question, reservation, policyRules } = input;
  const isRelevant = isPolicyRelevantQuestion(question);

  if (!isRelevant) {
    return {
      allowed: null,
      reason: "",
      policyContext: "",
      isPolicyRelevant: false,
    };
  }

  const rules = policyRules?.length
    ? policyRules
    : [...getDefaultCancellationPolicy(), ...getDefaultSupplementPolicy()];
  const policyContext = rules.join("\n");

  const q = question.toLowerCase();
  const isCancellation = /odpoved|cancel|cancellation|preklic|refund|povračilo/.test(q);
  const isSupplement = /doplačilo|supplement|extra|dodatek|postelja|ljubljenček|fee|pristojbina/.test(q);

  let allowed: boolean | null = null;
  let reason = "";

  if (isCancellation && reservation) {
    const checkIn = new Date(reservation.checkIn);
    const now = new Date();
    const daysUntil = Math.ceil((checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil >= 7) {
      allowed = true;
      reason = "Odpišitev je brezplačna, ker je več kot 7 dni do prihoda.";
    } else if (daysUntil >= 3) {
      allowed = false;
      reason = "Odpoved v tem obdobju pomeni 50 % kazen. Prosimo, kontaktirajte nas za podrobnosti.";
    } else {
      allowed = false;
      reason = "Odpoved manj kot 3 dni pred prihodom pomeni brez povračila. Kontaktirajte nas za izjeme.";
    }
  } else if (isSupplement) {
    allowed = null;
    reason =
      "Dodatki (postelja, živali, zgodnji check-in) so odvisni od nastanitve. Prosimo, kontaktirajte gostitelja za ceno.";
  } else {
    allowed = null;
    reason = "Pravila so na voljo; za specifična vprašanja kontaktirajte gostitelja.";
  }

  return {
    allowed,
    reason,
    policyContext,
    isPolicyRelevant: true,
  };
}
