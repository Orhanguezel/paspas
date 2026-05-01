"use client";

import * as React from "react";

import {
  Bug,
  Check,
  CheckCircle2,
  Circle,
  CircleDot,
  ClipboardCheck,
  HelpCircle,
  Lightbulb,
  ListTodo,
  Pencil,
  Plus,
  StickyNote,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateProjeTeklifiNotMutation,
  useDeleteProjeTeklifiNotMutation,
  useListProjeTeklifiNotlariQuery,
  useUpdateProjeTeklifiNotMutation,
} from "@/integrations/hooks";
import {
  PROJE_TEKLIFI_DURUM_OPTIONS,
  PROJE_TEKLIFI_NOT_TIPI_OPTIONS,
  PROJE_TEKLIFI_ONCELIK_OPTIONS,
  type ProjeTeklifiDurum,
  type ProjeTeklifiNot,
  type ProjeTeklifiNotTipi,
  type ProjeTeklifiOncelik,
} from "@/integrations/shared";

type Props = {
  dokumanKey: string;
  dokumanBaslik: string;
};

const TIPI_ICON: Record<ProjeTeklifiNotTipi, React.ComponentType<{ className?: string }>> = {
  note: StickyNote,
  todo: ListTodo,
  bug: Bug,
  idea: Lightbulb,
  question: HelpCircle,
};

const DURUM_ICON: Record<ProjeTeklifiDurum, React.ComponentType<{ className?: string }>> = {
  open: Circle,
  in_progress: CircleDot,
  done: CheckCircle2,
  wontfix: XCircle,
};

