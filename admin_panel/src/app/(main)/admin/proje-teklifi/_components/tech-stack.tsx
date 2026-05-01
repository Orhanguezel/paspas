"use client";

import {
  Bot,
  Cloud,
  Code2,
  Database,
  Globe,
  Smartphone,
  Workflow,
} from "lucide-react";

import { TECH_STACK } from "../_lib/teklif-data";

const KATEGORI_INFO: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  backend: { label: "Backend", icon: Database, color: "blue" },
  frontend: { label: "Frontend", icon: Globe, color: "violet" },
  ml: { label: "ML / Python", icon: Workflow, color: "purple" },
  scraping: { label: "Scraping", icon: Code2, color: "emerald" },
  ai: { label: "AI / LLM", icon: Bot, color: "fuchsia" },
  mobile: { label: "Mobil", icon: Smartphone, color: "cyan" },
  infra: { label: "Altyapı", icon: Cloud, color: "amber" },
};

const RENK_BORDER: Record<string, string> = {
  blue: "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20",
  violet: "border-violet-200 bg-violet-50/50 dark:border-violet-800 dark:bg-violet-950/20",
  purple: "border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20",
  emerald: "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20",
  fuchsia: "border-fuchsia-200 bg-fuchsia-50/50 dark:border-fuchsia-800 dark:bg-fuchsia-950/20",
  cyan: "border-cyan-200 bg-cyan-50/50 dark:border-cyan-800 dark:bg-cyan-950/20",
  amber: "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20",
};

const RENK_ICON: Record<string, string> = {
  blue: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/50",
  violet: "text-violet-600 bg-violet-100 dark:text-violet-400 dark:bg-violet-900/50",
  purple: "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/50",
  emerald: "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/50",
  fuchsia: "text-fuchsia-600 bg-fuchsia-100 dark:text-fuchsia-400 dark:bg-fuchsia-900/50",
  cyan: "text-cyan-600 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-900/50",
  amber: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/50",
};

const RENK_BADGE: Record<string, string> = {
  blue: "bg-white text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-800",
  violet: "bg-white text-violet-800 border-violet-200 dark:bg-violet-950/60 dark:text-violet-200 dark:border-violet-800",
  purple: "bg-white text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-800",
  emerald: "bg-white text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800",
  fuchsia: "bg-white text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-950/60 dark:text-fuchsia-200 dark:border-fuchsia-800",
  cyan: "bg-white text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-200 dark:border-cyan-800",
  amber: "bg-white text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800",
};

export default function TechStack() {
  const grouped = TECH_STACK.reduce<Record<string, typeof TECH_STACK>>((acc, item) => {
    if (!acc[item.kategori]) acc[item.kategori] = [];
    acc[item.kategori].push(item);
    return acc;
  }, {});

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-bold text-2xl text-foreground lg:text-3xl">Teknoloji Stack</h2>
        <p className="mt-1 text-muted-foreground">
          Mevcut Promats stack ile uyumlu, multi-deployment hazır, vendor lock-in yok.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(grouped).map(([key, items]) => {
          const info = KATEGORI_INFO[key];
          if (!info) return null;
          const Icon = info.icon;

          return (
            <div
              key={key}
              className={`rounded-xl border p-5 ${RENK_BORDER[info.color] ?? RENK_BORDER.blue}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${RENK_ICON[info.color] ?? RENK_ICON.blue}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">{info.label}</h3>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {items.map((item) => (
                  <span
                    key={item.isim}
                    className={`rounded-md border px-2 py-1 text-xs font-medium ${RENK_BADGE[info.color] ?? RENK_BADGE.blue}`}
                  >
                    {item.isim}
                    {item.versiyon ? <span className="ml-1 text-[10px] opacity-60">{item.versiyon}</span> : null}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
