"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
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
import { Search, Factory } from "lucide-react";
import { toast } from "sonner";
import {
  useListSiparisIslemleriAdminQuery,
  useUretimeAktarAdminMutation,
} from "@/integrations/endpoints/admin/erp/satis_siparisleri_admin.endpoints";
import type { KalemUretimDurumu, SiparisIslemSatiri } from "@/integrations/shared/erp/satis_siparisleri.types";
import {
  KALEM_URETIM_DURUMU_LABELS,
  KALEM_URETIM_DURUMU_BADGE,
} from "@/integrations/shared/erp/satis_siparisleri.types";

type Gorunum = "duz" | "musteri" | "urun";

export default function SiparisIslemleriTab() {
  const [search, setSearch] = React.useState("");
  const [gorunum, setGorunum] = React.useState<Gorunum>("duz");
  const [durumFiltre, setDurumFiltre] = React.useState<string>("all");
  const [gizleTamamlanan, setGizleTamamlanan] = React.useState(true);
  const [seciliKalemler, setSeciliKalemler] = React.useState<Set<string>>(new Set());
  const [aktarDialogAcik, setAktarDialogAcik] = React.useState(false);

  const { data: items = [], isLoading } = useListSiparisIslemleriAdminQuery({
    q: search || undefined,
    gorunum,
    uretimDurumu: durumFiltre !== "all" ? (durumFiltre as KalemUretimDurumu) : undefined,
    gizleTamamlanan,
    limit: 200,
  });

  const [uretimeAktar, { isLoading: aktarLoading }] = useUretimeAktarAdminMutation();

  // Sadece beklemede olanlar secilebilir
  const secilebilirler = React.useMemo(
    () => items.filter((i) => i.uretimDurumu === "beklemede"),
    [items],
  );

  const tumunuSec = () => {
    if (seciliKalemler.size === secilebilirler.length) {
      setSeciliKalemler(new Set());
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
  const seciliItems = items.filter((i) => seciliKalemler.has(i.kalemId));
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
    } catch (err: any) {
      const detail = err?.data?.error?.detail;
      toast.error(detail ?? "Üretime aktarma sırasında hata oluştu.");
    }
  }

  // Gruplama — SP-7: musteri bazında en geç planlanan bitiş hesaplanır
  const grouped = React.useMemo(() => {
    if (gorunum === "duz") return null;
    const map = new Map<string, { label: string; items: SiparisIslemSatiri[]; maxPlanned: string | null }>();
    for (const item of items) {
      const key = gorunum === "musteri" ? item.musteriId : item.urunId;
      const label = gorunum === "musteri" ? item.musteriAd : `${item.urunKod} — ${item.urunAd}`;
      if (!map.has(key)) map.set(key, { label, items: [], maxPlanned: null });
      const group = map.get(key)!;
      group.items.push(item);
      if (item.planlananBitis) {
        if (!group.maxPlanned || item.planlananBitis > group.maxPlanned) {
          group.maxPlanned = item.planlananBitis;
        }
      }
    }
    return Array.from(map.values());
  }, [items, gorunum]);

  function durumBadge(durum: KalemUretimDurumu) {
    return (
      <Badge variant={KALEM_URETIM_DURUMU_BADGE[durum] ?? "secondary"}>
        {KALEM_URETIM_DURUMU_LABELS[durum] ?? durum}
      </Badge>
    );
  }

  function renderTable(rows: SiparisIslemSatiri[]) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={secilebilirler.length > 0 && seciliKalemler.size === secilebilirler.length}
                onCheckedChange={tumunuSec}
              />
            </TableHead>
            <TableHead>Sipariş No</TableHead>
            {gorunum !== "musteri" && <TableHead>Müşteri</TableHead>}
            {gorunum !== "urun" && <TableHead>Ürün</TableHead>}
            <TableHead className="text-right">Miktar</TableHead>
            <TableHead>Üretim Durumu</TableHead>
            <TableHead className="text-right">Sevk Edilen</TableHead>
            <TableHead>Planlanan Bitiş</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((item) => {
            const secilebilir = item.uretimDurumu === "beklemede";
            return (
              <TableRow key={item.kalemId} className={seciliKalemler.has(item.kalemId) ? "bg-primary/5" : ""}>
                <TableCell>
                  <Checkbox
                    checked={seciliKalemler.has(item.kalemId)}
                    onCheckedChange={() => toggleKalem(item.kalemId)}
                    disabled={!secilebilir}
                  />
                </TableCell>
                <TableCell className="font-mono text-xs">{item.siparisNo}</TableCell>
                {gorunum !== "musteri" && <TableCell>{item.musteriAd}</TableCell>}
                {gorunum !== "urun" && (
                  <TableCell>
                    <span className="text-muted-foreground text-xs mr-1">{item.urunKod}</span>
                    {item.urunAd}
                  </TableCell>
                )}
                <TableCell className="text-right font-medium">{item.miktar.toLocaleString("tr-TR")}</TableCell>
                <TableCell>{durumBadge(item.uretimDurumu)}</TableCell>
                <TableCell className="text-right">
                  {item.sevkEdilenMiktar > 0 ? item.sevkEdilenMiktar.toLocaleString("tr-TR") : "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {item.planlananBitis
                    ? new Date(item.planlananBitis).toLocaleString("tr-TR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </TableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
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
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sipariş, müşteri veya ürün ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={gorunum} onValueChange={(v) => setGorunum(v as Gorunum)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="duz">Düz Liste</SelectItem>
                <SelectItem value="musteri">Müşteri Bazlı</SelectItem>
                <SelectItem value="urun">Ürün Bazlı</SelectItem>
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
          <Card key={group.label}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{group.label}</CardTitle>
                {group.maxPlanned && (
                  <span className="text-xs text-muted-foreground">
                    Planlanan Bitiş (En Geç):{" "}
                    <span className="font-medium text-foreground">
                      {new Date(group.maxPlanned).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">{renderTable(group.items)}</CardContent>
          </Card>
        ))
      )}

      {!isLoading && (
        <p className="text-sm text-muted-foreground text-right">Toplam {items.length} kalem</p>
      )}

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
    </div>
  );
}
