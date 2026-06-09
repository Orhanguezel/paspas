"use client";

// =============================================================
// Paspas ERP — Operatör Ekranı (makine-merkezli V2, 2 sekmeli)
// =============================================================

import { Fragment, useEffect, useState } from "react";

import { Clock, Pause, RefreshCcw, RotateCcw, Square } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useLocaleContext } from "@/i18n/LocaleProvider";
import {
  useDevamEtAdminMutation,
  useDuraklatAdminMutation,
  useGunlukUretimAdminMutation,
  useGetAcikVardiyalarAdminQuery,
  useKalipDegisimBaslatAdminMutation,
  useKalipDegisimBitirAdminMutation,
  useListAktifKalipDegisimleriAdminQuery,
  useListMakineKuyruguAdminQuery,
  useUretimBaslatAdminMutation,
  useUretimBitirAdminMutation,
} from "@/integrations/endpoints/admin/erp/operator_admin.endpoints";
import { useListDurusNedenleriAdminQuery } from "@/integrations/endpoints/admin/erp/tanimlar_admin.endpoints";
import type { MakineKuyruguDetayDto } from "@/integrations/shared/erp/operator.types";
import { ReceteDetayModal } from "../../uretim-emirleri/_components/recete-detay-modal";

const DURUM_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  bekliyor: "outline",
  calisiyor: "default",
  duraklatildi: "secondary",
  tamamlandi: "default",
  iptal: "destructive",
};

function getHybridShift(): "gunduz" | "gece" {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes >= 7 * 60 + 30 && minutes < 9 * 60 + 30) return "gece";
  return minutes >= 19 * 60 + 30 || minutes < 7 * 60 + 30 ? "gece" : "gunduz";
}

const DURUM_LABEL: Record<string, string> = {
  bekliyor: "Bekliyor",
  calisiyor: "Çalışıyor",
  duraklatildi: "Duraklatıldı",
  tamamlandi: "Tamamlandı",
  iptal: "İptal",
};

function useRealtimeClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function OperatorClient() {
  const { t } = useLocaleContext();
  const now = useRealtimeClock();

  const timeStr = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-12rem)] pb-10">
      {/* Premium Header - Industrial Glass Mode */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
        <div className="flex items-center gap-5">
          <div className="bg-primary/20 p-4 rounded-xl border border-primary/30">
            <Clock className="size-10 text-primary animate-pulse" />
          </div>
          <div>
            <div className="text-4xl font-black tracking-tighter tabular-nums leading-none mb-1">{timeStr}</div>
            <div className="text-sm font-medium text-slate-400 uppercase tracking-widest">{dateStr}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <VardiyaStatusBadge />
        </div>
      </div>

      <MakineKuyruguTab />
    </div>
  );
}

function VardiyaStatusBadge() {
  const { data: vardiyaData } = useGetAcikVardiyalarAdminQuery();
  const makineler = vardiyaData ?? [];
  const acikSayisi = makineler.filter(m => m.acikVardiyaId).length;

  return (
    <div className="flex flex-col items-end gap-1 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
      <span className="text-[10px] font-bold text-slate-500 uppercase">Aktif Makineler</span>
      <div className="flex items-center gap-2">
        <span className="size-2.5 rounded-full bg-emerald-500 animate-ping shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
        <span className="text-xl font-bold">{acikSayisi} / {makineler.length}</span>
      </div>
    </div>
  );
}

// ============================================================
// Tab 1: Makine Kuyruğu
// ============================================================

