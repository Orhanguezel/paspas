"use client";

import { useState } from "react";

import { Archive, Loader2, PackagePlus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useArchiveFuarProductMutation,
  useCreateFuarProductMutation,
  useListFuarProductsQuery,
} from "@/integrations/endpoints/admin/fuar-products.endpoints";

const initialForm = { code: "", name: "", priceUsd: "", setsPerCarton: "6", cartonsPerPallet: "20", moqAmount: "1" };

export function FuarProductsClient() {
  const [form, setForm] = useState(initialForm);
  const { data, isLoading, isError } = useListFuarProductsQuery(undefined);
  const [createProduct, createState] = useCreateFuarProductMutation();
  const [archiveProduct] = useArchiveFuarProductMutation();
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await createProduct({
        code: form.code.trim(),
        name: form.name.trim(),
        priceUsd: form.priceUsd ? Number(form.priceUsd) : undefined,
        setsPerCarton: Number(form.setsPerCarton),
        cartonsPerPallet: Number(form.cartonsPerPallet),
        moqAmount: Number(form.moqAmount),
        moqUnit: "pallet",
      }).unwrap();
      setForm(initialForm);
      toast.success("Fuar ürünü oluşturuldu.");
    } catch {
      toast.error("Fuar ürünü oluşturulamadı. Kod ve zorunlu alanları kontrol edin.");
    }
  }

  async function archive(id: string) {
    try {
      await archiveProduct(id).unwrap();
      toast.success("Ürün arşivlendi.");
    } catch {
      toast.error("Ürün arşivlenemedi.");
    }
  }

  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl tracking-tight">Fuar Ürünleri</h1>
        <p className="text-muted-foreground text-sm">
          Teklif hesaplarında kullanılacak bağımsız ürün, fiyat ve lojistik değerleri.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Yeni ürün</CardTitle>
          <CardDescription>MOQ birimi ilk aşamada palet olarak kaydedilir.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit}>
            <FieldGroup className="grid md:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="fuar-code">Ürün kodu</FieldLabel>
                <Input id="fuar-code" value={form.code} onChange={set("code")} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="fuar-name">Ürün adı</FieldLabel>
                <Input id="fuar-name" value={form.name} onChange={set("name")} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="fuar-price">USD set fiyatı</FieldLabel>
                <Input
                  id="fuar-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.priceUsd}
                  onChange={set("priceUsd")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="fuar-carton">Koli başına set</FieldLabel>
                <Input
                  id="fuar-carton"
                  type="number"
                  min="1"
                  value={form.setsPerCarton}
                  onChange={set("setsPerCarton")}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="fuar-pallet">Palet başına koli</FieldLabel>
                <Input
                  id="fuar-pallet"
                  type="number"
                  min="1"
                  value={form.cartonsPerPallet}
                  onChange={set("cartonsPerPallet")}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="fuar-moq">Minimum palet</FieldLabel>
                <Input
                  id="fuar-moq"
                  type="number"
                  min="1"
                  value={form.moqAmount}
                  onChange={set("moqAmount")}
                  required
                />
              </Field>
              <Button type="submit" disabled={createState.isLoading}>
                {createState.isLoading ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <PackagePlus data-icon="inline-start" />
                )}
                Ürünü kaydet
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Ürün listesi</CardTitle>
          <CardDescription>{data?.total ?? 0} ürün</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Ürünler yükleniyor…</p>
          ) : isError ? (
            <p className="text-destructive text-sm">Ürün servisine ulaşılamadı.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>USD</TableHead>
                  <TableHead>Dönüşüm</TableHead>
                  <TableHead>MOQ</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.code}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.priceUsd == null ? "—" : `$${product.priceUsd.toFixed(2)}`}</TableCell>
                    <TableCell>
                      {product.setsPerCarton} set/koli · {product.cartonsPerPallet} koli/palet
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.moqAmount} palet</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button type="button" size="sm" variant="ghost" onClick={() => archive(product.id)}>
                        <Archive data-icon="inline-start" />
                        Arşivle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
