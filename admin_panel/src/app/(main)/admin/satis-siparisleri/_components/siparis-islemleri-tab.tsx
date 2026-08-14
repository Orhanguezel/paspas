"use client";

import * as React from "react";

import { Factory, Lock, RefreshCcw, Search } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useListSiparisIslemleriAdminQuery,
  useUpdateSatisSiparisiAdminMutation,
  useUretimeAktarAdminMutation,
} from "@/integrations/endpoints/admin/erp/satis_siparisleri_admin.endpoints";
import type { KalemUretimDurumu, SiparisIslemSatiri } from "@/integrations/shared/erp/satis_siparisleri.types";
import { KALEM_URETIM_DURUMU_LABELS } from "@/integrations/shared/erp/satis_siparisleri.types";

import { canCloseSiparisItems, getBitisDisplay, getSevkDisplay, getUretimDisplay } from "./siparis-islemleri.helpers";

type Gorunum = "duz" | "musteri" | "urun" | "alt_grup" | "siparis";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debouncedValue;
}

export default function SiparisIslemleriTab() {
  const [search, setSearch] = React.useState("");
  const normalizedSearch = search.trim();
  const debouncedSearch = useDebouncedValue(normalizedSearch, 300);
  const [gorunum, setGorunum] = React.useState<Gorunum>("siparis");
  const [durumFiltre, setDurumFiltre] = React.useState<string>("all");
  const [gizleTamamlanan, setGizleTamamlanan] = React.useState(true);
  const [seciliKalemler, setSeciliKalemler] = React.useState<Set<string>>(new Set());
  const [aktarDialogAcik, setAktarDialogAcik] = React.useState(false);

  const {
    data: items = [],
    isLoading,
    isFetching,
    refetch,
  } = useListSiparisIslemleriAdminQuery(
    {
      q: debouncedSearch || undefined,
      gorunum,
      uretimDurumu: durumFiltre !== "all" ? (durumFiltre as KalemUretimDurumu) : undefined,
      gizleTamamlanan,
      limit: 200,
    },
    { pollingInterval: 30_000, refetchOnMountOrArgChange: true, refetchOnFocus: true },
  );

  const [uretimeAktar, { isLoading: aktarLoading }] = useUretimeAktarAdminMutation();
  const [updateSiparis, closeState] = useUpdateSatisSiparisiAdminMutation();
  const [closeTarget, setCloseTarget] = React.useState<SiparisIslemSatiri | null>(null);

  // Siparişi kapat: tüm kalemleri açık listeden düşürür (üretimdeki sipariş kapatılamaz).
  async function confirmClose() {
    if (!closeTarget) return;
    try {
      await updateSiparis({ id: closeTarget.siparisId, body: { durum: "kapali" } }).unwrap();
      toast.success(`${closeTarget.siparisNo} siparişi kapatıldı.`);
    } catch (err: unknown) {
      const e = err as { data?: { error?: { detail?: string; message?: string } } };
      toast.error(e?.data?.error?.detail ?? e?.data?.error?.message ?? "Sipariş kapatılamadı.");
    } finally {
      setCloseTarget(null);
    }
  }

  // Sadece beklemede olanlar secilebilir
  const secilebilirler = React.useMemo(() => items.filter((i) => i.uretimDurumu === "beklemede"), [items]);
  const tumSecilebilirlerSecili =
    secilebilirler.length > 0 && secilebilirler.every((item) => seciliKalemler.has(item.kalemId));

  const tumunuSec = () => {
    if (tumSecilebilirlerSecili) {
      setSeciliKalemler((prev) => {
        const next = new Set(prev);
        for (const item of secilebilirler) next.delete(item.kalemId);
        return next;
      });
    } else {
      setSeciliKalemler(new Set(secilebilirler.map((i) => i.kalemId)));
    }
  };

  const toggleKalem = (kalemId: string) => {
    setSeciliKalemler((prev) => {
      const next = new Set(prev);
      if (next.has(kalemId)) next.delete(kalemId);
      else next.add(kalemId);
      return next;
    });
  };

  // Secili kalemlerde ayni urun var mi? (birlestirme secenegi icin)
  const seciliItems = React.useMemo(() => items.filter((i) => seciliKalemler.has(i.kalemId)), [items, seciliKalemler]);
  const ayniUrunVarMi = React.useMemo(() => {
    const urunIds = new Set(seciliItems.map((i) => i.urunId));
    return seciliItems.length > 1 && urunIds.size < seciliItems.length;
  }, [seciliItems]);

  async function handleAktar(birlestir: boolean) {
    try {
      const result = await uretimeAktar({
        kalemIds: Array.from(seciliKalemler),
        birlestir,
      }).unwrap();
      if (result.atlananSayisi > 0) {
        toast.warning(result.message);
      } else {
        toast.success(result.message);
      }
      setSeciliKalemler(new Set());
      setAktarDialogAcik(false);
    } catch (err: unknown) {
      const detail = (err as { data?: { error?: { detail?: string } } })?.data?.error?.detail;
      toast.error(detail ?? "Üretime aktarma sırasında hata oluştu.");
    }
  }

  function openUretimeAktarForRows(rows: SiparisIslemSatiri[]) {
    const kalemIds = rows.filter((item) => item.uretimDurumu === "beklemede").map((item) => item.kalemId);
    if (kalemIds.length === 0) return;
    setSeciliKalemler(new Set(kalemIds));
    setAktarDialogAcik(true);
  }

  // Gruplama — tamamlanan üretimde gerçek, diğerlerinde planlanan en geç bitiş kullanılır.
  const grouped = React.useMemo(() => {
    if (gorunum === "duz") return null;
    const map = new Map<
      string,
      {
        key: string;
        label: string;
        items: SiparisIslemSatiri[];
        maxBitis: string | null;
        kalanToplam: number;
      }
    >();
    for (const item of items) {
      const key =
        gorunum === "musteri"
          ? item.musteriId
          : gorunum === "alt_grup"
            ? item.urunAltGrup || "__alt_grup_yok"
            : gorunum === "siparis"
              ? item.siparisId
              : item.urunId;
      const label =
        gorunum === "musteri"
          ? item.musteriAd
          : gorunum === "alt_grup"
            ? item.urunAltGrup || "Alt grup yok"
            : gorunum === "siparis"
              ? `${item.siparisNo} — ${item.musteriAd}`
              : `${item.urunKod} — ${item.urunAd}`;
      let group = map.get(key);
      if (!group) {
        group = { key, label, items: [], maxBitis: null, kalanToplam: 0 };
        map.set(key, group);
      }
      group.items.push(item);
      group.kalanToplam += item.uretimKalanMiktar ?? Math.max(item.miktar - item.uretilenMiktar, 0);
      const bitis = getBitisDisplay(item).value;
      if (bitis) {
        if (!group.maxBitis || bitis > group.maxBitis) {
          group.maxBitis = bitis;
        }
      }
    }
    return Array.from(map.values());
  }, [items, gorunum]);

  function renderTable(rows: SiparisIslemSatiri[]) {
    const showSelection = gorunum !== "siparis";
    const emptyColSpan = 6 + (gorunum !== "musteri" ? 1 : 0) + (gorunum !== "urun" ? 1 : 0) + (showSelection ? 1 : 0);
    return (
      <Table>
        <TableHeader>
          <TableRow>
            {showSelection && (
              <TableHead className="w-10">
                <Checkbox checked={tumSecilebilirlerSecili} onCheckedChange={tumunuSec} />
              </TableHead>
            )}
            <TableHead>Sipariş No</TableHead>
            {gorunum !== "musteri" && <TableHead>Müşteri</TableHead>}
            {gorunum !== "urun" && <TableHead>Ürün</TableHead>}
            <TableHead className="text-right">Stok</TableHead>
            <TableHead className="text-right">Miktar</TableHead>
            <TableHead className="text-right">Üretilen</TableHead>
            <TableHead className="text-right">Sevk Edilen</TableHead>
            <TableHead>Bitiş Tarihi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((item) => {
            const secilebilir = item.uretimDurumu === "beklemede";
            const uretimDisplay = getUretimDisplay(item);
            const sevkDisplay = getSevkDisplay(item);
            const bitisDisplay = getBitisDisplay(item);
            return (
              <TableRow key={item.kalemId} className={seciliKalemler.has(item.kalemId) ? "bg-primary/5" : ""}>
                {showSelection && (
                  <TableCell>
                    <Checkbox
                      checked={seciliKalemler.has(item.kalemId)}
                      onCheckedChange={() => toggleKalem(item.kalemId)}
                      disabled={!secilebilir}
                    />
                  </TableCell>
                )}
                <TableCell className="font-mono text-xs">{item.siparisNo}</TableCell>
                {gorunum !== "musteri" && <TableCell>{item.musteriAd}</TableCell>}
                {gorunum !== "urun" && (
                  <TableCell>
                    <div className="min-w-0">
                      <div>
                        <span className="mr-1 text-muted-foreground text-xs">{item.urunKod}</span>
                        {item.urunAd}
                      </div>
                      {item.urunAltGrup && <div className="text-muted-foreground text-xs">{item.urunAltGrup}</div>}
                    </div>
                  </TableCell>
                )}
                <TableCell className="text-right tabular-nums">
                  {item.urunStok.toLocaleString("tr-TR")} {item.urunBirim}
                </TableCell>
                <TableCell className="text-right font-medium">{item.miktar.toLocaleString("tr-TR")}</TableCell>
                <TableCell className="text-right">
                  {uretimDisplay.kind === "complete" ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600">{uretimDisplay.text}</Badge>
                  ) : uretimDisplay.text ? (
                    <span className="font-medium tabular-nums">{uretimDisplay.text}</span>
                  ) : (
                    <span className="sr-only">Üretim başlamadı</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {sevkDisplay.kind === "complete" ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600">{sevkDisplay.text}</Badge>
                  ) : sevkDisplay.text ? (
                    <span className="font-medium tabular-nums">{sevkDisplay.text}</span>
                  ) : (
                    <span className="sr-only">Sevk yapılmadı</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {bitisDisplay.value ? (
                    <div>
                      <div>
                        {new Date(bitisDisplay.value).toLocaleString("tr-TR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-[10px]">
                        {bitisDisplay.kind === "gercek" ? "Gerçek bitiş" : "Planlanan bitiş"}
                      </div>
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={emptyColSpan} className="py-8 text-center text-muted-foreground">
                Kayıt bulunamadı
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtreler + Aksiyon */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sipariş, müşteri veya ürün ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select
              value={gorunum}
              onValueChange={(v) => {
                setGorunum(v as Gorunum);
                setSeciliKalemler(new Set());
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="duz">Düz Liste</SelectItem>
                <SelectItem value="musteri">Müşteri Bazlı</SelectItem>
                <SelectItem value="urun">Ürün Bazlı</SelectItem>
                <SelectItem value="alt_grup">Ürün Alt Grubu</SelectItem>
                <SelectItem value="siparis">Sipariş Bazlı</SelectItem>
              </SelectContent>
            </Select>

            <Select value={durumFiltre} onValueChange={setDurumFiltre}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                {Object.entries(KALEM_URETIM_DURUMU_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Switch id="gizle-tamamlanan" checked={gizleTamamlanan} onCheckedChange={setGizleTamamlanan} />
              <Label htmlFor="gizle-tamamlanan" className="text-sm">
                Tamamlananları Gizle
              </Label>
            </div>

            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCcw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            </Button>

            {seciliKalemler.size > 0 && (
              <Button onClick={() => setAktarDialogAcik(true)} disabled={aktarLoading} className="gap-1.5">
                <Factory className="h-4 w-4" />
                Üretime Aktar ({seciliKalemler.size})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sonuclar */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : gorunum === "duz" ? (
        <Card>
          <CardContent className="p-0">{renderTable(items)}</CardContent>
        </Card>
      ) : (
        grouped?.map((group) => (
          <Card key={group.key}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-medium text-sm">{group.label}</CardTitle>
                  {(gorunum === "urun" || gorunum === "alt_grup") && (
                    <p className="text-muted-foreground text-xs">
                      Kalan toplam:{" "}
                      <span className="font-medium text-foreground tabular-nums">
                        {group.kalanToplam.toLocaleString("tr-TR")}
                      </span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-right">
                  {group.maxBitis && (
                    <span className="text-muted-foreground text-xs">
                      Bitiş (En Geç):{" "}
                      <span className="font-medium text-foreground">
                        {new Date(group.maxBitis).toLocaleDateString("tr-TR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </span>
                  )}
                  {gorunum === "siparis" && group.items.some((item) => item.uretimDurumu === "beklemede") && (
                    <Button size="sm" variant="outline" onClick={() => openUretimeAktarForRows(group.items)}>
                      <Factory className="mr-1 size-4" /> Üretime Aktar
                    </Button>
                  )}
                  {gorunum === "siparis" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title={
                        canCloseSiparisItems(group.items)
                          ? `${group.items[0]?.siparisNo} siparişini kapat`
                          : "Üretimi devam eden sipariş kapatılamaz"
                      }
                      aria-label={`${group.items[0]?.siparisNo} siparişini kapat`}
                      onClick={() => setCloseTarget(group.items[0] ?? null)}
                      disabled={closeState.isLoading || !canCloseSiparisItems(group.items)}
                    >
                      <Lock className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">{renderTable(group.items)}</CardContent>
          </Card>
        ))
      )}

      {!isLoading && <p className="text-right text-muted-foreground text-sm">Toplam {items.length} kalem</p>}

      {/* Uretime Aktar Dialog */}
      <AlertDialog open={aktarDialogAcik} onOpenChange={setAktarDialogAcik}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Üretime Aktar</AlertDialogTitle>
            <AlertDialogDescription>
              {seciliKalemler.size} sipariş kalemi için üretim emri oluşturulacak.
              {ayniUrunVarMi && " Aynı ürüne ait kalemler tespit edildi."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            {ayniUrunVarMi && (
              <AlertDialogAction onClick={() => handleAktar(true)} disabled={aktarLoading}>
                Birleştir
              </AlertDialogAction>
            )}
            <AlertDialogAction onClick={() => handleAktar(false)} disabled={aktarLoading}>
              {ayniUrunVarMi ? "Ayrı Ayrı" : "Üretime Aktar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Siparişi Kapat Dialog */}
      <AlertDialog open={!!closeTarget} onOpenChange={(v) => !v && setCloseTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Siparişi Kapat</AlertDialogTitle>
            <AlertDialogDescription>
              {closeTarget?.siparisNo} siparişi kapatılacak. Kapatılan siparişin tüm satırları bu ekrandan düşer ve
              yalnızca açık siparişler görünmeye devam eder. Üretimi devam eden bir sipariş kapatılamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClose} disabled={closeState.isLoading}>
              Siparişi Kapat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
