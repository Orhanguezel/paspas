"use client";

// =============================================================
// FILE: makine-montaj-planlama.tsx
// Paspas ERP — Parti bazlı "Makine ve Montaj Planlama" bloğu
// Operasyon bazında makine ataması (Atanmamış + makine isimleri) ve
// montaj Yes/No düzenlemesi yapılır. Atama makine_havuzu repoAtaOperasyon
// akışıyla (makine_id + makine_kuyrugu + planlanan tarih) yapılır;
// "Atanmamış" seçimi kuyruktan çıkarır (makine_id NULL).
// =============================================================

import { useMemo, useState } from "react";

import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useAtaOperasyonAdminMutation,
  useKuyrukCikarAdminMutation,
  useListAtanmamisAdminQuery,
  useListKuyrukAdminQuery,
  useListMakinelerAdminQuery,
} from "@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints";
import { useUpdateUretimEmriOperasyonPlanlariAdminMutation } from "@/integrations/endpoints/admin/erp/uretim_emirleri_admin.endpoints";

const ATANMAMIS_VALUE = "_atanmamis_";
const MONTAJ_EVET = "evet";
const MONTAJ_HAYIR = "hayir";

// Bir parti içindeki operasyonların birleşik (atanmış + atanmamış) görünümü.
interface PlanlamaSatiri {
  emirOperasyonId: string;
  uretimEmriId: string;
  emirNo: string;
  urunKod: string;
  urunAd: string;
  operasyonAdi: string;
  sira: number;
  planlananMiktar: number;
  montaj: boolean;
  makineId: string | null;
  makineAd: string | null;
  kuyruguId: string | null;
  // Aktif/duraklatılmış operasyonlar makineden çıkarılamaz/değiştirilemez.
  kilitli: boolean;
}

interface Props {
  uretimEmriIds: string[];
}

