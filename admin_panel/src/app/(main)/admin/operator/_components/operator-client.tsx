"use client";

// =============================================================
// Paspas ERP — Operatör Ekranı (makine-merkezli V2, 2 sekmeli)
// =============================================================

import { useEffect, useState } from "react";

import { Check, Clock, Pause, Play, RefreshCcw, RotateCcw, Square, Truck, X } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useLocaleContext } from "@/i18n/LocaleProvider";
import {
  useDevamEtAdminMutation,
  useDuraklatAdminMutation,
  useGetAcikVardiyalarAdminQuery,
  useListMakineKuyruguAdminQuery,
  useUretimBaslatAdminMutation,
  useUretimBitirAdminMutation,
  useVardiyaBasiAdminMutation,
  useVardiyaSonuAdminMutation,
} from "@/integrations/endpoints/admin/erp/operator_admin.endpoints";
import { useListDurusNedenleriAdminQuery } from "@/integrations/endpoints/admin/erp/tanimlar_admin.endpoints";
import {
  useListSevkEmirleriAdminQuery,
  useUpdateSevkEmriAdminMutation,
} from "@/integrations/endpoints/admin/erp/sevkiyat_admin.endpoints";
import type { MakineKuyruguDetayDto } from "@/integrations/shared/erp/operator.types";
import { SEVK_DURUM_BADGE, SEVK_DURUM_LABELS } from "@/integrations/shared/erp/sevkiyat.types";

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
  const [activeTab, setActiveTab] = useState("kuyruk");
  const now = useRealtimeClock();

  const dateStr = now.toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{t("admin.erp.operator.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.erp.operator.description")}</p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2">
          <Clock className="size-5 text-muted-foreground" />
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums tracking-tight">{timeStr}</div>
            <div className="text-xs text-muted-foreground">{dateStr}</div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="kuyruk">{t("admin.erp.operator.tabs.kuyruk")}</TabsTrigger>
          <TabsTrigger value="sevkiyat">{t("admin.erp.operator.tabs.sevkiyat")}</TabsTrigger>
        </TabsList>

        <TabsContent value="kuyruk" className="space-y-4">
          <MakineKuyruguTab />
        </TabsContent>
        <TabsContent value="sevkiyat" className="space-y-4">
          <SevkiyatTab />
        </TabsContent>
      </Tabs>
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

  const [finishing, setFinishing] = useState<MakineKuyruguDetayDto | null>(null);
  const [uretilenMiktar, setUretilenMiktar] = useState("");
  const [fireMiktar, setFireMiktar] = useState("0");
  const [notlar, setNotlar] = useState("");

  const [resuming, setResuming] = useState<MakineKuyruguDetayDto | null>(null);
  const [resumeUretim, setResumeUretim] = useState("0");
  const [resumeFire, setResumeFire] = useState("0");
  const [resumeNotlar, setResumeNotlar] = useState("");

  const [pausing, setPausing] = useState<MakineKuyruguDetayDto | null>(null);
  const [pauseNedenId, setPauseNedenId] = useState("");
  const [pauseNeden, setPauseNeden] = useState("");
  const [pauseUretimMiktari, setPauseUretimMiktari] = useState("");

  const { data: durusNedenleriData } = useListDurusNedenleriAdminQuery();
  const durusNedenleri = (durusNedenleriData?.items ?? []).filter((d) => d.isActive);

  const items = data?.items ?? [];

  // Group by machine
  const grouped = new Map<string, MakineKuyruguDetayDto[]>();
  for (const item of items) {
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
    } catch {
      toast.error(t("admin.erp.common.operationFailed"));
    }
  }

  function openResume(item: MakineKuyruguDetayDto) {
    setResumeUretim("0");
    setResumeFire("0");
    setResumeNotlar("");
    setResuming(item);
  }

  async function confirmResume() {
    if (!resuming) return;
    const u = Number.parseFloat(resumeUretim || "0");
    const f = Number.parseFloat(resumeFire || "0");
    if (Number.isNaN(u) || u < 0 || Number.isNaN(f) || f < 0) {
      toast.error(t("admin.erp.operator.invalidQuantity"));
      return;
    }
    try {
      await devamEt({
        makineKuyrukId: resuming.id,
        uretilenMiktar: u > 0 ? u : undefined,
        fireMiktar: f,
        birimTipi: resuming.montaj ? "takim" : "adet",
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

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCcw className={`size-4${isFetching ? " animate-spin" : ""}`} />
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={`operator-skeleton-${index}`}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <p>{t("admin.erp.operator.noQueue")}</p>
        </div>
      )}

      {!isLoading && grouped.size > 0 && (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([makineId, jobs]) => {
            const first = jobs[0];
            const hasActiveJob = jobs.some((j) => j.durum === "calisiyor" || j.durum === "duraklatildi");
            const firstBekleyenId = jobs.filter((j) => j.durum === "bekliyor").sort((a, b) => a.sira - b.sira)[0]?.id ?? null;
            return (
              <div key={makineId}>
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                  {first.makineKod} — {first.makineAd}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {jobs.map((job) => {
                    const progress = pct(job.planlananMiktar, job.uretilenMiktar);
                    const canStart = job.durum === "bekliyor" && !hasActiveJob && job.id === firstBekleyenId;
                    return (
                      <Card key={job.id} className="flex flex-col">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-mono">{job.emirNo}</CardTitle>
                            <Badge variant={DURUM_BADGE[job.durum] ?? "outline"}>
                              {DURUM_LABEL[job.durum] ?? job.durum}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {job.urunKod} — {job.urunAd}
                            {job.operasyonAdi && <span className="ml-1">({job.operasyonAdi})</span>}
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-2">
                          <div className="grid grid-cols-3 gap-1 text-xs">
                            <div>
                              <span className="text-muted-foreground">{t("admin.erp.operator.planned")}</span>
                              <div className="font-medium">{job.planlananMiktar}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{t("admin.erp.operator.produced")}</span>
                              <div className="font-medium">{job.uretilenMiktar}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{t("admin.erp.operator.scrap")}</span>
                              <div className="font-medium">{job.fireMiktar}</div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{t("admin.erp.operator.progress")}</span>
                              <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                          {job.montaj && (
                            <Badge variant="outline" className="text-xs">
                              {t("admin.erp.operator.assembly")}
                            </Badge>
                          )}
                        </CardContent>
                        <CardFooter className="gap-1 pt-0 flex-wrap">
                          {job.durum === "bekliyor" && (
                            <Button size="sm" className="flex-1" onClick={() => handleBaslat(job)} disabled={!canStart}>
                              <Play className="mr-1 size-3.5" />
                              {t("admin.erp.operator.start")}
                            </Button>
                          )}
                          {job.durum === "calisiyor" && (
                            <>
                              <Button size="sm" className="flex-1" onClick={() => openFinish(job)}>
                                <Square className="mr-1 size-3.5" />
                                {t("admin.erp.operator.finish")}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => openPause(job)}>
                                <Pause className="size-3.5" />
                              </Button>
                            </>
                          )}
                          {job.durum === "duraklatildi" && (
                            <Button size="sm" className="flex-1" onClick={() => openResume(job)}>
                              <RotateCcw className="mr-1 size-3.5" />
                              {t("admin.erp.operator.resume")}
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Finish Sheet */}
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
                  <div>{t("admin.erp.operator.producedQuantity")}: <span className="font-medium text-foreground">{finishing.oncekiUretimToplam}</span></div>
                  <div>{t("admin.erp.operator.scrapQuantity")}: <span className="font-medium text-foreground">{finishing.oncekiFireToplam}</span></div>
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
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{t("admin.erp.operator.producedQuantity")}</Label>
                <Input
                  type="number"
                  step="0.0001"
                  min={0}
                  value={resumeUretim}
                  onChange={(e) => setResumeUretim(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{t("admin.erp.operator.scrapQuantity")}</Label>
                <Input
                  type="number"
                  step="0.0001"
                  min={0}
                  value={resumeFire}
                  onChange={(e) => setResumeFire(e.target.value)}
                />
              </div>
            </div>
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
  const { t } = useLocaleContext();
  const { data: vardiyaData, isLoading } = useGetAcikVardiyalarAdminQuery();
  const [vardiyaBasi, { isLoading: isStarting }] = useVardiyaBasiAdminMutation();
  const [vardiyaSonu, { isLoading: isEnding }] = useVardiyaSonuAdminMutation();

  // Per-machine shift type selection
  const [vardiyaTipleri, setVardiyaTipleri] = useState<Record<string, "gunduz" | "gece">>({});

  // Sheet state for closing a shift
  const [closingMakineId, setClosingMakineId] = useState<string | null>(null);
  const [shiftEndUretim, setShiftEndUretim] = useState("0");
  const [shiftEndFire, setShiftEndFire] = useState("0");
  const [shiftEndNotlar, setShiftEndNotlar] = useState("");

  const makineler = vardiyaData ?? [];
  const closingMakine = makineler.find((m) => m.makineId === closingMakineId) ?? null;

  function getVardiyaTipi(makineId: string): "gunduz" | "gece" {
    return vardiyaTipleri[makineId] ?? "gunduz";
  }

  function getErrorMessage(error: unknown): string {
    const message =
      typeof error === "object" && error && "data" in error
        ? (error as { data?: { error?: { message?: string } } }).data?.error?.message
        : undefined;
    if (message === "vardiya_saati_gecersiz") return t("admin.erp.operator.shiftTimeInvalid");
    if (message === "acik_vardiya_zaten_var") return t("admin.erp.operator.shiftAlreadyOpen");
    if (message === "acik_vardiya_bulunamadi") return t("admin.erp.operator.shiftNotFound");
    return t("admin.erp.common.operationFailed");
  }

  async function handleShiftStart(makineId: string) {
    try {
      await vardiyaBasi({ makineId, vardiyaTipi: getVardiyaTipi(makineId) }).unwrap();
      toast.success(t("admin.erp.operator.shiftStarted"));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  function openShiftEnd(makineId: string) {
    setClosingMakineId(makineId);
    setShiftEndUretim("0");
    setShiftEndFire("0");
    setShiftEndNotlar("");
  }

  async function confirmShiftEnd() {
    if (!closingMakineId) return;
    const u = Number.parseFloat(shiftEndUretim || "0");
    const f = Number.parseFloat(shiftEndFire || "0");
    if (Number.isNaN(u) || u < 0 || Number.isNaN(f) || f < 0) {
      toast.error(t("admin.erp.operator.invalidQuantity"));
      return;
    }
    try {
      await vardiyaSonu({
        makineId: closingMakineId,
        uretilenMiktar: u > 0 ? u : undefined,
        fireMiktar: f,
        notlar: shiftEndNotlar.trim() || undefined,
      }).unwrap();
      toast.success(t("admin.erp.operator.shiftEnded"));
      setClosingMakineId(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("admin.erp.operator.shiftTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 px-6 pb-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : makineler.length === 0 ? (
            <p className="px-6 pb-4 text-sm text-muted-foreground">Aktif makine bulunamadı.</p>
          ) : (
            <div className="divide-y">
              {makineler.map((makine) => {
                const isAcik = makine.acikVardiyaId !== null;
                const baslangicStr = makine.baslangic
                  ? new Date(makine.baslangic).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
                  : null;
                const vardiyaTipiLabel = makine.vardiyaTipi === "gece" ? "Gece" : "Gündüz";

                return (
                  <div key={makine.makineId} className="flex items-center gap-3 px-6 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{makine.makineKod}</div>
                      <div className="truncate text-xs text-muted-foreground">{makine.makineAd}</div>
                    </div>

                    {isAcik ? (
                      <>
                        <Badge className="shrink-0 bg-green-600 text-white">
                          {vardiyaTipiLabel} {baslangicStr && `· ${baslangicStr}`}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openShiftEnd(makine.makineId)}
                          disabled={isEnding}
                        >
                          <Square className="mr-1 size-3" />
                          Kapat
                        </Button>
                      </>
                    ) : (
                      <>
                        <Select
                          value={getVardiyaTipi(makine.makineId)}
                          onValueChange={(v) =>
                            setVardiyaTipleri((prev) => ({ ...prev, [makine.makineId]: v as "gunduz" | "gece" }))
                          }
                        >
                          <SelectTrigger className="h-8 w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gunduz">{t("admin.erp.operator.dayShift")}</SelectItem>
                            <SelectItem value="gece">{t("admin.erp.operator.nightShift")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={() => handleShiftStart(makine.makineId)} disabled={isStarting}>
                          <Play className="mr-1 size-3" />
                          Aç
                        </Button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vardiya Kapat Sheet */}
      <Sheet open={closingMakineId !== null} onOpenChange={(open) => !open && setClosingMakineId(null)}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-md">
          <SheetHeader className="border-b px-4 py-4">
            <SheetTitle>
              {closingMakine
                ? `${closingMakine.makineKod} — ${t("admin.erp.operator.endShift")}`
                : t("admin.erp.operator.endShift")}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{t("admin.erp.operator.producedQuantity")}</Label>
                <Input
                  type="number"
                  step="0.0001"
                  min={0}
                  value={shiftEndUretim}
                  onChange={(e) => setShiftEndUretim(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label>{t("admin.erp.operator.scrapQuantity")}</Label>
                <Input
                  type="number"
                  step="0.0001"
                  min={0}
                  value={shiftEndFire}
                  onChange={(e) => setShiftEndFire(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t("admin.erp.operator.notes")}</Label>
              <Textarea value={shiftEndNotlar} onChange={(e) => setShiftEndNotlar(e.target.value)} rows={2} />
            </div>
          </div>
          <SheetFooter className="border-t px-4 py-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setClosingMakineId(null)}>
              {t("admin.common.cancel")}
            </Button>
            <Button onClick={confirmShiftEnd} disabled={isEnding}>
              <Check className="mr-1 size-4" />
              {t("admin.erp.operator.endShift")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ============================================================
// Tab 2: Sevkiyat
// ============================================================

function SevkiyatTab() {
  const { t } = useLocaleContext();
  const [q, setQ] = useState("");
  const [durumFilter, setDurumFilter] = useState<"_acik" | "_all" | "bekliyor" | "onaylandi" | "sevk_edildi" | "iptal">("_acik");
  const [updateEmri] = useUpdateSevkEmriAdminMutation();
  const { data, isLoading, isFetching, refetch } = useListSevkEmirleriAdminQuery({
    q: q.trim() || undefined,
    durum: durumFilter === "_acik" || durumFilter === "_all" ? undefined : durumFilter,
    limit: 100,
  });

  const allItems = data?.items ?? [];
  const items =
    durumFilter === "_acik"
      ? allItems.filter((item) => item.durum === "bekliyor" || item.durum === "onaylandi")
      : allItems;

  async function handleDurumChange(id: string, durum: "sevk_edildi" | "iptal") {
    try {
      await updateEmri({ id, body: { durum } }).unwrap();
      toast.success(
        t("admin.erp.sevkiyat.messages.durumGuncellendi", {
          durum: SEVK_DURUM_LABELS[durum]?.toLowerCase() ?? durum,
        }),
      );
    } catch {
      toast.error(t("admin.erp.sevkiyat.messages.durumHata"));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Truck className="size-4" />
          {t("admin.erp.operator.shipmentQueueTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("admin.erp.operator.shipmentQueueDescription")}</p>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t("admin.erp.sevkiyat.filters.ara")}</Label>
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder={t("admin.erp.sevkiyat.filters.araPlaceholder")}
              className="h-8 w-64"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t("admin.erp.sevkiyat.filters.durum")}</Label>
            <Select value={durumFilter} onValueChange={(value) => setDurumFilter(value as typeof durumFilter)}>
              <SelectTrigger className="h-8 w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_acik">{t("admin.erp.operator.openShipmentOrders")}</SelectItem>
                <SelectItem value="_all">{t("admin.erp.sevkiyat.filters.tumDurumlar")}</SelectItem>
                <SelectItem value="bekliyor">{t("admin.erp.sevkiyat.durumlar.bekliyor")}</SelectItem>
                <SelectItem value="onaylandi">{t("admin.erp.sevkiyat.durumlar.onaylandi")}</SelectItem>
                <SelectItem value="sevk_edildi">{t("admin.erp.sevkiyat.durumlar.sevk_edildi")}</SelectItem>
                <SelectItem value="iptal">{t("admin.erp.sevkiyat.durumlar.iptal")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={`size-4${isFetching ? " animate-spin" : ""}`} />
          </Button>
          <div className="ml-auto text-sm text-muted-foreground">
            {items.length} {t("admin.erp.operator.shipmentQueueCount")}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={`shipment-order-skeleton-${index}`} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-md border py-12 text-center text-sm text-muted-foreground">
            {t("admin.erp.operator.noShipmentQueue")}
          </div>
        ) : (
          <div className="overflow-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="border-b text-left">
                  <th className="px-3 py-2 font-medium">{t("admin.erp.sevkiyat.columns.sevkEmriNo")}</th>
                  <th className="px-3 py-2 font-medium">{t("admin.erp.sevkiyat.columns.musteri")}</th>
                  <th className="px-3 py-2 font-medium">{t("admin.erp.sevkiyat.columns.urunKod")}</th>
                  <th className="px-3 py-2 font-medium">{t("admin.erp.sevkiyat.columns.urunAd")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("admin.erp.sevkiyat.columns.miktar")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("admin.erp.sevkiyat.columns.stok")}</th>
                  <th className="px-3 py-2 font-medium">{t("admin.erp.sevkiyat.columns.tarih")}</th>
                  <th className="px-3 py-2 font-medium">{t("admin.erp.sevkiyat.columns.durum")}</th>
                  <th className="px-3 py-2 font-medium">{t("admin.erp.sevkiyat.columns.islem")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b last:border-b-0">
                    <td className="px-3 py-2 font-mono text-xs">{row.sevkEmriNo}</td>
                    <td className="px-3 py-2">{row.musteriAd ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs">{row.urunKod ?? "—"}</td>
                    <td className="px-3 py-2">{row.urunAd ?? "—"}</td>
                    <td className="px-3 py-2 text-right">{row.miktar}</td>
                    <td className="px-3 py-2 text-right">{row.stokMiktar}</td>
                    <td className="px-3 py-2">{row.tarih}</td>
                    <td className="px-3 py-2">
                      <Badge variant={SEVK_DURUM_BADGE[row.durum] ?? "outline"} className="text-[10px]">
                        {SEVK_DURUM_LABELS[row.durum] ?? row.durum}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      {(row.durum === "bekliyor" || row.durum === "onaylandi") && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleDurumChange(row.id, "sevk_edildi")}
                          >
                            <Check className="mr-1 size-3.5" />
                            {t("admin.erp.sevkiyat.actions.sevkEt")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-destructive hover:text-destructive"
                            onClick={() => handleDurumChange(row.id, "iptal")}
                          >
                            <X className="size-3.5" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-end text-xs text-muted-foreground">
        {t("admin.erp.operator.shipmentQueueFooter")}
      </CardFooter>
    </Card>
  );
}
