'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Lock, ArrowRight } from 'lucide-react';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  feature: string;
}

export function PaywallModal({ open, onClose, feature }: PaywallModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            {feature}
          </DialogTitle>
          <DialogDescription>
            This feature is available on the <strong>Pro</strong> plan.
            Upgrade to unlock it and more powerful features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <div className="flex items-center gap-2 text-sm">
            <ArrowRight className="w-4 h-4 text-primary" />
            Unlimited invoices
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ArrowRight className="w-4 h-4 text-primary" />
            10 premium templates
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ArrowRight className="w-4 h-4 text-primary" />
            No watermark on PDFs
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ArrowRight className="w-4 h-4 text-primary" />
            CSV/Excel export
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ArrowRight className="w-4 h-4 text-primary" />
            Priority support
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Maybe later
          </Button>
          <Button asChild size="sm">
            <Link href="/pricing">Upgrade to Pro</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
