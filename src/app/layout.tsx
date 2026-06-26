import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: { default: "Billify — Beautiful Invoices in Seconds", template: "%s | Billify" },
    description: "Create professional PDF invoices in seconds with Billify. Free forever. No signup. No cloud. Your data stays in your browser.",
    metadataBase: new URL("https://billify.me"),
    alternates: { canonical: "/" },
    openGraph: {
        title: "Billify — Beautiful Invoices in Seconds",
        description: "Create professional PDF invoices in seconds. Free forever. No signup required.",
        url: "https://billify.me",
        siteName: "Billify",
        locale: "en_US",
        type: "website",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "Billify — Professional invoice builder",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Billify — Beautiful Invoices in Seconds",
        description: "Create professional PDF invoices in seconds. Free forever.",
        images: ["/og-image.png"],
    },
    robots: { index: true, follow: true },
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
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self'; object-src 'none'; frame-ancestors 'self'; base-uri 'self'; form-action 'self';" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Billify",
              applicationCategory: "BusinessApplication",
              description: "Create professional PDF invoices in seconds. Free forever. No signup required.",
              url: "https://billify.me",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
                description: "Free tier with core invoice features",
              },
              operatingSystem: "Web Browser",
              featureList: "PDF export, invoice templates, auto-save, logo upload, no signup required",
            }),
          }}
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
        {children}
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
