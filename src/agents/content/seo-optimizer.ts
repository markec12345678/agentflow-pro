// SEO Optimizer stub
export class SeOOptimizer {
  async optimize(content: string): Promise<string> {
    return content;
  }

  async extractKeywords(content: string): Promise<string[]> {
    return ["keyword1", "keyword2"];
  }
}

export function extractKeywords(content: string): Promise<string[]> {
  const optimizer = new SeOOptimizer();
  return optimizer.extractKeywords(content);
}
