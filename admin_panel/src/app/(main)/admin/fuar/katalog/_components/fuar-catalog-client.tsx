"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { ArrowRight, Check, PackagePlus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { type FuarCartLine, readFuarCart, writeFuarCart } from "@/features/fuar/cart";
import { type FuarProduct, useListFuarProductsQuery } from "@/integrations/endpoints/admin/fuar-products.endpoints";

type Currency = "USD" | "EUR" | "TRY";
const categoryStyles = [
  "bg-blue-50 text-blue-700",
  "bg-orange-50 text-orange-700",
  "bg-emerald-50 text-emerald-700",
  "bg-violet-50 text-violet-700",
];
const formatMoney = (value: number, currency: Currency) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(value);

function productPrice(product: FuarProduct, currency: Currency) {
  return currency === "USD" ? product.priceUsd : currency === "EUR" ? product.priceEur : product.priceTry;
}

export function FuarCatalogClient() {
  const { data, isLoading } = useListFuarProductsQuery({ active: "true" });
  const [currency, setCurrency] = useState<Currency>("USD");
  const [category, setCategory] = useState("Tümü");
  const [cart, setCart] = useState<FuarCartLine[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [units, setUnits] = useState<Record<string, FuarCartLine["unit"]>>({});

  useEffect(() => setCart(readFuarCart()), []);
  const products = data?.items ?? [];
  const categories = useMemo(
    () => ["Tümü", ...new Set(products.map((product) => product.category).filter(Boolean) as string[])],
    [products],
  );
  const visibleProducts = category === "Tümü" ? products : products.filter((product) => product.category === category);

  function add(product: FuarProduct) {
    const amount = Number(amounts[product.id] || product.moqAmount);
    const unit = units[product.id] ?? product.moqUnit;
    if (!Number.isInteger(amount) || amount <= 0) return toast.error("Miktar pozitif tam sayı olmalı.");
    const next = [...cart.filter((line) => line.productId !== product.id), { productId: product.id, amount, unit }];
    setCart(next);
    writeFuarCart(next);
    toast.success(`${product.code} teklif sepetine eklendi.`);
  }

  return (
    <main className="flex flex-col gap-6 bg-slate-50/70 p-4 md:p-6">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Ürün Kataloğu</h1>
          <p className="text-muted-foreground text-sm">
            {products.length} aktif ürün · {cart.length} ürün teklif sepetinde
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
            <SelectTrigger className="w-28 bg-background">
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
          <Button asChild>
            <Link href="/admin/fuar/teklifler">
              <ShoppingCart data-icon="inline-start" />
              Sepet ({cart.length})<ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </header>
      <div className="flex flex-wrap gap-2">
        {categories.map((item) => (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={category === item ? "default" : "outline"}
            onClick={() => setCategory(item)}
          >
            {item}
          </Button>
        ))}
      </div>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Skeleton key={item} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleProducts.map((product, index) => {
            const price = productPrice(product, currency);
            const inCart = cart.some((line) => line.productId === product.id);
            const unit = units[product.id] ?? product.moqUnit;
            return (
              <Card key={product.id} className="overflow-hidden py-0 shadow-sm">
                <div
                  className={`flex h-24 items-start justify-between p-4 ${categoryStyles[index % categoryStyles.length]}`}
                >
                  <span className="font-semibold text-xs uppercase tracking-wider">{product.category || "Genel"}</span>
                  {inCart ? (
                    <Badge className="bg-emerald-600">
                      <Check />
                      Sepette
                    </Badge>
                  ) : null}
                </div>
                <CardHeader className="pt-5">
                  <CardDescription className="font-mono text-xs">{product.code}</CardDescription>
                  <CardTitle className="text-base">{product.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 pb-5">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      {price == null ? (
                        <span className="text-muted-foreground text-sm">{currency} fiyatı tanımsız</span>
                      ) : (
                        <strong className="text-primary text-xl">{formatMoney(price, currency)}</strong>
                      )}
                      <p className="text-muted-foreground text-xs">set başına</p>
                    </div>
                    <div className="text-right text-muted-foreground text-xs">
                      <p>
                        MOQ:{" "}
                        <strong className="text-foreground">
                          {product.moqAmount} {product.moqUnit}
                        </strong>
                      </p>
                      <p>{product.setsPerCarton} set/koli</p>
                      <p>{product.cartonsPerPallet} koli/palet</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_120px] gap-2">
                    <Field>
                      <FieldLabel htmlFor={`amount-${product.id}`}>Miktar</FieldLabel>
                      <Input
                        id={`amount-${product.id}`}
                        type="number"
                        min="1"
                        value={amounts[product.id] ?? String(product.moqAmount)}
                        onChange={(event) =>
                          setAmounts((current) => ({ ...current, [product.id]: event.target.value }))
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Birim</FieldLabel>
                      <Select
                        value={unit}
                        onValueChange={(value) =>
                          setUnits((current) => ({ ...current, [product.id]: value as FuarCartLine["unit"] }))
                        }
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
                  </div>
                  <Button
                    type="button"
                    variant={inCart ? "secondary" : "default"}
                    disabled={price == null}
                    onClick={() => add(product)}
                  >
                    <PackagePlus data-icon="inline-start" />
                    {inCart ? "Sepeti güncelle" : "Teklife ekle"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
