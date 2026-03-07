"use client";

// =============================================================
// Paspas ERP — Operatör Ekranı (makine-merkezli V2, 2 sekmeli)
// =============================================================

import { useMemo, useState } from "react";

import { Pause, Play, Plus, RefreshCcw, RotateCcw, Square, Trash2, Truck } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useLocaleContext } from "@/i18n/LocaleProvider";
import { useListMakinelerAdminQuery } from "@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints";
import { useListMusterilerAdminQuery } from "@/integrations/endpoints/admin/erp/musteriler_admin.endpoints";
import {
  useDevamEtAdminMutation,
  useDuraklatAdminMutation,
  useListMakineKuyruguAdminQuery,
  useSevkiyatOlusturAdminMutation,
  useUretimBaslatAdminMutation,
  useUretimBitirAdminMutation,
  useVardiyaBasiAdminMutation,
  useVardiyaSonuAdminMutation,
} from "@/integrations/endpoints/admin/erp/operator_admin.endpoints";
import { useListUrunlerAdminQuery } from "@/integrations/endpoints/admin/erp/urunler_admin.endpoints";
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

export default function OperatorClient() {
  const { t } = useLocaleContext();
  const [activeTab, setActiveTab] = useState("kuyruk");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">{t("admin.erp.operator.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.erp.operator.description")}</p>
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

  const [pausing, setPausing] = useState<MakineKuyruguDetayDto | null>(null);
  const [pauseNeden, setPauseNeden] = useState("");
  const [makineArizasi, setMakineArizasi] = useState(false);

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

  async function handleDevamEt(item: MakineKuyruguDetayDto) {
    try {
      await devamEt({ makineKuyrukId: item.id }).unwrap();
      toast.success(t("admin.erp.operator.resumed"));
    } catch {
      toast.error(t("admin.erp.common.operationFailed"));
    }
  }

  function openFinish(item: MakineKuyruguDetayDto) {
    setUretilenMiktar(String(item.planlananMiktar - item.uretilenMiktar));
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
      await bitir({
        makineKuyrukId: finishing.id,
        uretilenMiktar: u,
        fireMiktar: f,
        birimTipi: finishing.montaj ? "takim" : "adet",
        notlar: notlar.trim() || undefined,
      }).unwrap();
      toast.success(t("admin.erp.operator.finished"));
      setFinishing(null);
    } catch {
      toast.error(t("admin.erp.common.operationFailed"));
    }
  }

  function openPause(item: MakineKuyruguDetayDto) {
    setPauseNeden("");
    setMakineArizasi(false);
    setPausing(item);
  }

  async function confirmPause() {
    if (!pausing || !pauseNeden.trim()) {
      toast.error(t("admin.erp.operator.pauseReasonRequired"));
      return;
    }
    try {
      await duraklat({
        makineKuyrukId: pausing.id,
        neden: pauseNeden.trim(),
        makineArizasi,
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
            return (
              <div key={makineId}>
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                  {first.makineKod} — {first.makineAd}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {jobs.map((job) => {
                    const progress = pct(job.planlananMiktar, job.uretilenMiktar);
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
                            <Button size="sm" className="flex-1" onClick={() => handleBaslat(job)}>
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
                            <Button size="sm" className="flex-1" onClick={() => handleDevamEt(job)}>
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
            <div className="space-y-1">
              <Label>{t("admin.erp.operator.pauseReason")}</Label>
              <Input value={pauseNeden} onChange={(e) => setPauseNeden(e.target.value)} autoFocus />
            </div>
            <div className="flex items-center gap-3 rounded-md border px-3 py-2">
              <Switch checked={makineArizasi} onCheckedChange={setMakineArizasi} />
              <Label className="cursor-pointer">{t("admin.erp.operator.machineBreakdown")}</Label>
            </div>
          </div>
          <SheetFooter className="border-t px-4 py-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setPausing(null)}>
              {t("admin.common.cancel")}
            </Button>
            <Button onClick={confirmPause}>{t("admin.erp.operator.pauseConfirm")}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

function VardiyaPanel() {
  const { t } = useLocaleContext();
  const { data: makineData, isLoading } = useListMakinelerAdminQuery({ durum: "aktif" });
  const [vardiyaBasi, { isLoading: isStarting }] = useVardiyaBasiAdminMutation();
  const [vardiyaSonu, { isLoading: isEnding }] = useVardiyaSonuAdminMutation();

  const [makineId, setMakineId] = useState("");
  const [vardiyaTipi, setVardiyaTipi] = useState("gunduz");
  const [notlar, setNotlar] = useState("");

  const makineler = (makineData?.items ?? []).filter((makine) => makine.isActive && makine.durum === "aktif");

  function getErrorMessage(error: unknown): string {
    const message =
      typeof error === "object" && error && "data" in error
        ? (error as { data?: { error?: { message?: string } } }).data?.error?.message
        : undefined;

    if (message === "vardiya_saati_gecersiz") {
      return t("admin.erp.operator.shiftTimeInvalid");
    }
    if (message === "acik_vardiya_zaten_var") {
      return t("admin.erp.operator.shiftAlreadyOpen");
    }
    if (message === "acik_vardiya_bulunamadi") {
      return t("admin.erp.operator.shiftNotFound");
    }
    return t("admin.erp.common.operationFailed");
  }

  async function handleShiftStart() {
    if (!makineId) {
      toast.error(t("admin.erp.operator.shiftMachineRequired"));
      return;
    }

    try {
      await vardiyaBasi({
        makineId,
        vardiyaTipi,
        notlar: notlar.trim() || undefined,
      }).unwrap();
      toast.success(t("admin.erp.operator.shiftStarted"));
      setNotlar("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleShiftEnd() {
    if (!makineId) {
      toast.error(t("admin.erp.operator.shiftMachineRequired"));
      return;
    }

    try {
      await vardiyaSonu({
        makineId,
        notlar: notlar.trim() || undefined,
      }).unwrap();
      toast.success(t("admin.erp.operator.shiftEnded"));
      setNotlar("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("admin.erp.operator.shiftTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_220px_minmax(0,1fr)]">
          <div className="space-y-1">
            <Label>{t("admin.erp.operator.shiftMachine")}</Label>
            <Select value={makineId} onValueChange={setMakineId} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder={t("admin.erp.operator.shiftMachinePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {makineler.map((makine) => (
                  <SelectItem key={makine.id} value={makine.id}>
                    {makine.kod} - {makine.ad}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>{t("admin.erp.operator.shiftType")}</Label>
            <Select value={vardiyaTipi} onValueChange={setVardiyaTipi}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gunduz">{t("admin.erp.operator.dayShift")}</SelectItem>
                <SelectItem value="gece">{t("admin.erp.operator.nightShift")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>{t("admin.erp.operator.notes")}</Label>
            <Input value={notlar} onChange={(event) => setNotlar(event.target.value)} />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border bg-muted/30 px-3 py-3 text-sm">
            <div className="font-medium">{t("admin.erp.operator.dayShift")}</div>
            <div className="text-muted-foreground">{t("admin.erp.operator.dayShiftHours")}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 px-3 py-3 text-sm">
            <div className="font-medium">{t("admin.erp.operator.nightShift")}</div>
            <div className="text-muted-foreground">{t("admin.erp.operator.nightShiftHours")}</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={handleShiftEnd} disabled={isEnding || isStarting}>
          {t("admin.erp.operator.endShift")}
        </Button>
        <Button onClick={handleShiftStart} disabled={isStarting || isEnding}>
          {t("admin.erp.operator.startShift")}
        </Button>
      </CardFooter>
    </Card>
  );
}

// ============================================================
// Tab 2: Sevkiyat
// ============================================================

function SevkiyatTab() {
  const { t } = useLocaleContext();
  const [sevkiyatOlustur, { isLoading }] = useSevkiyatOlusturAdminMutation();
  const { data: musterilerData } = useListMusterilerAdminQuery({ tur: "musteri" });
  const { data: urunlerData } = useListUrunlerAdminQuery({ limit: 500 });

  const [kalemler, setKalemler] = useState([{ id: crypto.randomUUID(), musteriId: "", urunId: "", miktar: "" }]);
  const [notlar, setNotlar] = useState("");

  const musteriler = musterilerData?.items ?? [];
  const urunler = urunlerData?.items ?? [];

  const selectedMusteriler = useMemo(
    () =>
      Array.from(new Set(kalemler.map((kalem) => kalem.musteriId).filter(Boolean)))
        .map((musteriId) => musteriler.find((musteri) => musteri.id === musteriId) ?? null)
        .filter((musteri): musteri is NonNullable<typeof musteri> => !!musteri),
    [kalemler, musteriler],
  );

  function updateKalem(id: string, field: "musteriId" | "urunId" | "miktar", value: string) {
    setKalemler((current) =>
      current.map((kalem) => (kalem.id === id ? { ...kalem, [field]: value } : kalem)),
    );
  }

  function addKalem() {
    setKalemler((current) => [...current, { id: crypto.randomUUID(), musteriId: "", urunId: "", miktar: "" }]);
  }

  function removeKalem(id: string) {
    setKalemler((current) => (current.length === 1 ? current : current.filter((kalem) => kalem.id !== id)));
  }

  async function handleSubmit() {
    const preparedKalemler = kalemler
      .map((kalem) => ({
        musteriId: kalem.musteriId.trim(),
        urunId: kalem.urunId.trim(),
        miktar: Number.parseFloat(kalem.miktar || "0"),
      }))
      .filter((kalem) => kalem.musteriId && kalem.urunId && kalem.miktar > 0);

    if (preparedKalemler.length !== kalemler.length) {
      toast.error(t("admin.erp.operator.fillRequired"));
      return;
    }
    try {
      const result = await sevkiyatOlustur({
        kalemler: preparedKalemler,
        notlar: notlar.trim() || undefined,
      }).unwrap();
      toast.success(`${t("admin.erp.operator.shipmentCreated")}: ${result.sevkiyat.sevkNo}`);
      setKalemler([{ id: crypto.randomUUID(), musteriId: "", urunId: "", miktar: "" }]);
      setNotlar("");
    } catch {
      toast.error(t("admin.erp.common.operationFailed"));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Truck className="size-4" />
          {t("admin.erp.operator.shipmentTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {kalemler.map((kalem, index) => (
            <div key={kalem.id} className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {t("admin.erp.operator.shipmentLine")} {index + 1}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeKalem(kalem.id)}
                  disabled={kalemler.length === 1}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label>{t("admin.erp.operator.customer")}</Label>
                  <Select value={kalem.musteriId} onValueChange={(value) => updateKalem(kalem.id, "musteriId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("admin.erp.operator.customerPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {musteriler.map((musteri) => (
                        <SelectItem key={musteri.id} value={musteri.id}>
                          {musteri.ad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>{t("admin.erp.operator.product")}</Label>
                  <Select value={kalem.urunId} onValueChange={(value) => updateKalem(kalem.id, "urunId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("admin.erp.operator.productPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {urunler.map((urun) => (
                        <SelectItem key={urun.id} value={urun.id}>
                          {urun.kod} - {urun.ad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>{t("admin.erp.operator.quantity")}</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={kalem.miktar}
                    onChange={(event) => updateKalem(kalem.id, "miktar", event.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedMusteriler.map((musteri) =>
          musteri.sevkiyatNotu ? (
            <div key={musteri.id} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <div className="font-medium">
                {t("admin.erp.operator.customerShippingNote")}: {musteri.ad}
              </div>
              <div>{musteri.sevkiyatNotu}</div>
            </div>
          ) : null,
        )}

        <div className="flex justify-between gap-3 flex-wrap">
          <Button type="button" variant="outline" onClick={addKalem}>
            <Plus className="mr-1.5 size-4" />
            {t("admin.erp.operator.addShipmentLine")}
          </Button>
          <div className="min-w-72 flex-1 space-y-1">
            <Label>{t("admin.erp.operator.notes")}</Label>
            <Input
              value={notlar}
              onChange={(e) => setNotlar(e.target.value)}
              placeholder={t("admin.erp.operator.additionalOperatorNote")}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={handleSubmit} disabled={isLoading}>
          <Truck className="mr-1.5 size-4" />
          {t("admin.erp.operator.createShipment")}
        </Button>
      </CardFooter>
    </Card>
  );
}
