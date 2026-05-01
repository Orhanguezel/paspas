"use client";

import * as React from "react";

import {
  AppWindow,
  Brain,
  Database,
  Inbox,
  MessagesSquare,
  Radar,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { KATMANLAR } from "../_lib/teklif-data";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  MessagesSquare,
  AppWindow,
  Brain,
  TrendingUp,
  Radar,
  Inbox,
  Database,
};

// Tailwind class lookup (string interpolation çalışmaz)
const RENK_MAP: Record<
  string,
  { bg: string; border: string; iconBg: string; iconText: string; badgeBg: string; badgeText: string; line: string }
> = {
  fuchsia: {
    bg: "bg-fuchsia-50 dark:bg-fuchsia-950/30",
    border: "border-fuchsia-200 dark:border-fuchsia-800",
    iconBg: "bg-fuchsia-100 dark:bg-fuchsia-900/50",
    iconText: "text-fuchsia-600 dark:text-fuchsia-400",
    badgeBg: "bg-fuchsia-100 dark:bg-fuchsia-900/50",
    badgeText: "text-fuchsia-800 dark:text-fuchsia-200",
    line: "from-fuchsia-500 to-pink-500",
  },
  violet: {
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-800",
    iconBg: "bg-violet-100 dark:bg-violet-900/50",
    iconText: "text-violet-600 dark:text-violet-400",
    badgeBg: "bg-violet-100 dark:bg-violet-900/50",
    badgeText: "text-violet-800 dark:text-violet-200",
    line: "from-violet-500 to-purple-500",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-800",
    iconBg: "bg-purple-100 dark:bg-purple-900/50",
    iconText: "text-purple-600 dark:text-purple-400",
    badgeBg: "bg-purple-100 dark:bg-purple-900/50",
    badgeText: "text-purple-800 dark:text-purple-200",
    line: "from-purple-500 to-indigo-500",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    iconText: "text-blue-600 dark:text-blue-400",
    badgeBg: "bg-blue-100 dark:bg-blue-900/50",
    badgeText: "text-blue-800 dark:text-blue-200",
    line: "from-blue-500 to-cyan-500",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
    iconText: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-100 dark:bg-emerald-900/50",
    badgeText: "text-emerald-800 dark:text-emerald-200",
    line: "from-emerald-500 to-teal-500",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    iconText: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-100 dark:bg-amber-900/50",
    badgeText: "text-amber-800 dark:text-amber-200",
    line: "from-amber-500 to-orange-500",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    iconBg: "bg-red-100 dark:bg-red-900/50",
    iconText: "text-red-600 dark:text-red-400",
    badgeBg: "bg-red-100 dark:bg-red-900/50",
    badgeText: "text-red-800 dark:text-red-200",
    line: "from-red-500 to-rose-500",
  },
};

export default function MimariKatmanlar() {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-bold text-2xl text-foreground lg:text-3xl">7 Katmanlı Mimari</h2>
          <p className="mt-1 text-muted-foreground">
            Her katman bir önceki katmandan veri alır, üst katmana servis eder. Üstten alta:{" "}
            <strong>aksiyon</strong>; alttan üste: <strong>veri/sinyal</strong>.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {KATMANLAR.map((k) => {
          const Icon = ICONS[k.ikon] ?? Database;
          const renk = RENK_MAP[k.renk] ?? RENK_MAP.blue;

          return (
            <div
              key={k.kod}
              className={`group relative overflow-hidden rounded-xl border ${renk.border} ${renk.bg} p-5 transition hover:shadow-md`}
            >
              <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${renk.line}`} aria-hidden />

              <div className="flex items-start gap-4 pl-2">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${renk.iconBg}`}
                >
                  <Icon className={`h-6 w-6 ${renk.iconText}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={`font-bold font-mono ${renk.badgeBg} ${renk.badgeText} border-0`}>
                      {k.kod}
                    </Badge>
                    <h3 className="font-semibold text-foreground text-lg">{k.baslik}</h3>
                    <span className="text-muted-foreground text-xs">
                      Faz {k.fazlar.join(", ")}
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground text-sm">{k.altbaslik}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
