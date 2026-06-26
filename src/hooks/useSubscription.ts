'use client';

import { useState, useEffect, useCallback } from 'react';

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

const TOKEN_KEY = 'billify_sub_token';
const PLAN_KEY = 'billify_plan';
const LIMITS_KEY = 'billify_limits';

export type Plan = 'free' | 'pro';

export interface PlanLimits {
  invoicesPerMonth: number;
  templates: string[] | 'all';
  watermark: boolean;
  csvExport: boolean;
}

const DEFAULT_LIMITS: PlanLimits = {
  invoicesPerMonth: 3,
  templates: ['basic'],
  watermark: true,
  csvExport: false,
};

const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: DEFAULT_LIMITS,
  pro: { invoicesPerMonth: Infinity, templates: 'all', watermark: false, csvExport: true },
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

  // Validate token on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      // Check for checkout success redirect
      const params = new URLSearchParams(window.location.search);
      const checkout = params.get('checkout');
      const sessionId = params.get('session_id');
      if (checkout === 'success' && sessionId) {
        verifySession(sessionId);
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
        if (!res.ok) throw new Error('Token invalid');
        const data = await res.json();
        setPlanState(data.plan);
        setLimitsState(data.limits);
      })
      .catch(() => {
        // Token expired or invalid — clear and fall back to free
        clearSubscription();
        setPlanState('free');
        setLimitsState(DEFAULT_LIMITS);
      });
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
      return limits.templates.includes(templateId) || limits.templates.includes('basic');
    }
    return templateId === 'basic';
  }, [limits]);

  const hasCsvExport = useCallback(() => {
    return limits.csvExport === true;
  }, [limits]);

  const hasNoWatermark = useCallback(() => {
    return limits.watermark === false;
  }, [limits]);

  return {
    plan,
    limits,
    loading,
    error,
    verifySession,
    restoreByEmail,
    clear,
    canCreateInvoice,
    hasTemplateAccess,
    hasCsvExport,
    hasNoWatermark,
  };
}
