/**
 * AgentFlow Pro - Deploy Manager
 * Orchestration + status tracking for Vercel and Netlify
 */

import * as vercel from "./vercel-client";
import * as netlify from "./netlify-client";

export type DeployPlatform = "vercel" | "netlify";

export interface DeployManagerParams {
  siteId?: string;
  projectId?: string;
  deployDirectory?: string;
  deployId?: string;
  envKey?: string;
  envValue?: string;
}

export interface DeployManagerResult {
  deployUrl?: string;
  deployId?: string;
  state: string;
  previousDeploy?: string;
  envVars?: Record<string, string>;
}

export interface DeployManagerTokens {
  vercelToken: string;
  netlifyToken: string;
}

export interface TrackDeployOptions {
  maxAttempts?: number;
  intervalMs?: number;
}

const DEFAULT_TRACK_OPTS: Required<TrackDeployOptions> = {
  maxAttempts: 30,
  intervalMs: 5000,
};

export async function executeDeploy(
  platform: DeployPlatform,
  params: DeployManagerParams,
  tokens: DeployManagerTokens
): Promise<DeployManagerResult> {
  const dir = params.deployDirectory ?? ".";

  if (platform === "vercel") {
    const projId = params.projectId ?? params.siteId;
    if (!projId || !tokens.vercelToken) throw new Error("Missing projectId and vercelToken");
    const r = await vercel.deployProject(projId, dir, tokens.vercelToken);
    return { deployUrl: r.url, deployId: r.id, state: r.state };
  }

  if (platform === "netlify") {
    if (!params.siteId || !tokens.netlifyToken) throw new Error("Missing siteId and netlifyToken");
    const r = await netlify.deploySite(params.siteId, dir, tokens.netlifyToken);
    return { deployUrl: r.url, deployId: r.id, state: r.state };
  }

  throw new Error(`Unknown platform: ${platform}`);
}

export async function getDeployStatus(
  platform: DeployPlatform,
  params: DeployManagerParams,
  tokens: DeployManagerTokens
): Promise<DeployManagerResult> {
  const deployId = params.deployId;
  if (!deployId) throw new Error("Missing deployId");

  if (platform === "vercel") {
    if (!tokens.vercelToken) throw new Error("Missing vercelToken");
    const r = await vercel.getDeployStatus(deployId, tokens.vercelToken);
    return { deployUrl: r.url, deployId: r.id, state: r.state };
  }

  if (platform === "netlify") {
    if (!params.siteId || !tokens.netlifyToken) throw new Error("Missing siteId and netlifyToken");
    const r = await netlify.getDeployStatus(params.siteId, deployId, tokens.netlifyToken);
    return { deployUrl: r.url, deployId: r.id, state: r.state };
  }

  throw new Error(`Unknown platform: ${platform}`);
}

export async function executeRollback(
  platform: DeployPlatform,
  params: DeployManagerParams,
  tokens: DeployManagerTokens
): Promise<DeployManagerResult> {
  const deployId = params.deployId;
  if (!deployId) throw new Error("Missing deployId");

  if (platform === "vercel") {
    const projId = params.projectId ?? params.siteId;
    if (!projId || !tokens.vercelToken) throw new Error("Missing projectId and vercelToken");
    await vercel.rollbackToDeploy(projId, deployId, tokens.vercelToken);
    return { state: "rolled_back", previousDeploy: deployId };
  }

  if (platform === "netlify") {
    if (!params.siteId || !tokens.netlifyToken) throw new Error("Missing siteId and netlifyToken");
    await netlify.rollbackToDeploy(params.siteId, deployId, tokens.netlifyToken);
    return { state: "rolled_back", previousDeploy: deployId };
  }

  throw new Error(`Unknown platform: ${platform}`);
}

export async function manageEnv(
  platform: DeployPlatform,
  params: DeployManagerParams,
  tokens: DeployManagerTokens
): Promise<DeployManagerResult> {
  const projId = params.projectId ?? params.siteId;
  if (!projId) throw new Error("Missing projectId or siteId");

  if (platform === "vercel") {
    if (!tokens.vercelToken) throw new Error("Missing vercelToken");
    let envVars = await vercel.getEnvVars(projId, tokens.vercelToken);
    if (params.envKey && params.envValue) {
      await vercel.setEnvVar(projId, params.envKey, params.envValue, tokens.vercelToken);
      envVars = await vercel.getEnvVars(projId, tokens.vercelToken);
    }
    return { state: "ok", envVars };
  }

  if (platform === "netlify") {
    if (!params.siteId || !tokens.netlifyToken) throw new Error("Missing siteId and netlifyToken");
    let envVars = await netlify.getEnvVars(params.siteId, tokens.netlifyToken);
    if (params.envKey && params.envValue) {
      await netlify.setEnvVar(params.siteId, params.envKey, params.envValue, tokens.netlifyToken);
      envVars = await netlify.getEnvVars(params.siteId, tokens.netlifyToken);
    }
    return { state: "ok", envVars };
  }

  throw new Error(`Unknown platform: ${platform}`);
}

export async function trackDeployStatus(
  deployId: string,
  platform: DeployPlatform,
  siteIdOrProjectId: string,
  tokens: DeployManagerTokens,
  options?: TrackDeployOptions
): Promise<DeployManagerResult> {
  const opts = { ...DEFAULT_TRACK_OPTS, ...options };
  const params: DeployManagerParams = {
    deployId,
    projectId: platform === "vercel" ? siteIdOrProjectId : undefined,
    siteId: platform === "netlify" ? siteIdOrProjectId : undefined,
  };

  for (let i = 0; i < opts.maxAttempts; i++) {
    const result = await getDeployStatus(platform, params, tokens);
    const done = ["READY", "ready", "published", "ERROR", "error", "canceled", "failed"].includes(
      result.state
    );
    if (done) return result;
    await new Promise((r) => setTimeout(r, opts.intervalMs));
  }

  const last = await getDeployStatus(platform, params, tokens);
  return { ...last, state: last.state + " (timeout)" };
}
