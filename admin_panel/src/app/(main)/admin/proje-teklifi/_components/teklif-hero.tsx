"use client";

import { ArrowRight, FileText, Layers, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { STATS } from "../_lib/teklif-data";

export default function TeklifHero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-blue-50 via-violet-50 to-fuchsia-50 px-6 py-12 shadow-sm dark:from-blue-950/40 dark:via-violet-950/40 dark:to-fuchsia-950/40 lg:px-12 lg:py-16">
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl" />

      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-3 py-1 text-xs font-medium text-blue-700 backdrop-blur dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
          <Sparkles className="h-3 w-3" />
          MatPortal · v1.1 · 2026-05-01
        </div>

        <h1 className="mt-6 max-w-4xl bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 bg-clip-text font-extrabold text-4xl text-transparent leading-tight lg:text-6xl">
          Paspas ERP üzerine
          <br />
          11 fazlı dijital dönüşüm
        </h1>

        <p className="mt-5 max-w-3xl text-base text-muted-foreground lg:text-lg">
          Mevcut Paspas Üretim ERP'sini <strong>piyasayı dinleyen, talebi öngören, kendi kendini düzelten</strong>{" "}
          bir ekosisteme dönüştüren proje teklifi: bayi portalı + sipariş tahmin motoru + churn radarı + AI destekli
          otomasyon.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Link href="/admin/proje-teklifi/dokuman/00">
              <FileText className="h-4 w-4" />
              Yönetici Özetini Aç
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/admin/proje-teklifi/dokuman/ozet">
              <Layers className="h-4 w-4" />
              Tek Sayfa Özet
            </Link>
          </Button>
        </div>

        {/* Stats banner */}
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Faz" value={STATS.fazSayisi} accent="from-red-500 to-rose-500" />
          <StatCard label="Modül" value={STATS.modulSayisi} accent="from-amber-500 to-orange-500" />
          <StatCard label="Özellik" value={STATS.ozellikSayisi} accent="from-blue-500 to-indigo-500" />
          <StatCard label="DB Tablosu" value={`${STATS.veriTablosuSayisi}+`} accent="from-emerald-500 to-teal-500" />
          <StatCard label="Süre" value={STATS.toplamSure} accent="from-violet-500 to-fuchsia-500" small />
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: string | number;
  accent: string;
  small?: boolean;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card/80 p-4 backdrop-blur transition hover:scale-[1.02] hover:shadow-md">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`}
        aria-hidden
      />
      <div className={`font-bold ${small ? "text-lg" : "text-3xl"} text-foreground`}>{value}</div>
      <div className="mt-1 font-medium text-muted-foreground text-xs uppercase tracking-wider">{label}</div>
    </div>
  );
}
