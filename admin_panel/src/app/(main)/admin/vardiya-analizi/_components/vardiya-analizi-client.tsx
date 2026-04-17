"use client";

import { useMemo, useState } from "react";

import { AlertTriangle, CheckCircle2, Clock, Factory, Package, RefreshCw, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import {
  useGetVardiyaAnaliziAdminQuery,
  type KalipRollup,
  type MakineRollup,
  type VardiyaAnalizItem,
} from "@/integrations/endpoints/admin/erp/vardiya_analizi_admin.endpoints";

import TrendPaneli from "./trend-paneli";
import VardiyaDetaySheet from "./vardiya-detay-sheet";

type DetayTarget =
  | { type: "vardiya"; vardiyaKayitId: string; title: string; subtitle: string }
  | { type: "makine"; makineId: string; tarih: string; title: string; subtitle: string };

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
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

function vardiyaLabel(tipi: string): string {
  if (tipi === "gece") return "Gece Vardiyası";
  if (tipi === "gunduz") return "Gündüz Vardiyası";
  return tipi;
}

type ViewMode = "vardiya" | "makine" | "kalip" | "trend";

export default function VardiyaAnaliziClient() {
  const [tarih, setTarih] = useState(todayIsoDate());
  const [view, setView] = useState<ViewMode>("vardiya");
  const [detay, setDetay] = useState<DetayTarget | null>(null);

  const { data, isLoading, isFetching, refetch } = useGetVardiyaAnaliziAdminQuery(
    { tarih },
    { pollingInterval: 60000 },
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

  return (
    <div className="space-y-4">
      {/* Başlık + Filtre */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-lg">Vardiya Analizi</h1>
          <p className="text-muted-foreground text-sm">
            Günlük vardiya performansı, üretim ve duruş özetleri
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
          <Input
            type="date"
            value={tarih}
            onChange={(e) => setTarih(e.target.value)}
            className="w-auto"
          />
          <Button variant="outline" size="sm" onClick={() => setTarih(todayIsoDate())}>
            Bugün
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
        <TrendPaneli />
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
                  setDetay({
                    type: "makine",
                    makineId: m.makineId,
                    tarih,
                    title: m.makineAd,
                    subtitle: `${m.vardiyaSayisi} vardiya · OEE %${Math.round(m.oee * 100)}`,
                  })
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
              <span className="text-muted-foreground">Hedef / Gerçekleşen</span>
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
            {m.toplamUretim.toLocaleString("tr-TR")} adet üretim (hedef hesaplanamadı)
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
            <span className="text-muted-foreground">Üretim</span>
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
