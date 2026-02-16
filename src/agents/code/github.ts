/**
 * AgentFlow Pro - GitHub API client
 * Repo management, branch creation, file ops, PR creation
 */

import { Octokit } from "octokit";

export interface RepoMetadata {
  defaultBranch: string;
  defaultBranchSha: string;
}

export async function getRepo(
  owner: string,
  repo: string,
  token: string
): Promise<RepoMetadata> {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.repos.get({ owner, repo });
  const defaultBranch = data.default_branch ?? "main";
  const ref = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${defaultBranch}`,
  });
  const sha = ref.data.object.sha;
  return { defaultBranch, defaultBranchSha: sha };
}

export async function createBranch(
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

export async function createOrUpdateFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  token: string,
  branch?: string
): Promise<void> {
  const octokit = new Octokit({ auth: token });
  const contentBase64 = Buffer.from(content, "utf-8").toString("base64");

  try {
    const existing = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });
    if ("sha" in existing.data) {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: contentBase64,
        sha: existing.data.sha,
        branch,
      });
      return;
    }
  } catch {
    // File doesn't exist, create it
  }

  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: contentBase64,
    branch,
  });
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
