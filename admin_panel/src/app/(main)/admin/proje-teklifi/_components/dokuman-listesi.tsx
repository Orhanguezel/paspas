"use client";

import { ArrowRight, BookOpen, FileText, Sparkles } from "lucide-react";
import Link from "next/link";

import { TARTISMA_DOCS, TEKLIF_DOCS } from "../_lib/teklif-data";

export default function DokumanListesi() {
  const teklifAna = TEKLIF_DOCS.filter((d) => d.key !== "index" && d.key !== "ozet");
  const tartisma = TARTISMA_DOCS.filter((d) => d.key !== "t-index");

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-bold text-2xl text-foreground lg:text-3xl">Tüm Dokümanlar</h2>
        <p className="mt-1 text-muted-foreground">
          12 ana proje teklifi + 16 tartışma dokümanı = toplam 260+ özellik detayı.
        </p>
      </div>

      {/* Ana Teklif Dokümanları */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-foreground">Resmî Proje Teklifi (12 bölüm)</h3>
          <span className="ml-auto text-muted-foreground text-xs">Promats yönetimi okur</span>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {teklifAna.map((doc) => (
            <Link
              key={doc.key}
              href={`/admin/proje-teklifi/dokuman/${doc.key}`}
              className="group flex items-start gap-3 rounded-md border border-border bg-background p-3 transition hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/50">
                <span className="font-mono font-bold text-blue-700 text-xs dark:text-blue-300">
                  {doc.key.padStart(2, "0")}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-foreground text-sm">
                  {doc.title.replace(/^\d+ — /, "")}
                </div>
                {doc.description ? (
                  <div className="mt-0.5 line-clamp-1 text-muted-foreground text-xs">
                    {doc.description}
                  </div>
                ) : null}
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
            </Link>
          ))}
        </div>
      </div>

      {/* Tartışma Dokümanları */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-violet-600" />
          <h3 className="font-semibold text-foreground">Tartışma Dokümanları (16 dokümanı — kapsamlı teknik)</h3>
          <span className="ml-auto text-muted-foreground text-xs">İç tartışma + derinlemesine</span>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {tartisma.map((doc) => {
            const isDeep = ["t-12", "t-13", "t-14", "t-15"].includes(doc.key);
            return (
              <Link
                key={doc.key}
                href={`/admin/proje-teklifi/dokuman/${doc.key}`}
                className={`group flex items-start gap-3 rounded-md border border-border bg-background p-3 transition hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 ${
                  isDeep ? "ring-1 ring-fuchsia-200 dark:ring-fuchsia-900" : ""
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
                    isDeep ? "bg-fuchsia-100 dark:bg-fuchsia-900/50" : "bg-violet-100 dark:bg-violet-900/50"
                  }`}
                >
                  {isDeep ? (
                    <Sparkles
                      className="h-4 w-4 text-fuchsia-700 dark:text-fuchsia-300"
                    />
                  ) : (
                    <span className="font-mono font-bold text-violet-700 text-xs dark:text-violet-300">
                      {doc.key.replace("t-", "").padStart(2, "0")}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground text-sm">{doc.title}</div>
                  {isDeep ? (
                    <div className="mt-0.5 text-fuchsia-600 text-[10px] uppercase tracking-wider dark:text-fuchsia-400">
                      Derinlemesine teknik
                    </div>
                  ) : null}
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-violet-600" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
