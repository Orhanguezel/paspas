import { TrendingDown, TrendingUp, DollarSign, Users, Activity, BarChart3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// =============================================================
// FILE: src/app/(main)/admin/dashboard/default/_components/section-cards.tsx
// FINAL — Admin Dashboard KPI Cards (POLISHED)
// =============================================================

export function SectionCards() {
  return (
    <div className="grid @5xl/main:grid-cols-4 @xl/main:grid-cols-2 grid-cols-1 gap-6">
      {/* Revenue Card */}
      <Card className="@container/card bg-gm-surface/20 border-gm-border-soft rounded-[32px] backdrop-blur-sm shadow-xl hover:border-gm-gold/30 transition-all group overflow-hidden">
        <CardHeader className="relative">
          <div className="absolute top-6 right-8 opacity-10 group-hover:opacity-20 transition-all text-gm-gold">
            <DollarSign size={48} />
          </div>
          <CardDescription className="text-gm-muted font-serif italic text-base">Toplam Gelir</CardDescription>
          <CardTitle className="font-serif text-3xl tabular-nums text-gm-gold mt-1">₺124,500.00</CardTitle>
          <CardAction>
            <Badge className="bg-gm-success/10 text-gm-success border-gm-success/20 rounded-full px-3 py-1 text-[10px] font-bold">
              <TrendingUp className="mr-1 size-3" />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-xs">
          <div className="line-clamp-1 flex items-center gap-2 font-bold tracking-widest uppercase text-gm-muted">
            BU AY ARTIŞ <TrendingUp className="size-3 text-gm-success" />
          </div>
        </CardFooter>
      </Card>

      {/* New Customers Card */}
      <Card className="@container/card bg-gm-surface/20 border-gm-border-soft rounded-[32px] backdrop-blur-sm shadow-xl hover:border-gm-primary/30 transition-all group overflow-hidden">
        <CardHeader className="relative">
          <div className="absolute top-6 right-8 opacity-10 group-hover:opacity-20 transition-all text-gm-primary">
            <Users size={48} />
          </div>
          <CardDescription className="text-gm-muted font-serif italic text-base">Yeni kayıtlar</CardDescription>
          <CardTitle className="font-serif text-3xl tabular-nums text-foreground mt-1">1,234</CardTitle>
          <CardAction>
            <Badge className="bg-gm-error/10 text-gm-error border-gm-error/20 rounded-full px-3 py-1 text-[10px] font-bold">
              <TrendingDown className="mr-1 size-3" />
              -20%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-xs">
          <div className="line-clamp-1 flex items-center gap-2 font-bold tracking-widest uppercase text-gm-muted">
            PERFORMANS DÜŞÜŞÜ <TrendingDown className="size-3 text-gm-error" />
          </div>
        </CardFooter>
      </Card>

      {/* Active Accounts Card */}
      <Card className="@container/card bg-gm-surface/20 border-gm-border-soft rounded-[32px] backdrop-blur-sm shadow-xl hover:border-gm-gold/30 transition-all group overflow-hidden">
        <CardHeader className="relative">
          <div className="absolute top-6 right-8 opacity-10 group-hover:opacity-20 transition-all text-gm-gold">
            <Activity size={48} />
          </div>
          <CardDescription className="text-gm-muted font-serif italic text-base">Aktif oturumlar</CardDescription>
          <CardTitle className="font-serif text-3xl tabular-nums text-foreground mt-1">456</CardTitle>
          <CardAction>
            <Badge className="bg-gm-success/10 text-gm-success border-gm-success/20 rounded-full px-3 py-1 text-[10px] font-bold">
              <TrendingUp className="mr-1 size-3" />
              +8.2%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-xs">
          <div className="line-clamp-1 flex items-center gap-2 font-bold tracking-widest uppercase text-gm-muted">
            SÜREKLİLİK ARTIYOR <TrendingUp className="size-3 text-gm-success" />
          </div>
        </CardFooter>
      </Card>

      {/* Growth Rate Card */}
      <Card className="@container/card bg-gm-surface/20 border-gm-border-soft rounded-[32px] backdrop-blur-sm shadow-xl hover:border-gm-primary/30 transition-all group overflow-hidden">
        <CardHeader className="relative">
          <div className="absolute top-6 right-8 opacity-10 group-hover:opacity-20 transition-all text-gm-primary">
            <BarChart3 size={48} />
          </div>
          <CardDescription className="text-gm-muted font-serif italic text-base">Büyüme Oranı</CardDescription>
          <CardTitle className="font-serif text-3xl tabular-nums text-foreground mt-1">4.5%</CardTitle>
          <CardAction>
            <Badge className="bg-gm-primary/10 text-gm-primary border-gm-primary/20 rounded-full px-3 py-1 text-[10px] font-bold">
              <TrendingUp className="mr-1 size-3" />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-xs">
          <div className="line-clamp-1 flex items-center gap-2 font-bold tracking-widest uppercase text-gm-muted">
            İSTİKRARLI BÜYÜME <TrendingUp className="size-3 text-gm-primary" />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
