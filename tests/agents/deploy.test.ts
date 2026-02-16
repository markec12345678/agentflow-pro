/**
 * Deploy Agent tests
 */

jest.mock("../../src/agents/deploy/deploy-manager", () => ({
  executeDeploy: jest.fn(),
  getDeployStatus: jest.fn(),
  executeRollback: jest.fn(),
  manageEnv: jest.fn(),
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
