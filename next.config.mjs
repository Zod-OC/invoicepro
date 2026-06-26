/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  // NOTE: output:'export' does not emit HTTP response headers. The production
  // reverse proxy (nginx / Coolify) must add:
  //   Content-Security-Policy: default-src 'self'; ...; frame-ancestors 'self';
  // frame-ancestors cannot be enforced via <meta http-equiv>, so the header is
  // required for the /app iframe embeds on /invoice-template-for/* pages.
};

export default nextConfig;
