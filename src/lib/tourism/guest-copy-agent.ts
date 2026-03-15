// Guest Copy Agent stub
export class GuestCopyAgent {
  async copy(request: any): Promise<any> {
    return { answer: "Copied from policy" };
  }
}

export async function runGuestCopyAgent(request: any): Promise<any> {
  const agent = new GuestCopyAgent();
  return agent.copy(request);
}
