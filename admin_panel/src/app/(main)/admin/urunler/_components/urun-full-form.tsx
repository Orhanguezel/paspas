"use client";

// =============================================================
// FILE: src/app/(main)/admin/urunler/_components/urun-full-form.tsx
// Paspas ERP — Asıl Ürün + Operasyonel YM oluşturma formu
// Kullanıcı asıl ürünü ve operasyon tipini girer; backend otomatik
// olarak sağ/sol (çift op.) veya parça (tek op.) operasyonel YM'lerini + reçeteleri kurar.
// =============================================================

import { useMemo, useState } from "react";

import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

import {
  useCreateUrunFullAdminMutation,
  useListUrunlerAdminQuery,
} from "@/integrations/endpoints/admin/erp/urunler_admin.endpoints";
import type { UrunDto } from "@/integrations/shared/erp/urunler.types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (urunId: string) => void;
};

type ReceteKalemForm = {
  key: string;
  urunId: string;
  miktar: string;
  fireOrani: string;
};

type OperasyonTipi = "tek_tarafli" | "cift_tarafli";

function emptyKalem(): ReceteKalemForm {
  return {
    key: `k-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    urunId: "",
    miktar: "",
    fireOrani: "0",
  };
}

export default function UrunFullForm({ open, onClose, onSuccess }: Props) {
  const [kod, setKod] = useState("");
  const [ad, setAd] = useState("");
  const [operasyonTipi, setOperasyonTipi] = useState<OperasyonTipi>("tek_tarafli");
  const [birim, setBirim] = useState("takim");
  const [renk, setRenk] = useState("");
  const [birimFiyat, setBirimFiyat] = useState("");
  const [kritikStok, setKritikStok] = useState("0");
  const [hazirlikSuresiDk, setHazirlikSuresiDk] = useState("60");
  const [cevrimSuresiSn, setCevrimSuresiSn] = useState("45");
  const [yariMamulHammaddeleri, setYariMamulHammaddeleri] = useState<ReceteKalemForm[]>([]);
  const [asilUrunMalzemeleri, setAsilUrunMalzemeleri] = useState<ReceteKalemForm[]>([]);
  const [showYariMamulRecete, setShowYariMamulRecete] = useState(false);

  const { data: hammaddeList } = useListUrunlerAdminQuery(
    { kategori: "hammadde", limit: 500 },
    { skip: !open },
  );
  const hammaddeler = (hammaddeList?.items ?? []) as UrunDto[];

  const [createUrunFull, createState] = useCreateUrunFullAdminMutation();

  const isValid = useMemo(() => {
    if (!kod.trim() || !ad.trim()) return false;
    return true;
  }, [kod, ad]);

  function resetForm() {
    setKod("");
    setAd("");
    setOperasyonTipi("tek_tarafli");
    setBirim("takim");
    setRenk("");
    setBirimFiyat("");
    setKritikStok("0");
    setHazirlikSuresiDk("60");
    setCevrimSuresiSn("45");
    setYariMamulHammaddeleri([]);
    setAsilUrunMalzemeleri([]);
    setShowYariMamulRecete(false);
  }

  function cleanKalemler(list: ReceteKalemForm[]) {
    return list
      .filter((k) => k.urunId && Number(k.miktar) > 0)
      .map((k, idx) => ({
        urunId: k.urunId,
        miktar: Number(k.miktar),
        fireOrani: Number(k.fireOrani) || 0,
        sira: idx + 1,
      }));
  }

  async function handleSubmit() {
    if (!isValid) return;
    try {
      const payload = {
        kod: kod.trim(),
        ad: ad.trim(),
        operasyonTipi,
        birim,
        renk: renk.trim() || undefined,
        birimFiyat: birimFiyat ? Number(birimFiyat) : undefined,
        kritikStok: Number(kritikStok) || 0,
        hazirlikSuresiDk: Number(hazirlikSuresiDk) || 60,
        cevrimSuresiSn: Number(cevrimSuresiSn) || 45,
        yariMamulHammaddeleri: cleanKalemler(yariMamulHammaddeleri),
        asilUrunMalzemeleri: cleanKalemler(asilUrunMalzemeleri),
      };
      const result = await createUrunFull(payload).unwrap();
      toast.success(
        `Asıl ürün oluşturuldu: ${result.yariMamuller.length} operasyonel YM otomatik türetildi`,
      );
      resetForm();
      onClose();
      onSuccess?.(result.urun.id);
    } catch (err: unknown) {
      const apiErr = (err as { data?: { error?: { message?: string; detay?: string } } })?.data?.error;
      const message = apiErr?.message || "Kaydedilemedi";
      toast.error(`${message}${apiErr?.detay ? ` (${apiErr.detay})` : ""}`);
    }
  }

  function addYmKalem() {
    setYariMamulHammaddeleri((prev) => [...prev, emptyKalem()]);
  }
  function addAsilKalem() {
    setAsilUrunMalzemeleri((prev) => [...prev, emptyKalem()]);
  }

  function updateKalem(
    list: ReceteKalemForm[],
    setList: (next: ReceteKalemForm[]) => void,
    key: string,
    patch: Partial<ReceteKalemForm>,
  ) {
    setList(list.map((k) => (k.key === key ? { ...k, ...patch } : k)));
  }

  function removeKalem(
    list: ReceteKalemForm[],
    setList: (next: ReceteKalemForm[]) => void,
    key: string,
  ) {
    setList(list.filter((k) => k.key !== key));
  }

  const yariMamulOnizleme =
    operasyonTipi === "cift_tarafli"
      ? [`${ad.trim() || "ÜRÜN"} - Sağ`, `${ad.trim() || "ÜRÜN"} - Sol`]
      : [`${ad.trim() || "ÜRÜN"} - Parça (x2)`];

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          resetForm();
          onClose();
        }
      }}
    >
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Yeni Ürün + Otomatik Operasyonel YM</SheetTitle>
          <SheetDescription>
            Asıl ürün bilgilerini girin; operasyon tipine göre operasyonel YM(ler) + reçeteler otomatik
            kurulur.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 py-6">
          {/* Temel bilgi */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Asıl Ürün</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ff-kod">Kod</Label>
                <Input id="ff-kod" value={kod} onChange={(e) => setKod(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="ff-ad">Ad</Label>
                <Input id="ff-ad" value={ad} onChange={(e) => setAd(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="ff-birim">Birim</Label>
                <Input id="ff-birim" value={birim} onChange={(e) => setBirim(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="ff-renk">Renk</Label>
                <Input id="ff-renk" value={renk} onChange={(e) => setRenk(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="ff-fiyat">Birim Fiyat</Label>
                <Input
                  id="ff-fiyat"
                  type="number"
                  step="0.01"
                  value={birimFiyat}
                  onChange={(e) => setBirimFiyat(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ff-kritik">Kritik Stok</Label>
                <Input
                  id="ff-kritik"
                  type="number"
                  step="0.01"
                  value={kritikStok}
                  onChange={(e) => setKritikStok(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Operasyon Tipi */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Operasyon Tipi</h3>
            <Select
              value={operasyonTipi}
              onValueChange={(v) => setOperasyonTipi(v as OperasyonTipi)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tek_tarafli">Tek Operasyonlu (sağ = sol, 2 parça)</SelectItem>
                <SelectItem value="cift_tarafli">Çift Operasyonlu (sağ ≠ sol)</SelectItem>
              </SelectContent>
            </Select>
            <div className="rounded border bg-muted/40 p-3 text-xs">
              <p className="font-medium">Otomatik oluşturulacak operasyonel YM'ler:</p>
              <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                {yariMamulOnizleme.map((y) => (
                  <li key={y}>{y}</li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ff-hazir">Hazırlık Süresi (dk)</Label>
                <Input
                  id="ff-hazir"
                  type="number"
                  value={hazirlikSuresiDk}
                  onChange={(e) => setHazirlikSuresiDk(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ff-cevrim">Çevrim Süresi (sn)</Label>
                <Input
                  id="ff-cevrim"
                  type="number"
                  value={cevrimSuresiSn}
                  onChange={(e) => setCevrimSuresiSn(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Asıl Ürün Reçetesi (Ambalaj/Son İşlem) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Asıl Ürün Reçetesi (Ambalaj/Son İşlem)</h3>
              <Button size="sm" variant="outline" onClick={addAsilKalem}>
                <Plus className="mr-1 size-3" /> Kalem
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Bu malzemeler montaj sırasında tüketilir. Yarı mamuller otomatik eklenecek.
            </p>
            {asilUrunMalzemeleri.length === 0 ? (
              <p className="rounded border border-dashed p-3 text-center text-muted-foreground text-xs">
                Henüz malzeme eklenmemiş.
              </p>
            ) : (
              <div className="space-y-2">
                {asilUrunMalzemeleri.map((k) => (
                  <div key={k.key} className="grid grid-cols-[1fr_100px_80px_32px] gap-2">
                    <Select
                      value={k.urunId || ""}
                      onValueChange={(v) =>
                        updateKalem(asilUrunMalzemeleri, setAsilUrunMalzemeleri, k.key, { urunId: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Hammadde seç" />
                      </SelectTrigger>
                      <SelectContent>
                        {hammaddeler.map((h) => (
                          <SelectItem key={h.id} value={h.id}>
                            {h.kod} — {h.ad}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="Miktar"
                      value={k.miktar}
                      onChange={(e) =>
                        updateKalem(asilUrunMalzemeleri, setAsilUrunMalzemeleri, k.key, {
                          miktar: e.target.value,
                        })
                      }
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Fire %"
                      value={k.fireOrani}
                      onChange={(e) =>
                        updateKalem(asilUrunMalzemeleri, setAsilUrunMalzemeleri, k.key, {
                          fireOrani: e.target.value,
                        })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() =>
                        removeKalem(asilUrunMalzemeleri, setAsilUrunMalzemeleri, k.key)
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Operasyonel YM Reçetesi (Hammadde) — opsiyonel */}
          <div className="space-y-3 rounded border p-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Operasyonel YM Reçetesi (Hammadde)</h3>
                <p className="text-muted-foreground text-xs">
                  Plastik vb. hammadde girerseniz her operasyonel YM'ye aynı reçete kopyalanır.
                </p>
              </div>
              <Switch checked={showYariMamulRecete} onCheckedChange={setShowYariMamulRecete} />
            </div>
            {showYariMamulRecete && (
              <>
                <Button size="sm" variant="outline" onClick={addYmKalem}>
                  <Plus className="mr-1 size-3" /> Kalem
                </Button>
                {yariMamulHammaddeleri.length === 0 ? (
                  <p className="rounded border border-dashed p-3 text-center text-muted-foreground text-xs">
                    Henüz hammadde eklenmemiş.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {yariMamulHammaddeleri.map((k) => (
                      <div key={k.key} className="grid grid-cols-[1fr_100px_80px_32px] gap-2">
                        <Select
                          value={k.urunId || ""}
                          onValueChange={(v) =>
                            updateKalem(yariMamulHammaddeleri, setYariMamulHammaddeleri, k.key, {
                              urunId: v,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Hammadde seç" />
                          </SelectTrigger>
                          <SelectContent>
                            {hammaddeler.map((h) => (
                              <SelectItem key={h.id} value={h.id}>
                                {h.kod} — {h.ad}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          step="0.0001"
                          placeholder="Miktar"
                          value={k.miktar}
                          onChange={(e) =>
                            updateKalem(yariMamulHammaddeleri, setYariMamulHammaddeleri, k.key, {
                              miktar: e.target.value,
                            })
                          }
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Fire %"
                          value={k.fireOrani}
                          onChange={(e) =>
                            updateKalem(yariMamulHammaddeleri, setYariMamulHammaddeleri, k.key, {
                              fireOrani: e.target.value,
                            })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() =>
                            removeKalem(yariMamulHammaddeleri, setYariMamulHammaddeleri, k.key)
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Kaydet */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={onClose} disabled={createState.isLoading}>
              İptal
            </Button>
            <Button onClick={handleSubmit} disabled={!isValid || createState.isLoading}>
              <Save className="mr-1 size-4" />
              {createState.isLoading ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
