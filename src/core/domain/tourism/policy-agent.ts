// Policy Agent stub
export class PolicyAgent {
  check(context: any): any {
    return { isPolicyRelevant: false };
  }
}

export async function runPolicyAgent(context: any): Promise<any> {
  const agent = new PolicyAgent();
  return agent.check(context);
}
