"use client";

import { useMemo, useState } from "react";
import { PackageCheck, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateMalKabulAdminMutation } from "@/integrations/endpoints/admin/erp/mal_kabul_admin.endpoints";
import { useListSatinAlmaAdminQuery } from "@/integrations/endpoints/admin/erp/satin_alma_admin.endpoints";

const OPEN_STATUSES = new Set(["onaylandi", "siparis_verildi", "kismen_teslim"]);

export default function DepoMalKabulClient() {
  const [search, setSearch] = useState("");
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const { data, isLoading, isFetching, refetch } = useListSatinAlmaAdminQuery({ limit: 500 });
  const [createMalKabul] = useCreateMalKabulAdminMutation();

  const lines = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");
    return (data?.items ?? [])
      .filter((order) => order.isActive && OPEN_STATUSES.has(order.durum))
      .flatMap((order) => (order.items ?? [])
        .filter((line) => line.kalanMiktar > 0)
        .map((line) => ({ order, line })))
      .filter(({ order, line }) => !query || [order.siparisNo, order.tedarikciAd, line.urunKod, line.urunAd]
        .some((value) => value?.toLocaleLowerCase("tr-TR").includes(query)));
  }, [data?.items, search]);

  async function receive(orderId: string, lineId: string) {
    const item = lines.find(({ line }) => line.id === lineId && line.kalanMiktar > 0);
    if (!item || item.order.id !== orderId) return;
    const amount = Number(amounts[lineId]);
    if (!Number.isFinite(amount) || amount <= 0 || amount > item.line.kalanMiktar) {
      toast.error(`Miktar 0 ile ${item.line.kalanMiktar.toLocaleString("tr-TR")} arasında olmalı.`);
      return;
    }
    setSavingId(lineId);
    try {
      await createMalKabul({
        kaynakTipi: "satin_alma",
        satinAlmaSiparisId: item.order.id,
        satinAlmaKalemId: item.line.id,
        urunId: item.line.urunId,
        tedarikciId: item.order.tedarikciId,
        gelenMiktar: amount,
        kaliteDurumu: "kabul",
        notlar: "Mobil depo mal kabulü",
      }).unwrap();
      setAmounts((current) => ({ ...current, [lineId]: "" }));
      await refetch();
      toast.success(`${amount.toLocaleString("tr-TR")} ${item.line.birim ?? ""} stoğa alındı.`);
    } catch (error) {
      const message = (error as { data?: { error?: { message?: string } } })?.data?.error?.message;
      toast.error(message === "gelen_miktar_kalan_miktari_asiyor" ? "Açık sipariş miktarı değişti. Listeyi yenileyin." : message ?? "Mal kabul kaydedilemedi.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold"><PackageCheck className="size-5" /> Depo Mal Kabul</h1>
          <p className="text-sm text-muted-foreground">Açık satın alma siparişlerinden gelen malzemeyi doğrudan teslim alın.</p>
        </div>
        <Button type="button" variant="outline" size="icon" aria-label="Listeyi yenile" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Malzeme, tedarikçi veya sipariş ara" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Açık malzemeler yükleniyor…</p> : lines.length === 0 ? (
        <p className="rounded-lg border p-5 text-center text-sm text-muted-foreground">Teslim alınacak açık malzeme bulunmuyor.</p>
      ) : lines.map(({ order, line }) => (
        <Card key={line.id} className="gap-3 py-4">
          <CardHeader className="gap-2 px-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="text-base">{line.urunAd ?? line.urunKod ?? "Malzeme"}</CardTitle>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{line.urunKod}</p>
              </div>
              <Badge variant="secondary">{order.siparisNo}</Badge>
            </div>
            <p className="text-sm">Tedarikçi: <span className="font-medium">{order.tedarikciAd ?? "—"}</span></p>
          </CardHeader>
          <CardContent className="space-y-3 px-4">
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3 text-center text-xs">
              <div>Sipariş<div className="mt-1 font-semibold tabular-nums">{line.miktar.toLocaleString("tr-TR")}</div></div>
              <div>Kabul<div className="mt-1 font-semibold tabular-nums">{line.kabulMiktar.toLocaleString("tr-TR")}</div></div>
              <div>Kalan<div className="mt-1 font-semibold tabular-nums">{line.kalanMiktar.toLocaleString("tr-TR")}</div></div>
            </div>
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Label htmlFor={`kabul-${line.id}`}>Gelen miktar ({line.birim ?? "adet"})</Label>
                <Input id={`kabul-${line.id}`} type="number" min="0.0001" max={line.kalanMiktar} step="0.0001"
                  inputMode="decimal" placeholder={String(line.kalanMiktar)} value={amounts[line.id] ?? ""}
                  onChange={(event) => setAmounts((current) => ({ ...current, [line.id]: event.target.value }))} />
              </div>
              <Button type="button" onClick={() => receive(order.id, line.id)} disabled={savingId !== null}>
                {savingId === line.id ? "Kaydediliyor…" : "Kabul et"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
