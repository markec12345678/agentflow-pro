/**
 * AgentFlow Pro - Deploy Agent
 * Vercel + Netlify deployment, env management, rollback, status
 */

import type { Agent } from "../../orchestrator/Orchestrator";
import * as vercel from "./vercel-client";
import * as netlify from "./netlify-client";

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
      const projId = projectId ?? siteId;

      try {
        if (platform === "vercel" && vercelToken && projId) {
          if (action === "deploy") {
            const r = await vercel.deployProject(projId, deployDirectory, vercelToken);
            output.deployUrl = r.url;
            output.status = r.state;
          } else if (action === "status" && deployId) {
            const r = await vercel.getDeployStatus(deployId, vercelToken);
            output.deployUrl = r.url;
            output.status = r.state;
          } else if (action === "rollback" && deployId && projId) {
            await vercel.rollbackToDeploy(projId, deployId, vercelToken);
            output.previousDeploy = deployId;
          } else if (action === "env") {
            output.envVars = await vercel.getEnvVars(projId, vercelToken);
            if (envKey && envValue) {
              await vercel.setEnvVar(projId, envKey, envValue, vercelToken);
              output.envVars = await vercel.getEnvVars(projId, vercelToken);
            }
          }
        } else if (platform === "netlify" && netlifyToken && siteId) {
          if (action === "deploy") {
            const r = await netlify.deploySite(siteId, deployDirectory, netlifyToken);
            output.deployUrl = r.url;
            output.status = r.state;
          } else if (action === "status" && deployId) {
            const r = await netlify.getDeployStatus(siteId, deployId, netlifyToken);
            output.deployUrl = r.url;
            output.status = r.state;
          } else if (action === "rollback" && deployId) {
            await netlify.rollbackToDeploy(siteId, deployId, netlifyToken);
            output.previousDeploy = deployId;
          } else if (action === "env") {
            output.envVars = await netlify.getEnvVars(siteId, netlifyToken);
            if (envKey && envValue) {
              await netlify.setEnvVar(siteId, envKey, envValue, netlifyToken);
              output.envVars = await netlify.getEnvVars(siteId, netlifyToken);
            }
          }
        }
      } catch (err) {
        output.error = err instanceof Error ? err.message : String(err);
      }

      return output;
    },
  };
}
