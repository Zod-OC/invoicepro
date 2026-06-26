'use client';

import { useState, useEffect, useCallback } from 'react';
import { isEmbedMode, embedKey } from '@/lib/embed';

const API_BASE = typeof window !== 'undefined'
  ? `${window.location.origin}/api/stripe`
  : 'https://billify.me/api/stripe';

/** Get CSRF token from cookie for double-submit pattern */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/billify_csrf=([a-f0-9]+)/);
  return match?.[1] ?? null;
}

/** Ensure we have a CSRF token (prefetch from health endpoint if needed) */
async function ensureCsrfToken(): Promise<string | null> {
  let token = getCsrfToken();
  if (token) return token;
  try {
    await fetch(`${API_BASE}/`, { credentials: 'include' });
    token = getCsrfToken();
  } catch { /* non-critical */ }
  return token;
}

/** Build headers with CSRF + content-type for POST requests */
async function postHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const csrf = await ensureCsrfToken();
  return {
    'Content-Type': 'application/json',
    ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
    ...extra,
  };
}

// Namespaced per session: host uses billify_*, the embed iframe uses
// billify_embed_* so the two never read or write each other's subscription
// state. Evaluated at module load — a given page is either embed or not.
const TOKEN_KEY = embedKey('sub_token');
const PLAN_KEY = embedKey('plan');
const LIMITS_KEY = embedKey('limits');

export type Plan = 'free' | 'pro';

export interface PlanLimits {
  invoicesPerMonth: number;
  templates: string[] | 'all';
}

const DEFAULT_LIMITS: PlanLimits = {
  invoicesPerMonth: 3,
  // The actual free-tier template ids (see src/types/index.ts `templates`).
  // Not 'basic' — that was a sentinel that matched no real template id.
  templates: ['modern', 'classic'],
};

const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: DEFAULT_LIMITS,
  pro: { invoicesPerMonth: Infinity, templates: 'all' },
};

function getStoredPlan(): Plan {
  try {
    return (localStorage.getItem(PLAN_KEY) as Plan) || 'free';
  } catch { return 'free'; }
}

function getStoredLimits(): PlanLimits {
  try {
    const raw = localStorage.getItem(LIMITS_KEY);
    if (!raw) return DEFAULT_LIMITS;
    const parsed = JSON.parse(raw);
    if (parsed.invoicesPerMonth === null) parsed.invoicesPerMonth = Infinity;
    return parsed;
  } catch { return DEFAULT_LIMITS; }
}

function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

function setSubscription(plan: Plan, limits: PlanLimits, token?: string | null) {
  try {
    localStorage.setItem(PLAN_KEY, plan);
    localStorage.setItem(LIMITS_KEY, JSON.stringify(limits));
    if (token) localStorage.setItem(TOKEN_KEY, token);
  } catch { /* storage full */ }
}

function clearSubscription() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PLAN_KEY);
    localStorage.removeItem(LIMITS_KEY);
  } catch { /* ignore */ }
}

export function useSubscription() {
  const [plan, setPlanState] = useState<Plan>('free');
  const [limits, setLimitsState] = useState<PlanLimits>(DEFAULT_LIMITS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // False until the initial validation settles (embed short-circuit, no-token,
  // validate-token fetch, or verifySession). plan starts 'free' synchronously
  // and only becomes authoritative after this flips true — callers must not
  // branch on `plan` until `initialized` is true, or they act on the stale
  // initial 'free' (e.g. wrongly downgrading a logged-in Pro user's template).
  const [initialized, setInitialized] = useState(false);

  // Validate token on mount
  useEffect(() => {
    // Embed mode: the SEO page editor is genuinely unlimited with no signup.
    // Short-circuit the whole subscription flow — treat as pro, write nothing,
    // and never fire verifySession from the iframe's ?checkout=success quirk.
    if (isEmbedMode()) {
      setPlanState('pro');
      setLimitsState(PLAN_LIMITS.pro);
      setInitialized(true);
      return;
    }

    const token = getToken();
    if (!token) {
      // Check for checkout success redirect
      const params = new URLSearchParams(window.location.search);
      const checkout = params.get('checkout');
      const sessionId = params.get('session_id');
      if (checkout === 'success' && sessionId) {
        // Post-payment redirect: initialized flips when verifySession resolves
        // (in its finally), so callers gate on a resolved plan — not the
        // synchronous initial 'free' state.
        verifySession(sessionId);
      } else {
        setInitialized(true);
      }
      return;
    }

    // Validate stored token with server
    fetch(`${API_BASE}/validate-token`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          // Token explicitly rejected by the server (expired, revoked, or
          // malformed). This is a *permanent* rejection — clear and downgrade.
          clearSubscription();
          setPlanState('free');
          setLimitsState(DEFAULT_LIMITS);
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setPlanState(data.plan);
        setLimitsState(data.limits);
      })
      .catch(() => {
        // Network error or transient server failure (5xx, DNS, timeout).
        // Do NOT collapse this into plan='free' — that would downgrade a
        // logged-in Pro user's subscription (and trigger the template clamp
        // in page.tsx, persisting the downgrade via auto-save) on a momentary
        // network blip. Restore the stored plan optimistically instead.
        const storedPlan = getStoredPlan();
        setPlanState(storedPlan);
        setLimitsState(storedPlan === 'pro' ? PLAN_LIMITS.pro : DEFAULT_LIMITS);
      })
      .finally(() => setInitialized(true));
  }, []);

  const verifySession = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/verify-session`, {
        method: 'POST',
        credentials: 'include',
        headers: await postHeaders(),
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Verification failed');

      setPlanState(data.plan);
      setLimitsState(data.limits);
      setSubscription(data.plan, data.limits, data.token);

      // Clean URL params
      const url = new URL(window.location.href);
      url.searchParams.delete('checkout');
      url.searchParams.delete('session_id');
      window.history.replaceState({}, '', url.toString());
    } catch (err: any) {
      setError(err.message || 'Failed to verify purchase');
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  const restoreByEmail = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/verify-subscription`, {
        method: 'POST',
        credentials: 'include',
        headers: await postHeaders(),
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Verification failed');

      setPlanState(data.plan);
      setLimitsState(data.limits);
      if (data.token) {
        setSubscription(data.plan, data.limits, data.token);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to restore subscription');
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    clearSubscription();
    setPlanState('free');
    setLimitsState(DEFAULT_LIMITS);
  }, []);

  // Feature gates
  const canCreateInvoice = useCallback((currentMonthCount: number) => {
    if (plan === 'pro') return true;
    return currentMonthCount < (limits.invoicesPerMonth || 3);
  }, [plan, limits]);

  const hasTemplateAccess = useCallback((templateId: string) => {
    if (limits.templates === 'all') return true;
    if (Array.isArray(limits.templates)) {
      return limits.templates.includes(templateId);
    }
    return false;
  }, [limits]);

  return {
    plan,
    limits,
    loading,
    error,
    initialized,
    verifySession,
    restoreByEmail,
    clear,
    canCreateInvoice,
    hasTemplateAccess,
  };
}
