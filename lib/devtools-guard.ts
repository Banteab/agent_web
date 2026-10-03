const DOCKED_GAP_PX = 100;

/**
 * Heuristic only — can be bypassed; use as a deterrent, not security.
 *
 * Deliberately does NOT compare window.innerHeight against
 * visualViewport.height: on mobile, the browser's own address bar
 * auto-hides/shows during a normal scroll and creates exactly this kind
 * of gap, which has nothing to do with DevTools. Desktop DevTools docked
 * to a side or the bottom is still caught by the outerWidth/outerHeight
 * check below, since that compares the actual OS window to the page
 * viewport rather than the mobile chrome-driven visualViewport.
 */
export function isDevToolsLikelyOpen(): boolean {
  if (typeof window === "undefined") return false;

  const widthGap = Math.abs(window.outerWidth - window.innerWidth);
  const heightGap = Math.abs(window.outerHeight - window.innerHeight);
  if (widthGap > DOCKED_GAP_PX || heightGap > DOCKED_GAP_PX) return true;

  const firebug = (window as Window & { Firebug?: { chrome?: { isInitialized?: boolean } } }).Firebug;
  if (firebug?.chrome?.isInitialized) return true;

  return false;
}
