"use client";

import { useState } from "react";

import { Archive, Loader2, PackagePlus, Pencil, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  type FuarProduct,
  type FuarProductCreate,
  useArchiveFuarProductMutation,
  useCreateFuarProductMutation,
  useListFuarProductsQuery,
  useUpdateFuarProductMutation,
} from "@/integrations/endpoints/admin/fuar-products.endpoints";

const initialForm = {
  code: "",
  name: "",
  category: "",
  productGroup: "",
  priceUsd: "",
  setsPerCarton: "6",
  cartonsPerPallet: "20",
  moqAmount: "1",
  hsCode: "",
  originCountry: "Türkiye",
  cartonWidthCm: "",
  cartonLengthCm: "",
  cartonHeightCm: "",
  palletWidthCm: "",
  palletLengthCm: "",
  palletHeightCm: "",
  netWeightPerSetKg: "",
  grossWeightPerCartonKg: "",
  palletTareKg: "",
};
const numericKeys = [
  "priceUsd",
  "cartonWidthCm",
  "cartonLengthCm",
  "cartonHeightCm",
  "palletWidthCm",
  "palletLengthCm",
  "palletHeightCm",
  "netWeightPerSetKg",
  "grossWeightPerCartonKg",
  "palletTareKg",
] as const;

export function FuarProductsClient() {
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { data, isLoading, isError } = useListFuarProductsQuery(undefined);
  const [createProduct, createState] = useCreateFuarProductMutation();
  const [updateProduct, updateState] = useUpdateFuarProductMutation();
  const [archiveProduct] = useArchiveFuarProductMutation();
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const optionalNumber = (key: (typeof numericKeys)[number]) => (form[key] ? Number(form[key]) : undefined);
      const body: FuarProductCreate = {
        code: form.code.trim(),
        name: form.name.trim(),
        category: form.category.trim() || undefined,
        productGroup: form.productGroup.trim() || undefined,
        hsCode: form.hsCode.trim() || undefined,
        originCountry: form.originCountry.trim() || "Türkiye",
        priceUsd: optionalNumber("priceUsd"),
        setsPerCarton: Number(form.setsPerCarton),
        cartonsPerPallet: Number(form.cartonsPerPallet),
        moqAmount: Number(form.moqAmount),
        moqUnit: "pallet",
        cartonWidthCm: optionalNumber("cartonWidthCm"),
        cartonLengthCm: optionalNumber("cartonLengthCm"),
        cartonHeightCm: optionalNumber("cartonHeightCm"),
        palletWidthCm: optionalNumber("palletWidthCm"),
        palletLengthCm: optionalNumber("palletLengthCm"),
        palletHeightCm: optionalNumber("palletHeightCm"),
        netWeightPerSetKg: optionalNumber("netWeightPerSetKg"),
        grossWeightPerCartonKg: optionalNumber("grossWeightPerCartonKg"),
        palletTareKg: optionalNumber("palletTareKg"),
      };
      if (editingId) await updateProduct({ id: editingId, body }).unwrap();
      else await createProduct(body).unwrap();
      setForm(initialForm);
      setEditingId(null);
      toast.success(editingId ? "Fuar ürünü güncellendi." : "Fuar ürünü oluşturuldu.");
    } catch {
      toast.error("Fuar ürünü oluşturulamadı. Kod ve zorunlu alanları kontrol edin.");
    }
  }

  function edit(product: FuarProduct) {
    const value = (input: string | number | null) => (input == null ? "" : String(input));
    setEditingId(product.id);
    setForm({
      code: product.code,
      name: product.name,
      category: value(product.category),
      productGroup: value(product.productGroup),
      priceUsd: value(product.priceUsd),
      setsPerCarton: value(product.setsPerCarton),
      cartonsPerPallet: value(product.cartonsPerPallet),
      moqAmount: value(product.moqAmount),
      hsCode: value(product.hsCode),
      originCountry: product.originCountry,
      cartonWidthCm: value(product.cartonWidthCm),
      cartonLengthCm: value(product.cartonLengthCm),
      cartonHeightCm: value(product.cartonHeightCm),
      palletWidthCm: value(product.palletWidthCm),
      palletLengthCm: value(product.palletLengthCm),
      palletHeightCm: value(product.palletHeightCm),
      netWeightPerSetKg: value(product.netWeightPerSetKg),
      grossWeightPerCartonKg: value(product.grossWeightPerCartonKg),
      palletTareKg: value(product.palletTareKg),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(initialForm);
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
          <CardTitle>{editingId ? "Ürünü düzenle" : "Yeni ürün"}</CardTitle>
          <CardDescription>Teklif, CBM ve ağırlık hesaplarında kullanılacak ana ürün bilgileri.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit}>
            <FieldGroup className="grid md:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="fuar-code">Ürün kodu</FieldLabel>
                <Input id="fuar-code" value={form.code} onChange={set("code")} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="fuar-category">Kategori</FieldLabel>
                <Input id="fuar-category" value={form.category} onChange={set("category")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="fuar-group">Ürün grubu</FieldLabel>
                <Input id="fuar-group" value={form.productGroup} onChange={set("productGroup")} />
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
              <Field>
                <FieldLabel htmlFor="fuar-hs">GTİP / HS kodu</FieldLabel>
                <Input id="fuar-hs" value={form.hsCode} onChange={set("hsCode")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="fuar-origin">Menşe</FieldLabel>
                <Input id="fuar-origin" value={form.originCountry} onChange={set("originCountry")} required />
              </Field>
              {(
                [
                  ["cartonWidthCm", "Koli en (cm)"],
                  ["cartonLengthCm", "Koli boy (cm)"],
                  ["cartonHeightCm", "Koli yükseklik (cm)"],
                  ["palletWidthCm", "Palet en (cm)"],
                  ["palletLengthCm", "Palet boy (cm)"],
                  ["palletHeightCm", "Palet yükseklik (cm)"],
                  ["netWeightPerSetKg", "Set net ağırlık (kg)"],
                  ["grossWeightPerCartonKg", "Koli brüt ağırlık (kg)"],
                  ["palletTareKg", "Palet dara (kg)"],
                ] as const
              ).map(([key, label]) => (
                <Field key={key}>
                  <FieldLabel htmlFor={`fuar-${key}`}>{label}</FieldLabel>
                  <Input id={`fuar-${key}`} type="number" min="0" step="0.01" value={form[key]} onChange={set(key)} />
                </Field>
              ))}
              <div className="flex gap-2">
                <Button type="submit" disabled={createState.isLoading || updateState.isLoading}>
                  {createState.isLoading || updateState.isLoading ? (
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <PackagePlus data-icon="inline-start" />
                  )}
                  {editingId ? "Değişiklikleri kaydet" : "Ürünü kaydet"}
                </Button>
                {editingId ? (
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    <X data-icon="inline-start" />
                    Vazgeç
                  </Button>
                ) : null}
              </div>
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
                      <Button type="button" size="sm" variant="ghost" onClick={() => edit(product)}>
                        <Pencil data-icon="inline-start" />
                        Düzenle
                      </Button>
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
