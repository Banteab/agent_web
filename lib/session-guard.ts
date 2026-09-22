/** Client-only hook for api client to trigger logout without importing auth-context. */
let onSessionInvalid: ((reason: "expired" | "unauthorized") => void) | null = null;

export function registerSessionInvalidHandler(
  handler: (reason: "expired" | "unauthorized") => void,
) {
  onSessionInvalid = handler;
}

export function notifySessionInvalid(reason: "expired" | "unauthorized") {
  onSessionInvalid?.(reason);
}
