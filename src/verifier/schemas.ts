/**
 * AgentFlow Pro - Verifier schemas per agent type
 * Minimal validation: required fields, types
 */

export type AgentType = "research" | "content" | "code" | "deploy";

function isObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function isObjectArray(v: unknown): v is Record<string, unknown>[] {
  return Array.isArray(v) && v.every((x) => isObject(x));
}

export function validateResearchOutput(output: unknown): string[] {
  const errors: string[] = [];
  if (!isObject(output)) {
    errors.push("Output must be an object");
    return errors;
  }
  if (!("urls" in output) || !isStringArray(output.urls)) {
    errors.push("Research output must have urls: string[]");
  }
  if (!("scrapedData" in output) || !isObjectArray(output.scrapedData)) {
    errors.push("Research output must have scrapedData: array");
  }
  if (!("searchResults" in output) || !isObjectArray(output.searchResults)) {
    errors.push("Research output must have searchResults: array");
  }
  return errors;
}

export function validateContentOutput(output: unknown): string[] {
  const errors: string[] = [];
  if (!isObject(output)) {
    errors.push("Output must be an object");
    return errors;
  }
  const hasBlog = "blog" in output && typeof output.blog === "string";
  const hasSocial = "social" in output && typeof output.social === "string";
  const hasEmail = "email" in output && typeof output.email === "string";
  const hasKeywords = "keywords" in output && Array.isArray(output.keywords);
  if (!hasBlog && !hasSocial && !hasEmail && !hasKeywords) {
    errors.push("Content output must have at least one of: blog, social, email, keywords");
  }
  return errors;
}

export function validateCodeOutput(output: unknown): string[] {
  const errors: string[] = [];
  if (!isObject(output)) {
    errors.push("Output must be an object");
    return errors;
  }
  const hasFiles = "files" in output && Array.isArray(output.files);
  const hasSuggestions = "suggestions" in output && Array.isArray(output.suggestions);
  const hasPr = "pullRequest" in output && isObject(output.pullRequest);
  if (!hasFiles && !hasSuggestions && !hasPr) {
    errors.push("Code output must have at least one of: files, suggestions, pullRequest");
  }
  return errors;
}

export function validateDeployOutput(output: unknown): string[] {
  const errors: string[] = [];
  if (!isObject(output)) {
    errors.push("Output must be an object");
    return errors;
  }
  const hasDeployUrl = "deployUrl" in output && typeof output.deployUrl === "string";
  const hasStatus = "status" in output && typeof output.status === "string";
  const hasEnvVars = "envVars" in output && isObject(output.envVars);
  const hasError = "error" in output && typeof output.error === "string";
  if (!hasDeployUrl && !hasStatus && !hasEnvVars && !hasError) {
    errors.push("Deploy output must have at least one of: deployUrl, status, envVars, error");
  }
  return errors;
}
