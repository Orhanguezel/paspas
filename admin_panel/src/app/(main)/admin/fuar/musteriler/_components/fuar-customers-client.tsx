"use client";

import { useState } from "react";

import { Archive, Loader2, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  type FuarCustomer,
  type FuarCustomerInput,
  useArchiveFuarCustomerMutation,
  useCreateFuarCustomerMutation,
  useListFuarCustomersQuery,
  useUpdateFuarCustomerMutation,
} from "@/integrations/endpoints/admin/fuar-customers.endpoints";

const empty = {
  code: "",
  name: "",
  contactName: "",
  email: "",
  phone: "",
  country: "",
  city: "",
  defaultDiscountPercent: "0",
};
export function FuarCustomersClient() {
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { data, isLoading, isError } = useListFuarCustomersQuery(undefined);
  const [create, creating] = useCreateFuarCustomerMutation();
  const [update, updating] = useUpdateFuarCustomerMutation();
  const [archive] = useArchiveFuarCustomerMutation();
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const body: FuarCustomerInput = {
      code: form.code.trim(),
      name: form.name.trim(),
      contactName: form.contactName.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      country: form.country.trim() || undefined,
      city: form.city.trim() || undefined,
      defaultDiscountPercent: Number(form.defaultDiscountPercent),
      isForeign: true,
    };
    try {
      if (editingId) await update({ id: editingId, body }).unwrap();
      else await create(body).unwrap();
      toast.success(editingId ? "Müşteri güncellendi." : "Müşteri oluşturuldu.");
      setEditingId(null);
      setForm(empty);
    } catch {
      toast.error("Müşteri kaydedilemedi.");
    }
  }
  function edit(customer: FuarCustomer) {
    setEditingId(customer.id);
    setForm({
      code: customer.code,
      name: customer.name,
      contactName: customer.contactName || "",
      email: customer.email || "",
      phone: customer.phone || "",
      country: customer.country || "",
      city: customer.city || "",
      defaultDiscountPercent: String(customer.defaultDiscountPercent),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function remove(id: string) {
    try {
      await archive(id).unwrap();
      toast.success("Müşteri arşivlendi.");
    } catch {
      toast.error("Müşteri arşivlenemedi.");
    }
  }
  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl tracking-tight">Fuar Müşterileri</h1>
        <p className="text-muted-foreground text-sm">
          Fuar teklifleri için firma, iletişim ve varsayılan indirim kayıtları.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Müşteriyi düzenle" : "Yeni müşteri"}</CardTitle>
          <CardDescription>Genel indirim teklif oluşturulurken otomatik uygulanır.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit}>
            <FieldGroup className="grid md:grid-cols-3">
              {(
                [
                  ["code", "Müşteri kodu"],
                  ["name", "Firma adı"],
                  ["contactName", "Yetkili"],
                  ["email", "E-posta"],
                  ["phone", "Telefon"],
                  ["country", "Ülke"],
                  ["city", "Şehir"],
                ] as const
              ).map(([key, label]) => (
                <Field key={key}>
                  <FieldLabel htmlFor={`customer-${key}`}>{label}</FieldLabel>
                  <Input
                    id={`customer-${key}`}
                    type={key === "email" ? "email" : "text"}
                    value={form[key]}
                    onChange={set(key)}
                    required={key === "code" || key === "name"}
                  />
                </Field>
              ))}
              <Field>
                <FieldLabel htmlFor="customer-discount">Genel indirim (%)</FieldLabel>
                <Input
                  id="customer-discount"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.defaultDiscountPercent}
                  onChange={set("defaultDiscountPercent")}
                  required
                />
              </Field>
              <div className="flex gap-2">
                <Button type="submit" disabled={creating.isLoading || updating.isLoading}>
                  {creating.isLoading || updating.isLoading ? (
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <Save data-icon="inline-start" />
                  )}
                  {editingId ? "Değişiklikleri kaydet" : "Müşteriyi kaydet"}
                </Button>
                {editingId ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setForm(empty);
                    }}
                  >
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
          <CardTitle>Müşteri listesi</CardTitle>
          <CardDescription>{data?.total ?? 0} müşteri</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Yükleniyor…</p>
          ) : isError ? (
            <p className="text-destructive text-sm">Müşteri servisine ulaşılamadı.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead>Yetkili</TableHead>
                  <TableHead>Konum</TableHead>
                  <TableHead>İndirim</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.code}</TableCell>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.contactName || "—"}</TableCell>
                    <TableCell>{[customer.city, customer.country].filter(Boolean).join(", ") || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">%{customer.defaultDiscountPercent}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button type="button" size="sm" variant="ghost" onClick={() => edit(customer)}>
                        <Pencil data-icon="inline-start" />
                        Düzenle
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => remove(customer.id)}>
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
