export const APP_CACHE_PREFIX = "pdc-";
export const APP_CACHE_VERSION = "pdc-shell-v1";
export const SERVICE_WORKER_PATH = "/sw.js";

export type ServiceWorkerMessage =
  | { type: "PREPARE_OFFLINE"; requestId: string }
  | { type: "CLEAR_APP_CACHES"; requestId: string }
  | { type: "SKIP_WAITING" };
