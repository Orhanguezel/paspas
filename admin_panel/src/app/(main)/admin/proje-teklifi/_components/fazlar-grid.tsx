"use client";

import * as React from "react";

import {
  ArrowRight,
  Brain,
  Inbox,
  MessagesSquare,
  Package,
  Radar,
  Smartphone,
  Sparkles,
  Store,
  TrendingUp,
  UserSearch,
  Wrench,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";

import { FAZLAR } from "../_lib/teklif-data";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Wrench,
  Inbox,
  TrendingUp,
  UserSearch,
  Package,
  Radar,
  Store,
  Brain,
  MessagesSquare,
  Smartphone,
  Sparkles,
};

const RENK_MAP: Record<string, { card: string; icon: string; iconBg: string; line: string; badge: string }> = {
  red: {
    card: "border-red-200 hover:border-red-400 hover:shadow-red-100 dark:border-red-900 dark:hover:border-red-700",
    icon: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-900/50",
    line: "from-red-500 to-rose-500",
    badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  },
  amber: {
    card: "border-amber-200 hover:border-amber-400 hover:shadow-amber-100 dark:border-amber-900 dark:hover:border-amber-700",
    icon: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    line: "from-amber-500 to-orange-500",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  },
  blue: {
    card: "border-blue-200 hover:border-blue-400 hover:shadow-blue-100 dark:border-blue-900 dark:hover:border-blue-700",
    icon: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    line: "from-blue-500 to-indigo-500",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  },
  indigo: {
    card: "border-indigo-200 hover:border-indigo-400 hover:shadow-indigo-100 dark:border-indigo-900 dark:hover:border-indigo-700",
    icon: "text-indigo-600 dark:text-indigo-400",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
    line: "from-indigo-500 to-violet-500",
    badge: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
  },
  emerald: {
    card: "border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100 dark:border-emerald-900 dark:hover:border-emerald-700",
    icon: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
    line: "from-emerald-500 to-teal-500",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  },
  rose: {
    card: "border-rose-200 hover:border-rose-400 hover:shadow-rose-100 dark:border-rose-900 dark:hover:border-rose-700",
    icon: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-100 dark:bg-rose-900/50",
    line: "from-rose-500 to-pink-500",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
  },
  violet: {
    card: "border-violet-200 hover:border-violet-400 hover:shadow-violet-100 dark:border-violet-900 dark:hover:border-violet-700",
    icon: "text-violet-600 dark:text-violet-400",
    iconBg: "bg-violet-100 dark:bg-violet-900/50",
    line: "from-violet-500 to-purple-500",
    badge: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  },
  purple: {
    card: "border-purple-200 hover:border-purple-400 hover:shadow-purple-100 dark:border-purple-900 dark:hover:border-purple-700",
    icon: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-100 dark:bg-purple-900/50",
    line: "from-purple-500 to-fuchsia-500",
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
  },
  fuchsia: {
    card: "border-fuchsia-200 hover:border-fuchsia-400 hover:shadow-fuchsia-100 dark:border-fuchsia-900 dark:hover:border-fuchsia-700",
    icon: "text-fuchsia-600 dark:text-fuchsia-400",
    iconBg: "bg-fuchsia-100 dark:bg-fuchsia-900/50",
    line: "from-fuchsia-500 to-pink-500",
    badge: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/40 dark:text-fuchsia-200",
  },
  cyan: {
    card: "border-cyan-200 hover:border-cyan-400 hover:shadow-cyan-100 dark:border-cyan-900 dark:hover:border-cyan-700",
    icon: "text-cyan-600 dark:text-cyan-400",
    iconBg: "bg-cyan-100 dark:bg-cyan-900/50",
    line: "from-cyan-500 to-sky-500",
    badge: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200",
  },
  slate: {
    card: "border-slate-300 hover:border-slate-500 hover:shadow-slate-100 dark:border-slate-700 dark:hover:border-slate-500",
    icon: "text-slate-600 dark:text-slate-400",
    iconBg: "bg-slate-100 dark:bg-slate-800",
    line: "from-slate-400 to-zinc-500",
    badge: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  },
};

const DURUM_LABEL: Record<string, { label: string; emoji: string; class: string }> = {
  tamam: {
    label: "Tamamlandı",
    emoji: "✅",
    class: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  },
  devam: {
    label: "Devam Ediyor",
    emoji: "🔄",
    class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
  },
  planli: {
    label: "Planda",
    emoji: "📅",
    class: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  },
  vizyon: {
    label: "Vizyon",
    emoji: "✨",
    class: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
  },
};

export default function FazlarGrid() {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-bold text-2xl text-foreground lg:text-3xl">11 Fazlı Yol Haritası</h2>
          <p className="mt-1 text-muted-foreground">
            Her faz tek başına çalışır, kendi başına değer üretir, sonraki fazı besler. Sıralama esnek.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {Object.entries(DURUM_LABEL).map(([key, info]) => (
            <Badge key={key} variant="outline" className={`${info.class} border-0`}>
              {info.emoji} {info.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FAZLAR.map((faz) => {
          const Icon = ICONS[faz.ikon] ?? Sparkles;
          const renk = RENK_MAP[faz.renk] ?? RENK_MAP.blue;
          const durum = DURUM_LABEL[faz.durum];

          return (
            <Link
              key={faz.no}
              href={`/admin/proje-teklifi/dokuman/${faz.detayDokuman}`}
              className={`group relative overflow-hidden rounded-xl border bg-card p-5 transition hover:shadow-lg ${renk.card}`}
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${renk.line}`} aria-hidden />

              <div className="flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${renk.iconBg}`}>
                  <Icon className={`h-6 w-6 ${renk.icon}`} />
                </div>
                <div className="text-right">
                  <div className="font-mono text-3xl font-bold text-muted-foreground/40 group-hover:text-muted-foreground/70 transition">
                    {String(faz.no).padStart(2, "0")}
                  </div>
                </div>
              </div>

              <h3 className="mt-4 font-semibold text-foreground text-lg leading-snug">
                {faz.baslik}
              </h3>
              <p className="mt-2 line-clamp-2 text-muted-foreground text-sm">{faz.ozet}</p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {faz.ana.slice(0, 3).map((a) => (
                  <span
                    key={a}
                    className={`rounded-md px-2 py-0.5 font-medium text-[11px] ${renk.badge}`}
                  >
                    {a}
                  </span>
                ))}
                {faz.ana.length > 3 ? (
                  <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-[11px] text-muted-foreground">
                    +{faz.ana.length - 3}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex items-center justify-between border-border border-t pt-3 text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${durum.class} border-0 text-[10px]`}>
                    {durum.emoji} {durum.label}
                  </Badge>
                  <span className="text-muted-foreground">{faz.sure}</span>
                </div>
                <ArrowRight className={`h-4 w-4 ${renk.icon} transition group-hover:translate-x-1`} />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
