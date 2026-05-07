'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Trash2,
  RefreshCcw,
  Globe,
  Star,
  Calendar,
  LogIn,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

async function revalidate(opts: { all?: boolean; path?: string }) {
  const res = await fetch('/api/revalidate-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Revalidation failed');
  return data;
}

const CACHE_ACTIONS = [
  {
    id: 'all',
    label: 'Tüm Site Cache',
    description: "Tüm sayfaların cache'ini temizler. Tema/tasarım değişiklikleri ve site ayarları için bunu kullanın.",
    icon: Globe,
    action: () => revalidate({ all: true }),
    variant: 'destructive' as const,
  },
  {
    id: 'home',
    label: 'Ana Sayfa',
    description: "Ana sayfanın cache'ini temizler.",
    icon: Globe,
    action: () => revalidate({ path: '/tr' }),
  },
  {
    id: 'birth-chart',
    label: 'Doğum Haritası',
    description: "Doğum haritası sayfası cache'ini temizler.",
    icon: Sparkles,
    action: () => revalidate({ path: '/tr/birth-chart' }),
  },
  {
    id: 'consultants',
    label: 'Danışmanlar',
    description: "Danışman listesi ve detay sayfaları cache'ini temizler.",
    icon: Star,
    action: () => revalidate({ path: '/tr/consultants' }),
  },
  {
    id: 'booking',
    label: 'Randevu',
    description: "Randevu akışının cache'ini temizler.",
    icon: Calendar,
    action: () => revalidate({ path: '/tr/booking' }),
  },
  {
    id: 'auth',
    label: 'Giriş / Kayıt',
    description: "Giriş ve kayıt sayfalarının cache'ini temizler.",
    icon: LogIn,
    action: () => revalidate({ path: '/tr/auth/login' }),
  },
];

export default function CacheManagementClient() {
  const [loading, setLoading] = React.useState<string | null>(null);
  const [lastCleared, setLastCleared] = React.useState<Record<string, string>>({});

  async function handleClear(id: string, action: () => Promise<any>) {
    setLoading(id);
    try {
      await action();
      const now = new Date().toLocaleTimeString('tr-TR');
      setLastCleared((prev) => ({ ...prev, [id]: now }));
      toast.success(id === 'all' ? 'Tüm site cache temizlendi' : 'Cache temizlendi');
    } catch (err: any) {
      toast.error(err?.message || 'Cache temizlenemedi');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="w-8 h-px bg-gm-gold" />
          <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">Performans & Veri</span>
        </div>
        <h1 className="font-serif text-4xl text-gm-text">Cache Yönetimi</h1>
        <p className="text-gm-muted text-sm font-serif italic opacity-70">
          Frontend sayfalarının cache'ini temizleyerek içerik güncellemelerinin anında yansımasını sağlayın.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-8 items-start">
        <Card className="bg-gm-bg-deep/50 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl">
          <CardContent className="p-10 space-y-8">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-gm-gold/10 flex items-center justify-center text-gm-gold border border-gm-gold/20 shadow-inner">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="text-gm-text font-serif text-xl">Hızlı Temizleme</h3>
                <p className="text-[10px] font-bold text-gm-muted tracking-widest uppercase">Sayfa Bazlı Cache Kontrolü</p>
              </div>
            </div>

            <div className="space-y-4">
              {CACHE_ACTIONS.map((item, idx) => (
                <div 
                  key={item.id} 
                  className={cn(
                    "flex flex-col md:flex-row items-center justify-between rounded-[24px] border border-gm-border-soft p-6 gap-6 transition-all hover:bg-gm-primary/[0.02] group",
                    item.id === 'all' && "bg-gm-error/[0.02] border-gm-error/20"
                  )}
                >
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className={cn(
                      "flex size-14 items-center justify-center rounded-2xl bg-gm-surface border border-gm-border-soft group-hover:border-gm-gold/30 transition-colors shadow-inner shrink-0",
                      item.id === 'all' && "bg-gm-error/10 border-gm-error/20"
                    )}>
                      <item.icon className={cn("size-6 text-gm-muted group-hover:text-gm-gold transition-colors", item.id === 'all' && "text-gm-error")} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-serif text-gm-text">{item.label}</span>
                        {lastCleared[item.id] && (
                          <Badge className="bg-gm-gold/10 text-gm-gold border-gm-gold/20 text-[9px] font-mono rounded-full px-2">
                            {lastCleared[item.id]}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gm-muted opacity-70 truncate md:whitespace-normal">{item.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleClear(item.id, item.action)}
                    disabled={loading !== null}
                    className={cn(
                      "rounded-full px-8 h-12 text-[10px] font-bold tracking-widest uppercase transition-all shadow-lg backdrop-blur-sm shrink-0",
                      item.id === 'all' 
                        ? "bg-gm-error/10 border-gm-error/40 text-gm-error hover:bg-gm-error hover:text-black" 
                        : "border-gm-border-soft text-gm-text hover:bg-gm-surface"
                    )}
                  >
                    {loading === item.id ? (
                      <RefreshCcw className="mr-2 size-4 animate-spin text-gm-gold" />
                    ) : (
                      <Trash2 className="mr-2 size-4 text-gm-gold" />
                    )}
                    Temizle
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-3 text-gm-gold">
              <Info size={18} />
              <h3 className="text-sm font-bold tracking-widest uppercase">Önemli Bilgiler</h3>
            </div>
            
            <div className="space-y-4 text-gm-text text-sm font-serif italic opacity-80 leading-relaxed">
              <p>
                Frontend sayfaları standart olarak <span className="text-gm-gold">5 dakika (300 saniye)</span> boyunca cache'lenir.
              </p>
              <Separator className="bg-gm-border-soft" />
              <p>
                Cache temizlendiğinde sayfalar bir sonraki ziyarette API'den en güncel verileri çeker.
              </p>
              <Separator className="bg-gm-border-soft" />
              <p>
                Tema şablonu veya global site ayarı değiştirildiğinde tüm cache <span className="text-gm-text not-italic font-bold underline decoration-gm-gold/50">otomatik</span> olarak temizlenir.
              </p>
            </div>

            <div className="pt-4">
              <div className="rounded-2xl bg-gm-gold/5 border border-gm-gold/10 p-4">
                <p className="text-[10px] text-gm-gold font-bold uppercase tracking-tighter text-center">
                  Sadece içerik güncellemelerinde kullanın.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