export function MakineMontajPlanlama({ uretimEmriIds }: Props) {
  const emirIdSet = useMemo(() => new Set(uretimEmriIds), [uretimEmriIds]);

  const { data: atanmamisler = [] } = useListAtanmamisAdminQuery();
  const { data: kuyruklar = [] } = useListKuyrukAdminQuery();
  const { data: makinelerData } = useListMakinelerAdminQuery({});

  const [ataOperasyon, { isLoading: ataliyor }] = useAtaOperasyonAdminMutation();
  const [kuyrukCikar, { isLoading: cikariliyor }] = useKuyrukCikarAdminMutation();
  const [updateOperasyonPlanlari, { isLoading: montajGuncelleniyor }] =
    useUpdateUretimEmriOperasyonPlanlariAdminMutation();

  const makineler = makinelerData?.items ?? [];
  const islemDevam = ataliyor || cikariliyor || montajGuncelleniyor;

  const satirlar = useMemo<PlanlamaSatiri[]>(() => {
    const map = new Map<string, PlanlamaSatiri>();

    // Atanmamış operasyonlar
    for (const op of atanmamisler) {
      if (!emirIdSet.has(op.uretimEmriId)) continue;
      map.set(op.id, {
        emirOperasyonId: op.id,
        uretimEmriId: op.uretimEmriId,
        emirNo: op.emirNo,
        urunKod: op.urunKod,
        urunAd: op.urunAd,
        operasyonAdi: op.operasyonAdi,
        sira: op.sira,
        planlananMiktar: op.planlananMiktar,
        montaj: op.montaj,
        makineId: null,
        makineAd: null,
        kuyruguId: null,
        kilitli: false,
      });
    }

    // Atanmış operasyonlar (kuyruktan)
    for (const grup of kuyruklar) {
      for (const item of grup.kuyruk) {
        if (!emirIdSet.has(item.uretimEmriId)) continue;
        if (!item.emirOperasyonId) continue;
        map.set(item.emirOperasyonId, {
          emirOperasyonId: item.emirOperasyonId,
          uretimEmriId: item.uretimEmriId,
          emirNo: item.emirNo,
          urunKod: item.urunKod,
          urunAd: item.urunAd,
          operasyonAdi: item.operasyonAdi,
          sira: item.sira,
          planlananMiktar: item.planlananMiktar,
          montaj: item.montaj,
          makineId: grup.makineId,
          makineAd: grup.makineAd,
          kuyruguId: item.id,
          kilitli: item.durum === "calisiyor" || item.durum === "duraklatildi",
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      const adCompare = a.urunAd.localeCompare(b.urunAd, "tr");
      if (adCompare !== 0) return adCompare;
      return a.sira - b.sira;
    });
  }, [atanmamisler, kuyruklar, emirIdSet]);

  // İşlem sırasında satır bazlı kilit (çift tıklama önleme)
  const [busyOpId, setBusyOpId] = useState<string | null>(null);

  async function handleMakineChange(satir: PlanlamaSatiri, value: string) {
    if (satir.kilitli) {
      toast.error("Aktif veya duraklatılmış operasyon değiştirilemez.");
      return;
    }
    const yeniMakineId = value === ATANMAMIS_VALUE ? null : value;
    if (yeniMakineId === satir.makineId) return;

    setBusyOpId(satir.emirOperasyonId);
    try {
      // Önce mevcut atamayı kaldır (kuyruktan çıkar) — makine değişimi veya
      // Atanmamış'a dönüş için gerekli.
      if (satir.kuyruguId) {
        await kuyrukCikar(satir.kuyruguId).unwrap();
      }
      if (yeniMakineId) {
        await ataOperasyon({
          emirOperasyonId: satir.emirOperasyonId,
          makineId: yeniMakineId,
          montaj: satir.montaj,
        }).unwrap();
        toast.success("Makine atandı.");
      } else {
        toast.success("Makine ataması kaldırıldı.");
      }
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error && "data" in error
          ? ((error as { data?: { error?: { detail?: string; message?: string } } }).data?.error?.detail ??
            (error as { data?: { error?: { detail?: string; message?: string } } }).data?.error?.message)
          : undefined;
      toast.error(message ?? "Makine ataması güncellenemedi.");
    } finally {
      setBusyOpId(null);
    }
  }

  async function handleMontajChange(satir: PlanlamaSatiri, value: string) {
    const montaj = value === MONTAJ_EVET;
    if (montaj === satir.montaj) return;

    setBusyOpId(satir.emirOperasyonId);
    try {
      await updateOperasyonPlanlari({
        id: satir.uretimEmriId,
        body: { operasyonlar: [{ id: satir.emirOperasyonId, montaj }] },
      }).unwrap();
      toast.success("Montaj ayarı güncellendi.");
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error && "data" in error
          ? (error as { data?: { error?: { message?: string } } }).data?.error?.message
          : undefined;
      toast.error(message ?? "Montaj ayarı güncellenemedi.");
    } finally {
      setBusyOpId(null);
    }
  }

  if (satirlar.length === 0) return null;

  return (
    <div className="space-y-2">
      <div>
        <h3 className="font-semibold text-sm">Makine ve Montaj Planlama</h3>
        <p className="text-muted-foreground text-xs">
          Çift taraflı ürünlerin Sağ/Sol operasyonel yarı mamulleri burada makineye atanır.
        </p>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Parça / Yarı Mamul</TableHead>
              <TableHead className="text-right">Miktar</TableHead>
              <TableHead className="w-56">Makine</TableHead>
              <TableHead className="w-32 text-center">Montaj</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {satirlar.map((satir) => {
              const satirMesgul = islemDevam && busyOpId === satir.emirOperasyonId;
              return (
                <TableRow key={satir.emirOperasyonId}>
                  <TableCell>
                    {/* Parça / Yarı Mamul: operasyon adı her zaman üretilen yarımamulü verir */}
                    <div className="font-medium text-sm">{satir.operasyonAdi || satir.urunAd}</div>
                    <div className="font-mono text-muted-foreground text-xs">
                      {satir.urunKod ? `${satir.urunKod} · ` : ""}
                      {satir.emirNo}
                      {satir.urunAd ? ` · ${satir.urunAd}` : ""}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {satir.planlananMiktar.toLocaleString("tr-TR")}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={satir.makineId ?? ATANMAMIS_VALUE}
                      onValueChange={(value) => handleMakineChange(satir, value)}
                      disabled={satir.kilitli || satirMesgul}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ATANMAMIS_VALUE} className="text-xs">
                          Atanmamış
                        </SelectItem>
                        {makineler.map((m) => (
                          <SelectItem key={m.id} value={m.id} className="text-xs">
                            <span className="font-mono font-medium">{m.kod}</span>
                            <span className="text-muted-foreground ml-2">{m.ad}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center">
                    <Select
                      value={satir.montaj ? MONTAJ_EVET : MONTAJ_HAYIR}
                      onValueChange={(value) => handleMontajChange(satir, value)}
                      disabled={satirMesgul}
                    >
                      <SelectTrigger className="mx-auto h-8 w-24 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={MONTAJ_EVET} className="text-xs">
                          Evet
                        </SelectItem>
                        <SelectItem value={MONTAJ_HAYIR} className="text-xs">
                          Hayır
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
