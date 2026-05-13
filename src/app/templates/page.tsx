import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { templates } from '@/types';

export default function TemplatesPage() {
  return (
    <div className="min-h-full flex flex-col">
      <nav className="w-full border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg">InvoicePro</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </Button>
        </div>
      </nav>

      <div className="flex-1 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Invoice Templates</h1>
          <p className="text-muted-foreground mb-10">Choose a template. Customize everything. Export as PDF.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {templates.map((t) => (
              <Card key={t.id} className="overflow-hidden">
                <div className={`h-40 flex items-center justify-center ${
                  t.id === 'modern' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                  t.id === 'classic' ? 'bg-zinc-100 dark:bg-zinc-800' :
                  'bg-white dark:bg-zinc-900 border-b'
                }`}>
                  <div className={`text-center ${t.id === 'modern' ? 'text-white' : ''}`}>
                    <div className="text-2xl font-bold">INVOICE</div>
                    <div className="text-sm opacity-80">#001 • $100.00</div>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{t.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={`/app?template=${t.id}`}>Use Template</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
