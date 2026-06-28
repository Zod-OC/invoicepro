/**
 * fetch with an abort deadline. A hung request — the proxy holds the
 * connection open, the server accepts but never responds, a Stripe cold-start
 * stall — would otherwise leave a caller waiting forever. For useSubscription
 * that means `initialized` stays false, the Download button stays disabled on
 * "Checking access..." and the preview on "Preparing your workspace…" with no
 * in-app recovery. The AbortController fires after `ms`, the fetch rejects with
 * an AbortError, and the caller's catch/finally run exactly as if the request
 * had failed — so the UI always settles.
 *
 * Centralized so the abort/clear/timeout logic lives in one place rather than
 * duplicated per call site (verifySession and the validate-token mount flow
 * previously each hand-rolled the same AbortController + setTimeout + finally
 * pair, which had to be edited in lockstep).
 *
 * Any `signal` passed in `init` is ignored: the helper owns the abort so it
 * can guarantee the timeout fires and the controller is cleared exactly once.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
