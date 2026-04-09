"use client";

// =============================================================
// FILE: tanimlar/_components/birimler-tab.tsx
// Paspas ERP — Birim tanımları yönetimi
// =============================================================

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useListBirimlerAdminQuery,
  useCreateBirimAdminMutation,
  useUpdateBirimAdminMutation,
  useDeleteBirimAdminMutation,
} from "@/integrations/endpoints/admin/erp/tanimlar_admin.endpoints";
import type { BirimDto } from "@/integrations/shared/erp/tanimlar.types";

// ── Form Sheet ────────────────────────────────────────────────

interface BirimFormProps {
  open: boolean;
  onClose: () => void;
  birim?: BirimDto | null;
}

function BirimForm({ open, onClose, birim }: BirimFormProps) {
  const isEdit = !!birim;

  const [kod, setKod] = useState(birim?.kod ?? "");
  const [ad, setAd] = useState(birim?.ad ?? "");
  const [sira, setSira] = useState(String(birim?.sira ?? 0));
  const [isActive, setIsActive] = useState(birim?.isActive ?? true);

  const [createBirim, { isLoading: creating }] = useCreateBirimAdminMutation();
  const [updateBirim, { isLoading: updating }] = useUpdateBirimAdminMutation();
  const busy = creating || updating;

  const handleOpen = (v: boolean) => {
    if (v) {
      setKod(birim?.kod ?? "");
      setAd(birim?.ad ?? "");
      setSira(String(birim?.sira ?? 0));
      setIsActive(birim?.isActive ?? true);
    }
  };

  const handleSubmit = async () => {
    if (!kod.trim() || !ad.trim()) {
      toast.error("Kod ve Ad zorunludur.");
      return;
    }
    try {
      if (isEdit && birim) {
        await updateBirim({ id: birim.id, body: { kod: kod.trim(), ad: ad.trim(), sira: Number(sira) || 0, isActive } }).unwrap();
        toast.success("Birim güncellendi.");
      } else {
        await createBirim({ kod: kod.trim(), ad: ad.trim(), sira: Number(sira) || 0, isActive }).unwrap();
        toast.success("Birim eklendi.");
      }
      onClose();
    } catch {
      toast.error("İşlem başarısız.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { handleOpen(v); if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Birimi Düzenle" : "Yeni Birim Ekle"}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 py-4">
          <div className="space-y-1.5">
            <Label>Kod *</Label>
            <Input
              value={kod}
              onChange={(e) => setKod(e.target.value)}
              placeholder="adet, kg, metre..."
              disabled={busy}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Ad *</Label>
            <Input
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              placeholder="Adet, Kilogram, Metre..."
              disabled={busy}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Sıra</Label>
            <Input
              type="number"
              min={0}
              value={sira}
              onChange={(e) => setSira(e.target.value)}
              disabled={busy}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch id="birim-active" checked={isActive} onCheckedChange={setIsActive} disabled={busy} />
            <Label htmlFor="birim-active">Aktif</Label>
          </div>
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>İptal</Button>
          <Button onClick={handleSubmit} disabled={busy}>
            {isEdit ? "Güncelle" : "Ekle"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ── Main Component ────────────────────────────────────────────

export default function BirimlerTab() {
  const { data, isLoading } = useListBirimlerAdminQuery();
  const [deleteBirim] = useDeleteBirimAdminMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BirimDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BirimDto | null>(null);

  const items = data?.items ?? [];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBirim(deleteTarget.id).unwrap();
      toast.success("Birim silindi.");
    } catch {
      toast.error("Silinemedi.");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Birimler</CardTitle>
            <CardDescription>Ürünlerde kullanılan ölçü birimleri</CardDescription>
          </div>
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="mr-2 size-4" />
            Yeni Birim
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Yükleniyor...</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Henüz birim tanımlanmamış.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Sıra</TableHead>
                <TableHead>Kod</TableHead>
                <TableHead>Ad</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="text-muted-foreground">{b.sira}</TableCell>
                  <TableCell className="font-mono font-medium">{b.kod}</TableCell>
                  <TableCell>{b.ad}</TableCell>
                  <TableCell>
                    <Badge variant={b.isActive ? "default" : "secondary"}>
                      {b.isActive ? "Aktif" : "Pasif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditing(b); setFormOpen(true); }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(b)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <BirimForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        birim={editing}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Birimi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.ad}</strong> ({deleteTarget?.kod}) birimini silmek istediğinizden emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
