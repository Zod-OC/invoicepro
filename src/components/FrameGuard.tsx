'use client';

import { useEffect, useState } from 'react';
import { isUntrustedFrame } from '@/lib/embed';

/**
 * Defense-in-depth frame-breaking for every page EXCEPT the trusted /app embed.
 *
 * The CSP frame-ancestors 'self' header (public/_headers, nginx) is the PRIMARY
 * framing defense, but it is operator-deployed and may be absent on a
 * misconfigured deploy (plain `serve dist`, a Coolify include that's missing, a
 * new static host that doesn't honor _headers). /app already has its own
 * isUntrustedFrame refusal (render-time + data-layer), so it guards itself; this
 * component extends the same defense to the marketing and profession pages,
 * which otherwise have NO JS refusal and NO meta frame-ancestors, so on a
 * misconfigured deploy they are frameable by any cross-origin site
 * (clickjacking / camouflage). The profession pages are the entry point to the
 * embed iframe, so framing one would serve Billify's editor to a third-party
 * framer's visitors — this refuses that.
 *
 * Refuses (renders nothing) when the page is framed by anything that isn't the
 * trusted same-origin /invoice-template-for/* embed (isEmbedMode). Top-level
 * tabs are always allowed. /app is explicitly deferred to its own existing
 * frame logic (it has a tailored refusal with a recovery link), so this only
 * acts on the marketing + profession pages.
 *
 * SSR/prerender and the first client render show the page normally (framed
 * starts false) so there is no hydration mismatch; only an actually-framed-
 * untrusted client swaps to the refusal post-mount. The one paint before the
 * swap is public marketing content (no victim data) — acceptable, and the same
 * one-paint tradeoff /app's refusal makes.
 */
export function FrameGuard({ children }: { children: React.ReactNode }) {
  const [framed, setFramed] = useState(false);
  useEffect(() => {
    // isUntrustedFrame() reads window.parent.location and is client-only —
    // computing it during render would mismatch the prerendered HTML, so the
    // check runs in this mount effect. Defer /app to its own isUntrustedFrame
    // refusal: only guard the marketing + profession pages that have no JS
    // refusal of their own. The trusted /app embed (framed by a same-origin
    // profession page) has isUntrustedFrame()===false, so it's allowed through.
    if (isUntrustedFrame() && !window.location.pathname.startsWith('/app')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFramed(true);
    }
  }, []);
  if (framed) return null; // refuse to render — break the frame
  return <>{children}</>;
}
