// Code Agent stub
export class CodeAgent {
  async code(prompt: string): Promise<any> {
    return { code: "// Generated code" };
  }
}

export function createCodeAgent(): CodeAgent {
  return new CodeAgent();
}
