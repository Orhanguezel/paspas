"use client";

// =============================================================
// Paspas ERP — Operatör Ekranı (makine-merkezli V2, 2 sekmeli)
// =============================================================

import { useEffect, useState } from "react";

import { AlertTriangle, Clock, Pause, Play, RefreshCcw, RotateCcw, Square, X } from "lucide-react";
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
  useListMakineKuyruguAdminQuery,
  useUretimBaslatAdminMutation,
  useUretimBitirAdminMutation,
} from "@/integrations/endpoints/admin/erp/operator_admin.endpoints";
import { useListDurusNedenleriAdminQuery } from "@/integrations/endpoints/admin/erp/tanimlar_admin.endpoints";
import type { MakineKuyruguDetayDto } from "@/integrations/shared/erp/operator.types";

const DURUM_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  bekliyor: "outline",
  calisiyor: "default",
  duraklatildi: "secondary",
  tamamlandi: "default",
  iptal: "destructive",
};

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
  const [baslat] = useUretimBaslatAdminMutation();
  const [bitir] = useUretimBitirAdminMutation();
  const [duraklat] = useDuraklatAdminMutation();
  const [devamEt] = useDevamEtAdminMutation();
  const [gunlukUretimGir] = useGunlukUretimAdminMutation();

  const [finishing, setFinishing] = useState<MakineKuyruguDetayDto | null>(null);
  const [uretilenMiktar, setUretilenMiktar] = useState("");
  const [fireMiktar, setFireMiktar] = useState("0");
  const [notlar, setNotlar] = useState("");

  const [dailyEntry, setDailyEntry] = useState<MakineKuyruguDetayDto | null>(null);
  const [dailyUretilenMiktar, setDailyUretilenMiktar] = useState("");
  const [dailyFireMiktar, setDailyFireMiktar] = useState("0");
  const [dailyNotlar, setDailyNotlar] = useState("");

  const [resuming, setResuming] = useState<MakineKuyruguDetayDto | null>(null);
  const [resumeNotlar, setResumeNotlar] = useState("");

  const [pausing, setPausing] = useState<MakineKuyruguDetayDto | null>(null);
  const [pauseNedenId, setPauseNedenId] = useState("");
  const [pauseNeden, setPauseNeden] = useState("");
  const [pauseUretimMiktari, setPauseUretimMiktari] = useState("");

  const { data: durusNedenleriData } = useListDurusNedenleriAdminQuery();
  const durusNedenleri = (durusNedenleriData?.items ?? []).filter((d) => d.isActive);

  const items = data?.items ?? [];

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
      if (message === "makine_bugun_calismiyor") {
        toast.error("Bu makine için bugün çalışma planı tanımlanmamış.");
      } else if (message === "makinede_aktif_is_var") {
        toast.error("Bu makinede zaten çalışan bir iş var.");
      } else if (message === "sadece_bekliyor_baslatilabilir") {
        toast.error("Sadece bekleyen işler başlatılabilir.");
      } else {
        toast.error(t("admin.erp.common.operationFailed"));
      }
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
        <div className="grid gap-10">
          {Array.from(grouped.entries()).map(([makineId, jobs]) => {
            const first = jobs[0];
            const activeJob = jobs.find((j) => j.durum === "calisiyor" || j.durum === "duraklatildi");
            const firstBekleyenId = jobs.filter((j) => j.durum === "bekliyor").sort((a, b) => a.sira - b.sira)[0]?.id ?? null;
            const remainingJobs = jobs.filter(j => j.id !== activeJob?.id && j.durum !== "tamamlandi");

            return (
              <div key={makineId} className="space-y-4">
                {/* Machine Header Sticker */}
                <div className="flex items-center gap-3">
                  <div className="px-5 py-2 bg-slate-900 text-white rounded-t-xl text-lg font-black tracking-tight border-b-0 border border-slate-900 shadow-md">
                    {first.makineKod}
                  </div>
                  <div className="text-xl font-bold text-slate-700">{first.makineAd}</div>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  {/* ACTIVE JOB - MEGA AREA */}
                  {activeJob ? (
                    <div className={`relative overflow-hidden p-8 rounded-3xl border-2 shadow-2xl transition-all ${activeJob.durum === 'duraklatildi' ? 'border-amber-400 bg-amber-50' : 'border-primary bg-white'}`}>
                      <div className="relative z-10 grid lg:grid-cols-[1fr_auto] gap-8">
                        <div className="space-y-6">
                          <div className="flex items-center gap-3">
                            <Badge className={`text-sm px-3 py-1 uppercase font-bold tracking-widest ${activeJob.durum === 'duraklatildi' ? 'bg-amber-500' : 'bg-primary animate-pulse'}`}>
                              {activeJob.durum === 'duraklatildi' ? 'DURAKLATILDI' : 'ÜRETİMDE'}
                            </Badge>
                            <span className="text-sm font-mono text-muted-foreground"># {activeJob.emirNo}</span>
                          </div>

                          <div className="space-y-2">
                             <div className="text-4xl font-black leading-tight text-slate-900">{activeJob.urunAd}</div>
                             <div className="text-xl font-medium text-muted-foreground">{activeJob.urunKod} {activeJob.operasyonAdi && `· ${activeJob.operasyonAdi}`}</div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                            <div className="bg-slate-100/50 p-4 rounded-2xl">
                              <span className="text-xs font-bold text-slate-500 uppercase">Planlanan</span>
                              <div className="text-3xl font-black text-slate-800 tabular-nums">{activeJob.planlananMiktar}</div>
                            </div>
                            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                              <span className="text-xs font-bold text-primary uppercase">Üretilen</span>
                              <div className="text-3xl font-black text-primary tabular-nums">{activeJob.uretilenMiktar}</div>
                            </div>
                             <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                              <span className="text-xs font-bold text-rose-500 uppercase">Fire</span>
                              <div className="text-3xl font-black text-rose-600 tabular-nums">{activeJob.fireMiktar}</div>
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
                        <div className="flex flex-col gap-4 min-w-60">
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
                    <div className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-3xl p-12 text-center flex flex-col items-center gap-6">
                      <div className="bg-white p-6 rounded-full shadow-inner border border-slate-200">
                        <Play className="size-16 text-slate-300" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-2xl font-bold text-slate-700">Şu an çalışan iş yok</h3>
                        <p className="text-slate-500">Kuyruktaki sıradaki işi başlatabilirsiniz.</p>
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
                      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                        {remainingJobs.map((job) => {
                          const canStart = job.durum === "bekliyor" && !activeJob && job.id === firstBekleyenId;
                          return (
                            <Card key={job.id} className={`shrink-0 w-80 snap-start border-2 transition-all ${canStart ? 'ring-2 ring-primary ring-offset-4 border-primary/30' : 'opacity-80'}`}>
                              <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                  <div className="text-xs font-mono font-bold text-slate-400"># {job.emirNo}</div>
                                  <Badge variant="outline" className="text-[10px]">{job.planlananMiktar} Adet</Badge>
                                </div>
                                <CardTitle className="text-base font-black truncate text-slate-800 mt-1">{job.urunAd}</CardTitle>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <p className="text-xs text-muted-foreground truncate mb-4">{job.urunKod} {job.operasyonAdi && `· ${job.operasyonAdi}`}</p>
                                <Button 
                                  className="w-full font-bold h-10 rounded-xl" 
                                  disabled={!canStart} 
                                  onClick={() => handleBaslat(job)}
                                >
                                  {canStart ? 'BAŞLAT' : 'SIRADA'}
                                </Button>
                              </CardContent>
                            </Card>
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
        <SheetContent side="right" className="w-full p-0 sm:max-w-md">
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
        <SheetContent side="right" className="w-full p-0 sm:max-w-md">
          <SheetHeader className="border-b px-4 py-4">
            <SheetTitle>Günlük Üretim Girişi</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4 py-4">
            <p className="text-sm text-muted-foreground">
              <strong className="font-mono">{dailyEntry?.emirNo}</strong> — {dailyEntry?.urunAd}
            </p>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              Bu alana toplam iş miktarını değil, yalnız bu vardiyada üretilen ek miktarı girin.
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
        <SheetContent side="right" className="w-full p-0 sm:max-w-md">
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
        <SheetContent side="right" className="w-full p-0 sm:max-w-md">
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
    </>
  );
}

function VardiyaPanel() {
  const { data: vardiyaData, isLoading } = useGetAcikVardiyalarAdminQuery();

  const makineler = vardiyaData ?? [];

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
                const baslangicStr = makine.baslangic
                  ? new Date(makine.baslangic).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
                  : null;
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
