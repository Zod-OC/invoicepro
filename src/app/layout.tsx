import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { softwareApplicationJsonLd, ogImageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { FrameGuard } from "@/components/FrameGuard";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// Shared OG/twitter/robots spine (card type, image-array shape, robots default)
// via ogImageMetadata (src/lib/seo.ts), so the default metadata and the
// profession route's generateMetadata can't drift on those literals. layout.tsx
// layers the sitewide siteName/locale onto openGraph on top of the shared base.
const og = ogImageMetadata({
    title: "Billify — Beautiful Invoices in Seconds",
    description: "Create professional PDF invoices in seconds. Free forever. No signup required.",
    url: SITE_URL,
    image: "/og-image.png",
    imageAlt: "Billify — Professional invoice builder",
});

export const metadata: Metadata = {
    title: { default: "Billify — Beautiful Invoices in Seconds", template: "%s | Billify" },
    description: "Create professional PDF invoices in seconds with Billify. Free forever. No signup. No cloud. Your data stays in your browser.",
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: "/" },
    openGraph: { ...og.openGraph, siteName: "Billify", locale: "en_US" },
    twitter: og.twitter,
    robots: og.robots,
    keywords: ["invoice generator", "PDF invoice", "free invoice", "invoice builder", "freelancer invoice", "small business invoice", "privacy-first"],
    authors: [{ name: "Billify" }],
    creator: "Billify",
    publisher: "Billify",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} h-full antialiased`}>
      <head>
        {/* CSP via <meta> covers every directive EXCEPT frame-ancestors, which
            browsers ignore in <meta> and only honor as an HTTP header. The full
            header — including frame-ancestors 'self' — is shipped in
            public/_headers (copied to dist/_headers by output:'export') and
            enforced by any static host that honors _headers (Netlify, Cloudflare
            Pages). For nginx/Coolify, the operator must add the same header; see
            next.config.mjs. frame-ancestors is intentionally omitted here. */}
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';" />
        {/* Referrer-Policy via <meta> mirrors the HTTP header in public/_headers
            (and the nginx confs) for hosts that don't honor _headers. no-referrer
            stops the one-time same-origin handoff/persist/download tokens —
            carried in /app?… params and stripped by the mount effect only AFTER
            first paint — from leaking via document.referrer on a cross-origin
            navigation during that pre-mount window, on browsers whose default is
            NOT strict-origin-when-cross-origin. Modern browsers already strip the
            query cross-origin, so this is defense-in-depth; it makes the persist
            flag's "unforgable cross-origin" claim hold for token confidentiality
            in transit, not just the stash-write side. */}
        <meta name="referrer" content="no-referrer" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: softwareApplicationJsonLd() }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <noscript>
          <style>{noscriptStyles}</style>
          <div className="noscript-fallback">
            <div className="noscript-inner">
              <h1>JavaScript is required</h1>
              <p>Billify runs entirely in your browser and needs JavaScript to generate invoices. Please enable JavaScript to continue.</p>
            </div>
          </div>
        </noscript>
        <FrameGuard>{children}</FrameGuard>
      </body>
    </html>
  );
}

const noscriptStyles = `
  .noscript-fallback {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0a0a0a;
    z-index: 9999;
  }
  .noscript-inner {
    text-align: center;
    max-width: 480px;
    padding: 2rem;
    color: #e5e5e5;
    font-family: system-ui, sans-serif;
  }
  .noscript-inner h1 { font-size: 1.5rem; margin-bottom: 1rem; }
  .noscript-inner p { font-size: 1rem; line-height: 1.5; opacity: 0.8; }
`;
