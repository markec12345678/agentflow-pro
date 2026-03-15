// Content Agent stub
export class ContentAgent {
  async generate(prompt: string): Promise<any> {
    return { content: "Generated content" };
  }
}

export function createContentAgent(): ContentAgent {
  return new ContentAgent();
}
