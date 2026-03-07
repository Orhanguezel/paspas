"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, Clock3, GripVertical, Package, RefreshCcw, Trash2, User, Wrench } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocaleContext } from "@/i18n/LocaleProvider";
import {
  useDeleteIsYukuAdminMutation,
  useListIsYukleriAdminQuery,
  useUpdateIsYukuAdminMutation,
} from "@/integrations/endpoints/admin/erp/is_yukler_admin.endpoints";
import { useListMakinelerAdminQuery } from "@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints";
import { IS_YUKU_DURUM_BADGE, IS_YUKU_DURUM_LABELS, type IsYukuDto } from "@/integrations/shared/erp/is_yukler.types";

type MakineKolonu = {
  makineId: string;
  makineKod: string;
  makineAd: string;
  items: IsYukuDto[];
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatOnlyDate(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("tr-TR");
}

function formatDuration(totalDk: number) {
  if (totalDk < 60) return `${totalDk} dk`;
  const saat = Math.floor(totalDk / 60);
  const dakika = totalDk % 60;
  return dakika ? `${saat}s ${dakika}dk` : `${saat}s`;
}

function findColumnId(columns: MakineKolonu[], itemId: string) {
  return columns.find((column) => column.items.some((item) => item.kuyrukId === itemId))?.makineId ?? null;
}

function LoadCard() {
  return <Skeleton className="h-56 w-full" />;
}

function KuyrukKarti({
  item,
  onRemove,
  isBusy,
}: {
  item: IsYukuDto;
  onRemove: (item: IsYukuDto) => void;
  isBusy: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.kuyrukId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const terminRiski = Boolean(
    item.terminTarihi &&
      item.planlananBitis &&
      new Date(item.planlananBitis).getTime() > new Date(item.terminTarihi).getTime(),
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-background p-3 shadow-sm transition ${isDragging ? "opacity-60" : ""}`}
    >
      <div className="mb-2 flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-muted-foreground text-xs">#{item.sira}</span>
            <Link href={`/admin/uretim-emirleri/${item.uretimEmriId}`} className="font-mono font-semibold text-sm">
              {item.emirNo}
            </Link>
            {item.montaj && (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <Wrench className="size-3" />
                Montajlı
              </Badge>
            )}
            <Badge variant={IS_YUKU_DURUM_BADGE[item.durum] ?? "outline"} className="text-[10px]">
              {IS_YUKU_DURUM_LABELS[item.durum] ?? item.durum}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-1 text-sm">
            <Package className="size-3.5 text-muted-foreground" />
            <span className="font-mono text-muted-foreground text-xs">{item.urunKod ?? "—"}</span>
            <span className="truncate">{item.urunAd ?? "Ürün"}</span>
          </div>
          <div className="mt-1 text-muted-foreground text-xs">{item.operasyonAdi ?? "Operasyon"}</div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-destructive hover:text-destructive"
          onClick={() => onRemove(item)}
          disabled={isBusy}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <div className="space-y-1.5 pl-6 text-xs">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
          <span>
            Miktar: <span className="font-medium text-foreground">{item.planlananMiktar}</span>
          </span>
          {item.uretilenMiktar > 0 && (
            <span>
              Üretilen: <span className="font-medium text-foreground">{item.uretilenMiktar}</span>
            </span>
          )}
          {item.fireMiktar > 0 && (
            <span>
              Fire: <span className="font-medium text-destructive">{item.fireMiktar}</span>
            </span>
          )}
        </div>

        {item.musteriAd && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <User className="size-3.5" />
            <span>{item.musteriAd}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock3 className="size-3.5" />
            {formatDuration(item.hazirlikSuresiDk + item.planlananSureDk)}
          </span>
          <span>Termin: {formatOnlyDate(item.terminTarihi)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
          <span>Başlangıç: {formatDate(item.planlananBaslangic)}</span>
          <span className={terminRiski ? "font-medium text-destructive" : undefined}>
            Bitiş: {formatDate(item.planlananBitis)}
          </span>
          {terminRiski && <AlertTriangle className="size-3.5 text-destructive" />}
        </div>
      </div>
    </div>
  );
}

function MakineKolon({
  column,
  onRemove,
  isBusy,
}: {
  column: MakineKolonu;
  onRemove: (item: IsYukuDto) => void;
  isBusy: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `container:${column.makineId}` });
  const toplamSure = column.items.reduce((sum, item) => sum + item.hazirlikSuresiDk + item.planlananSureDk, 0);

  return (
    <Card className="min-h-[260px]">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-mono font-semibold">{column.makineKod}</span>
          <span className="text-muted-foreground">{column.makineAd}</span>
          <Badge variant="outline" className="ml-auto">
            {formatDuration(toplamSure)}
          </Badge>
          <Badge variant="secondary">{column.items.length} iş</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={setNodeRef}
          className={`min-h-[180px] space-y-2 rounded-lg border border-dashed p-2 transition ${
            isOver ? "border-primary bg-primary/5" : "border-transparent"
          }`}
        >
          <SortableContext items={column.items.map((item) => item.kuyrukId)} strategy={verticalListSortingStrategy}>
            {column.items.length === 0 ? (
              <div className="flex h-[160px] items-center justify-center text-center text-muted-foreground text-sm">
                Bu makinede planlı iş yok
              </div>
            ) : (
              column.items.map((item) => (
                <KuyrukKarti key={item.kuyrukId} item={item} onRemove={onRemove} isBusy={isBusy} />
              ))
            )}
          </SortableContext>
        </div>
      </CardContent>
    </Card>
  );
}

export default function IsYukleriClient() {
  const { t } = useLocaleContext();
  const [makineId, setMakineId] = useState("hepsi");
  const params = makineId !== "hepsi" ? { makineId } : undefined;

  const { data, isLoading, isFetching, refetch } = useListIsYukleriAdminQuery(params);
  const { data: makineler } = useListMakinelerAdminQuery();
  const [updateIsYuku, updateState] = useUpdateIsYukuAdminMutation();
  const [deleteIsYuku, deleteState] = useDeleteIsYukuAdminMutation();

  const [localColumns, setLocalColumns] = useState<MakineKolonu[]>([]);

  useEffect(() => {
    const machineList = (makineler?.items ?? [])
      .filter((machine) => makineId === "hepsi" || machine.id === makineId)
      .map((machine) => ({ makineId: machine.id, makineKod: machine.kod, makineAd: machine.ad }));

    const nextColumns = machineList.map((machine) => ({
      ...machine,
      items: (data?.items ?? []).filter((item) => item.makineId === machine.makineId).sort((a, b) => a.sira - b.sira),
    }));
    setLocalColumns(nextColumns);
  }, [data?.items, makineler?.items, makineId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleRemove(item: IsYukuDto) {
    try {
      await deleteIsYuku(item.kuyrukId).unwrap();
      toast.success("İş yükü kuyruktan çıkarıldı");
    } catch {
      toast.error("İş yükü kuyruktan çıkarılamadı");
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceColumnId = findColumnId(localColumns, String(active.id));
    if (!sourceColumnId) return;

    const overId = String(over.id);
    const targetColumnId = overId.startsWith("container:")
      ? overId.replace("container:", "")
      : findColumnId(localColumns, overId);
    if (!targetColumnId) return;

    const sourceColumn = localColumns.find((column) => column.makineId === sourceColumnId);
    const targetColumn = localColumns.find((column) => column.makineId === targetColumnId);
    if (!sourceColumn || !targetColumn) return;

    const sourceIndex = sourceColumn.items.findIndex((item) => item.kuyrukId === active.id);
    if (sourceIndex === -1) return;

    const targetIndex = overId.startsWith("container:")
      ? targetColumn.items.length
      : Math.max(
          targetColumn.items.findIndex((item) => item.kuyrukId === over.id),
          0,
        );

    if (sourceColumnId === targetColumnId && sourceIndex === targetIndex) return;

    const movedItem = sourceColumn.items[sourceIndex];
    const nextColumns = localColumns.map((column) => ({ ...column, items: [...column.items] }));
    const nextSource = nextColumns.find((column) => column.makineId === sourceColumnId);
    const nextTarget = nextColumns.find((column) => column.makineId === targetColumnId);
    if (!nextSource || !nextTarget) return;

    if (sourceColumnId === targetColumnId) {
      nextSource.items = arrayMove(nextSource.items, sourceIndex, targetIndex).map((item, index) => ({
        ...item,
        sira: index + 1,
      }));
    } else {
      nextSource.items.splice(sourceIndex, 1);
      nextSource.items = nextSource.items.map((item, index) => ({ ...item, sira: index + 1 }));

      const moved = { ...movedItem, makineId: targetColumnId };
      nextTarget.items.splice(targetIndex, 0, moved);
      nextTarget.items = nextTarget.items.map((item, index) => ({ ...item, sira: index + 1 }));
    }

    setLocalColumns(nextColumns);

    try {
      await updateIsYuku({
        id: movedItem.kuyrukId,
        body: {
          makineId: targetColumnId,
          sira: targetIndex + 1,
        },
      }).unwrap();
      toast.success(sourceColumnId === targetColumnId ? "İş sırası güncellendi" : "İş başka makineye taşındı");
    } catch {
      toast.error("İş yükü taşınamadı");
      const machineList = (makineler?.items ?? [])
        .filter((machine) => makineId === "hepsi" || machine.id === makineId)
        .map((machine) => ({ makineId: machine.id, makineKod: machine.kod, makineAd: machine.ad }));
      const rollbackColumns = machineList.map((machine) => ({
        ...machine,
        items: (data?.items ?? []).filter((item) => item.makineId === machine.makineId).sort((a, b) => a.sira - b.sira),
      }));
      setLocalColumns(rollbackColumns);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-lg">{t("admin.erp.isYukler.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("admin.erp.common.totalCount", {
              count: String(data?.total ?? 0),
              item: t("admin.erp.isYukler.singular").toLowerCase(),
            })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCcw className={isFetching ? "size-4 animate-spin" : "size-4"} />
        </Button>
      </div>

      <div className="flex gap-3">
        <Select value={makineId} onValueChange={setMakineId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder={t("admin.erp.isYukler.searchPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hepsi">{t("admin.erp.isYukler.allMachines")}</SelectItem>
            {(makineler?.items ?? []).map((machine) => (
              <SelectItem key={machine.id} value={machine.id}>
                {machine.kod} — {machine.ad}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <LoadCard key={`is-yuku-skeleton-${index + 1}`} />
          ))}
        </div>
      ) : localColumns.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground text-sm">
          {t("admin.erp.isYukler.notFound")}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="grid gap-4 xl:grid-cols-2">
            {localColumns.map((column) => (
              <MakineKolon
                key={column.makineId}
                column={column}
                onRemove={handleRemove}
                isBusy={updateState.isLoading || deleteState.isLoading}
              />
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
}
