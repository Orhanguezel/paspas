"use client";

import { ArrowRight, CheckCircle2, MessageCircleQuestion } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const KARAR_NOKTALARI = [
  {
    no: 1,
    soru: "Faz sıralaması doğru mu?",
    detay: "Önce Paspas tamamlanma, paralel hazırlık. Faz 6 (Portal) öncelendirmesin mi?",
    onerim: "Hayır — Faz 0 olmadan stabilite riski. Paralel hazırlık olabilir.",
  },
  {
    no: 2,
    soru: "Bütçe başlangıç senaryosu nedir?",
    detay: "Senaryo A ($50-100/ay free tier) mı, doğrudan B ($430-500/ay) mı?",
    onerim: "A — ihtiyaç doğunca B'ye geç. İlk 6 ay free tier yeter.",
  },
  {
    no: 3,
    soru: "AI otomasyon eşiği nasıl?",
    detay: "İlk 3 ay tüm öneriler manuel onay; sonra kademeli aç. Onay?",
    onerim: "Evet — öğrenme dönemi şart. Risk 4-6 düşük aksiyonlar 3 ay sonra otomatik.",
  },
  {
    no: 4,
    soru: "MatPortal bayi-side branding ne olsun?",
    detay: "'Promats Bayi Portalı' / 'MatPortal' / başka isim mi?",
    onerim: "Promats marka kimliği — bayinin gözünde 'Promats Bayi Portalı'.",
  },
];

export default function KararNoktalari() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-bold text-2xl text-foreground lg:text-3xl">Karar Beklenen Noktalar</h2>
        <p className="mt-1 text-muted-foreground">
          Bu doküman karar vermek için değil, <strong>karar zemini hazırlamak için</strong> yazıldı. Promats yönetiminin
          onaylaması gereken 4 başlık:
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {KARAR_NOKTALARI.map((k) => (
          <div
            key={k.no}
            className="group rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 font-bold text-amber-700 dark:from-amber-900/50 dark:to-orange-900/50 dark:text-amber-300">
                {k.no}
              </div>
              <div className="flex-1">
                <div className="flex items-start gap-2">
                  <MessageCircleQuestion className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <h3 className="font-semibold text-foreground">{k.soru}</h3>
                </div>
                <p className="mt-2 text-muted-foreground text-sm">{k.detay}</p>
                <div className="mt-3 flex items-start gap-2 rounded-md bg-emerald-50 p-2.5 dark:bg-emerald-950/30">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <span className="font-medium text-emerald-800 text-xs uppercase tracking-wider dark:text-emerald-300">
                      Önerim
                    </span>
                    <p className="mt-0.5 text-emerald-900 text-sm dark:text-emerald-100">{k.onerim}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-violet-50 p-8 text-center dark:from-blue-950/40 dark:to-violet-950/40 dark:border-blue-800">
        <h3 className="font-bold text-2xl text-foreground">Detaylı incelemeye hazır mısınız?</h3>
        <p className="mt-2 text-muted-foreground">
          Tek sayfa özetten başlayın, yönetici özetine geçin, sonra ilgilendiğiniz fazın derinlemesine dokümanını
          okuyun. Her dokümanın altında <strong>yazılımcı notları</strong> bölümü var — soru/yorum yazabilirsiniz.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700">
            <Link href="/admin/proje-teklifi/dokuman/ozet">
              Tek Sayfa Özet
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/admin/proje-teklifi/dokuman/00">
              Yönetici Özeti
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/admin/proje-teklifi/dokuman/02">
              Çözüm Genel Bakış
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
