'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { History, Trash2, CheckCircle2, Send, Clock, FileText } from 'lucide-react';
import { useInvoiceHistory } from '@/hooks/useInvoiceHistory';
import { formatCurrency } from '@/types';
import type { HistoryStatus } from '@/types';

const STATUS_CONFIG: Record<HistoryStatus, { label: string; variant: 'secondary' | 'default' | 'destructive' | 'outline'; icon: React.ElementType; className: string }> = {
  draft: { label: 'Draft', variant: 'secondary', icon: FileText, className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  sent: { label: 'Sent', variant: 'default', icon: Send, className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
  paid: { label: 'Paid', variant: 'default', icon: CheckCircle2, className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' },
  overdue: { label: 'Overdue', variant: 'destructive', icon: Clock, className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
};

/**
 * Invoice history panel. Shows a table of all invoices the user has created,
 * with manual status tracking (draft → sent → paid → overdue). Clicking a
 * record loads the invoice back into the editor (via the onLoadInvoice callback).
 *
 * This component is self-contained — the parent passes onLoadInvoice to handle
 * loading a record back into the editor. Status updates are handled internally
 * via the useInvoiceHistory hook.
 */
export function InvoiceHistory({ onLoadInvoice }: { onLoadInvoice: (id: string) => void }) {
  const { history, ready, updateStatus, removeRecord, clearHistory, markOverdue } = useInvoiceHistory();
  const [open, setOpen] = useState(false);

  // Mark overdue invoices when the panel opens.
  useEffect(() => {
    if (open) markOverdue();
  }, [open, markOverdue]);

  const handleStatusChange = (id: string, status: HistoryStatus) => {
    updateStatus(id, status);
  };

  const handleLoad = (id: string) => {
    onLoadInvoice(id);
    setOpen(false);
  };

  const statusCounts = history.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {} as Record<HistoryStatus, number>,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="w-4 h-4" />
          History
          {history.length > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {history.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Invoice History</DialogTitle>
          <DialogDescription>
            All invoices you&apos;ve created. Update status as you send and receive payments.
          </DialogDescription>
        </DialogHeader>

        {!ready ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No invoices yet. Create your first invoice to see it here.</p>
          </div>
        ) : (
          <>
            {/* Summary badges */}
            <div className="flex flex-wrap gap-2 pb-2">
              {(Object.keys(STATUS_CONFIG) as HistoryStatus[]).map((status) => {
                const count = statusCounts[status] || 0;
                if (count === 0) return null;
                const cfg = STATUS_CONFIG[status];
                const Icon = cfg.icon;
                return (
                  <div key={status} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.className}`}>
                    <Icon className="w-3 h-3" />
                    {count} {cfg.label}
                  </div>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-xs text-muted-foreground hover:text-destructive"
                onClick={() => {
                  if (confirm('Clear all invoice history? This cannot be undone.')) clearHistory();
                }}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear all
              </Button>
            </div>

            {/* History table */}
            <div className="overflow-y-auto flex-1 -mx-2">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background border-b">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="font-medium px-2 py-2">Invoice</th>
                    <th className="font-medium px-2 py-2">Client</th>
                    <th className="font-medium px-2 py-2 text-right">Amount</th>
                    <th className="font-medium px-2 py-2">Due</th>
                    <th className="font-medium px-2 py-2">Status</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record) => {
                    const cfg = STATUS_CONFIG[record.status];
                    const StatusIcon = cfg.icon;
                    return (
                      <tr key={record.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-2 py-2.5 font-mono text-xs">{record.number}</td>
                        <td className="px-2 py-2.5 max-w-[160px] truncate">{record.clientName}</td>
                        <td className="px-2 py-2.5 text-right font-medium tabular-nums">
                          {formatCurrency(record.amount, record.currency)}
                        </td>
                        <td className="px-2 py-2.5 text-xs text-muted-foreground">{record.dueDate}</td>
                        <td className="px-2 py-2.5">
                          <select
                            value={record.status}
                            onChange={(e) => handleStatusChange(record.id, e.target.value as HistoryStatus)}
                            className={`text-xs rounded-full border-0 px-2 py-1 font-medium cursor-pointer outline-none ${cfg.className}`}
                          >
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                          </select>
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => handleLoad(record.id)}
                              title="Load into editor"
                            >
                              Load
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => removeRecord(record.id)}
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
