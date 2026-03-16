/**
 * AgentFlow Pro - GitHub client (MCP-style API via Octokit)
 * getFileContents, pushFiles, createPullRequest
 */

import { Octokit } from "octokit";

export async function getFileContents(
  owner: string,
  repo: string,
  path: string,
  token: string,
  branch?: string
): Promise<string> {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
    ref: branch,
  });
  if (Array.isArray(data)) {
    throw new Error(`Path ${path} is a directory, not a file`);
  }
  if ("content" in data && typeof data.content === "string") {
    return Buffer.from(data.content, "base64").toString("utf-8");
  }
  throw new Error(`Could not read content from ${path}`);
}

export interface FileToPush {
  path: string;
  content: string;
}

export async function pushFiles(
  owner: string,
  repo: string,
  branch: string,
  files: FileToPush[],
  message: string,
  token: string
): Promise<void> {
  const octokit = new Octokit({ auth: token });
  const { defaultBranchSha } = await getDefaultBranchSha(
    owner,
    repo,
    token
  );

  try {
    await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
  } catch {
    await createBranchFromSha(owner, repo, branch, defaultBranchSha, token);
  }

  for (const file of files) {
    const contentBase64 = Buffer.from(file.content, "utf-8").toString("base64");
    try {
      const existing = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: file.path,
        ref: branch,
      });
      if (!Array.isArray(existing.data) && "sha" in existing.data) {
        await octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: file.path,
          message,
          content: contentBase64,
          sha: existing.data.sha,
          branch,
        });
      } else {
        await octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: file.path,
          message,
          content: contentBase64,
          branch,
        });
      }
    } catch {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: file.path,
        message,
        content: contentBase64,
        branch,
      });
    }
  }
}

export interface PullRequestResult {
  url: string;
  number: number;
}

export async function createPullRequest(
  owner: string,
  repo: string,
  head: string,
  base: string,
  title: string,
  body: string,
  token: string
): Promise<PullRequestResult> {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.pulls.create({
    owner,
    repo,
    head,
    base,
    title,
    body,
  });
  return { url: data.html_url ?? data.url ?? "", number: data.number };
}

export async function getDefaultBranchSha(
  owner: string,
  repo: string,
  token: string
): Promise<{ defaultBranch: string; defaultBranchSha: string }> {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.repos.get({ owner, repo });
  const defaultBranch = data.default_branch ?? "main";
  const ref = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${defaultBranch}`,
  });
  return { defaultBranch, defaultBranchSha: ref.data.object.sha };
}

async function createBranchFromSha(
  owner: string,
  repo: string,
  branch: string,
  fromSha: string,
  token: string
): Promise<void> {
  const octokit = new Octokit({ auth: token });
  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branch}`,
    sha: fromSha,
  });
}