const ONCELIK_BADGE: Record<ProjeTeklifiOncelik, { label: string; className: string }> = {
  low: { label: "Düşük", className: "bg-muted text-muted-foreground" },
  normal: { label: "Normal", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200" },
  high: { label: "Yüksek", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" },
  urgent: { label: "Acil", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200" },
};

const DURUM_BADGE: Record<ProjeTeklifiDurum, { label: string; className: string }> = {
  open: { label: "Açık", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200" },
  in_progress: { label: "Devam", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200" },
  done: { label: "Tamam", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200" },
  wontfix: { label: "İptal", className: "bg-muted text-muted-foreground" },
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function ProjeTeklifiNotlarPanel({ dokumanKey, dokumanBaslik }: Props) {
  const { data, isLoading, isFetching } = useListProjeTeklifiNotlariQuery({
    dokumanKey,
    limit: 200,
    sort: "created_at",
    order: "desc",
  });
  const [createNot, { isLoading: creating }] = useCreateProjeTeklifiNotMutation();
  const [updateNot] = useUpdateProjeTeklifiNotMutation();
  const [deleteNot] = useDeleteProjeTeklifiNotMutation();

  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [icerik, setIcerik] = React.useState("");
  const [baslik, setBaslik] = React.useState("");
  const [notTipi, setNotTipi] = React.useState<ProjeTeklifiNotTipi>("note");
  const [oncelik, setOncelik] = React.useState<ProjeTeklifiOncelik>("normal");
  const [etiketlerInput, setEtiketlerInput] = React.useState("");

  const resetForm = () => {
    setIcerik("");
    setBaslik("");
    setNotTipi("note");
    setOncelik("normal");
    setEtiketlerInput("");
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (n: ProjeTeklifiNot) => {
    setEditingId(n.id);
    setIcerik(n.icerik);
    setBaslik(n.baslik ?? "");
    setNotTipi(n.notTipi);
    setOncelik(n.oncelik);
    setEtiketlerInput(n.etiketler.join(", "));
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!icerik.trim()) {
      toast.error("Not içeriği boş olamaz");
      return;
    }

    const etiketler = etiketlerInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20);

    const body = {
      dokumanKey,
      dokumanBaslik,
      notTipi,
      baslik: baslik.trim() || null,
      icerik: icerik.trim(),
      etiketler: etiketler.length ? etiketler : null,
      oncelik,
    };

    try {
      if (editingId) {
        await updateNot({ id: editingId, body }).unwrap();
        toast.success("Not güncellendi");
      } else {
        await createNot(body).unwrap();
        toast.success("Not eklendi");
      }
      resetForm();
    } catch (err) {
      toast.error("Kaydedilemedi");
      console.error(err);
    }
  };

  const handleDurumToggle = async (n: ProjeTeklifiNot) => {
    const yeniDurum: ProjeTeklifiDurum =
      n.durum === "open"
        ? "in_progress"
        : n.durum === "in_progress"
          ? "done"
          : n.durum === "done"
            ? "open"
            : "open";
    try {
      await updateNot({ id: n.id, body: { durum: yeniDurum } }).unwrap();
      toast.success(`Durum: ${DURUM_BADGE[yeniDurum].label}`);
    } catch {
      toast.error("Güncellenemedi");
    }
  };

  const handleDelete = async (n: ProjeTeklifiNot) => {
    if (!confirm(`Bu notu silmek istediğinize emin misiniz?\n\n"${n.baslik ?? n.icerik.slice(0, 60)}"`)) {
      return;
    }
    try {
      await deleteNot(n.id).unwrap();
      toast.success("Not silindi");
      if (editingId === n.id) resetForm();
    } catch {
      toast.error("Silinemedi");
    }
  };

  const items = data?.items ?? [];
  const acikSayisi = items.filter((n) => n.durum === "open").length;
  const devamSayisi = items.filter((n) => n.durum === "in_progress").length;
  const tamamSayisi = items.filter((n) => n.durum === "done").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Yazılımcı Notları
              {isFetching && !isLoading ? (
                <Spinner className="h-3 w-3 text-muted-foreground" />
              ) : null}
            </CardTitle>
            <CardDescription className="mt-1">
              <span className="font-mono text-xs">{dokumanKey}</span> · {dokumanBaslik}
              {items.length > 0 ? (
                <>
                  {" · "}
                  <span className="text-blue-600">{acikSayisi} açık</span>
                  {" · "}
                  <span className="text-yellow-600">{devamSayisi} devam</span>
                  {" · "}
                  <span className="text-green-600">{tamamSayisi} tamam</span>
                </>
              ) : null}
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => {
              if (showForm && !editingId) {
                resetForm();
              } else {
                resetForm();
                setShowForm(true);
              }
            }}
            variant={showForm && !editingId ? "outline" : "default"}
          >
            {showForm && !editingId ? (
              <>
                <X className="h-4 w-4" />
                İptal
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Yeni Not
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {showForm ? (
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-md border border-border bg-muted/30 p-4"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="not-tipi">Tip</Label>
                <Select value={notTipi} onValueChange={(v) => setNotTipi(v as ProjeTeklifiNotTipi)}>
                  <SelectTrigger id="not-tipi">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJE_TEKLIFI_NOT_TIPI_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="not-oncelik">Öncelik</Label>
                <Select value={oncelik} onValueChange={(v) => setOncelik(v as ProjeTeklifiOncelik)}>
                  <SelectTrigger id="not-oncelik">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJE_TEKLIFI_ONCELIK_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="not-etiketler">Etiketler</Label>
                <Input
                  id="not-etiketler"
                  placeholder="virgülle ayrılı (faz-2, mlops, ...)"
                  value={etiketlerInput}
                  onChange={(e) => setEtiketlerInput(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="not-baslik">Başlık (opsiyonel)</Label>
              <Input
                id="not-baslik"
                placeholder="Kısa özet..."
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="not-icerik">İçerik *</Label>
              <Textarea
                id="not-icerik"
                placeholder="Not, soru, yapılacak iş, fikir..."
                value={icerik}
                onChange={(e) => setIcerik(e.target.value)}
                rows={5}
                required
              />
              <p className="text-xs text-muted-foreground">
                Markdown desteklenmiyor — düz metin. Codeblock için ` ` (backtick) kullanabilirsiniz.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={resetForm}>
                İptal
              </Button>
              <Button type="submit" disabled={creating || !icerik.trim()}>
                {creating ? <Spinner className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                {editingId ? "Güncelle" : "Kaydet"}
              </Button>
            </div>
          </form>
        </CardContent>
      ) : null}

      <Separator />

      <CardContent className="pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Bu doküman için henüz not yok.{" "}
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={() => setShowForm(true)}
            >
              İlk notu siz ekleyin
            </button>
            .
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((n) => {
              const TipIcon = TIPI_ICON[n.notTipi];
              const DurumIcon = DURUM_ICON[n.durum];
              const oncelikInfo = ONCELIK_BADGE[n.oncelik];
              const durumInfo = DURUM_BADGE[n.durum];

              return (
                <li
                  key={n.id}
                  className="rounded-md border border-border bg-card p-3 transition hover:border-primary/40"
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => handleDurumToggle(n)}
                      className="mt-0.5 shrink-0 rounded-full p-1 hover:bg-accent"
                      title="Durumu değiştir"
                    >
                      <DurumIcon className="h-4 w-4 text-muted-foreground" />
                    </button>

                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <TipIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        {n.baslik ? (
                          <span className="font-semibold text-sm">{n.baslik}</span>
                        ) : null}
                        <Badge variant="outline" className={`${oncelikInfo.className} border-0`}>
                          {oncelikInfo.label}
                        </Badge>
                        <Badge variant="outline" className={`${durumInfo.className} border-0`}>
                          {durumInfo.label}
                        </Badge>
                        {n.etiketler.map((e) => (
                          <Badge key={e} variant="outline" className="font-mono text-xs">
                            {e}
                          </Badge>
                        ))}
                      </div>

                      <p className="whitespace-pre-wrap text-sm text-foreground">{n.icerik}</p>

                      <div className="flex items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
                        <span>
                          {formatDate(n.createdAt)}
                          {n.updatedAt !== n.createdAt ? (
                            <span> · düzenlendi {formatDate(n.updatedAt)}</span>
                          ) : null}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => startEdit(n)}
                            title="Düzenle"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(n)}
                            title="Sil"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
