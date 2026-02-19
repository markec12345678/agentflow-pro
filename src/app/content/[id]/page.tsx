"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";

interface Post {
  id: string;
  title: string | null;
  topic: string | null;
  fullContent: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  imageUrl: string | null;
  pipelineStage?: string | null;
  brief?: string | null;
  reviewedAt?: string | null;
  guardrailIssues?: string[] | null;
  approvalStatus?: string | null;
  approvedBy?: string | null;
  canApprove?: boolean;
  isOwner?: boolean;
  createdAt: string;
}

export default function ContentDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const shouldOpenPublish = searchParams.get("publish") === "1";
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishModal, setPublishModal] = useState(false);
  const [publishPlatform, setPublishPlatform] = useState<
    "wordpress" | "medium" | "linkedin" | "twitter"
  >("wordpress");
  const [wpSiteUrl, setWpSiteUrl] = useState("");
  const [wpUsername, setWpUsername] = useState("");
  const [wpAppPassword, setWpAppPassword] = useState("");
  const [mediumToken, setMediumToken] = useState("");
  const [linkedinToken, setLinkedinToken] = useState("");
  const [twitterAccessToken, setTwitterAccessToken] = useState("");
  const [twitterAccessSecret, setTwitterAccessSecret] = useState("");
  const [twitterApiKey, setTwitterApiKey] = useState("");
  const [twitterApiSecret, setTwitterApiSecret] = useState("");
  const [publishConnections, setPublishConnections] = useState<{ linkedin: boolean; twitter: boolean }>({ linkedin: false, twitter: false });
  const [publishStatus, setPublishStatus] = useState<"draft" | "publish">("draft");
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<{ postUrl?: string } | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [optimizeModalOpen, setOptimizeModalOpen] = useState(false);
  const [optimizeLoading, setOptimizeLoading] = useState(false);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [optimizeResult, setOptimizeResult] = useState<{
    keywords: string[];
    metaTitle: string;
    metaDescription: string;
    headlineSuggestions: string[];
    internalLinkSuggestions: string[];
    geoHints?: { faqSuggestions: string[]; featuredSnippetHints: string[]; conversionPatterns: string[] };
    aeoHints?: { faqSuggestions: string[]; featuredSnippetHints: string[]; conversionPatterns: string[] };
  } | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editSelection, setEditSelection] = useState<{ start: number; end: number } | null>(null);
  const [inlineEditLoading, setInlineEditLoading] = useState(false);
  const [inlineEditError, setInlineEditError] = useState<string | null>(null);
  const [saveContentLoading, setSaveContentLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);

  const handlePublish = async () => {
    if (!post) return;
    setPublishLoading(true);
    setPublishError(null);
    setPublishSuccess(null);
    try {
      const credentials: Record<string, unknown> = {};
      if (publishPlatform === "wordpress") {
        if (!wpSiteUrl.trim() || !wpUsername.trim() || !wpAppPassword.trim()) {
          setPublishError("Site URL, username, and Application Password are required");
          setPublishLoading(false);
          return;
        }
        credentials.wordpress = {
          siteUrl: wpSiteUrl.trim(),
          username: wpUsername.trim(),
          appPassword: wpAppPassword.trim(),
        };
      } else if (publishPlatform === "medium") {
        if (!mediumToken.trim()) {
          setPublishError("Medium integration token is required");
          setPublishLoading(false);
          return;
        }
        credentials.medium = { token: mediumToken.trim() };
      } else if (publishPlatform === "linkedin") {
        if (!publishConnections.linkedin && !linkedinToken.trim()) {
          setPublishError("Connect LinkedIn in Settings or paste access token");
          setPublishLoading(false);
          return;
        }
        if (linkedinToken.trim()) {
          credentials.linkedin = { accessToken: linkedinToken.trim() };
        }
      } else if (publishPlatform === "twitter") {
        if (!publishConnections.twitter) {
          if (!twitterAccessToken.trim() || !twitterAccessSecret.trim()) {
            setPublishError("Connect Twitter in Settings or add access token and secret");
            setPublishLoading(false);
            return;
          }
          credentials.twitter = {
            accessToken: twitterAccessToken.trim(),
            accessTokenSecret: twitterAccessSecret.trim(),
            ...(twitterApiKey.trim() && { apiKey: twitterApiKey.trim() }),
            ...(twitterApiSecret.trim() && { apiSecret: twitterApiSecret.trim() }),
          };
        }
      }

      const res = await fetch("/api/content/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          platform: publishPlatform,
          credentials,
          status: publishStatus,
        }),
      });
      const data = (await res.json()) as { error?: string; postUrl?: string };

      if (!res.ok) {
        setPublishError(data.error ?? "Publish failed");
        setPublishLoading(false);
        return;
      }

      setPublishSuccess({ postUrl: data.postUrl });
      setPost((p) => (p ? { ...p, pipelineStage: "published" } : p));
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setPublishLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetch(`/api/content/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setPost(data);
        setEditContent(data.fullContent ?? "");
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (post?.fullContent !== undefined && editContent === "" && post.fullContent) {
      setEditContent(post.fullContent);
    }
  }, [post?.fullContent, editContent]);

  useEffect(() => {
    if (post && shouldOpenPublish) {
      setPublishModal(true);
      router.replace(`/content/${id}`);
    }
  }, [post, shouldOpenPublish, router, id]);

  useEffect(() => {
    if (publishModal) {
      fetch("/api/auth/connections")
        .then((r) => r.json())
        .then((data) => {
          if (!data.error) setPublishConnections({ linkedin: data.linkedin, twitter: data.twitter });
        })
        .catch(() => { });
    }
  }, [publishModal]);

  useEffect(() => {
    if (post && imageModalOpen) {
      const base = [post.title, post.topic].filter(Boolean).join(" – ");
      setImagePrompt(base || "Professional blog illustration");
    }
  }, [post, imageModalOpen]);

  const handleOptimize = async () => {
    if (!post) return;
    setOptimizeLoading(true);
    setOptimizeError(null);
    setOptimizeResult(null);
    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: post.topic ?? post.title ?? "",
          content: post.fullContent ?? undefined,
          postId: post.id,
        }),
      });
      const data = (await res.json()) as {
        keywords?: string[];
        metaTitle?: string;
        metaDescription?: string;
        headlineSuggestions?: string[];
        internalLinkSuggestions?: string[];
        geoHints?: { faqSuggestions: string[]; featuredSnippetHints: string[]; conversionPatterns: string[] };
        aeoHints?: { faqSuggestions: string[]; featuredSnippetHints: string[]; conversionPatterns: string[] };
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Optimization failed");
      setOptimizeResult({
        keywords: data.keywords ?? [],
        metaTitle: data.metaTitle ?? "",
        metaDescription: data.metaDescription ?? "",
        headlineSuggestions: data.headlineSuggestions ?? [],
        internalLinkSuggestions: data.internalLinkSuggestions ?? [],
        geoHints: data.geoHints,
        aeoHints: data.aeoHints,
      });
    } catch (e) {
      setOptimizeError(e instanceof Error ? e.message : "Optimization failed");
    } finally {
      setOptimizeLoading(false);
    }
  };

  const handleApplyOptimize = async () => {
    if (!post || !optimizeResult) return;
    try {
      const res = await fetch(`/api/content/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metaTitle: optimizeResult.metaTitle,
          metaDescription: optimizeResult.metaDescription,
        }),
      });
      if (res.ok) {
        setPost((p) =>
          p
            ? {
              ...p,
              metaTitle: optimizeResult.metaTitle,
              metaDescription: optimizeResult.metaDescription,
            }
            : p
        );
        setOptimizeModalOpen(false);
        setOptimizeResult(null);
      }
    } catch {
      setOptimizeError("Failed to save");
    }
  };

  const handleInlineEdit = async (action: "improve" | "expand" | "shorten") => {
    if (!post) return;
    const textToEdit = editSelection
      ? editContent.slice(editSelection.start, editSelection.end)
      : editContent;
    if (!textToEdit.trim()) {
      setInlineEditError("Select text or ensure content is not empty");
      return;
    }
    setInlineEditLoading(true);
    setInlineEditError(null);
    try {
      const res = await fetch("/api/content/edit-inline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToEdit, action }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Edit failed");
      const newText = data.text ?? textToEdit;
      let updatedContent: string;
      if (editSelection) {
        updatedContent =
          editContent.slice(0, editSelection.start) +
          newText +
          editContent.slice(editSelection.end);
      } else {
        updatedContent = newText;
      }
      setEditContent(updatedContent);
      setEditSelection(null);
      const patchRes = await fetch(`/api/content/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullContent: updatedContent }),
      });
      if (patchRes.ok) {
        setPost((p) => (p ? { ...p, fullContent: updatedContent } : p));
      }
    } catch (e) {
      setInlineEditError(e instanceof Error ? e.message : "Edit failed");
    } finally {
      setInlineEditLoading(false);
    }
  };

  const handleSaveContent = async () => {
    if (!post) return;
    setSaveContentLoading(true);
    try {
      const patchRes = await fetch(`/api/content/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullContent: editContent }),
      });
      if (patchRes.ok) {
        setPost((p) => (p ? { ...p, fullContent: editContent } : p));
      }
    } finally {
      setSaveContentLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!post) return;
    setImageLoading(true);
    setImageError(null);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt, postId: post.id }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Image generation failed");
      if (data.url) {
        setPost((p) => (p ? { ...p, imageUrl: data.url! } : p));
        setImageModalOpen(false);
      }
    } catch (e) {
      setImageError(e instanceof Error ? e.message : "Image generation failed");
    } finally {
      setImageLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <p className="text-center text-gray-600 dark:text-gray-400">Loading...</p>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Post not found.</p>
          <Link href="/content" className="text-blue-600 hover:underline">
            Back to My Content
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-3xl mx-auto">
        {(post.pipelineStage || post.approvalStatus) && (
          <div className="mb-6 rounded-lg bg-gray-100 dark:bg-gray-700 px-4 py-3 flex items-center justify-between">
            {post.approvalStatus === "approved" && (
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">Approved</span>
            )}
            {post.approvalStatus === "rejected" && (
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">Rejected</span>
            )}
            {post.pipelineStage && (
              <span className="text-sm font-medium dark:text-white">
                Stage:{" "}
                <span className="capitalize">{post.pipelineStage}</span>
              </span>
            )}
            <div className="flex gap-2">
              {post.pipelineStage === "draft" && (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await fetch(`/api/content/${post.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ pipelineStage: "review" }),
                    });
                    if (res.ok)
                      setPost((p) =>
                        p ? { ...p, pipelineStage: "review" } : p
                      );
                  }}
                  className="text-sm rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
                >
                  Move to Review
                </button>
              )}
              {post.pipelineStage === "review" && post.isOwner !== false && (
                <button
                  type="button"
                  onClick={() => {
                    setPublishModal(true);
                    setPublishError(null);
                    setPublishSuccess(null);
                  }}
                  className="text-sm rounded-lg bg-green-600 px-3 py-1.5 text-white hover:bg-green-700"
                >
                  Publish
                </button>
              )}
              {post.pipelineStage === "review" && post.canApprove && post.approvalStatus !== "approved" && post.approvalStatus !== "rejected" && (
                <>
                  <button
                    type="button"
                    disabled={approveLoading}
                    onClick={async () => {
                      setApproveLoading(true);
                      try {
                        const res = await fetch(`/api/content/${post.id}/approve`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "approve" }),
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setPost((p) =>
                            p ? { ...p, approvalStatus: "approved", pipelineStage: "published" } : p
                          );
                        } else {
                          alert(data.error ?? "Failed");
                        }
                      } finally {
                        setApproveLoading(false);
                      }
                    }}
                    className="text-sm rounded-lg bg-green-600 px-3 py-1.5 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {approveLoading ? "..." : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={approveLoading}
                    onClick={async () => {
                      setApproveLoading(true);
                      try {
                        const res = await fetch(`/api/content/${post.id}/approve`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "reject" }),
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setPost((p) =>
                            p ? { ...p, approvalStatus: "rejected" } : p
                          );
                        } else {
                          alert(data.error ?? "Failed");
                        }
                      } finally {
                        setApproveLoading(false);
                      }
                    }}
                    className="text-sm rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <Link
            href="/content"
            className="text-blue-600 hover:underline"
          >
            ← Back to My Content
          </Link>
          {post.isOwner !== false && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setOptimizeModalOpen(true);
                  setOptimizeError(null);
                  setOptimizeResult(null);
                  handleOptimize();
                }}
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Optimize
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageModalOpen(true);
                  setImageError(null);
                }}
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Generate Image
              </button>
              <button
                type="button"
                onClick={() => {
                  setPublishModal(true);
                  setPublishError(null);
                  setPublishSuccess(null);
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
              >
                Publish
              </button>
            </div>
          )}
          {post.canApprove && post.isOwner === false && (
            <span className="text-sm text-gray-500">Viewing as approver</span>
          )}
        </div>

        {publishModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-w-md w-full rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl">
              <h3 className="text-lg font-bold dark:text-white mb-4">1-Click Publish</h3>
              <select
                value={publishPlatform}
                onChange={(e) =>
                  setPublishPlatform(e.target.value as "wordpress" | "medium" | "linkedin" | "twitter")
                }
                className="w-full mb-4 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="wordpress">WordPress</option>
                <option value="medium">Medium</option>
                <option value="linkedin">LinkedIn</option>
                <option value="twitter">Twitter/X</option>
              </select>

              {publishPlatform === "wordpress" && (
                <div className="space-y-4 mb-4">
                  <input
                    type="url"
                    placeholder="Site URL (e.g. https://yoursite.com)"
                    value={wpSiteUrl}
                    onChange={(e) => setWpSiteUrl(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Username"
                    value={wpUsername}
                    onChange={(e) => setWpUsername(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="password"
                    placeholder="Application Password"
                    value={wpAppPassword}
                    onChange={(e) => setWpAppPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Create an Application Password in WordPress: Users → Profile → Application Passwords
                  </p>
                </div>
              )}

              {publishPlatform === "medium" && (
                <div className="mb-4">
                  <input
                    type="password"
                    placeholder="Integration token"
                    value={mediumToken}
                    onChange={(e) => setMediumToken(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Get token from Medium Settings → Integration tokens
                  </p>
                </div>
              )}

              {publishPlatform === "linkedin" && (
                <div className="mb-4">
                  {publishConnections.linkedin ? (
                    <p className="text-sm text-green-600 dark:text-green-400">Connected – ready to publish</p>
                  ) : (
                    <>
                      <Link
                        href="/api/auth/linkedin/connect"
                        className="inline-block rounded-lg bg-[#0a66c2] px-4 py-2 text-sm font-medium text-white hover:bg-[#004182] mb-2"
                      >
                        Connect LinkedIn
                      </Link>
                      <input
                        type="password"
                        placeholder="Or paste access token (fallback)"
                        value={linkedinToken}
                        onChange={(e) => setLinkedinToken(e.target.value)}
                        className="w-full mt-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </>
                  )}
                </div>
              )}

              {publishPlatform === "twitter" && (
                <div className="mb-4">
                  {publishConnections.twitter ? (
                    <p className="text-sm text-green-600 dark:text-green-400">Connected – ready to publish</p>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        href="/api/auth/twitter/connect"
                        className="inline-block rounded-lg bg-black dark:bg-white dark:text-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                      >
                        Connect Twitter
                      </Link>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Or paste credentials below:</p>
                      <input
                        type="text"
                        placeholder="API Key (optional)"
                        value={twitterApiKey}
                        onChange={(e) => setTwitterApiKey(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <input
                        type="password"
                        placeholder="API Secret (optional)"
                        value={twitterApiSecret}
                        onChange={(e) => setTwitterApiSecret(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <input
                        type="password"
                        placeholder="Access token"
                        value={twitterAccessToken}
                        onChange={(e) => setTwitterAccessToken(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <input
                        type="password"
                        placeholder="Access token secret"
                        value={twitterAccessSecret}
                        onChange={(e) => setTwitterAccessSecret(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>
              )}

              {(publishPlatform === "wordpress" || publishPlatform === "medium") && (
                <div className="mb-4">
                  <label className="block text-sm font-medium dark:text-gray-300 mb-2">Status</label>
                  <select
                    value={publishStatus}
                    onChange={(e) => setPublishStatus(e.target.value as "draft" | "publish")}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="publish">Publish now</option>
                  </select>
                </div>
              )}

              {publishError && (
                <p className="mb-4 text-sm text-red-600 dark:text-red-400">{publishError}</p>
              )}
              {publishSuccess?.postUrl && (
                <p className="mb-4 text-sm text-green-600 dark:text-green-400">
                  Published! <a href={publishSuccess.postUrl} target="_blank" rel="noopener noreferrer" className="underline">View post</a>
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPublishModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishLoading}
                  className="flex-1 rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {publishLoading ? "Publishing…" : "Publish"}
                </button>
              </div>
            </div>
          </div>
        )}

        {optimizeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl">
              <h3 className="text-lg font-bold dark:text-white mb-4">
                SEO, GEO & AEO Optimization
              </h3>
              {optimizeLoading && (
                <p className="text-gray-500 dark:text-gray-400">Analyzing...</p>
              )}
              {optimizeError && (
                <p className="mb-4 text-sm text-red-600 dark:text-red-400">
                  {optimizeError}
                </p>
              )}
              {optimizeResult && !optimizeLoading && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium dark:text-gray-300 mb-1">Meta Title</label>
                    <input
                      type="text"
                      value={optimizeResult.metaTitle}
                      onChange={(e) =>
                        setOptimizeResult((r) =>
                          r ? { ...r, metaTitle: e.target.value } : r
                        )
                      }
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-gray-300 mb-1">Meta Description</label>
                    <textarea
                      value={optimizeResult.metaDescription}
                      onChange={(e) =>
                        setOptimizeResult((r) =>
                          r ? { ...r, metaDescription: e.target.value } : r
                        )
                      }
                      rows={2}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium dark:text-gray-300 mb-1">Keywords</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {optimizeResult.keywords.join(", ")}
                    </p>
                  </div>
                  {optimizeResult.headlineSuggestions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium dark:text-gray-300 mb-1">Headline Suggestions</p>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                        {optimizeResult.headlineSuggestions.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {optimizeResult.internalLinkSuggestions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium dark:text-gray-300 mb-1">Internal Link Ideas</p>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1 break-all">
                        {optimizeResult.internalLinkSuggestions.map((u, i) => (
                          <li key={i}>
                            <a href={u} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {u}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {optimizeResult.geoHints && (
                    <div className="rounded-lg border border-purple-200 dark:border-purple-800 p-3">
                      <p className="text-sm font-medium dark:text-gray-300 mb-2">
                        GEO (Generative Engine Optimization)
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">FAQ ideas for AI search:</p>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-0.5">
                        {optimizeResult.geoHints.faqSuggestions.slice(0, 3).map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Conversion patterns: {optimizeResult.geoHints.conversionPatterns.slice(0, 2).join("; ")}</p>
                    </div>
                  )}
                  {optimizeResult.aeoHints && (
                    <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 p-3">
                      <p className="text-sm font-medium dark:text-gray-300 mb-2">
                        AEO (Answer Engine Optimization)
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Featured snippet tips:</p>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-0.5">
                        {optimizeResult.aeoHints.featuredSnippetHints.slice(0, 2).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOptimizeModalOpen(false);
                        setOptimizeResult(null);
                      }}
                      className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyOptimize}
                      className="flex-1 rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700"
                    >
                      Apply Meta
                    </button>
                  </div>
                </div>
              )}
              {!optimizeResult && !optimizeLoading && (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOptimizeModalOpen(false)}
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleOptimize}
                    disabled={optimizeLoading}
                    className="flex-1 rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {imageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-w-md w-full rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl">
              <h3 className="text-lg font-bold dark:text-white mb-4">
                Generate Image (DALL-E)
              </h3>
              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe the image..."
                rows={3}
                className="w-full mb-4 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {imageError && (
                <p className="mb-4 text-sm text-red-600 dark:text-red-400">
                  {imageError}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setImageModalOpen(false)}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={imageLoading}
                  className="flex-1 rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {imageLoading ? "Generating…" : "Generate"}
                </button>
              </div>
            </div>
          </div>
        )}

        {post.guardrailIssues && post.guardrailIssues.length > 0 && (
          <div className="mb-6 rounded-lg border border-amber-500/50 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
              Brand Voice Guardrail Warnings
            </p>
            <ul className="list-disc list-inside text-sm text-amber-700 dark:text-amber-300 space-y-1">
              {post.guardrailIssues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        <article className="rounded-xl bg-white dark:bg-gray-800 p-8 shadow-lg">
          {post.imageUrl && (
            <div className="mb-6 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.imageUrl}
                alt=""
                className="w-full max-h-80 object-cover"
              />
            </div>
          )}
          <h1 className="text-3xl font-bold dark:text-white mb-4">
            {post.title ?? "Untitled"}
          </h1>
          {post.topic && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Topic: {post.topic}
            </p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
            {new Date(post.createdAt).toLocaleDateString()}
          </p>
          <div className="prose dark:prose-invert max-w-none">
            {(post.fullContent != null || editContent) ? (
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => handleInlineEdit("improve")}
                    disabled={inlineEditLoading}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {inlineEditLoading ? "..." : "Improve"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInlineEdit("expand")}
                    disabled={inlineEditLoading}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {inlineEditLoading ? "..." : "Expand"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInlineEdit("shorten")}
                    disabled={inlineEditLoading}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {inlineEditLoading ? "..." : "Shorten"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveContent}
                    disabled={saveContentLoading}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
                  >
                    {saveContentLoading ? "Saving..." : "Save"}
                  </button>
                </div>
                {inlineEditError && (
                  <p className="mb-2 text-sm text-red-600 dark:text-red-400">
                    {inlineEditError}
                  </p>
                )}
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onSelect={(e) => {
                    const t = e.target as HTMLTextAreaElement;
                    setEditSelection(
                      t.selectionStart !== t.selectionEnd
                        ? { start: t.selectionStart, end: t.selectionEnd }
                        : null
                    );
                  }}
                  className="w-full min-h-[200px] px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans"
                  placeholder="Content..."
                  spellCheck
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Select text for Improve/Expand/Shorten; AI edits auto-save. Click Save for manual edits.
                </p>
              </div>
            ) : (
              <p className="text-gray-500">No content stored for this post.</p>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}
