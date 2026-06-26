'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, Zap } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

export function SubscriptionManager() {
  const { plan, limits, loading, error, restoreByEmail, clear } = useSubscription();
  const [email, setEmail] = useState('');
  const [showRestore, setShowRestore] = useState(false);

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await restoreByEmail(email.trim());
  };

  return (
    <div className="space-y-4">
      {/* Current plan badge */}
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <div>
            <p className="text-sm font-medium">Current plan: <span className="capitalize">{plan}</span></p>
            <p className="text-xs text-muted-foreground">
              {plan === 'free'
                ? `3 invoices/month • 2 basic templates • No signup, no account`
                : `Unlimited invoices • All 12 templates • Logo upload • Data stays in your browser`}
            </p>
          </div>
        </div>
      </div>

      {/* Restore / recover */}
      {plan === 'free' && !showRestore && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => setShowRestore(true)}
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Restore purchased plan
        </Button>
      )}

      {showRestore && (
        <form onSubmit={handleRestore} className="space-y-3 rounded-lg border p-3">
          <Label htmlFor="restore-email" className="text-sm">Enter your billing email</Label>
          <Input
            id="restore-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Checking...</>
              ) : (
                'Restore'
              )}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowRestore(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {plan !== 'free' && (
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={clear}>
          Sign out (switch to free)
        </Button>
      )}
    </div>
  );
}
