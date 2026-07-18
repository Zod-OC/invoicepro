'use client';

import { useState, useRef } from 'react';
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
import { Download, Upload, AlertTriangle, Check } from 'lucide-react';
import { exportBackup, downloadBackup, parseBackup, applyBackup, importBackup, type ImportResult } from '@/lib/backup';

/**
 * Backup/restore dialog. Lets users export all their Billify data (clients,
 * history, counter, current invoice) to a JSON file, and import it on another
 * device or browser. Always free for all users — data portability is a core
 * principle.
 *
 * The import flow is two-step: parse + preview → confirm → apply + reload.
 * This prevents accidental overwrites and lets the user verify what's in the
 * backup before committing.
 */
export function BackupRestore() {
  const [open, setOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [pendingJson, setPendingJson] = useState<string | null>(null);
  const [justImported, setJustImported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const backup = exportBackup();
    downloadBackup(backup);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);
    setImportPreview(null);
    setJustImported(false);

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      try {
        parseBackup(text); // validate without applying
        setPendingJson(text);
        // Show a preview of what's in the file.
        const backup = parseBackup(text);
        setImportPreview({
          success: true,
          clientsImported: backup.clients.length,
          historyImported: backup.history.length,
          snapshotsImported: backup.snapshots ? Object.keys(backup.snapshots).length : 0,
          counterSet: backup.counter !== null,
          currentSet: backup.currentInvoice !== null,
        });
      } catch (err) {
        setParseError(err instanceof Error ? err.message : 'Failed to read backup file.');
      }
    };
    reader.readAsText(file);

    // Reset input so the same file can be re-selected.
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!pendingJson) return;
    try {
      importBackup(pendingJson);
      setJustImported(true);
      setImportPreview(null);
      setPendingJson(null);
      // Reload after a short delay so the user sees the success state.
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Import failed.');
    }
  };

  const handleCancel = () => {
    setImportPreview(null);
    setPendingJson(null);
    setParseError(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Backup
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Backup & Restore</DialogTitle>
          <DialogDescription>
            Export your clients, invoice history, and settings to a file. Import it on another device or browser.
          </DialogDescription>
        </DialogHeader>

        {justImported ? (
          <div className="flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-950/30 p-3 text-sm text-green-700 dark:text-green-400">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>Import successful! Reloading…</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Export */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Export data</p>
                  <p className="text-xs text-muted-foreground">Download a backup of all your Billify data.</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                  <Download className="w-3.5 h-3.5" />
                  Export
                </Button>
              </div>
            </div>

            {/* Import */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Import data</p>
                  <p className="text-xs text-muted-foreground">
                    Restore from a backup file. This replaces all current data.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Select file
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Parse error */}
              {parseError && (
                <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Import preview */}
              {importPreview && (
                <div className="space-y-3 rounded-md bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground">This backup contains:</p>
                  <ul className="text-sm space-y-1">
                    <li>{importPreview.clientsImported} client(s)</li>
                    <li>{importPreview.historyImported} invoice record(s)</li>
                    <li>{importPreview.snapshotsImported} saved invoice snapshot(s) — powers the History "Load" button</li>
                    {importPreview.counterSet && <li>Invoice counter</li>}
                    {importPreview.currentSet && <li>Current invoice draft</li>}
                  </ul>
                  {importPreview.historyImported > 0 &&
                    importPreview.snapshotsImported === 0 && (
                      <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-500">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span>
                          This backup has invoice history but no saved snapshots — its rows will list in History but their "Load" buttons will be disabled.
                        </span>
                      </div>
                    )}
                  <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-500">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>Importing will replace all existing data on this device.</span>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleConfirmImport}>
                      Confirm import
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
