/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  // NOTE: output:'export' does not emit HTTP response headers. The full CSP —
  // including frame-ancestors 'self' (which browsers ignore in <meta http-equiv>,
  // so it cannot live in src/app/layout.tsx) — is shipped per host so the framing
  // boundary for the /app iframe embeds on /invoice-template-for/* pages is
  // enforced everywhere. The header value is byte-identical across all four
  // sources — keep them in lockstep on any CSP change:
  //   - public/_headers  → dist/_headers, honored automatically by Netlify and
  //     Cloudflare Pages (output:'export' copies public/* to dist/).
  //   - vercel.json      → honored by Vercel, which (unlike Netlify/Cloudflare)
  //     does NOT read _headers, so without this a Vercel deploy ships no CSP and
  //     the frame-ancestors clickjacking boundary is unenforced (R35 #4).
  //   - deploy/nginx.conf + docker-billify/nginx.conf → for nginx / Coolify,
  //     which ignore _headers; the operator must serve via this config.
  // Any OTHER static host that ignores both _headers and vercel.json must set
  // the same header at its edge — the nginx configs are the reference copy.
};

export default nextConfig;
