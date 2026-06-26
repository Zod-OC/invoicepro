'use client';

import { useEffect } from 'react';
import { embedKey } from '@/lib/embed';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console for debugging — no external error tracking (privacy-first)
    console.error('Billify error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">
          We hit an unexpected issue. Your invoice data is safely stored in your browser.
          Try reloading the page or starting fresh.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem(embedKey('current'));
                window.location.reload();
              }
            }}
            className="px-4 py-2 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent transition-colors"
          >
            Clear &amp; Reload
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <pre className="mt-4 text-xs text-left bg-muted p-3 rounded-md overflow-auto max-h-48">
            {error.message}
            {error.digest && `
Digest: ${error.digest}`}
          </pre>
        )}
      </div>
    </div>
  );
}
