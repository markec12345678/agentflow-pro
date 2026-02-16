/**
 * Deploy Agent tests
 */

jest.mock("../../src/agents/deploy/vercel-client", () => ({
  deployProject: jest.fn(),
  getDeployStatus: jest.fn(),
  rollbackToDeploy: jest.fn(),
  getEnvVars: jest.fn(),
  setEnvVar: jest.fn(),
}));

jest.mock("../../src/agents/deploy/netlify-client", () => ({
  deploySite: jest.fn(),
  getDeployStatus: jest.fn(),
  rollbackToDeploy: jest.fn(),
  getEnvVars: jest.fn(),
  setEnvVar: jest.fn(),
}));

import { createDeployAgent } from "../../src/agents/deploy/DeployAgent";

describe("DeployAgent", () => {
  it("creates agent with correct type and name", () => {
    const agent = createDeployAgent();
    expect(agent.type).toBe("deploy");
    expect(agent.name).toBe("Deploy Agent");
  });

  it("returns structured output for empty input", async () => {
    const agent = createDeployAgent();
    const result = await agent.execute({});
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
    expect(result).toHaveProperty("deployUrl");
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("envVars");
  });
});
