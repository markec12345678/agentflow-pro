/**
 * Singleton InMemoryBackend for app API routes (memory persistence across requests)
 */
import { InMemoryBackend } from "./memory-backend";

let _backend: InMemoryBackend | null = null;

export function getAppBackend(): InMemoryBackend {
  if (!_backend) _backend = new InMemoryBackend();
  return _backend;
}
