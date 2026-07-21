'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Users, Plus, Trash2, UserPlus, Lock } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { FREE_CLIENT_LIMIT } from '@/types';
import type { Client, Invoice } from '@/types';

interface ClientDirectoryProps {
  /** Current invoice — used to pre-fill the "save client" form. */
  invoice: Invoice;
  /** Called when a client is selected to fill into the invoice. */
  onSelectClient: (client: Client) => void;
  /** Whether the user is on a paid plan (unlimited clients). */
  isPro: boolean;
}

/**
 * Client directory panel. Shows saved clients and lets the user save the
 * current invoice recipient as a client for future reuse.
 *
 * Free tier is limited to FREE_CLIENT_LIMIT (3) clients. The save option is
 * disabled when the limit is reached, with a Pro upgrade nudge.
 */
export function ClientDirectory({ invoice, onSelectClient, isPro }: ClientDirectoryProps) {
  const { clients, ready, addClient, removeClient, clientFromInvoice, findDuplicate } = useClients();
  const [open, setOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const atLimit = !isPro && clients.length >= FREE_CLIENT_LIMIT;
  const currentClientData = clientFromInvoice(invoice);
  const isAlreadySaved = findDuplicate(currentClientData.name, currentClientData.email) !== undefined;

  const handleSave = () => {
    if (atLimit || isAlreadySaved || !currentClientData.name.trim()) return;
    addClient(currentClientData);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleSelect = (client: Client) => {
    onSelectClient(client);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="w-4 h-4" />
          Clients
          {clients.length > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {clients.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Clients</DialogTitle>
          <DialogDescription>
            Save client details for quick re-invoicing. No signup required — data stays in your browser.
            {!isPro && ` Free tier: up to ${FREE_CLIENT_LIMIT} clients.`}
          </DialogDescription>
        </DialogHeader>

        {!ready ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="space-y-4 overflow-y-auto flex-1">
            {/* Save current client */}
            {currentClientData.name.trim() && !isAlreadySaved && (
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{currentClientData.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentClientData.email}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSave}
                  disabled={atLimit}
                  className="gap-1.5 flex-shrink-0 ml-2"
                >
                  {atLimit ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      Pro only
                    </>
                  ) : justSaved ? (
                    'Saved!'
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            )}

            {justSaved && (
              <div className="text-xs text-green-600 dark:text-green-400 px-1">
                Client saved! You can reuse these details next time.
              </div>
            )}

            {/* Client list */}
            {clients.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No saved clients yet. Fill in the &quot;Bill To&quot; section and save for next time.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/30 cursor-pointer group"
                    onClick={() => handleSelect(client)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{client.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {client.email && <span className="truncate">{client.email}</span>}
                        {client.defaultCurrency && <Badge variant="outline" className="text-[10px] py-0">{client.defaultCurrency}</Badge>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive flex-shrink-0 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeClient(client.id);
                      }}
                      aria-label={`Delete client ${client.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Free tier limit notice */}
            {!isPro && (
              <div className="text-xs text-muted-foreground border-t pt-3">
                {clients.length} / {FREE_CLIENT_LIMIT} clients used on free plan.
                <span className="text-primary font-medium"> Upgrade to Pro for unlimited clients.</span>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
