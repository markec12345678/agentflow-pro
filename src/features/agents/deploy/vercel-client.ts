/**
 * AgentFlow Pro - Vercel deploy client
 * REST API: deployProject, getDeployStatus, rollbackToDeploy, env management
 */

const VERCEL_API = "https://api.vercel.com";

export interface DeployStatus {
  id: string;
  url?: string;
  state: string;
  readyState?: string;
}

async function vercelFetch(path: string, token: string, opts?: RequestInit) {
  const res = await fetch(`${VERCEL_API}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...opts?.headers,
    },
  });
  if (!res.ok) throw new Error(`Vercel API ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function deployProject(
  projectId: string,
  _deployDirectory: string,
  token: string
): Promise<DeployStatus> {
  const result = (await vercelFetch(
    "/v13/deployments",
    token,
    {
      method: "POST",
      body: JSON.stringify({
        name: projectId,
        project: projectId,
        target: "production",
      }),
    }
  )) as { id?: string; url?: string; readyState?: string; status?: string };
  return {
    id: result.id ?? "",
    url: result.url,
    state: result.readyState ?? result.status ?? "UNKNOWN",
    readyState: result.readyState,
  };
}

export async function getDeployStatus(
  deployId: string,
  token: string
): Promise<DeployStatus> {
  const result = (await vercelFetch(
    `/v13/deployments/${encodeURIComponent(deployId)}`,
    token
  )) as { id?: string; url?: string; readyState?: string; status?: string };
  return {
    id: result.id ?? deployId,
    url: result.url,
    state: result.readyState ?? result.status ?? "UNKNOWN",
    readyState: result.readyState,
  };
}

export async function rollbackToDeploy(
  projectId: string,
  deployId: string,
  token: string
): Promise<void> {
  await vercelFetch(
    `/v10/projects/${encodeURIComponent(projectId)}/deployments/${encodeURIComponent(deployId)}/promote`,
    token,
    { method: "POST" }
  );
}

export async function getEnvVars(
  projectId: string,
  token: string
): Promise<Record<string, string>> {
  const data = (await vercelFetch(
    `/v9/projects/${encodeURIComponent(projectId)}/env`,
    token
  )) as { envs?: Array<{ key?: string; value?: string }> };
  const out: Record<string, string> = {};
  for (const e of data.envs ?? []) {
    if (e.key && e.value) out[e.key] = e.value;
  }
  return out;
}

export async function setEnvVar(
  projectId: string,
  key: string,
  value: string,
  token: string
): Promise<void> {
  await vercelFetch(
    `/v10/projects/${encodeURIComponent(projectId)}/env`,
    token,
    {
      method: "POST",
      body: JSON.stringify({
        key,
        value,
        type: "plain",
        target: ["production", "preview", "development"],
      }),
    }
  );
}
