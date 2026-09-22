const DOCKED_GAP_PX = 160;

/** Heuristic only — can be bypassed; use as a deterrent, not security. */
export function isDevToolsLikelyOpen(): boolean {
  if (typeof window === "undefined") return false;

  const widthGap = Math.abs(window.outerWidth - window.innerWidth);
  const heightGap = Math.abs(window.outerHeight - window.innerHeight);
  if (widthGap > DOCKED_GAP_PX || heightGap > DOCKED_GAP_PX) return true;

  const firebug = (window as Window & { Firebug?: { chrome?: { isInitialized?: boolean } } }).Firebug;
  if (firebug?.chrome?.isInitialized) return true;

  return false;
}
