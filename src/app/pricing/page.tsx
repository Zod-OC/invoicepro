import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Check } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-full flex flex-col">
      <nav className="w-full border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg">InvoicePro</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/app" className="text-sm text-muted-foreground hover:text-foreground">App</Link>
            <Button asChild size="sm">
              <Link href="/app">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex-1 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Simple Pricing</h1>
          <p className="text-lg text-muted-foreground mb-12">Start free. Upgrade when you need more power.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Free</CardTitle>
                <div className="text-3xl font-bold">$0</div>
                <p className="text-sm text-muted-foreground">Forever free</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {['3 invoices per month', 'Basic templates', 'PDF export', 'localStorage save', 'Watermark on PDF'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    {f}
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full mt-4">
                  <Link href="/app">Start Free</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">Pro</CardTitle>
                <div className="text-3xl font-bold">$9<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                <p className="text-sm text-muted-foreground">or $79/year (27% off)</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {['Unlimited invoices', 'All 10+ templates', 'Custom branding colors', 'Invoice history & search', 'Export CSV/Excel', 'No watermark'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    {f}
                  </div>
                ))}
                <Button className="w-full mt-4">Upgrade to Pro</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Team</CardTitle>
                <div className="text-3xl font-bold">$29<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                <p className="text-sm text-muted-foreground">For growing businesses</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {['Everything in Pro', 'Up to 5 team members', 'Shared templates', 'Admin dashboard', 'API access (soon)', 'Priority support'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    {f}
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full mt-4">
                  <Link href="mailto:team@invoicepro.app">Contact Sales</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
