// Research Agent stub
export class ResearchAgent {
  async research(query: string): Promise<any> {
    return { results: [] };
  }
}

export function createResearchAgent(): ResearchAgent {
  return new ResearchAgent();
}
