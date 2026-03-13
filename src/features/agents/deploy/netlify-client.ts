/**
 * AgentFlow Pro - Netlify deploy client
 * REST API: deploySite, getDeployStatus, rollbackToDeploy, env management
 */

const NETLIFY_API = "https://api.netlify.com/api/v1";

export interface NetlifyDeployStatus {
  id: string;
  url?: string;
  state: string;
}

async function netlifyFetch(
  path: string,
  token: string,
  opts?: RequestInit
) {
  const res = await fetch(`${NETLIFY_API}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...opts?.headers,
    },
  });
  if (!res.ok) throw new Error(`Netlify API ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function deploySite(
  siteId: string,
  _deployDirectory: string,
  token: string
): Promise<NetlifyDeployStatus> {
  const result = (await netlifyFetch(
    `/sites/${encodeURIComponent(siteId)}/builds`,
    token,
    { method: "POST", body: "{}" }
  )) as { id?: string; deploy_url?: string; state?: string };
  return {
    id: result.id ?? "",
    url: result.deploy_url,
    state: result.state ?? "building",
  };
}

export async function getDeployStatus(
  siteId: string,
  deployId: string,
  token: string
): Promise<NetlifyDeployStatus> {
  const result = (await netlifyFetch(
    `/sites/${encodeURIComponent(siteId)}/deploys/${encodeURIComponent(deployId)}`,
    token
  )) as { id?: string; deploy_url?: string; state?: string };
  return {
    id: result.id ?? deployId,
    url: result.deploy_url,
    state: result.state ?? "unknown",
  };
}

export async function rollbackToDeploy(
  siteId: string,
  deployId: string,
  token: string
): Promise<void> {
  await netlifyFetch(
    `/sites/${encodeURIComponent(siteId)}/deploys/${encodeURIComponent(deployId)}/restore`,
    token,
    { method: "POST" }
  );
}

export async function getEnvVars(
  siteId: string,
  token: string
): Promise<Record<string, string>> {
  const data = (await netlifyFetch(
    `/sites/${encodeURIComponent(siteId)}/env`,
    token
  )) as Array<{ key?: string; value?: string }>;
  const out: Record<string, string> = {};
  for (const e of Array.isArray(data) ? data : []) {
    if (e.key && e.value) out[e.key] = e.value;
  }
  return out;
}

export async function setEnvVar(
  siteId: string,
  key: string,
  value: string,
  token: string
): Promise<void> {
  await netlifyFetch(
    `/sites/${encodeURIComponent(siteId)}/env`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ key, value }),
    }
  );
}
