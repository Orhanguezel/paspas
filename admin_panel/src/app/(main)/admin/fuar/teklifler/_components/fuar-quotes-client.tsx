"use client";

import { useEffect, useMemo, useState } from "react";

import { FilePlus2, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { readFuarCart, writeFuarCart } from "@/features/fuar/cart";
import { useListFuarCustomersQuery } from "@/integrations/endpoints/admin/fuar-customers.endpoints";
import { useListFuarProductsQuery } from "@/integrations/endpoints/admin/fuar-products.endpoints";
import {
  type FuarQuoteCreate,
  type FuarQuoteDetail,
  useCreateFuarQuoteMutation,
  useCreateFuarQuoteRevisionMutation,
  useGetFuarQuoteQuery,
  useListFuarQuotesQuery,
} from "@/integrations/endpoints/admin/fuar-quotes.endpoints";

type LineDraft = { key: string; productId: string; amount: string; unit: "set" | "carton" | "pallet" };
const newLine = (): LineDraft => ({ key: crypto.randomUUID(), productId: "", amount: "1", unit: "pallet" });
const money = (value: number, currency: string) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(value);

export function FuarQuotesClient() {
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [currency, setCurrency] = useState<"USD" | "EUR" | "TRY">("USD");
  const [deliveryMethod, setDeliveryMethod] = useState<"EXW" | "FOB" | "CIF">("EXW");
  const [loadingType, setLoadingType] = useState<"loose" | "palletized">("palletized");
  const [freight, setFreight] = useState("0");
  const [extraDiscount, setExtraDiscount] = useState("0");
  const [lines, setLines] = useState<LineDraft[]>(() => [newLine()]);
  const { data: customers } = useListFuarCustomersQuery(undefined);
  const { data: products } = useListFuarProductsQuery(undefined);
  const productMap = useMemo(() => new Map(products?.items.map((product) => [product.id, product])), [products?.items]);
  const { data: quotes, isLoading } = useListFuarQuotesQuery(undefined);
  const { data: selectedQuote } = useGetFuarQuoteQuery(selectedQuoteId, { skip: !selectedQuoteId });
  const [createQuote, createState] = useCreateFuarQuoteMutation();
  const [createRevision, revisionState] = useCreateFuarQuoteRevisionMutation();

  useEffect(() => {
    const saved = readFuarCart();
    if (!saved.length) return;
    setLines(
      saved.map((line) => ({
        key: crypto.randomUUID(),
        productId: line.productId,
        amount: String(line.amount),
        unit: line.unit,
      })),
    );
  }, []);

  useEffect(() => {
    if (!selectedQuote) return;
    const current = selectedQuote.revisions[0];
    setCustomerId(current.snapshot.customer.id);
    setCurrency(current.snapshot.currency);
    setDeliveryMethod(current.snapshot.deliveryMethod);
    setLoadingType(current.snapshot.loadingType);
    setFreight(String(current.snapshot.freight));
    setExtraDiscount(String(current.snapshot.extraDiscountPercent));
    setLines(
      current.snapshot.lines.map((line) => ({
        key: crypto.randomUUID(),
        productId: line.product.id,
        amount: String(line.amount),
        unit: line.unit,
      })),
    );
  }, [selectedQuote]);

  const body = (): FuarQuoteCreate => ({
    customerId,
    currency,
    deliveryMethod,
    loadingType,
    freight: Number(freight),
    extraDiscountPercent: Number(extraDiscount),
    lines: lines.map(({ productId, amount, unit }) => ({ productId, amount: Number(amount), unit })),
  });
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const result = selectedQuoteId
        ? await createRevision({ id: selectedQuoteId, body: body() }).unwrap()
        : await createQuote(body()).unwrap();
      toast.success(`${result.quoteNo} / R${result.revisionNo} oluşturuldu.`);
      if (!selectedQuoteId) {
        writeFuarCart([]);
        resetForm();
      }
    } catch {
      toast.error("Kayıt oluşturulamadı. Fiyat, MOQ ve paketleme bilgilerini kontrol edin.");
    }
  }
  function resetForm() {
    setSelectedQuoteId("");
    setCustomerId("");
    setCurrency("USD");
    setDeliveryMethod("EXW");
    setLoadingType("palletized");
    setFreight("0");
    setExtraDiscount("0");
    setLines([newLine()]);
  }
  function updateLine(key: string, patch: Partial<LineDraft>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }
  const pending = createState.isLoading || revisionState.isLoading;
  const canSubmit = Boolean(
    customerId && lines.length && lines.every((line) => line.productId && Number(line.amount) > 0),
  );

  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl tracking-tight">Fuar Teklifleri</h1>
        <p className="text-muted-foreground text-sm">
          Çoklu ürün satırıyla yeni teklif hazırlayın veya kayıtlı tekliften yeni revizyon üretin.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>{selectedQuote ? `${selectedQuote.quoteNo} · yeni revizyon` : "Yeni teklif"}</CardTitle>
          <CardDescription>
            {selectedQuote
              ? `Mevcut R${selectedQuote.currentRevision} korunur; yeni kayıt R${selectedQuote.currentRevision + 1} olur.`
              : "İlk kayıt otomatik teklif numarası ve R1 revizyonu oluşturur."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-5" onSubmit={submit}>
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
                  onChange={(event) => setFreight(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Yükleme tipi</FieldLabel>
                <Select value={loadingType} onValueChange={(value) => setLoadingType(value as typeof loadingType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="palletized">Paletli</SelectItem>
                      <SelectItem value="loose">Paletsiz / kolili</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
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
                  onChange={(event) => setExtraDiscount(event.target.value)}
                />
              </Field>
            </FieldGroup>
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-medium">Ürün satırları</h2>
                <p className="text-muted-foreground text-sm">Her ürün için miktar ve paketleme birimini seçin.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLines((current) => [...current, newLine()])}
              >
                <Plus data-icon="inline-start" />
                Satır ekle
              </Button>
            </div>
            <FieldGroup className="flex flex-col gap-3">
              {lines.map((line, index) => (
                <div
                  key={line.key}
                  className="grid items-end gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1fr)_140px_150px_auto]"
                >
                  <Field>
                    <FieldLabel>Ürün {index + 1}</FieldLabel>
                    <Select
                      value={line.productId}
                      onValueChange={(value) => updateLine(line.key, { productId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ürün seçin">
                          {productMap.get(line.productId)
                            ? `${productMap.get(line.productId)?.code} · ${productMap.get(line.productId)?.name}`
                            : undefined}
                        </SelectValue>
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
                    <FieldLabel>Miktar</FieldLabel>
                    <Input
                      type="number"
                      min="1"
                      value={line.amount}
                      onChange={(event) => updateLine(line.key, { amount: event.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Birim</FieldLabel>
                    <Select
                      value={line.unit}
                      onValueChange={(value) => updateLine(line.key, { unit: value as LineDraft["unit"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="set">Set</SelectItem>
                          <SelectItem value="carton">Koli</SelectItem>
                          <SelectItem value="pallet">Palet</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`${index + 1}. satırı sil`}
                    disabled={lines.length === 1}
                    onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </FieldGroup>
            <div className="flex flex-wrap justify-end gap-2">
              {selectedQuote ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  <RotateCcw data-icon="inline-start" />
                  Yeni teklife dön
                </Button>
              ) : null}
              <Button type="submit" disabled={!canSubmit || pending}>
                {pending ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <FilePlus2 data-icon="inline-start" />
                )}
                {selectedQuote ? `R${selectedQuote.currentRevision + 1} oluştur` : "Teklifi oluştur"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {selectedQuote ? <QuoteDetail quote={selectedQuote} /> : null}
      <Card>
        <CardHeader>
          <CardTitle>Teklif listesi</CardTitle>
          <CardDescription>{quotes?.items.length ?? 0} teklif · detay için satırı açın</CardDescription>
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
                  <TableHead className="text-right">İşlem</TableHead>
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
                    <TableCell className="text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedQuoteId(quote.id)}>
                        Detay / Revizyon
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

function QuoteDetail({ quote }: { quote: FuarQuoteDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revizyon geçmişi</CardTitle>
        <CardDescription>
          {quote.quoteNo} için {quote.revisions.length} değiştirilemez kayıt
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {quote.revisions.map((revision) => (
          <div key={revision.revisionNo} className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge>R{revision.revisionNo}</Badge>
                <span className="font-medium">{revision.snapshot.customer.name}</span>
              </div>
              <strong>{money(revision.totals.grandTotal, revision.snapshot.currency)}</strong>
            </div>
            {revision.snapshot.logisticsTotals ? (
              <div className="grid gap-3 rounded-md bg-muted p-3 text-sm sm:grid-cols-3">
                <div>
                  <span className="text-muted-foreground">Toplam hacim</span>
                  <strong className="block">{revision.snapshot.logisticsTotals.cbm.toLocaleString("tr-TR")} m³</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Net ağırlık</span>
                  <strong className="block">
                    {revision.snapshot.logisticsTotals.netWeightKg.toLocaleString("tr-TR")} kg
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Brüt ağırlık</span>
                  <strong className="block">
                    {revision.snapshot.logisticsTotals.grossWeightKg.toLocaleString("tr-TR")} kg
                  </strong>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Lojistik toplamı için bazı ürünlerin ölçü veya ağırlık bilgileri eksik.
              </p>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead>Birim fiyat</TableHead>
                  <TableHead>Hacim / brüt</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revision.snapshot.lines.map((line) => (
                  <TableRow key={`${revision.revisionNo}-${line.product.id}`}>
                    <TableCell>
                      {line.product.code} · {line.product.name}
                    </TableCell>
                    <TableCell>
                      {line.amount} {line.unit}
                    </TableCell>
                    <TableCell>{money(line.unitPricePerSet, revision.snapshot.currency)}</TableCell>
                    <TableCell>
                      {line.logistics
                        ? `${line.logistics.cbm.toLocaleString("tr-TR")} m³ · ${line.logistics.grossWeightKg.toLocaleString("tr-TR")} kg`
                        : "Bilgi eksik"}
                    </TableCell>
                    <TableCell className="text-right">{money(line.lineTotal, revision.snapshot.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
