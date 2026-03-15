// Communication Agent stub
export class CommunicationAgent {
  async communicate(message: any): Promise<any> {
    return { sent: true };
  }
}

export function createCommunicationAgent(): CommunicationAgent {
  return new CommunicationAgent();
}
