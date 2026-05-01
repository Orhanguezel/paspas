"use client";

import { useMemo, useState } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Factory,
  FileSpreadsheet,
  Package,
  Printer,
  RefreshCw,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import {
  useGetVardiyaAnaliziAdminQuery,
  useGetVardiyaTrendAdminQuery,
  type KalipRollup,
  type MakineRollup,
  type VardiyaAnalizItem,
} from "@/integrations/endpoints/admin/erp/vardiya_analizi_admin.endpoints";
import {
  downloadReportAsExcel,
  openReportAsPdf,
  sanitizeFileNameSegment,
  type ReportDocument,
  type ReportMetric,
  type ReportTable,
} from "@/lib/erp/vardiya-analizi-export";

import TrendPaneli from "./trend-paneli";
import VardiyaDetaySheet from "./vardiya-detay-sheet";

type DetayTarget =
  | { type: "vardiya"; vardiyaKayitId: string; title: string; subtitle: string }
  | {
      type: "makine";
      makineId: string;
      tarih?: string;
      baslangicTarih?: string;
      bitisTarih?: string;
      title: string;
      subtitle: string;
    };

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function shiftIsoDate(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function sortIsoDates(a: string, b: string): { baslangicTarih: string; bitisTarih: string } {
  return a <= b
    ? { baslangicTarih: a, bitisTarih: b }
    : { baslangicTarih: b, bitisTarih: a };
}

function formatDateLabel(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDk(dk: number): string {
  if (dk <= 0) return "0dk";
  const h = Math.floor(dk / 60);
  const m = dk % 60;
  if (h === 0) return `${m}dk`;
  if (m === 0) return `${h}sa`;
  return `${h}sa ${m}dk`;
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTimeLabel(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function vardiyaLabel(tipi: string): string {
  if (tipi === "gece") return "Gece Vardiyası";
  if (tipi === "gunduz") return "Gündüz Vardiyası";
  return tipi;
}

function operasyonTipiLabel(tip: string | null): string {
  if (tip === "cift_tarafli") return "Çift taraf";
  if (tip === "tek_tarafli") return "Tek taraf";
  return "Baskı";
}

function viewLabel(view: ViewMode): string {
  if (view === "makine") return "Makine Bazlı";
  if (view === "kalip") return "Kalıp Bazlı";
  if (view === "trend") return "Trend";
  return "Vardiya Bazlı";
}

function ozetMetrics(ozet: NonNullable<ReturnType<typeof getOzetLike>>): ReportMetric[] {
  return [
    { label: "Toplam Üretim", value: ozet.toplamUretim.toLocaleString("tr-TR") },
    { label: "Toplam Çalışma", value: formatDk(ozet.toplamCalismaDk) },
    {
      label: "Toplam Duruş",
      value: `${formatDk(ozet.toplamDurusDk)} (%${Math.round(ozet.durusOrani * 100)})`,
    },
    { label: "Arıza", value: `${ozet.arizaSayisi} adet` },
    { label: "Kalıp Değişimi", value: `${ozet.kalipDegisimSayisi} adet` },
    { label: "OEE", value: `%${Math.round(ozet.oee * 100)}` },
  ];
}

function getOzetLike(data: { ozet?: any } | undefined | null) {
  return data?.ozet ?? null;
}

function buildTrendMetrics(gunler: Array<{
  toplamUretim: number;
  toplamCalismaDk: number;
  toplamDurusDk: number;
  arizaSayisi: number;
  kalipDegisimSayisi: number;
  oee: number;
}>): ReportMetric[] {
  const toplamUretim = gunler.reduce((sum, gun) => sum + gun.toplamUretim, 0);
  const toplamCalismaDk = gunler.reduce((sum, gun) => sum + gun.toplamCalismaDk, 0);
  const toplamDurusDk = gunler.reduce((sum, gun) => sum + gun.toplamDurusDk, 0);
  const toplamAriza = gunler.reduce((sum, gun) => sum + gun.arizaSayisi, 0);
  const toplamKalip = gunler.reduce((sum, gun) => sum + gun.kalipDegisimSayisi, 0);
  const ortalamaOee = gunler.length > 0 ? gunler.reduce((sum, gun) => sum + gun.oee, 0) / gunler.length : 0;

  return [
    { label: "Toplam Üretim", value: toplamUretim.toLocaleString("tr-TR") },
    { label: "Toplam Çalışma", value: formatDk(toplamCalismaDk) },
    { label: "Toplam Duruş", value: formatDk(toplamDurusDk) },
    { label: "Arıza", value: `${toplamAriza} adet` },
    { label: "Kalıp Değişimi", value: `${toplamKalip} adet` },
    { label: "Ortalama OEE", value: `%${Math.round(ortalamaOee * 100)}` },
  ];
}

type ViewMode = "vardiya" | "makine" | "kalip" | "trend";
type RangePreset = "gun" | "hafta" | "ay" | "ozel";

export default function VardiyaAnaliziClient() {
  const [tarih, setTarih] = useState(todayIsoDate());
  const [rangePreset, setRangePreset] = useState<RangePreset>("gun");
  const [customBaslangic, setCustomBaslangic] = useState(shiftIsoDate(todayIsoDate(), -6));
  const [customBitis, setCustomBitis] = useState(todayIsoDate());
  const [view, setView] = useState<ViewMode>("vardiya");
  const [trendGunSayisi, setTrendGunSayisi] = useState<7 | 30>(7);
  const [detay, setDetay] = useState<DetayTarget | null>(null);

  const range = useMemo(() => {
    if (rangePreset === "gun") {
      return {
        label: "Günlük görünüm",
        query: { tarih },
        subtitle: formatDateLabel(tarih),
      };
    }

    if (rangePreset === "hafta") {
      const baslangicTarih = shiftIsoDate(tarih, -6);
      return {
        label: "Son 7 gün",
        query: { baslangicTarih, bitisTarih: tarih },
        subtitle: `${formatDateLabel(baslangicTarih)} - ${formatDateLabel(tarih)}`,
      };
    }

    if (rangePreset === "ay") {
      const baslangicTarih = shiftIsoDate(tarih, -29);
      return {
        label: "Son 30 gün",
        query: { baslangicTarih, bitisTarih: tarih },
        subtitle: `${formatDateLabel(baslangicTarih)} - ${formatDateLabel(tarih)}`,
      };
    }

    const sorted = sortIsoDates(customBaslangic, customBitis);
    return {
      label: "Özel aralık",
      query: sorted,
      subtitle: `${formatDateLabel(sorted.baslangicTarih)} - ${formatDateLabel(sorted.bitisTarih)}`,
    };
  }, [customBaslangic, customBitis, rangePreset, tarih]);

  const { data, isLoading, isFetching, refetch } = useGetVardiyaAnaliziAdminQuery(
    range.query,
    { pollingInterval: 60000 },
  );
  const { data: trendData, isLoading: isTrendLoading } = useGetVardiyaTrendAdminQuery(
    { gunSayisi: trendGunSayisi },
    { skip: view !== "trend" },
  );

  const vardiyalar = data?.vardiyalar ?? [];
  const makineler = data?.makineler ?? [];
  const kaliplar = data?.kaliplar ?? [];
  const ozet = data?.ozet;

  const gruplandirilmis = useMemo(() => {
    const map = new Map<string, VardiyaAnalizItem[]>();
    for (const v of vardiyalar) {
      const key = `${v.vardiyaTipi}-${v.aktif ? "aktif" : "tamamlandi"}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(v);
    }
    return map;
  }, [vardiyalar]);

  const exportReport = useMemo<ReportDocument | null>(() => {
    const generatedAt = new Date().toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    if (view === "trend") {
      const gunler = trendData?.gunler ?? [];
      return {
        title: "Vardiya Analizi Raporu",
        subtitle: `Trend • Son ${trendGunSayisi} Gün`,
        generatedAt,
        metrics: buildTrendMetrics(gunler),
        tables: [
          {
            title: `Trend Görünümü (${trendGunSayisi} Gün)`,
            columns: ["Tarih", "Üretim", "Çalışma", "Duruş", "Arıza", "Kalıp Değişimi", "OEE"],
            rows: gunler.map((gun) => [
              formatDateLabel(gun.tarih),
              gun.toplamUretim.toLocaleString("tr-TR"),
              formatDk(gun.toplamCalismaDk),
              formatDk(gun.toplamDurusDk),
              gun.arizaSayisi,
              gun.kalipDegisimSayisi,
              `%${Math.round(gun.oee * 100)}`,
            ]),
          },
        ],
        note: "PDF çıktısı tarayıcının yazdırma penceresi üzerinden oluşturulur.",
      };
    }

    if (!data || !ozet) return null;

    let tables: ReportTable[] = [];

    if (view === "vardiya") {
      tables = [
        {
          title: "Vardiya Kayıtları",
          columns: [
            "Vardiya",
            "Durum",
            "Makine",
            "Operatör",
            "Başlangıç",
            "Bitiş",
            "Net Üretim",
            "Fire",
            "Operasyon / Kalıp",
            "Çalışma",
            "Duruş",
            "OEE",
            "Ürün Kırılımı",
          ],
          rows: vardiyalar.map((vardiya) => [
            vardiyaLabel(vardiya.vardiyaTipi),
            vardiya.aktif ? "Aktif" : "Tamamlandı",
            vardiya.makineAd,
            vardiya.operatorAd ?? "—",
            formatDateTimeLabel(vardiya.baslangic),
            formatDateTimeLabel(vardiya.bitis),
            vardiya.uretim.netToplam.toLocaleString("tr-TR"),
            vardiya.uretim.fireToplam.toLocaleString("tr-TR"),
            vardiya.uretim.operasyonKirilimi.length > 0
              ? vardiya.uretim.operasyonKirilimi
                  .map((op) => `${op.operasyonAdi}: ${op.miktar.toLocaleString("tr-TR")}${op.kalipKod ? ` (${op.kalipKod})` : ""}`)
                  .join(" | ")
              : "—",
            formatDk(vardiya.calismaSuresiDk),
            formatDk(vardiya.durusToplamDk),
            `%${Math.round(vardiya.oee * 100)}`,
            vardiya.uretim.urunKirilimi.length > 0
              ? vardiya.uretim.urunKirilimi
                  .map((urun) => `${urun.urunAd}: ${urun.miktar.toLocaleString("tr-TR")}`)
                  .join(" | ")
              : "—",
          ]),
        },
      ];
    } else if (view === "makine") {
      tables = [
        {
          title: "Makine Kırılımı",
          columns: [
            "Makine",
            "Vardiya",
            "Aktif",
            "Baskı Adedi",
            "Çalışma",
            "Duruş",
            "Arıza",
            "Kalıp Değişimi",
            "Operasyon / Kalıp",
            "Ort. Çevrim",
            "Teorik Hedef",
            "Gerçekleşme",
            "OEE",
          ],
          rows: makineler.map((makine) => [
            makine.makineAd,
            makine.vardiyaSayisi,
            makine.aktifVardiya,
            makine.toplamUretim.toLocaleString("tr-TR"),
            formatDk(makine.calismaSuresiDk),
            formatDk(makine.durusToplamDk),
            `${makine.arizaSayisi} (${formatDk(makine.arizaDk)})`,
            `${makine.kalipDegisimSayisi} (${formatDk(makine.kalipDegisimDk)})`,
            makine.operasyonKirilimi.length > 0
              ? makine.operasyonKirilimi
                  .map((op) => `${op.operasyonAdi}: ${op.miktar.toLocaleString("tr-TR")}${op.kalipKod ? ` (${op.kalipKod})` : ""}`)
                  .join(" | ")
              : "—",
            makine.ortCevrimSaniye != null ? `${makine.ortCevrimSaniye} sn` : "—",
            makine.teorikHedef != null ? makine.teorikHedef.toLocaleString("tr-TR") : "—",
            makine.hedefGerceklesmeYuzde != null ? `%${makine.hedefGerceklesmeYuzde}` : "—",
            `%${Math.round(makine.oee * 100)}`,
          ]),
        },
      ];
    } else if (view === "kalip") {
      tables = [
        {
          title: "Kalıp Kırılımı",
          columns: [
            "Kalıp Kodu",
            "Kalıp Adı",
            "Üretim",
            "Çalışma",
            "Makine Sayısı",
            "Makineler",
            "Ürün Sayısı",
            "Ürünler",
            "Kalıp Değişimi",
          ],
          rows: kaliplar.map((kalip) => [
            kalip.kalipKod,
            kalip.kalipAd,
            kalip.toplamUretim.toLocaleString("tr-TR"),
            formatDk(kalip.calismaDk),
            kalip.makineSayisi,
            kalip.makineler.join(", ") || "—",
            kalip.urunSayisi,
            kalip.urunler.join(", ") || "—",
            kalip.kalipDegisimSayisi,
          ]),
        },
      ];
    }

    return {
      title: "Vardiya Analizi Raporu",
      subtitle: `${viewLabel(view)} • ${data.tarih}`,
      generatedAt,
      metrics: ozetMetrics(ozet),
      tables,
      note: "PDF çıktısı tarayıcının yazdırma penceresi üzerinden oluşturulur.",
    };
  }, [data, kaliplar, makineler, ozet, trendData, trendGunSayisi, vardiyalar, view]);

  const exportFileStem = useMemo(() => {
    const sourceLabel =
      view === "trend" ? `trend-${trendGunSayisi}-gun` : data?.tarih ?? range.subtitle;
    return `vardiya-analizi-${sanitizeFileNameSegment(viewLabel(view))}-${sanitizeFileNameSegment(
      sourceLabel,
    )}`;
  }, [data?.tarih, range.subtitle, trendGunSayisi, view]);

  const exportDisabled = isLoading || isFetching || (view === "trend" && isTrendLoading) || !exportReport;

  function applyPreset(next: RangePreset) {
    if (next === "ozel") {
      if (rangePreset !== "ozel") {
        if ("tarih" in range.query) {
          setCustomBaslangic(range.query.tarih ?? "");
          setCustomBitis(range.query.tarih ?? "");
        } else {
          setCustomBaslangic(range.query.baslangicTarih ?? "");
          setCustomBitis(range.query.bitisTarih ?? "");
        }
      }
      setRangePreset("ozel");
      return;
    }

    setRangePreset(next);
  }

  function resetToday() {
    const today = todayIsoDate();
    setTarih(today);
    setCustomBaslangic(today);
    setCustomBitis(today);
  }

  function handleExcelExport() {
    if (!exportReport) {
      toast.error("Dışa aktarılacak veri bulunamadı.");
      return;
    }
    downloadReportAsExcel(exportReport, exportFileStem);
    toast.success("Excel raporu indiriliyor.");
  }

  function handlePdfExport() {
    if (!exportReport) {
      toast.error("Dışa aktarılacak veri bulunamadı.");
      return;
    }
    const opened = openReportAsPdf(exportReport);
    if (!opened) {
      toast.error("Tarayıcı yazdırma penceresini engelledi.");
      return;
    }
    toast.success("PDF yazdırma penceresi açıldı.");
  }

  return (
    <div className="space-y-4">
      {/* Başlık + Filtre */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-lg">Vardiya Analizi</h1>
          <p className="text-muted-foreground text-sm">
            Günlük vardiya performansı, üretim ve duruş özetleri
          </p>
          <p className="mt-1 text-muted-foreground text-xs">
            {range.label} • {data?.tarih ?? range.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border p-0.5">
            <Button
              size="sm"
              variant={view === "vardiya" ? "default" : "ghost"}
              className="h-7 px-3"
              onClick={() => setView("vardiya")}
            >
              Vardiya Bazlı
            </Button>
            <Button
              size="sm"
              variant={view === "makine" ? "default" : "ghost"}
              className="h-7 px-3"
              onClick={() => setView("makine")}
            >
              Makine Bazlı
            </Button>
            <Button
              size="sm"
              variant={view === "kalip" ? "default" : "ghost"}
              className="h-7 px-3"
              onClick={() => setView("kalip")}
            >
              Kalıp Bazlı
            </Button>
            <Button
              size="sm"
              variant={view === "trend" ? "default" : "ghost"}
              className="h-7 px-3"
              onClick={() => setView("trend")}
            >
              Trend
            </Button>
          </div>
          <div className="flex rounded-md border p-0.5">
            <Button
              size="sm"
              variant={rangePreset === "gun" ? "default" : "ghost"}
              className="h-7 px-3"
              onClick={() => applyPreset("gun")}
            >
              Gün
            </Button>
            <Button
              size="sm"
              variant={rangePreset === "hafta" ? "default" : "ghost"}
              className="h-7 px-3"
              onClick={() => applyPreset("hafta")}
            >
              7 Gün
            </Button>
            <Button
              size="sm"
              variant={rangePreset === "ay" ? "default" : "ghost"}
              className="h-7 px-3"
              onClick={() => applyPreset("ay")}
            >
              30 Gün
            </Button>
            <Button
              size="sm"
              variant={rangePreset === "ozel" ? "default" : "ghost"}
              className="h-7 px-3"
              onClick={() => applyPreset("ozel")}
            >
              Özel
            </Button>
          </div>
          {rangePreset === "ozel" ? (
            <>
              <Input
                type="date"
                value={customBaslangic}
                onChange={(e) => setCustomBaslangic(e.target.value)}
                className="w-auto"
              />
              <Input
                type="date"
                value={customBitis}
                onChange={(e) => setCustomBitis(e.target.value)}
                className="w-auto"
              />
            </>
          ) : (
            <Input
              type="date"
              value={tarih}
              onChange={(e) => setTarih(e.target.value)}
              className="w-auto"
            />
          )}
          <Button variant="outline" size="sm" onClick={resetToday}>
            Bugün
          </Button>
          <Button variant="outline" size="sm" onClick={handleExcelExport} disabled={exportDisabled}>
            <FileSpreadsheet className="mr-1 size-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handlePdfExport} disabled={exportDisabled}>
            <Printer className="mr-1 size-4" />
            PDF
          </Button>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Özet Kartları */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={`ozet-skeleton-${i}`} className="h-20" />
          ))}
        </div>
      ) : ozet ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          <MetricCard icon={<Package className="size-4" />} label="Toplam Üretim" value={ozet.toplamUretim.toLocaleString("tr-TR")} />
          <MetricCard
            icon={<Clock className="size-4" />}
            label="Çalışma"
            value={formatDk(ozet.toplamCalismaDk)}
          />
          <MetricCard
            icon={<AlertTriangle className="size-4 text-amber-500" />}
            label="Duruş"
            value={`${formatDk(ozet.toplamDurusDk)} (%${Math.round(ozet.durusOrani * 100)})`}
          />
          <MetricCard
            icon={<AlertTriangle className="size-4 text-destructive" />}
            label="Arıza"
            value={`${ozet.arizaSayisi} adet`}
          />
          <MetricCard
            icon={<Wrench className="size-4" />}
            label="Kalıp Değişimi"
            value={`${ozet.kalipDegisimSayisi} adet`}
          />
          <MetricCard
            icon={<Factory className="size-4 text-primary" />}
            label="OEE"
            value={`%${Math.round(ozet.oee * 100)}`}
          />
        </div>
      ) : null}

      <Separator />

      {/* İçerik */}
      {view === "trend" ? (
        <TrendPaneli
          gunSayisi={trendGunSayisi}
          onGunSayisiChange={setTrendGunSayisi}
          data={trendData}
          isLoading={isTrendLoading}
        />
      ) : isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : view === "vardiya" ? (
        vardiyalar.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              Seçilen tarihte vardiya kaydı bulunmuyor.
            </CardContent>
          </Card>
        ) : (
          <>
            {Array.from(gruplandirilmis.entries()).map(([key, group]) => {
              const [tipi, durum] = key.split("-");
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-sm">{vardiyaLabel(tipi)}</h2>
                    <Badge variant={durum === "aktif" ? "default" : "secondary"}>
                      {durum === "aktif" ? "Aktif" : "Tamamlandı"}
                    </Badge>
                    <span className="text-muted-foreground text-xs">({group.length} kayıt)</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {group.map((v) => (
                      <VardiyaCard
                        key={v.id}
                        v={v}
                        onOpenDetay={() =>
                          setDetay({
                            type: "vardiya",
                            vardiyaKayitId: v.id,
                            title: `${v.makineAd} — ${vardiyaLabel(v.vardiyaTipi)}`,
                            subtitle: `${v.operatorAd ?? "Operatör yok"} · ${formatTime(v.baslangic)} - ${formatTime(v.bitis)}`,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )
      ) : view === "makine" ? (
        makineler.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              Seçilen tarihte makine kaydı bulunmuyor.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {makineler.map((m) => (
              <MakineCard
                key={m.makineId}
                m={m}
                onOpenDetay={() =>
                  setDetay(
                    "tarih" in range.query
                      ? {
                          type: "makine",
                          makineId: m.makineId,
                          tarih: range.query.tarih,
                          title: m.makineAd,
                          subtitle: `${m.vardiyaSayisi} vardiya · OEE %${Math.round(m.oee * 100)} · ${range.subtitle}`,
                        }
                      : {
                          type: "makine",
                          makineId: m.makineId,
                          baslangicTarih: range.query.baslangicTarih,
                          bitisTarih: range.query.bitisTarih,
                          title: m.makineAd,
                          subtitle: `${m.vardiyaSayisi} vardiya · OEE %${Math.round(m.oee * 100)} · ${range.subtitle}`,
                        },
                  )
                }
              />
            ))}
          </div>
        )
      ) : kaliplar.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            Seçilen tarihte kalıp bazlı üretim kaydı bulunmuyor.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {kaliplar.map((k) => (
            <KalipCard key={k.kalipId} k={k} />
          ))}
        </div>
      )}

      <VardiyaDetaySheet open={!!detay} onClose={() => setDetay(null)} target={detay} />
    </div>
  );
}

function KalipCard({ k }: { k: KalipRollup }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm">{k.kalipAd}</CardTitle>
            <p className="font-mono text-muted-foreground text-xs">{k.kalipKod}</p>
          </div>
          <Badge variant="outline" className="font-mono">
            <Wrench className="mr-1 size-3" />
            Kalıp
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded border bg-muted/40 p-2">
            <div className="text-muted-foreground">Üretim</div>
            <div className="font-semibold tabular-nums">
              {k.toplamUretim.toLocaleString("tr-TR")} adet
            </div>
          </div>
          <div className="rounded border bg-muted/40 p-2">
            <div className="text-muted-foreground">Çalışma</div>
            <div className="font-semibold tabular-nums">{formatDk(k.calismaDk)}</div>
          </div>
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Makine ({k.makineSayisi})</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {k.makineler.map((ad) => (
              <Badge key={ad} variant="secondary" className="text-[10px]">
                {ad}
              </Badge>
            ))}
          </div>
        </div>

        {k.urunler.length > 0 && (
          <div className="space-y-1 text-xs">
            <div className="text-muted-foreground">Ürün ({k.urunSayisi})</div>
            <ul className="space-y-0.5">
              {k.urunler.slice(0, 5).map((u) => (
                <li key={u} className="truncate text-[11px]">
                  • {u}
                </li>
              ))}
              {k.urunler.length > 5 && (
                <li className="text-muted-foreground text-[10px]">
                  +{k.urunler.length - 5} diğer ürün
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MakineCard({ m, onOpenDetay }: { m: MakineRollup; onOpenDetay: () => void }) {
  const hedefStatus =
    m.hedefGerceklesmeYuzde === null
      ? null
      : m.hedefGerceklesmeYuzde >= 95
        ? "iyi"
        : m.hedefGerceklesmeYuzde >= 75
          ? "orta"
          : "dusuk";
  return (
    <Card
      className={`cursor-pointer transition-colors hover:bg-muted/40 ${m.aktifVardiya ? "border-primary/40" : ""}`}
      onClick={onOpenDetay}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm">{m.makineAd}</CardTitle>
            <p className="text-muted-foreground text-xs">
              {m.vardiyaSayisi} vardiya · OEE: %{Math.round(m.oee * 100)}
            </p>
          </div>
          {m.aktifVardiya && (
            <Badge variant="default">
              <span className="mr-1 size-1.5 animate-pulse rounded-full bg-white" />
              Çalışıyor
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Hedef vs Gerçekleşen */}
        {m.teorikHedef !== null && m.hedefGerceklesmeYuzde !== null ? (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Hedef / Baskı</span>
              <span
                className={
                  hedefStatus === "iyi"
                    ? "font-semibold text-emerald-600"
                    : hedefStatus === "orta"
                      ? "font-semibold text-amber-600"
                      : "font-semibold text-destructive"
                }
              >
                %{m.hedefGerceklesmeYuzde}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded bg-muted">
              <div
                className={
                  hedefStatus === "iyi"
                    ? "h-full bg-emerald-500"
                    : hedefStatus === "orta"
                      ? "h-full bg-amber-500"
                      : "h-full bg-destructive"
                }
                style={{ width: `${Math.min(100, m.hedefGerceklesmeYuzde)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="tabular-nums">{m.toplamUretim.toLocaleString("tr-TR")}</span>
              <span className="tabular-nums text-muted-foreground">
                / {m.teorikHedef.toLocaleString("tr-TR")} adet
              </span>
            </div>
            {m.ortCevrimSaniye && (
              <p className="text-muted-foreground text-[10px]">
                Ortalama çevrim: {m.ortCevrimSaniye}sn
              </p>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground text-xs">
            <Package className="mr-1 inline-block size-3" />
            {m.toplamUretim.toLocaleString("tr-TR")} baskı (hedef hesaplanamadı)
          </div>
        )}

        {m.operasyonKirilimi.length > 0 && (
          <div className="space-y-1 text-xs">
            <div className="text-muted-foreground">Operasyon / Kalıp</div>
            <div className="flex flex-wrap gap-1">
              {m.operasyonKirilimi.slice(0, 4).map((op) => (
                <Badge
                  key={`${op.operasyonId ?? op.operasyonAdi}-${op.kalipId ?? "kalipsiz"}`}
                  variant="secondary"
                  className="max-w-full text-[10px]"
                >
                  <span className="truncate">
                    {op.operasyonAdi} · {op.miktar.toLocaleString("tr-TR")}
                    {op.kalipKod ? ` · ${op.kalipKod}` : ""}
                  </span>
                </Badge>
              ))}
              {m.operasyonKirilimi.length > 4 && (
                <Badge variant="outline" className="text-[10px]">
                  +{m.operasyonKirilimi.length - 4}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Çalışma / Duruş */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded border bg-muted/40 p-2">
            <div className="text-muted-foreground">Çalışma</div>
            <div className="font-semibold tabular-nums">{formatDk(m.calismaSuresiDk)}</div>
          </div>
          <div className="rounded border bg-muted/40 p-2">
            <div className="text-muted-foreground">Duruş</div>
            <div className="font-semibold tabular-nums">{formatDk(m.durusToplamDk)}</div>
          </div>
        </div>

        {/* Duruş Detay */}
        {(m.arizaSayisi > 0 || m.kalipDegisimSayisi > 0 || m.bakimDk > 0) && (
          <div className="flex flex-wrap gap-1 text-xs">
            {m.arizaSayisi > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                <AlertTriangle className="mr-1 size-3" />
                {m.arizaSayisi}× Arıza ({formatDk(m.arizaDk)})
              </Badge>
            )}
            {m.kalipDegisimSayisi > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                <Wrench className="mr-1 size-3" />
                {m.kalipDegisimSayisi}× Kalıp ({formatDk(m.kalipDegisimDk)})
              </Badge>
            )}
            {m.bakimDk > 0 && (
              <Badge variant="outline" className="text-[10px]">
                Bakım ({formatDk(m.bakimDk)})
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          {icon}
          <span>{label}</span>
        </div>
        <div className="mt-1 font-semibold text-lg tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

function VardiyaCard({ v, onOpenDetay }: { v: VardiyaAnalizItem; onOpenDetay: () => void }) {
  return (
    <Card
      className={`cursor-pointer transition-colors hover:bg-muted/40 ${v.aktif ? "border-primary/40" : ""}`}
      onClick={onOpenDetay}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm">{v.makineAd}</CardTitle>
            <p className="text-muted-foreground text-xs">
              {v.operatorAd ?? "Operatör atanmamış"} · {formatTime(v.baslangic)} - {formatTime(v.bitis)}
            </p>
          </div>
          {v.aktif ? (
            <Badge variant="default">
              <span className="mr-1 size-1.5 animate-pulse rounded-full bg-white" />
              Aktif
            </Badge>
          ) : (
            <Badge variant="secondary">
              <CheckCircle2 className="mr-1 size-3" />
              Bitti
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Üretim Kırılımı */}
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Baskı Adedi</span>
            <span className="font-semibold tabular-nums">
              {v.uretim.toplamMiktar.toLocaleString("tr-TR")} adet
            </span>
          </div>
          {v.uretim.urunKirilimi.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {v.uretim.urunKirilimi.map((u) => (
                <li key={u.urunId} className="flex justify-between text-xs">
                  <span className="truncate pr-2">{u.urunAd}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {u.miktar.toLocaleString("tr-TR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {v.uretim.operasyonKirilimi.length > 0 && (
          <div className="space-y-1 text-xs">
            <div className="text-muted-foreground">Operasyon / Kalıp</div>
            <ul className="space-y-0.5">
              {v.uretim.operasyonKirilimi.slice(0, 4).map((op) => (
                <li
                  key={`${op.operasyonId ?? op.operasyonAdi}-${op.kalipId ?? "kalipsiz"}`}
                  className="flex justify-between gap-2 text-xs"
                >
                  <span className="truncate">
                    {op.operasyonAdi}
                    <span className="text-muted-foreground">
                      {" "}· {operasyonTipiLabel(op.operasyonTipi)}
                      {op.kalipKod ? ` · ${op.kalipKod}` : ""}
                    </span>
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {op.miktar.toLocaleString("tr-TR")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Çalışma / Duruş */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded border bg-muted/40 p-2">
            <div className="text-muted-foreground">Çalışma</div>
            <div className="font-semibold tabular-nums">{formatDk(v.calismaSuresiDk)}</div>
          </div>
          <div className="rounded border bg-muted/40 p-2">
            <div className="text-muted-foreground">Duruş</div>
            <div className="font-semibold tabular-nums">{formatDk(v.durusToplamDk)}</div>
          </div>
        </div>

        {/* Duruş Detay */}
        {(v.duruslar.arizaSayisi > 0 ||
          v.duruslar.kalipDegisimSayisi > 0 ||
          v.duruslar.bakimSayisi > 0) && (
          <div className="flex flex-wrap gap-1 text-xs">
            {v.duruslar.arizaSayisi > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                <AlertTriangle className="mr-1 size-3" />
                {v.duruslar.arizaSayisi}× Arıza ({formatDk(v.duruslar.arizaDk)})
              </Badge>
            )}
            {v.duruslar.kalipDegisimSayisi > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                <Wrench className="mr-1 size-3" />
                {v.duruslar.kalipDegisimSayisi}× Kalıp ({formatDk(v.duruslar.kalipDegisimDk)})
              </Badge>
            )}
            {v.duruslar.bakimSayisi > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {v.duruslar.bakimSayisi}× Bakım ({formatDk(v.duruslar.bakimDk)})
              </Badge>
            )}
          </div>
        )}

        {/* OEE */}
        <div className="flex items-center justify-between border-t pt-2 text-xs">
          <span className="text-muted-foreground">OEE</span>
          <span className="font-semibold tabular-nums">%{Math.round(v.oee * 100)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
