"use client";

// =============================================================
// FILE: makine-montaj-planlama.tsx
// Paspas ERP — Parti bazlı "Makine ve Montaj Planlama" bloğu
// Operasyon bazında makine ataması (Atanmamış + makine isimleri) ve
// montaj Yes/No düzenlemesi yapılır. Atama makine_havuzu repoAtaOperasyon
// akışıyla (makine_id + makine_kuyrugu + planlanan tarih) yapılır;
// "Atanmamış" seçimi kuyruktan çıkarır (makine_id NULL).
// =============================================================

import { useEffect, useMemo, useRef, useState } from "react";

import { RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

function normalizeTr(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getTarafKey(satir: PlanlamaSatiri) {
  const text = normalizeTr(`${satir.operasyonAdi} ${satir.urunAd} ${satir.urunKod}`);
  if (/\b(sag|sg)\b/.test(text) || text.endsWith("-sg")) return "sag";
  if (/\b(sol|sl)\b/.test(text) || text.endsWith("-sl")) return "sol";
  return null;
}

function getMamulKey(satir: PlanlamaSatiri) {
  const source = satir.urunAd || satir.operasyonAdi || satir.urunKod || satir.emirNo;
  return normalizeTr(source)
    .replace(/\s*-\s*(sag|sol|sg|sl)\b/g, "")
    .replace(/\b(sag|sol)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Bir parti içindeki operasyonların birleşik (atanmış + atanmamış) görünümü.
interface PlanlamaSatiri {
  emirOperasyonId: string;
  uretimEmriId: string;
  emirNo: string;
  urunKod: string;
  urunAd: string;
  urunStok: number;
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

  const { data: atanmamisler = [], refetch: refetchAtanmamis, isFetching: atanmamisYukleniyor } =
    useListAtanmamisAdminQuery();
  const { data: kuyruklar = [], refetch: refetchKuyruk, isFetching: kuyrukYukleniyor } = useListKuyrukAdminQuery();
  const { data: makinelerData } = useListMakinelerAdminQuery({});

  function yenile() {
    refetchAtanmamis();
    refetchKuyruk();
  }

  const [ataOperasyon, { isLoading: ataliyor }] = useAtaOperasyonAdminMutation();
  const [kuyrukCikar, { isLoading: cikariliyor }] = useKuyrukCikarAdminMutation();
  const [updateOperasyonPlanlari, { isLoading: montajGuncelleniyor }] =
    useUpdateUretimEmriOperasyonPlanlariAdminMutation();

  const makineler = makinelerData?.items ?? [];
  const islemDevam = ataliyor || cikariliyor || montajGuncelleniyor;
  const defaultMontajAppliedRef = useRef<Set<string>>(new Set());
  // İşlem sırasında satır bazlı kilit (çift tıklama önleme)
  const [busyOpId, setBusyOpId] = useState<string | null>(null);

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
        urunStok: op.urunStok,
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
          urunStok: item.urunStok,
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

  const satirGruplari = useMemo(() => {
    const groups = new Map<string, PlanlamaSatiri[]>();
    for (const satir of satirlar) {
      const key = getMamulKey(satir);
      groups.set(key, [...(groups.get(key) ?? []), satir]);
    }
    return Array.from(groups.values()).map((group) => [...group].sort((a, b) => a.sira - b.sira));
  }, [satirlar]);

  function isEnjeksiyon2Satiri(satir: PlanlamaSatiri) {
    const makine = makineler.find((m) => m.id === satir.makineId);
    const text = normalizeTr(`${makine?.kod ?? ""} ${makine?.ad ?? ""} ${satir.makineAd ?? ""}`);
    return text.includes("enjeksiyon 2") || text.includes("enj-02") || text.includes("900 t arka");
  }

  function findMontajDefaultSatiri(group: PlanlamaSatiri[]) {
    return (
      group.find(isEnjeksiyon2Satiri) ??
      group.find((satir) => getTarafKey(satir) === "sol") ??
      group[group.length - 1] ??
      null
    );
  }

  function getMontajPatch(target: PlanlamaSatiri, group: PlanlamaSatiri[]) {
    return group
      .filter((satir) => satir.emirOperasyonId)
      .map((satir) => ({
        id: satir.emirOperasyonId,
        montaj: satir.emirOperasyonId === target.emirOperasyonId,
      }));
  }

  async function setExclusiveMontaj(target: PlanlamaSatiri, group: PlanlamaSatiri[]) {
    await updateOperasyonPlanlari({
      id: target.uretimEmriId,
      body: { operasyonlar: getMontajPatch(target, group) },
    }).unwrap();
  }

  useEffect(() => {
    if (montajGuncelleniyor || satirGruplari.length === 0) return;

    const group = satirGruplari.find((items) => {
      if (items.length !== 2) return false;
      const key = items.map((satir) => `${satir.emirOperasyonId}:${satir.montaj ? 1 : 0}:${satir.makineId ?? ""}`).join("|");
      if (defaultMontajAppliedRef.current.has(key)) return false;
      return items.filter((satir) => satir.montaj).length !== 1;
    });
    if (!group) return;

    const key = group.map((satir) => `${satir.emirOperasyonId}:${satir.montaj ? 1 : 0}:${satir.makineId ?? ""}`).join("|");
    const target = findMontajDefaultSatiri(group);
    if (!target) return;

    defaultMontajAppliedRef.current.add(key);
    setBusyOpId(target.emirOperasyonId);
    setExclusiveMontaj(target, group)
      .catch(() => {
        defaultMontajAppliedRef.current.delete(key);
        toast.error("Montaj default seçimi kaydedilemedi.");
      })
      .finally(() => setBusyOpId(null));
  }, [montajGuncelleniyor, satirGruplari]);

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
        const group = satirGruplari.find((items) => items.some((item) => item.emirOperasyonId === satir.emirOperasyonId));
        const nextSatir = { ...satir, makineId: yeniMakineId };
        await ataOperasyon({
          emirOperasyonId: satir.emirOperasyonId,
          makineId: yeniMakineId,
          montaj: group?.length === 2 && isEnjeksiyon2Satiri(nextSatir) ? true : satir.montaj,
        }).unwrap();
        if (group?.length === 2 && isEnjeksiyon2Satiri(nextSatir)) {
          await setExclusiveMontaj(nextSatir, group.map((item) => item.emirOperasyonId === satir.emirOperasyonId ? nextSatir : item));
        }
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
    const group = satirGruplari.find((items) => items.some((item) => item.emirOperasyonId === satir.emirOperasyonId)) ?? [satir];
    const requestedMontaj = value === MONTAJ_EVET;
    if (group.length !== 2) {
      if (requestedMontaj === satir.montaj) return;
      setBusyOpId(satir.emirOperasyonId);
      try {
        await updateOperasyonPlanlari({
          id: satir.uretimEmriId,
          body: { operasyonlar: [{ id: satir.emirOperasyonId, montaj: requestedMontaj }] },
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
      return;
    }

    const target = requestedMontaj
      ? satir
      : group.find((item) => item.emirOperasyonId !== satir.emirOperasyonId) ?? satir;
    if (target.emirOperasyonId === satir.emirOperasyonId && satir.montaj && group.filter((item) => item.montaj).length === 1) return;

    setBusyOpId(satir.emirOperasyonId);
    try {
      await setExclusiveMontaj(target, group);
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

  const formatMiktar = (value: number) => value.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
  const yukleniyor = atanmamisYukleniyor || kuyrukYukleniyor;

  // Boşsa "return null" YAPMA — kullanıcı butonla açtığı için geri bildirim ver
  // (henüz veri gelmemiş / cache tazelenmemiş olabilir; Yenile ile çözülür).
  if (satirlar.length === 0) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed bg-muted/20 px-4 py-3">
        <p className="text-muted-foreground text-xs">
          {yukleniyor
            ? "Planlama bilgileri yükleniyor…"
            : "Bu partiye ait planlanabilir operasyon bulunamadı. Az önce oluşturduysanız Yenile'ye basın."}
        </p>
        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={yenile} disabled={yukleniyor}>
          <RefreshCcw className={`size-3.5 ${yukleniyor ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-sm">Makine ve Montaj Planlama</h3>
          <p className="text-muted-foreground text-xs">
            Çift taraflı ürünlerin Sağ/Sol operasyonel yarı mamulleri burada makineye atanır.
          </p>
        </div>
        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={yenile} disabled={yukleniyor}>
          <RefreshCcw className={`size-3.5 ${yukleniyor ? "animate-spin" : ""}`} />
          Yenile
        </Button>
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
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <div className="font-medium text-sm">{satir.operasyonAdi || satir.urunAd}</div>
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                        Stok: {formatMiktar(satir.urunStok)}
                      </Badge>
                    </div>
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
