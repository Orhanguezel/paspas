"use client";

import { useState } from "react";

import { FilePlus2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListFuarCustomersQuery } from "@/integrations/endpoints/admin/fuar-customers.endpoints";
import { useListFuarProductsQuery } from "@/integrations/endpoints/admin/fuar-products.endpoints";
import {
  useCreateFuarQuoteMutation,
  useListFuarQuotesQuery,
} from "@/integrations/endpoints/admin/fuar-quotes.endpoints";

export function FuarQuotesClient() {
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [currency, setCurrency] = useState<"USD" | "EUR" | "TRY">("USD");
  const [deliveryMethod, setDeliveryMethod] = useState<"EXW" | "FOB" | "CIF">("EXW");
  const [amount, setAmount] = useState("1");
  const [freight, setFreight] = useState("0");
  const [extraDiscount, setExtraDiscount] = useState("0");
  const { data: customers } = useListFuarCustomersQuery(undefined);
  const { data: products } = useListFuarProductsQuery(undefined);
  const { data: quotes, isLoading } = useListFuarQuotesQuery(undefined);
  const [createQuote, createState] = useCreateFuarQuoteMutation();
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const result = await createQuote({
        customerId,
        currency,
        deliveryMethod,
        freight: Number(freight),
        extraDiscountPercent: Number(extraDiscount),
        lines: [{ productId, amount: Number(amount), unit: "pallet" }],
      }).unwrap();
      toast.success(`${result.quoteNo} / R${result.revisionNo} oluşturuldu.`);
      setAmount("1");
      setFreight("0");
      setExtraDiscount("0");
    } catch {
      toast.error("Teklif oluşturulamadı. Fiyat, MOQ ve ürün bilgilerini kontrol edin.");
    }
  }
  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl tracking-tight">Fuar Teklifleri</h1>
        <p className="text-muted-foreground text-sm">
          Müşteri indirimi, teslim şekli ve değiştirilemez revizyon snapshot’ı ile teklif oluşturun.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Yeni teklif</CardTitle>
          <CardDescription>İlk kayıt otomatik teklif numarası ve R1 revizyonu oluşturur.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit}>
            <FieldGroup className="grid md:grid-cols-3">
              <Field>
                <FieldLabel>Müşteri</FieldLabel>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Müşteri seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {customers?.items
                        .filter((item) => item.isActive)
                        .map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.code} · {item.name}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Ürün</FieldLabel>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ürün seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {products?.items
                        .filter((item) => item.isActive)
                        .map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.code} · {item.name}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="quote-amount">Palet adedi</FieldLabel>
                <Input
                  id="quote-amount"
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Para birimi</FieldLabel>
                <Select value={currency} onValueChange={(value) => setCurrency(value as typeof currency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {["USD", "EUR", "TRY"].map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Teslim şekli</FieldLabel>
                <Select
                  value={deliveryMethod}
                  onValueChange={(value) => setDeliveryMethod(value as typeof deliveryMethod)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {["EXW", "FOB", "CIF"].map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="quote-freight">Navlun</FieldLabel>
                <Input
                  id="quote-freight"
                  type="number"
                  min="0"
                  step="0.01"
                  value={freight}
                  onChange={(e) => setFreight(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="quote-discount">Ek indirim (%)</FieldLabel>
                <Input
                  id="quote-discount"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={extraDiscount}
                  onChange={(e) => setExtraDiscount(e.target.value)}
                />
              </Field>
              <Button type="submit" disabled={!customerId || !productId || createState.isLoading}>
                {createState.isLoading ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <FilePlus2 data-icon="inline-start" />
                )}
                Teklifi oluştur
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Teklif listesi</CardTitle>
          <CardDescription>{quotes?.items.length ?? 0} teklif</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Yükleniyor…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teklif No</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Teslim</TableHead>
                  <TableHead>Para Birimi</TableHead>
                  <TableHead>Revizyon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes?.items.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.quoteNo}</TableCell>
                    <TableCell>{quote.customerName}</TableCell>
                    <TableCell>{quote.deliveryMethod}</TableCell>
                    <TableCell>{quote.currency}</TableCell>
                    <TableCell>
                      <Badge variant="outline">R{quote.currentRevision}</Badge>
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
