// /app editor route — 'use client' page needs its own server layout for metadata.
// This layout sets noindex,nofollow on the entire /app route, including all
// query-string variants (?embed=..., ?invoice=..., ?handoff=..., etc.).
// The editor is dynamic, no useful content for Google to index, and not
// representative of the public landing page — indexing it would dilute SEO.
export const metadata = {
  title: 'Invoice Builder — Billify',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      nocache: true,
    },
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
