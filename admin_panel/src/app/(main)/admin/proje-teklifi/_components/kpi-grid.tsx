"use client";

import { ArrowDownRight, ArrowUpRight, Target, TrendingDown, TrendingUp } from "lucide-react";

import { KPI_LIST } from "../_lib/teklif-data";

const RENK_MAP: Record<string, { card: string; iconBg: string; iconText: string; arrowText: string }> = {
  violet: {
    card: "bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200 dark:from-violet-950/30 dark:to-purple-950/30 dark:border-violet-800",
    iconBg: "bg-violet-100 dark:bg-violet-900/50",
    iconText: "text-violet-600 dark:text-violet-400",
    arrowText: "text-violet-600 dark:text-violet-400",
  },
  blue: {
    card: "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-800",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    iconText: "text-blue-600 dark:text-blue-400",
    arrowText: "text-blue-600 dark:text-blue-400",
  },
  emerald: {
    card: "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 dark:from-emerald-950/30 dark:to-teal-950/30 dark:border-emerald-800",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
    iconText: "text-emerald-600 dark:text-emerald-400",
    arrowText: "text-emerald-600 dark:text-emerald-400",
  },
  rose: {
    card: "bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200 dark:from-rose-950/30 dark:to-pink-950/30 dark:border-rose-800",
    iconBg: "bg-rose-100 dark:bg-rose-900/50",
    iconText: "text-rose-600 dark:text-rose-400",
    arrowText: "text-rose-600 dark:text-rose-400",
  },
};

export default function KpiGrid() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-bold text-2xl text-foreground lg:text-3xl">Hedef KPI'lar (12 Ay)</h2>
        <p className="mt-1 text-muted-foreground">
          Başarı kriterleri — her kategori 7 alt KPI ile detaylı izlenir.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {KPI_LIST.map((kpi) => {
          const renk = RENK_MAP[kpi.renk] ?? RENK_MAP.blue;
          const ArrowIcon = kpi.yon === "yukari" ? ArrowUpRight : ArrowDownRight;
          const TrendIcon = kpi.yon === "yukari" ? TrendingUp : TrendingDown;

          return (
            <div
              key={`${kpi.kategori}-${kpi.baslik}`}
              className={`relative rounded-xl border ${renk.card} p-5 transition hover:scale-[1.01] hover:shadow-md`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-muted-foreground text-xs uppercase tracking-wider">
                    {kpi.kategori}
                  </div>
                  <h3 className="mt-1 font-semibold text-foreground">{kpi.baslik}</h3>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${renk.iconBg}`}>
                  <TrendIcon className={`h-5 w-5 ${renk.iconText}`} />
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-3">
                <span className={`font-bold text-2xl ${renk.iconText}`}>{kpi.hedef}</span>
                <ArrowIcon className={`h-4 w-4 ${renk.arrowText}`} />
                <span className="text-muted-foreground text-sm">{kpi.fark}</span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-muted-foreground text-xs">
                <Target className="h-3 w-3" />
                Mevcut: <span className="font-medium">{kpi.baseline}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