function MakineKuyruguTab() {
  const { t } = useLocaleContext();
  const { data, isLoading, isFetching, refetch } = useListMakineKuyruguAdminQuery();
  const { data: aktifKalipDegisimleri } = useListAktifKalipDegisimleriAdminQuery();
  const [baslat] = useUretimBaslatAdminMutation();
  const [bitir] = useUretimBitirAdminMutation();
  const [duraklat] = useDuraklatAdminMutation();
  const [devamEt] = useDevamEtAdminMutation();
  const [gunlukUretimGir] = useGunlukUretimAdminMutation();
  const [kalipDegisimBaslat] = useKalipDegisimBaslatAdminMutation();
  const [kalipDegisimBitir] = useKalipDegisimBitirAdminMutation();

  const [finishing, setFinishing] = useState<MakineKuyruguDetayDto | null>(null);
  const [uretilenMiktar, setUretilenMiktar] = useState("");
  const [fireMiktar, setFireMiktar] = useState("0");
  const [notlar, setNotlar] = useState("");

  const [dailyEntry, setDailyEntry] = useState<MakineKuyruguDetayDto | null>(null);
  const [dailyUretilenMiktar, setDailyUretilenMiktar] = useState("");
  const [dailyFireMiktar, setDailyFireMiktar] = useState("0");
  const [dailyNotlar, setDailyNotlar] = useState("");
  const [dailyVardiyaTipi, setDailyVardiyaTipi] = useState<"gunduz" | "gece">("gunduz");
  const [receteDetayEmirId, setReceteDetayEmirId] = useState<string | null>(null);

  const [resuming, setResuming] = useState<MakineKuyruguDetayDto | null>(null);
  const [resumeNotlar, setResumeNotlar] = useState("");

  const [pausing, setPausing] = useState<MakineKuyruguDetayDto | null>(null);
  const [pauseNedenId, setPauseNedenId] = useState("");
  const [pauseNeden, setPauseNeden] = useState("");
  const [pauseUretimMiktari, setPauseUretimMiktari] = useState("");

  const { data: durusNedenleriData } = useListDurusNedenleriAdminQuery();
  const durusNedenleri = (durusNedenleriData?.items ?? []).filter((d) => d.isActive);

  const items = data?.items ?? [];
  const aktifKalipByMakine = new Map((aktifKalipDegisimleri ?? []).map((item) => [item.makineId, item]));

  // Group by machine — exclude completed jobs (tamamlandi görünmemeli)
  const grouped = new Map<string, MakineKuyruguDetayDto[]>();
  for (const item of items) {
    if (item.durum === "tamamlandi") continue;
    const key = item.makineId;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)?.push(item);
  }

  function pct(planned: number, produced: number): number {
    if (!planned) return 0;
    return Math.min(100, Math.round((produced / planned) * 100));
  }

  async function handleBaslat(item: MakineKuyruguDetayDto) {
    try {
      await baslat({ makineKuyrukId: item.id }).unwrap();
      toast.success(t("admin.erp.operator.started"));
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error && "data" in error
          ? (error as { data?: { error?: { message?: string } } }).data?.error?.message
          : undefined;
      const detail =
        typeof error === "object" && error && "data" in error
          ? (error as { data?: { error?: { detail?: string } } }).data?.error?.detail
          : undefined;
      if (message === "makine_bugun_calismiyor") {
        toast.error("Bu makine için bugün çalışma planı tanımlanmamış.");
      } else if (message === "makine_planli_kapali") {
        toast.error(detail ?? "Makine planlı kapalı aralıkta.");
      } else if (message === "makinede_aktif_is_var") {
        toast.error("Bu makinede zaten çalışan bir iş var.");
      } else if (message === "sadece_bekliyor_baslatilabilir") {
        toast.error("Sadece bekleyen işler başlatılabilir.");
      } else {
        toast.error(t("admin.erp.common.operationFailed"));
      }
    }
  }

  async function handleKalipDegisimBaslat(makineId: string, makineKuyrukId?: string) {
    try {
      await kalipDegisimBaslat({ makineId, makineKuyrukId }).unwrap();
      toast.success("Kalıp değişimi başladı.");
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error && "data" in error
          ? (error as { data?: { error?: { message?: string } } }).data?.error?.message
          : undefined;
      if (message === "makinede_aktif_is_var") {
        toast.error("Bu makinede çalışan iş varken kalıp değişimi başlatılamaz.");
      } else if (message === "aktif_kalip_degisimi_var") {
        toast.error("Bu makinede zaten açık kalıp değişimi var.");
      } else {
        toast.error(t("admin.erp.common.operationFailed"));
      }
    }
  }

  async function handleKalipDegisimBitir(durusKayitId: string) {
    try {
      await kalipDegisimBitir({ durusKayitId }).unwrap();
      toast.success("Kalıp değişimi bitirildi. Sıradaki üretimi başlatabilirsiniz.");
    } catch {
      toast.error(t("admin.erp.common.operationFailed"));
    }
  }

  function openResume(item: MakineKuyruguDetayDto) {
    setResumeNotlar("");
    setResuming(item);
  }

  async function confirmResume() {
    if (!resuming) return;
    try {
      await devamEt({
        makineKuyrukId: resuming.id,
        notlar: resumeNotlar.trim() || undefined,
      }).unwrap();
      toast.success(t("admin.erp.operator.resumed"));
      setResuming(null);
    } catch {
      toast.error(t("admin.erp.common.operationFailed"));
    }
  }

  function openFinish(item: MakineKuyruguDetayDto) {
    // Default to planned quantity as the actual total (operator adjusts if needed)
    setUretilenMiktar(String(item.planlananMiktar));
    setFireMiktar("0");
    setNotlar("");
    setFinishing(item);
  }

  async function confirmFinish() {
    if (!finishing) return;
    const u = parseFloat(uretilenMiktar || "0");
    const f = parseFloat(fireMiktar || "0");
    if (Number.isNaN(u) || u < 0) {
      toast.error(t("admin.erp.operator.invalidQuantity"));
      return;
    }
    try {
      const result = await bitir({
        makineKuyrukId: finishing.id,
        uretilenMiktar: u,
        fireMiktar: f,
        birimTipi: finishing.montaj ? "takim" : "adet",
        notlar: notlar.trim() || undefined,
      }).unwrap();
      toast.success(t("admin.erp.operator.finished"));
      if (result.stokFarki !== undefined && result.stokFarki !== 0) {
        const farkStr = result.stokFarki > 0
          ? `+${result.stokFarki.toFixed(0)}`
          : `${result.stokFarki.toFixed(0)}`;
        toast.info(`Stok düzeltmesi uygulandı: ${farkStr} adet (ölçüm farkı giderildi)`);
      }
      setFinishing(null);
    } catch {
      toast.error(t("admin.erp.common.operationFailed"));
    }
  }

  function openDailyEntry(item: MakineKuyruguDetayDto) {
    setDailyUretilenMiktar("");
    setDailyFireMiktar("0");
    setDailyNotlar("");
    setDailyVardiyaTipi(getHybridShift());
    setDailyEntry(item);
  }

  async function confirmDailyEntry() {
    if (!dailyEntry) return;
    const u = parseFloat(dailyUretilenMiktar || "0");
    const f = parseFloat(dailyFireMiktar || "0");
    if (Number.isNaN(u) || u <= 0 || Number.isNaN(f) || f < 0) {
      toast.error("Günlük üretim miktarı sıfırdan büyük olmalı.");
      return;
    }
    try {
      await gunlukUretimGir({
        makineId: dailyEntry.makineId,
        uretilenMiktar: u,
        fireMiktar: f,
        vardiyaTipi: dailyVardiyaTipi,
        birimTipi: dailyEntry.montaj ? "takim" : "adet",
        notlar: dailyNotlar.trim() || undefined,
      }).unwrap();
      toast.success("Günlük üretim kaydedildi.");
      setDailyEntry(null);
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error && "data" in error
          ? (error as { data?: { error?: { message?: string } } }).data?.error?.message
          : undefined;
      if (message === "aktif_uretim_bulunamadi") {
        toast.error("Bu makinede günlük üretim yazılacak aktif bir iş bulunamadı.");
      } else if (message === "makine_bugun_calismiyor") {
        toast.error("Bu makine için bugün çalışma planı tanımlanmamış.");
      } else {
        toast.error(t("admin.erp.common.operationFailed"));
      }
    }
  }

  function openPause(item: MakineKuyruguDetayDto) {
    setPauseNedenId("");
    setPauseNeden("");
    setPauseUretimMiktari(String(item.uretilenMiktar));
    setPausing(item);
  }

  async function confirmPause() {
    if (!pausing || !pauseNedenId) {
      toast.error(t("admin.erp.operator.pauseReasonRequired"));
      return;
    }
    const uretim = parseFloat(pauseUretimMiktari || "0");
    try {
      await duraklat({
        makineKuyrukId: pausing.id,
        durusNedeniId: pauseNedenId,
        neden: pauseNeden.trim() || durusNedenleri.find((d) => d.id === pauseNedenId)?.ad || "",
        anlikUretimMiktari: uretim > 0 ? uretim : undefined,
      }).unwrap();
      toast.success(t("admin.erp.operator.paused"));
      setPausing(null);
    } catch {
      toast.error(t("admin.erp.common.operationFailed"));
    }
  }

  return (
    <>
      <VardiyaPanel />

      {!isLoading && items.length === 0 && (
        <div className="py-24 text-center">
          <p className="text-2xl font-light text-muted-foreground">Şu an atanmış iş bulunmuyor.</p>
        </div>
      )}

      {/* Industrial Grid Layout */}
      {!isLoading && grouped.size > 0 && (
        <div className="grid gap-10 overflow-x-hidden">
          {Array.from(grouped.entries()).map(([makineId, jobs]) => {
            const first = jobs[0];
            const activeJob = jobs.find((j) => j.durum === "calisiyor" || j.durum === "duraklatildi");
            const firstBekleyenId = jobs.filter((j) => j.durum === "bekliyor").sort((a, b) => a.sira - b.sira)[0]?.id ?? null;
            const firstBekleyenJob = jobs.find((j) => j.id === firstBekleyenId);
            const aktifKalip = aktifKalipByMakine.get(makineId);
            const planliKapali = jobs.find((j) => j.makinePlanliKapali);
            const planliKapaliText = planliKapali
              ? `${planliKapali.makineKapaliAciklama ?? "Planlı kapalı"}${planliKapali.makineKapaliBitisTarih ? ` - ${planliKapali.makineKapaliBitisTarih} tarihine kadar` : ""}`
              : null;
            const remainingJobs = jobs.filter(j => j.id !== activeJob?.id && j.durum !== "tamamlandi");

            return (
              <div key={makineId} className="min-w-0 space-y-4">
                {/* Machine Header Sticker */}
                <div className="flex min-w-0 items-center gap-3">
                  <div className="px-5 py-2 bg-slate-900 text-white rounded-t-xl text-lg font-black tracking-tight border-b-0 border border-slate-900 shadow-md">
                    {first.makineKod}
                  </div>
                  <div className="min-w-0 truncate text-lg font-bold text-slate-700 sm:text-xl">{first.makineAd}</div>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="min-w-0 overflow-x-hidden rounded-2xl border border-slate-200 bg-slate-50/50 p-3 shadow-sm space-y-4 sm:p-6 sm:space-y-6">
                  {/* ACTIVE JOB - MEGA AREA */}
                  {activeJob ? (
                    <div className={`relative overflow-hidden rounded-3xl border-2 p-4 shadow-2xl transition-all sm:p-8 ${activeJob.durum === 'duraklatildi' ? 'border-amber-400 bg-amber-50' : 'border-primary bg-white'}`}>
                      <div className="relative z-10 grid min-w-0 gap-5 lg:grid-cols-[1fr_auto] lg:gap-8">
                        <div className="min-w-0 space-y-6">
                          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                            <Badge className={`text-sm px-3 py-1 uppercase font-bold tracking-widest ${activeJob.durum === 'duraklatildi' ? 'bg-amber-500' : 'bg-primary animate-pulse'}`}>
                              {activeJob.durum === 'duraklatildi' ? 'DURAKLATILDI' : 'ÜRETİMDE'}
                            </Badge>
                            <span className="text-sm font-mono text-muted-foreground"># {activeJob.emirNo}</span>
                          </div>

                          <div className="min-w-0 space-y-2">
                             <div className="break-words text-2xl font-black leading-tight text-slate-900 sm:text-3xl md:text-5xl">{activeJob.urunAd}</div>
                             <div className="break-words text-base font-medium text-muted-foreground sm:text-lg md:text-xl">{activeJob.urunKod} {activeJob.operasyonAdi && `· ${activeJob.operasyonAdi}`}</div>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-6">
                            <div className="bg-slate-100/50 p-4 rounded-2xl">
                              <span className="text-xs font-bold text-slate-500 uppercase">Planlanan</span>
                              <div className="text-2xl font-black text-slate-800 tabular-nums sm:text-3xl">{activeJob.planlananMiktar}</div>
                            </div>
                            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                              <span className="text-xs font-bold text-primary uppercase">Üretilen</span>
                              <div className="text-2xl font-black text-primary tabular-nums sm:text-3xl">{activeJob.uretilenMiktar}</div>
                            </div>
                             <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                              <span className="text-xs font-bold text-rose-500 uppercase">Fire</span>
                              <div className="text-2xl font-black text-rose-600 tabular-nums sm:text-3xl">{activeJob.fireMiktar}</div>
                            </div>
                          </div>
                   
                          {/* Progress Mega Bar */}
                          <div className="space-y-2 pt-2">
                            <div className="flex justify-between items-end">
                              <span className="text-sm font-bold text-slate-600">TAMAMLANMA</span>
                              <span className="text-2xl font-black text-primary">{pct(activeJob.planlananMiktar, activeJob.uretilenMiktar)}%</span>
                            </div>
                            <Progress value={pct(activeJob.planlananMiktar, activeJob.uretilenMiktar)} className="h-4 bg-slate-200" />
                          </div>
                        </div>

                        {/* MEGA BUTTONS AREA */}
                        <div className="flex min-w-0 flex-col gap-3 sm:gap-4 lg:min-w-60">
                          <Button
                            variant="outline"
                            className="h-14 text-base font-bold rounded-2xl border-2"
                            onClick={() => setReceteDetayEmirId(activeJob.uretimEmriId)}
                          >
                            Reçete Detayı
                          </Button>
                          {activeJob.durum === "calisiyor" && (
                            <>
                              <Button 
                                className="h-28 text-2xl font-black flex-col gap-2 rounded-3xl shadow-lg hover:scale-[1.02] transition-transform" 
                                onClick={() => openFinish(activeJob)}
                              >
                                <Square className="size-8" />
                                BİTİR
                              </Button>
                              <Button
                                variant="outline"
                                className="h-20 text-lg font-bold flex-col gap-1 rounded-3xl border-2 hover:bg-sky-50 hover:border-sky-200 transition-all text-sky-700 border-sky-200"
                                onClick={() => openDailyEntry(activeJob)}
                              >
                                <Clock className="size-5" />
                                GÜNLÜK ÜRETİM
                              </Button>
                              <Button 
                                variant="outline" 
                                className="h-20 text-xl font-bold flex-col gap-1 rounded-3xl border-2 hover:bg-amber-50 hover:border-amber-200 transition-all text-amber-600 border-amber-200" 
                                onClick={() => openPause(activeJob)}
                              >
                                <Pause className="size-6" />
                                DURAKLAT
                              </Button>
                            </>
                          )}
                          {activeJob.durum === "duraklatildi" && (
                            <>
                              <Button 
                                className="h-28 text-2xl font-black flex-col gap-3 rounded-3xl bg-amber-500 hover:bg-amber-600 shadow-xl" 
                                onClick={() => openResume(activeJob)}
                              >
                                <RotateCcw className="size-10" />
                                DEVAM ET
                              </Button>
                              <Button
                                variant="outline"
                                className="h-20 text-lg font-bold flex-col gap-1 rounded-3xl border-2 hover:bg-sky-50 hover:border-sky-200 transition-all text-sky-700 border-sky-200"
                                onClick={() => openDailyEntry(activeJob)}
                              >
                                <Clock className="size-5" />
                                GÜNLÜK ÜRETİM
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* EMPTY ACTIVE AREA -> SUGGEST NEXT */
                    <div className="relative flex min-h-[320px] flex-col items-center justify-center gap-6 overflow-hidden rounded-3xl border-2 border-dashed border-slate-300 bg-slate-100/50 p-6 text-center sm:min-h-[400px] sm:gap-8 sm:p-12">
                      <div className="rounded-full border border-slate-200 bg-white p-5 shadow-xl sm:p-8">
                        <RefreshCcw className={`size-14 sm:size-20 ${aktifKalip ? "text-amber-500 animate-spin" : "text-slate-300"}`} />
                      </div>
                      <div className="space-y-3 max-w-md">
                        <h3 className="text-2xl font-black text-slate-800 sm:text-3xl">Şu an çalışan iş yok</h3>
                        <p className="text-base font-medium leading-relaxed text-slate-500 sm:text-lg">
                          {aktifKalip 
                            ? "Kalıp değişimi süreci devam ediyor. Operasyon bitince sıradaki işi başlatabilirsiniz." 
                            : planliKapaliText
                              ? planliKapaliText
                            : "Makine şu an boşta. Kuyruktaki sıradaki işi başlatarak üretime geçebilirsiniz."}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-4 w-full max-w-2xl">
                        {aktifKalip ? (
                          <Button
                            className="h-20 px-10 rounded-2xl bg-amber-500 text-xl font-black hover:bg-amber-600 shadow-lg hover:scale-[1.02] transition-transform"
                            onClick={() => handleKalipDegisimBitir(aktifKalip.id)}
                          >
                            <Square className="mr-3 size-6" />
                            KALIP DEĞİŞİMİ BİTİR
                          </Button>
                        ) : (
                          <>
                            {firstBekleyenJob && (
                              <Button
                                className="min-h-20 px-6 rounded-3xl bg-primary text-base font-black hover:bg-primary/90 shadow-xl hover:scale-[1.02] transition-transform flex-col gap-1 sm:h-24 sm:px-12 sm:text-2xl"
                                disabled={!!planliKapaliText}
                                onClick={() => handleBaslat(firstBekleyenJob)}
                              >
                                <span className="text-xs font-bold opacity-70 uppercase tracking-widest">SIRADAKİ İŞİ BAŞLAT</span>
                                {firstBekleyenJob.urunAd}
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              className="h-20 px-10 rounded-2xl border-2 border-amber-200 text-lg font-black text-amber-700 hover:bg-amber-50 shadow-md transition-all"
                              onClick={() => handleKalipDegisimBaslat(makineId, firstBekleyenJob?.id)}
                            >
                              <RefreshCcw className="mr-3 size-6" />
                              KALIP DEĞİŞTİR
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* QUEUE AREA - COLLAPSED / HORIZONTAL SCROLL */}
                  {remainingJobs.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Sıradaki İşler ({remainingJobs.length})</h4>
                        <Button variant="ghost" size="sm" className="text-xs font-bold" onClick={() => refetch()}>YENİLE</Button>
                      </div>
                      <div className="grid gap-2 pb-4 sm:gap-4 sm:grid-cols-[repeat(auto-fill,minmax(18rem,1fr))]">
                        {remainingJobs.map((job) => {
                          const canStart = job.durum === "bekliyor" && !activeJob && !aktifKalip && !job.makinePlanliKapali && job.id === firstBekleyenId;
                          return (
                            <Fragment key={job.id}>
                            <div className={`flex min-w-0 items-center gap-2 rounded-xl border bg-white p-2 sm:hidden ${canStart ? 'border-primary ring-1 ring-primary' : 'opacity-80'}`}>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-black text-slate-800">{job.urunAd}</div>
                                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <span className="truncate">{job.urunKod}</span>
                                  <Badge variant="outline" className="h-5 shrink-0 px-1 text-[10px]">{job.planlananMiktar}</Badge>
                                  {job.makinePlanliKapali ? (
                                    <Badge variant="destructive" className="h-5 shrink-0 px-1 text-[10px]">Kapalı</Badge>
                                  ) : null}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                className="h-8 shrink-0 rounded-lg px-3 text-xs font-bold"
                                disabled={!canStart}
                                onClick={() => handleBaslat(job)}
                              >
                                {canStart ? 'Başlat' : 'Sırada'}
                              </Button>
                            </div>
                            <Card className={`hidden w-full border-2 transition-all sm:block ${canStart ? 'border-primary/30 ring-2 ring-primary ring-offset-4' : 'opacity-80'}`}>
                              <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 text-xs font-mono font-bold text-slate-400"># {job.emirNo}</div>
                                  <div className="flex shrink-0 flex-wrap justify-end gap-1">
                                    {job.makinePlanliKapali ? (
                                      <Badge variant="destructive" className="text-[10px]">Kapalı</Badge>
                                    ) : null}
                                    <Badge variant="outline" className="text-[10px]">{job.planlananMiktar} Adet</Badge>
                                  </div>
                                </div>
                                <CardTitle className="mt-1 truncate text-sm font-black text-slate-800 sm:text-base">{job.urunAd}</CardTitle>
                              </CardHeader>
                              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                                <p className="mb-3 truncate text-xs text-muted-foreground sm:mb-4">{job.urunKod} {job.operasyonAdi && `· ${job.operasyonAdi}`}</p>
                                <Button 
                                  className="h-9 w-full rounded-xl font-bold sm:h-10" 
                                  disabled={!canStart} 
                                  onClick={() => handleBaslat(job)}
                                >
                                  {canStart ? 'BAŞLAT' : 'SIRADA'}
                                </Button>
                                <Button
                                  variant="outline"
                                  className="mt-2 h-9 w-full rounded-xl font-semibold"
                                  onClick={() => setReceteDetayEmirId(job.uretimEmriId)}
                                >
                                  Reçete Detayı
                                </Button>
                              </CardContent>
                            </Card>
                            </Fragment>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Sheet open={!!finishing} onOpenChange={(v) => !v && setFinishing(null)}>
        <SheetContent side="right" className="h-dvh w-full max-w-full p-0 sm:h-auto sm:max-w-2xl">
          <SheetHeader className="border-b px-4 py-4">
            <SheetTitle>{t("admin.erp.operator.finishTitle")}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4 py-4">
            <p className="text-sm text-muted-foreground">
              <strong className="font-mono">{finishing?.emirNo}</strong> — {finishing?.urunAd}
            </p>
            {finishing && finishing.oncekiUretimToplam > 0 && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
                <div className="font-medium">{t("admin.erp.operator.previousMeasurements")}</div>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>{t("admin.erp.operator.producedQuantity")}: <span className="font-medium text-foreground">{finishing.oncekiUretimToplam ?? 0}</span></div>
                  <div>{t("admin.erp.operator.scrapQuantity")}: <span className="font-medium text-foreground">{finishing.oncekiFireToplam ?? 0}</span></div>
                </div>
                <p className="text-xs text-muted-foreground">{t("admin.erp.operator.finishTotalHint")}</p>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>
                  {finishing?.montaj ? t("admin.erp.operator.setCount") : t("admin.erp.operator.producedCount")}
                </Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={uretilenMiktar}
                  onChange={(e) => setUretilenMiktar(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label>{t("admin.erp.operator.scrapCount")}</Label>
                <Input type="number" step="0.0001" value={fireMiktar} onChange={(e) => setFireMiktar(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t("admin.erp.operator.notes")}</Label>
              <Textarea rows={2} value={notlar} onChange={(e) => setNotlar(e.target.value)} />
            </div>
          </div>
          <SheetFooter className="border-t px-4 py-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setFinishing(null)}>
              {t("admin.common.cancel")}
            </Button>
            <Button onClick={confirmFinish}>{t("admin.common.save")}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={!!dailyEntry} onOpenChange={(v) => !v && setDailyEntry(null)}>
        <SheetContent side="right" className="h-dvh w-full max-w-full p-0 sm:h-auto sm:max-w-2xl">
          <SheetHeader className="border-b px-4 py-4">
            <SheetTitle>Günlük Üretim Girişi</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4 py-4">
            <p className="text-sm text-muted-foreground">
              <strong className="font-mono">{dailyEntry?.emirNo}</strong> — {dailyEntry?.urunAd}
            </p>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>Bu alana toplam iş miktarını değil, yalnız bu vardiyada üretilen ek miktarı girin.</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-full px-3 text-xs"
                  onClick={() => setDailyVardiyaTipi((current) => (current === "gunduz" ? "gece" : "gunduz"))}
                >
                  {dailyVardiyaTipi === "gunduz" ? "Gündüz" : "Gece"} Vardiyası
                </Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>
                  {dailyEntry?.montaj ? "Vardiyada Üretilen Takım" : "Vardiyada Üretilen Adet"}
                </Label>
                <Input
                  type="number"
                  step="0.0001"
                  min={0}
                  value={dailyUretilenMiktar}
                  onChange={(e) => setDailyUretilenMiktar(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label>Vardiya Fire Miktarı</Label>
                <Input
                  type="number"
                  step="0.0001"
                  min={0}
                  value={dailyFireMiktar}
                  onChange={(e) => setDailyFireMiktar(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t("admin.erp.operator.notes")}</Label>
              <Textarea rows={2} value={dailyNotlar} onChange={(e) => setDailyNotlar(e.target.value)} />
            </div>
          </div>
          <SheetFooter className="border-t px-4 py-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setDailyEntry(null)}>
              {t("admin.common.cancel")}
            </Button>
            <Button onClick={confirmDailyEntry}>Günlük Üretimi Kaydet</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Pause Sheet */}
      <Sheet open={!!pausing} onOpenChange={(v) => !v && setPausing(null)}>
        <SheetContent side="right" className="h-dvh w-full max-w-full p-0 sm:h-auto sm:max-w-2xl">
          <SheetHeader className="border-b px-4 py-4">
            <SheetTitle>{t("admin.erp.operator.pauseTitle")}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4 py-4">
            <p className="text-sm text-muted-foreground">
              <strong className="font-mono">{pausing?.emirNo}</strong> — {pausing?.urunAd}
            </p>
            <div className="space-y-1">
              <Label>{t("admin.erp.operator.pauseReason")} *</Label>
              <Select value={pauseNedenId || "none"} onValueChange={(v) => {
                const id = v === "none" ? "" : v;
                setPauseNedenId(id);
                const found = durusNedenleri.find((d) => d.id === id);
                if (found) setPauseNeden(found.ad);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.erp.operator.selectPauseReason")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("admin.erp.operator.selectPauseReason")}</SelectItem>
                  {durusNedenleri.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.kod} — {d.ad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("admin.erp.operator.pauseNote")}</Label>
              <Input value={pauseNeden} onChange={(e) => setPauseNeden(e.target.value)} placeholder={t("admin.erp.operator.pauseNotePlaceholder")} />
            </div>
            <div className="space-y-1">
              <Label>{t("admin.erp.operator.currentProduction")}</Label>
              <Input type="number" step="0.0001" value={pauseUretimMiktari} onChange={(e) => setPauseUretimMiktari(e.target.value)} />
            </div>
          </div>
          <SheetFooter className="border-t px-4 py-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setPausing(null)}>
              {t("admin.common.cancel")}
            </Button>
            <Button onClick={confirmPause} disabled={!pauseNedenId}>{t("admin.erp.operator.pauseConfirm")}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Resume (DevamEt) Sheet */}
      <Sheet open={!!resuming} onOpenChange={(v) => !v && setResuming(null)}>
        <SheetContent side="right" className="h-dvh w-full max-w-full p-0 sm:h-auto sm:max-w-2xl">
          <SheetHeader className="border-b px-4 py-4">
            <SheetTitle>{t("admin.erp.operator.resumeTitle")}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4 py-4">
            <p className="text-sm text-muted-foreground">
              <strong className="font-mono">{resuming?.emirNo}</strong> — {resuming?.urunAd}
            </p>
            <div className="space-y-1">
              <Label>{t("admin.erp.operator.notes")}</Label>
              <Textarea rows={2} value={resumeNotlar} onChange={(e) => setResumeNotlar(e.target.value)} />
            </div>
          </div>
          <SheetFooter className="border-t px-4 py-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setResuming(null)}>
              {t("admin.common.cancel")}
            </Button>
            <Button onClick={confirmResume}>
              <RotateCcw className="mr-1 size-4" />
              {t("admin.erp.operator.resumeConfirm")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ReceteDetayModal emirId={receteDetayEmirId} onOpenChange={(open) => !open && setReceteDetayEmirId(null)} />
    </>
  );
}

function VardiyaPanel() {
  const { data: vardiyaData, isLoading } = useGetAcikVardiyalarAdminQuery();

  const makineler = vardiyaData ?? [];
  const formatVardiyaTime = (value: string | Date | null): string | null => {
    if (!value) return null;
    if (value instanceof Date) {
      return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
    }
    const timePart = value.includes("T") ? value.split("T")[1] : value.split(" ")[1];
    return timePart?.slice(0, 5) ?? null;
  };

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-10">
        <div className="bg-slate-50 border-b px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-3 rounded-full bg-emerald-500" />
             <h3 className="text-lg font-black tracking-tight text-slate-800 uppercase italic">Vardiya Durumu</h3>
          </div>
          <p className="text-xs font-bold text-slate-500 tracking-widest">Vardiyalar sistem tarafından yönetilir, üretim takibi iş kartlarından yapılır</p>
        </div>
        
        <div className="p-4 md:p-8">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : makineler.length === 0 ? (
            <div className="py-12 text-center text-slate-400 italic">Aktif makine bulunamadı.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {makineler.map((makine) => {
                const isAcik = makine.acikVardiyaId !== null;
                const baslangicStr = formatVardiyaTime(makine.baslangic);
                const vardiyaTipiLabel = makine.vardiyaTipi === "gece" ? "Gece" : "Gündüz";

                return (
                  <div key={makine.makineId} className={`p-6 rounded-3xl border-2 transition-all flex flex-col justify-between min-h-[160px] ${isAcik ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 bg-white'}`}>
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-black font-mono shadow-sm">{makine.makineKod}</span>
                        {isAcik && <Badge className="bg-emerald-600 font-bold">{vardiyaTipiLabel} · {baslangicStr}</Badge>}
                      </div>
                      <div className="text-lg font-black tracking-tight text-slate-800 truncate mb-4">{makine.makineAd}</div>
                      <p className="text-sm text-slate-500">
                        {isAcik
                          ? "Vardiya aktif. Üretim kaydını aşağıdaki iş kartlarından yönetin."
                          : "Uygun vardiya saatinde ve çalışma takvimi açıksa sistem otomatik açar."}
                      </p>
                    </div>

                    <div className={`flex-1 h-14 rounded-2xl border px-4 text-sm font-medium flex items-center justify-center text-center ${
                      isAcik
                        ? "border-emerald-200 bg-white text-emerald-700"
                        : "border-dashed border-slate-300 bg-slate-50 text-slate-500"
                    }`}>
                      {isAcik ? "Otomatik vardiya aktif" : "Otomatik vardiya bekleniyor"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ============================================================
