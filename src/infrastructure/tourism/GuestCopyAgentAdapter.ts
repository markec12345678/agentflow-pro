/**
 * Infrastructure: Adapter for IGuestCopyAgent using lib/tourism/guest-copy-agent
 */

import { runGuestCopyAgent } from "@/lib/tourism/guest-copy-agent";
import type {
  IGuestCopyAgent,
  CopyAgentInput,
  CopyAgentOutput,
} from "@/domain/tourism/ports/copy-agent.port";

export class GuestCopyAgentAdapter implements IGuestCopyAgent {
  async run(input: CopyAgentInput): Promise<CopyAgentOutput> {
    return runGuestCopyAgent({
      question: input.question,
      retrievalContext: input.retrievalContext,
      fallbackFaqAnswer: input.fallbackFaqAnswer,
      policyResult: input.policyResult ?? undefined,
      language: input.language,
      apiKey: input.apiKey,
    });
  }
}
