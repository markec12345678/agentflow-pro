/**
 * AgentFlow Pro - Pusher server-side (real-time Canvas)
 */

import Pusher from "pusher";

let pusher: Pusher | null = null;

function getPusher(): Pusher | null {
  if (pusher) return pusher;
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER || "eu";
  if (!appId || !key || !secret) return null;
  pusher = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });
  return pusher;
}

export type CanvasUpdatePayload = {
  nodes: unknown[];
  edges: unknown[];
  name?: string;
};

export function triggerCanvasUpdate(
  boardId: string,
  payload: CanvasUpdatePayload
): void {
  const p = getPusher();
  if (!p) return;
  try {
    p.trigger(`canvas-${boardId}`, "canvas-update", payload);
  } catch {
    // Graceful: ignore Pusher errors
  }
}
