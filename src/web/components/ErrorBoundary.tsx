"use client";

import { Component, type ReactNode } from "react";

function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error;
  const msg =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message)
      : String(error);
  if (msg === "[object Event]" || msg === "[object Object]")
    return new Error("An unexpected error occurred");
  return new Error(msg || "Unknown error");
}

export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(raw: unknown) {
    return { error: normalizeError(raw) };
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <h1 className="mb-4 text-2xl font-bold">Something went wrong</h1>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                {this.state.error.message}
              </p>
              <button
                type="button"
                onClick={() => this.setState({ error: null })}
                className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
              >
                Try again
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
