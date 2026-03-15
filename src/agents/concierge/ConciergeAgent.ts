// Concierge Agent stub
export class ConciergeAgent {
  async process(request: any): Promise<any> {
    return { success: true, message: "Concierge service available" };
  }
}

export function createConciergeAgent(): ConciergeAgent {
  return new ConciergeAgent();
}
