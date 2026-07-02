"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";

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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useListMakinelerAdminQuery } from "@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints";
import {
  useGetVardiyaAnaliziAdminQuery,
  useGetVardiyaTrendAdminQuery,
  useUpdateGunlukUretimKaydiAdminMutation,
  type DurusDetayOzet,
  type DurusNedeniOzet,
  type KalipRollup,
  type MakineRollup,
  type UretimKaydiOzet,
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

function yesterdayIsoDate(): string {
  return shiftIsoDate(todayIsoDate(), -1);
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

function formatDateTimeRange(start: string | null, end: string | null): string {
  if (!start) return "—";
  return `${formatDateTimeLabel(start)} - ${end ? formatTime(end) : "—"}`;
}

function formatPercent(value: number | null): string {
  return value === null ? "—" : `%${Math.round(value * 100)}`;
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
    { label: "OEE", value: formatPercent(ozet.oee) },
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
type RangePreset = "gun" | "hafta" | "ay" | "ozel" | "vardiya-cifti";
type VardiyaCiftiMode = "gunduz-gece" | "gece-gunduz";

function defaultShiftPairRange(): { baslangicTarih: string; bitisTarih: string; vardiyaCifti: VardiyaCiftiMode } {
  const now = new Date();
  const h = now.getHours() + now.getMinutes() / 60;
  const today = todayIsoDate();

  if (h >= 7.5 && h < 19.5) {
    return { baslangicTarih: shiftIsoDate(today, -1), bitisTarih: today, vardiyaCifti: "gunduz-gece" };
  }

  if (h >= 19.5) {
    return { baslangicTarih: shiftIsoDate(today, -1), bitisTarih: today, vardiyaCifti: "gece-gunduz" };
  }

  return { baslangicTarih: shiftIsoDate(today, -2), bitisTarih: shiftIsoDate(today, -1), vardiyaCifti: "gece-gunduz" };
}

export default function VardiyaAnaliziClient() {
  const [defaultPair] = useState(defaultShiftPairRange);
  const [tarih, setTarih] = useState(defaultPair.bitisTarih);
  const [rangePreset, setRangePreset] = useState<RangePreset>("vardiya-cifti");
  const [customBaslangic, setCustomBaslangic] = useState(defaultPair.baslangicTarih);
  const [customBitis, setCustomBitis] = useState(defaultPair.bitisTarih);
  const [view, setView] = useState<ViewMode>("vardiya");
  const [trendGunSayisi, setTrendGunSayisi] = useState<7 | 30>(7);
  const [detay, setDetay] = useState<DetayTarget | null>(null);
  const [editingKayit, setEditingKayit] = useState<UretimKaydiOzet | null>(null);
  const [selectedVardiyaTipleri, setSelectedVardiyaTipleri] = useState<string[]>(["gunduz", "gece"]);
  const [selectedMakineIds, setSelectedMakineIds] = useState<string[]>([]);
  const [updateGunlukKayit, { isLoading: isUpdatingKayit }] = useUpdateGunlukUretimKaydiAdminMutation();
  const { data: makineData } = useListMakinelerAdminQuery({ durum: "aktif" });
  const makineSecenekleri = makineData?.items ?? [];

  // 4a: İlk açılışta makine filtresi UYGULAMA — önceki günün (yesterdayIsoDate)
  // tüm makinelerinin gündüz + gece vardiyaları görünsün. Kullanıcı isterse
  // aşağıdaki makine checkbox'larından filtreler.

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

    if (rangePreset === "vardiya-cifti") {
      return {
        label: "Vardiya çifti",
        query: defaultPair,
        subtitle: `${formatDateLabel(defaultPair.baslangicTarih)} - ${formatDateLabel(defaultPair.bitisTarih)}`,
      };
    }

    const sorted = sortIsoDates(customBaslangic, customBitis);
    return {
      label: "Özel aralık",
      query: sorted,
      subtitle: `${formatDateLabel(sorted.baslangicTarih)} - ${formatDateLabel(sorted.bitisTarih)}`,
    };
  }, [customBaslangic, customBitis, defaultPair, rangePreset, tarih]);

  const analizQuery = useMemo(() => ({
    ...range.query,
    makineId: selectedMakineIds.length > 0 ? selectedMakineIds : undefined,
    vardiyaTipi: rangePreset === "vardiya-cifti"
      ? undefined
      : selectedVardiyaTipleri.length > 0 ? selectedVardiyaTipleri : undefined,
  }), [range.query, rangePreset, selectedMakineIds, selectedVardiyaTipleri]);

  const { data, isLoading, isFetching, refetch } = useGetVardiyaAnaliziAdminQuery(
    analizQuery,
    { pollingInterval: 60000 },
  );
  const { data: trendData, isLoading: isTrendLoading } = useGetVardiyaTrendAdminQuery(
    { gunSayisi: trendGunSayisi },
    { skip: view !== "trend" },
  );

  const vardiyalar = data?.vardiyalar ?? [];
  const makineler = data?.makineler ?? [];
  const kaliplar = data?.kaliplar ?? [];
  const uretimKayitlari = data?.uretimKayitlari ?? [];
  const durusDetaylari = data?.durusDetaylari ?? [];
  const durusOzeti = data?.durusOzeti ?? [];
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
            formatPercent(vardiya.oee),
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
            formatPercent(makine.oee),
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
    setRangePreset("gun");
  }

  function toggleVardiyaTipi(tip: string) {
    setSelectedVardiyaTipleri((current) =>
      current.includes(tip) ? current.filter((item) => item !== tip) : [...current, tip],
    );
  }

  function toggleMakine(id: string) {
    setSelectedMakineIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
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

  async function handleUpdateKayit(body: { ekUretimMiktari: number; fireMiktari: number; netMiktar: number; notlar: string | null }) {
    if (!editingKayit) return;
    try {
      await updateGunlukKayit({ id: editingKayit.id, body }).unwrap();
      toast.success("Üretim kaydı güncellendi.");
      setEditingKayit(null);
      refetch();
    } catch {
      toast.error("Üretim kaydı güncellenemedi.");
    }
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
              variant={rangePreset === "vardiya-cifti" ? "default" : "ghost"}
              className="h-7 px-3"
              onClick={() => applyPreset("vardiya-cifti")}
            >
              Vardiya Çifti
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
          <div className="flex items-center gap-2 rounded-md border px-2 py-1">
            {[
              ["gunduz", "Gündüz"],
              ["gece", "Gece"],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-1.5 text-xs">
                <Checkbox
                  checked={selectedVardiyaTipleri.includes(value)}
                  onCheckedChange={() => toggleVardiyaTipi(value)}
                />
                {label}
              </label>
            ))}
          </div>
          {makineSecenekleri.length > 0 && (
            <div className="flex max-w-full flex-wrap items-center gap-2 rounded-md border px-2 py-1">
              {makineSecenekleri.slice(0, 6).map((makine) => (
                <label key={makine.id} className="flex items-center gap-1.5 text-xs">
                  <Checkbox
                    checked={selectedMakineIds.includes(makine.id)}
                    onCheckedChange={() => toggleMakine(makine.id)}
                  />
                  {makine.ad}
                </label>
              ))}
            </div>
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
          <MetricCard icon={<Package className="size-4" />} label="Net Üretim" value={ozet.toplamUretim.toLocaleString("tr-TR")} />
          <MetricCard
            icon={<AlertTriangle className="size-4 text-amber-500" />}
            label="Fire"
            value={ozet.toplamFire.toLocaleString("tr-TR")}
          />
          <MetricCard
            icon={<Clock className="size-4" />}
            label="Çalışma Süresi"
            value={formatDk(ozet.toplamCalismaDk)}
          />
          <MetricCard
            icon={<AlertTriangle className="size-4 text-amber-500" />}
            label="Duruş Süresi"
            value={formatDk(ozet.toplamDurusDk)}
          />
          <MetricCard
            icon={<Wrench className="size-4" />}
            label="Duruş Sayısı"
            value={`${ozet.durusSayisi} adet`}
          />
          <MetricCard
            icon={<Factory className="size-4 text-primary" />}
            label="OEE"
            value={formatPercent(ozet.oee)}
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
        <VardiyaYoneticiGorunumu
          vardiyalar={vardiyalar}
          makineler={makineler}
          uretimKayitlari={uretimKayitlari}
          durusDetaylari={durusDetaylari}
          durusOzeti={durusOzeti}
          onEditUretim={setEditingKayit}
        />
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
                          subtitle: `${m.vardiyaSayisi} vardiya · OEE ${formatPercent(m.oee)} · ${range.subtitle}`,
                        }
                      : {
                          type: "makine",
                          makineId: m.makineId,
                          baslangicTarih: range.query.baslangicTarih,
                          bitisTarih: range.query.bitisTarih,
                          title: m.makineAd,
                          subtitle: `${m.vardiyaSayisi} vardiya · OEE ${formatPercent(m.oee)} · ${range.subtitle}`,
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
      <UretimKaydiEditDialog
        kayit={editingKayit}
        open={!!editingKayit}
        isSaving={isUpdatingKayit}
        onClose={() => setEditingKayit(null)}
        onSubmit={handleUpdateKayit}
      />
    </div>
  );
}

function VardiyaYoneticiGorunumu({
  vardiyalar,
  makineler,
  uretimKayitlari,
  durusDetaylari,
  durusOzeti,
  onEditUretim,
}: {
  vardiyalar: VardiyaAnalizItem[];
  makineler: MakineRollup[];
  uretimKayitlari: UretimKaydiOzet[];
  durusDetaylari: DurusDetayOzet[];
  durusOzeti: DurusNedeniOzet[];
  onEditUretim: (kayit: UretimKaydiOzet) => void;
}) {
  const machineGroups = useMemo(() => {
    const makineMap = new Map(makineler.map((makine) => [makine.makineId, makine]));
    const ids = new Set<string>();
    for (const makine of makineler) ids.add(makine.makineId);
    for (const kayit of uretimKayitlari) {
      if (kayit.makineId) ids.add(kayit.makineId);
    }

    return Array.from(ids).map((makineId) => {
      const makine = makineMap.get(makineId);
      const records = uretimKayitlari.filter((kayit) => kayit.makineId === makineId);
      const shiftKeys = new Set<string>();
      for (const vardiya of vardiyalar) {
        if (vardiya.makineId === makineId) shiftKeys.add(vardiya.vardiyaTipi);
      }
      for (const kayit of records) shiftKeys.add(kayit.vardiyaTipi);
      const shifts = Array.from(shiftKeys).sort((a, b) => {
        const order = { gunduz: 0, gece: 1 } as Record<string, number>;
        return (order[a] ?? 9) - (order[b] ?? 9) || a.localeCompare(b, "tr");
      });

      return {
        makineId,
        makineAd: makine?.makineAd ?? records[0]?.makineAd ?? "Makine",
        makine,
        shifts,
        records,
      };
    });
  }, [makineler, uretimKayitlari, vardiyalar]);

  if (vardiyalar.length === 0 && uretimKayitlari.length === 0 && durusDetaylari.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground text-sm">
          Seçilen filtrelerde vardiya kaydı bulunmuyor.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {machineGroups.map(({ makineId, makineAd, makine, shifts, records }) => (
        <Card key={makineId}>
          <CardHeader className="space-y-3 pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">{makineAd}</CardTitle>
                <p className="text-muted-foreground text-xs">
                  {records.length} üretim kaydı • {makine?.vardiyaSayisi ?? shifts.length} vardiya
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-6">
                <MiniMetric label="Net Üretim" value={(makine?.toplamUretim ?? 0).toLocaleString("tr-TR")} />
                <MiniMetric label="Fire" value={(makine?.fireToplam ?? 0).toLocaleString("tr-TR")} />
                <MiniMetric label="Duruş Sayısı" value={`${makine?.durusSayisi ?? 0}`} />
                <MiniMetric label="Toplam Duruş" value={formatDk(makine?.durusToplamDk ?? 0)} />
                <MiniMetric label="Net Çalışma" value={formatDk(makine?.calismaSuresiDk ?? 0)} />
                <MiniMetric label="OEE" value={formatPercent(makine?.oee ?? null)} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {shifts.length === 0 ? (
              <div className="rounded-md border py-8 text-center text-muted-foreground text-sm">
                Bu makine için üretim kaydı bulunmuyor.
              </div>
            ) : (
              shifts.map((shift) => {
                const shiftRows = records.filter((row) => row.vardiyaTipi === shift);
                const vardiyaTotal = vardiyalar.find((v) => v.makineId === makineId && v.vardiyaTipi === shift);
                const netTotal = vardiyaTotal?.uretim.netToplam ?? shiftRows.reduce((sum, row) => sum + row.netMiktar, 0);
                const fireTotal = vardiyaTotal?.uretim.fireToplam ?? shiftRows.reduce((sum, row) => sum + row.fireMiktar, 0);

                return (
                  <div key={`${makineId}-${shift}`} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-sm">{vardiyaLabel(shift)}</h3>
                      <Badge variant="outline" className="font-mono">
                        Net {netTotal.toLocaleString("tr-TR")} • Fire {fireTotal.toLocaleString("tr-TR")}
                      </Badge>
                    </div>
                    <div className="overflow-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Vardiya</TableHead>
                            <TableHead>Tarih-Saat</TableHead>
                            <TableHead>Ürün</TableHead>
                            <TableHead>Operasyon</TableHead>
                            <TableHead className="text-right">Net</TableHead>
                            <TableHead className="text-right">Fire</TableHead>
                            <TableHead className="text-right">Verim. (Net Çalışma)</TableHead>
                            <TableHead className="text-right">Verim. (Vardiya)</TableHead>
                            <TableHead>Operatör</TableHead>
                            <TableHead className="text-right">İşlem</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shiftRows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={10} className="py-6 text-center text-muted-foreground">
                                Bu vardiyada net üretimi olan kayıt bulunmuyor.
                              </TableCell>
                            </TableRow>
                          ) : (
                            shiftRows.map((row) => (
                              <TableRow key={row.id}>
                                <TableCell>{vardiyaLabel(row.vardiyaTipi)}</TableCell>
                                <TableCell>{formatDateTimeRange(row.baslangic, row.bitis)}</TableCell>
                                <TableCell>
                                  <div className="font-medium">{row.urunAd}</div>
                                  {row.urunKod && <div className="font-mono text-muted-foreground text-xs">{row.urunKod}</div>}
                                </TableCell>
                                <TableCell>{row.operasyonAdi ?? "—"}</TableCell>
                                <TableCell className="text-right tabular-nums">{row.netMiktar.toLocaleString("tr-TR")}</TableCell>
                                <TableCell className="text-right tabular-nums">{row.fireMiktar.toLocaleString("tr-TR")}</TableCell>
                                <TableCell className="text-right tabular-nums">{formatPercent(row.verimlilikNet)}</TableCell>
                                <TableCell className="text-right tabular-nums">{formatPercent(row.verimlilikVardiya)}</TableCell>
                                <TableCell>{row.operatorAd ?? "—"}</TableCell>
                                <TableCell className="text-right">
                                  <Button size="sm" variant="outline" onClick={() => onEditUretim(row)}>
                                    Düzenle
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                          <TableRow className="bg-muted/50 font-semibold">
                            <TableCell colSpan={4}>{vardiyaLabel(shift)} Toplamı</TableCell>
                            <TableCell className="text-right tabular-nums">{netTotal.toLocaleString("tr-TR")}</TableCell>
                            <TableCell className="text-right tabular-nums">{fireTotal.toLocaleString("tr-TR")}</TableCell>
                            <TableCell colSpan={4} />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      ))}

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <TableSection title="Duruşlar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Makine</TableHead>
                <TableHead>Başlangıç</TableHead>
                <TableHead>Bitiş</TableHead>
                <TableHead className="text-right">Süre</TableHead>
                <TableHead>Duruş Nedeni</TableHead>
                <TableHead>Operatör</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {durusDetaylari.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.makineAd ?? "—"}</TableCell>
                  <TableCell>{formatDateTimeLabel(row.baslangic)}</TableCell>
                  <TableCell>{formatTime(row.bitis)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatDk(row.sureDk)}</TableCell>
                  <TableCell>{row.neden}</TableCell>
                  <TableCell>{row.operatorAd ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableSection>

        <TableSection title="Duruş Özeti">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Duruş Nedeni</TableHead>
                <TableHead className="text-right">Adet</TableHead>
                <TableHead className="text-right">Toplam Süre</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {durusOzeti.map((row) => (
                <TableRow key={row.neden}>
                  <TableCell>{row.neden}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.adet}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatDk(row.toplamDk)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableSection>
      </div>
    </div>
  );
}

function TableSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="font-semibold text-sm">{title}</h2>
      <div className="overflow-auto rounded-md border">{children}</div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-24 rounded-md border bg-muted/40 px-2 py-1.5">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function UretimKaydiEditDialog({
  kayit,
  open,
  isSaving,
  onClose,
  onSubmit,
}: {
  kayit: UretimKaydiOzet | null;
  open: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (body: { ekUretimMiktari: number; fireMiktari: number; netMiktar: number; notlar: string | null }) => Promise<void>;
}) {
  const [ekUretimMiktari, setEkUretimMiktari] = useState("0");
  const [fireMiktari, setFireMiktari] = useState("0");
  const [netMiktar, setNetMiktar] = useState("0");
  const [notlar, setNotlar] = useState("");

  useEffect(() => {
    if (!kayit) return;
    setEkUretimMiktari(String(kayit.ekUretimMiktari ?? kayit.netMiktar + kayit.fireMiktar));
    setFireMiktari(String(kayit.fireMiktar ?? 0));
    setNetMiktar(String(kayit.netMiktar ?? 0));
    setNotlar(kayit.notlar ?? "");
  }, [kayit]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ek = Number(ekUretimMiktari);
    const fire = Number(fireMiktari);
    const net = Number(netMiktar);
    if (!Number.isFinite(ek) || !Number.isFinite(fire) || !Number.isFinite(net)) {
      toast.error("Miktar alanları geçerli sayı olmalı.");
      return;
    }
    if (ek < 0 || fire < 0 || net < 0) {
      toast.error("Miktarlar negatif olamaz.");
      return;
    }
    if (Math.abs((ek - fire) - net) > 0.0001) {
      toast.error("Net miktar, üretim eksi fire ile uyumlu olmalı.");
      return;
    }
    await onSubmit({
      ekUretimMiktari: ek,
      fireMiktari: fire,
      netMiktar: net,
      notlar: notlar.trim() || null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Üretim Kaydı Düzenle</DialogTitle>
        </DialogHeader>
        {kayit && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <div className="font-medium">{kayit.urunAd}</div>
              <div className="text-muted-foreground text-xs">
                {kayit.makineAd ?? "Makine yok"} • {vardiyaLabel(kayit.vardiyaTipi)} • {formatDateTimeLabel(kayit.baslangic)}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="ek-uretim">Üretim</Label>
                <Input
                  id="ek-uretim"
                  type="number"
                  min="0"
                  step="0.0001"
                  value={ekUretimMiktari}
                  onChange={(event) => {
                    const next = event.target.value;
                    setEkUretimMiktari(next);
                    const calculated = Number(next) - Number(fireMiktari);
                    if (Number.isFinite(calculated) && calculated >= 0) setNetMiktar(String(calculated));
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fire">Fire</Label>
                <Input
                  id="fire"
                  type="number"
                  min="0"
                  step="0.0001"
                  value={fireMiktari}
                  onChange={(event) => {
                    const next = event.target.value;
                    setFireMiktari(next);
                    const calculated = Number(ekUretimMiktari) - Number(next);
                    if (Number.isFinite(calculated) && calculated >= 0) setNetMiktar(String(calculated));
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="net">Net</Label>
                <Input
                  id="net"
                  type="number"
                  min="0"
                  step="0.0001"
                  value={netMiktar}
                  onChange={(event) => setNetMiktar(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notlar">Notlar</Label>
              <Textarea
                id="notlar"
                value={notlar}
                onChange={(event) => setNotlar(event.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Vazgeç
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
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
              {m.vardiyaSayisi} vardiya · OEE: {formatPercent(m.oee)}
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
          <span className="font-semibold tabular-nums">{formatPercent(v.oee)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
