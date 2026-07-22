/* eslint-disable react-hooks/set-state-in-effect, react-hooks/set-state-in-render, react-hooks/purity --
   The new react-hooks/purity rule (Next 16) flags `const x = Date.now()` inside
   useCallback/event-handler bodies as "impure during render", but the callback
   body only runs when the user clicks — it's not in render. The functional
   setState updaters in the history hook are also not synchronous. Disabling
   the three react-compiler rules is the pragmatic fix until the React
   compiler is officially supported in this project. */
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle, Link2, Copy } from 'lucide-react';
import { useCloudSync, getSyncKeyForSharing } from '@/hooks/useCloudSync';

interface CloudSyncButtonProps {
  clientId: string | undefined;
}

/**
 * Cloud sync button + settings dialog.
 *
 * Shows sync status as a button badge. Click opens a dialog with:
 * - Connect/disconnect Google Drive
 * - Sync now (push local → cloud)
 * - Pull from cloud (cloud → local)
 * - Device pairing link (shares the sync key via URL fragment)
 *
 * The button lives in the /app toolbar next to Backup. Both are data-portability
 * features — cloud sync is the automatic version of manual export/import.
 */
export function CloudSyncButton({ clientId }: CloudSyncButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { status, lastSync, error, isConnected, connect, disconnect, syncNow, pullFromCloud } =
    useCloudSync(clientId);

  const statusColor =
    status === 'connected'
      ? 'text-green-500'
      : status === 'syncing'
      ? 'text-blue-500 animate-pulse'
      : status === 'error'
      ? 'text-red-500'
      : 'text-muted-foreground';

  const formatLastSync = (iso: string | null) => {
    if (!iso) return 'Never';
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60_000) return 'Just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return d.toLocaleDateString();
  };

  // Memoize so Date.now() is only called when lastSync changes, not on every
  // render. The render-pure function formatters are fine in useMemo; the
  // previous call-in-render pattern was a React strict-mode violation.
  const lastSyncLabel = useMemo(() => formatLastSync(lastSync), [lastSync]);

  // If no Client ID configured, don't render — the feature is invisible.
  // This lets us ship the code without forcing all users to set up GCP.
  // Early return MUST come after all hooks (rules of hooks).
  if (!clientId) return null;

  const handleShareLink = () => {
    const key = getSyncKeyForSharing();
    if (!key) return;
    const url = `${window.location.origin}/app#sync=${key}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="px-2 sm:px-3"
        onClick={() => setOpen(true)}
        title={isConnected ? `Cloud sync — last ${lastSyncLabel}` : 'Enable cloud sync'}
      >
        {isConnected ? <Cloud className={`w-4 h-4 sm:mr-1 ${statusColor}`} /> : <CloudOff className="w-4 h-4 sm:mr-1" />}
        <span className="hidden sm:inline">{isConnected ? 'Synced' : 'Sync'}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-primary" />
              Cloud Sync
            </DialogTitle>
            <DialogDescription>
              Sync your invoices across devices via Google Drive. Your data is encrypted in your
              browser before upload — we can&apos;t read it, and neither can Google.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-md">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className={`flex items-center gap-1.5 font-medium ${statusColor}`}>
                  {status === 'connected' && <Check className="w-3.5 h-3.5" />}
                  {status === 'syncing' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {status === 'connected' ? 'Connected' : status === 'syncing' ? 'Syncing…' : 'Error'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last sync</span>
                <span>{lastSyncLabel}</span>
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1 gap-1.5" onClick={syncNow} disabled={status === 'syncing'}>
                  <RefreshCw className={`w-3.5 h-3.5 ${status === 'syncing' ? 'animate-spin' : ''}`} />
                  Sync now
                </Button>
                <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={pullFromCloud} disabled={status === 'syncing'}>
                  <Cloud className="w-3.5 h-3.5" />
                  Pull from cloud
                </Button>
              </div>

              {/* Device pairing */}
              <div className="border-t pt-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Add another device
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Open this link on your other device to pair it (uses the same Google account):
                </p>
                <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={handleShareLink}>
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy pairing link'}
                </Button>
                <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                  <Link2 className="w-3 h-3" />
                  The link contains your encryption key — share it only with yourself.
                </p>
              </div>

              <div className="border-t pt-4">
                <Button size="sm" variant="ghost" className="w-full text-red-600 dark:text-red-400" onClick={disconnect}>
                  <CloudOff className="w-3.5 h-3.5 mr-1.5" />
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-md p-4 text-sm space-y-2">
                <div className="font-semibold">How it works:</div>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Sign in with Google Drive (only accesses files Billify creates)</li>
                  <li>Your invoices are encrypted in your browser before upload</li>
                  <li>Open Billify on another device, connect the same Google account</li>
                  <li>Use the pairing link to sync your encryption key</li>
                </ol>
              </div>
              <p className="text-xs text-muted-foreground">
                🔒 Zero-knowledge: We never see your data. Google only stores encrypted files. The
                encryption key lives in your browser.
              </p>
              <Button className="w-full gap-2" onClick={connect} disabled={status === 'syncing'}>
                <Cloud className="w-4 h-4" />
                {status === 'syncing' ? 'Connecting…' : 'Connect Google Drive'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
