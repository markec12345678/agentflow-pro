/**
 * Infrastructure: Adapter for IGuestRetrieval using lib/tourism/guest-retrieval
 */

import { retrieveGuestContext } from '@/infrastructure/tourism/GuestRetrievalAdapter';
import type { MemoryBackend } from "@/memory/memory-backend";
import type { IGuestRetrieval, RetrievalContext } from "@/domain/tourism/ports/guest-retrieval.port";

export class GuestRetrievalAdapter implements IGuestRetrieval {
  async retrieve(opts: {
    propertyId?: string;
    guestId?: string;
    userId?: string;
    kgBackend?: unknown;
  }): Promise<RetrievalContext> {
    return retrieveGuestContext({
      propertyId: opts.propertyId,
      guestId: opts.guestId,
      userId: opts.userId,
      kgBackend: opts.kgBackend as MemoryBackend | undefined,
    });
  }
}
