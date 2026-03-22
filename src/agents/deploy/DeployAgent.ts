/**
 * AgentFlow Pro - Deploy Agent
 * Vercel + Netlify deployment, env management, rollback via deploy-manager
 */

import type { Agent } from "../../orchestrator/Orchestrator";
import { isMockMode } from "@/lib/mock-mode";
import {
  executeDeploy,
  getDeployStatus,
  executeRollback,
  manageEnv,
} from "./deploy-manager";

export interface DeployInput {
  platform?: "vercel" | "netlify";
  siteId?: string;
  projectId?: string;
  deployDirectory?: string;
  deployId?: string;
  action?: "deploy" | "status" | "rollback" | "env";
  envKey?: string;
  envValue?: string;
}

export interface DeployOutput {
  deployUrl?: string;
  status?: string;
  previousDeploy?: string;
  envVars?: Record<string, string>;
  error?: string;
}

export function createDeployAgent(config?: {
  vercelToken?: string;
  netlifyToken?: string;
}): Agent {
  const vercelToken = config?.vercelToken ?? process.env.VERCEL_TOKEN ?? "";
  const netlifyToken = config?.netlifyToken ?? process.env.NETLIFY_TOKEN ?? "";
  const tokens = { vercelToken, netlifyToken };

  return {
    id: "deploy-agent",
    type: "deploy",
    name: "Deploy Agent",
    execute: async (input: unknown): Promise<DeployOutput> => {
      const {
        platform = "vercel",
        siteId,
        projectId,
        deployDirectory = ".",
        deployId,
        action = "status",
        envKey,
        envValue,
      } = (input as DeployInput) ?? {};

      const output: DeployOutput = {
        deployUrl: undefined,
        status: undefined,
        envVars: undefined,
      };

      if (isMockMode()) {
        return {
          deployUrl: "https://mock-deploy.vercel.app",
          status: "ready",
          envVars: { MOCK: "true" },
        };
      }

      const hasToken =
        (platform === "vercel" && vercelToken && (projectId ?? siteId)) ||
        (platform === "netlify" && netlifyToken && siteId);
      if (!hasToken) return output;

      const params = {
        siteId,
        projectId,
        deployDirectory,
        deployId,
        envKey,
        envValue,
      };

      try {
        if (action === "deploy") {
          const r = await executeDeploy(platform, params, tokens);
          output.deployUrl = r.deployUrl;
          output.status = r.state;
        } else if (action === "status" && deployId) {
          const r = await getDeployStatus(platform, params, tokens);
          output.deployUrl = r.deployUrl;
          output.status = r.state;
        } else if (action === "rollback" && deployId) {
          const r = await executeRollback(platform, params, tokens);
          output.previousDeploy = r.previousDeploy;
          output.status = r.state;
        } else if (action === "env") {
          const r = await manageEnv(platform, params, tokens);
          output.envVars = r.envVars;
          output.status = r.state;
        }
      } catch (err) {
        output.error = err instanceof Error ? err.message : String(err);
      }

      return output;
    },
  };
}
