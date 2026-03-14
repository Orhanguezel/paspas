'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertTriangle, Clock3, GripVertical, RefreshCcw, Trash2, Wrench } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocaleContext } from '@/i18n/LocaleProvider';
import {
  useDeleteIsYukuAdminMutation,
  useListIsYukleriAdminQuery,
  useUpdateIsYukuAdminMutation,
} from '@/integrations/endpoints/admin/erp/is_yukler_admin.endpoints';
import { useListMakinelerAdminQuery } from '@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints';
import { IS_YUKU_DURUM_BADGE, IS_YUKU_DURUM_LABELS, type IsYukuDto } from '@/integrations/shared/erp/is_yukler.types';

type MakineGrubu = {
  makineId: string;
  makineKod: string;
  makineAd: string;
  items: IsYukuDto[];
};

function formatDate(value: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatOnlyDate(value: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('tr-TR');
}

function formatDuration(totalDk: number) {
  if (totalDk < 60) return `${totalDk} dk`;
  const saat = Math.floor(totalDk / 60);
  const dakika = totalDk % 60;
  return dakika ? `${saat}s ${dakika}dk` : `${saat}s`;
}

function findGroupId(groups: MakineGrubu[], itemId: string) {
  return groups.find((g) => g.items.some((item) => item.kuyrukId === itemId))?.makineId ?? null;
}

// ─── Compact queue row ───────────────────────────────────────

function KuyrukSatiri({
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
  const style = { transform: CSS.Transform.toString(transform), transition };

  const terminRiski = Boolean(
    item.terminTarihi &&
      item.planlananBitis &&
      new Date(item.planlananBitis).getTime() > new Date(item.terminTarihi).getTime(),
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded border bg-background px-2 py-1.5 text-xs transition ${
        isDragging ? 'opacity-60' : ''
      }`}
    >
      <button type="button" className="text-muted-foreground hover:text-foreground" {...attributes} {...listeners}>
        <GripVertical className="size-3.5" />
      </button>

      <span className="w-6 shrink-0 text-center font-mono text-muted-foreground">{item.sira}</span>

      <Link
        href={`/admin/uretim-emirleri/${item.uretimEmriId}`}
        className="w-20 shrink-0 truncate font-mono font-semibold hover:underline"
      >
        {item.emirNo}
      </Link>

      <span className="w-16 shrink-0 truncate font-mono text-muted-foreground">{item.urunKod}</span>
      <span className="min-w-0 flex-1 truncate">{item.urunAd}</span>
      <span className="w-28 shrink-0 truncate text-muted-foreground">{item.operasyonAdi}</span>

      <span className="w-14 shrink-0 text-right font-mono">{item.planlananMiktar}</span>

      {item.musteriAd && (
        <span className="w-24 shrink-0 truncate text-muted-foreground">{item.musteriAd}</span>
      )}

      <span className="w-16 shrink-0 text-right text-muted-foreground">
        <Clock3 className="mr-0.5 inline size-3" />
        {formatDuration(item.hazirlikSuresiDk + item.planlananSureDk)}
      </span>

      <span className={`w-20 shrink-0 text-right ${terminRiski ? 'font-medium text-destructive' : 'text-muted-foreground'}`}>
        {formatOnlyDate(item.terminTarihi)}
        {terminRiski && <AlertTriangle className="ml-0.5 inline size-3" />}
      </span>

      <span className="w-16 shrink-0 text-right text-muted-foreground">
        {formatDate(item.planlananBaslangic)}
      </span>

      <div className="flex w-20 shrink-0 items-center justify-end gap-1">
        {item.montaj && (
          <Badge variant="secondary" className="px-1.5 py-0.5 text-xs gap-1">
            <Wrench className="size-3" />
            Montaj
          </Badge>
        )}
        <Badge variant={IS_YUKU_DURUM_BADGE[item.durum] ?? 'outline'} className="px-1.5 text-[9px]">
          {IS_YUKU_DURUM_LABELS[item.durum] ?? item.durum}
        </Badge>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="size-6 shrink-0 text-destructive hover:text-destructive"
        onClick={() => onRemove(item)}
        disabled={isBusy}
      >
        <Trash2 className="size-3" />
      </Button>
    </div>
  );
}

// ─── Machine group ───────────────────────────────────────────

function MakineGrubuPanel({
  group,
  onRemove,
  isBusy,
  t,
}: {
  group: MakineGrubu;
  onRemove: (item: IsYukuDto) => void;
  isBusy: boolean;
  t: (key: string, params?: Record<string, string>) => string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `container:${group.makineId}` });
  const toplamSure = group.items.reduce((sum, item) => sum + item.hazirlikSuresiDk + item.planlananSureDk, 0);
  const calisanSayisi = group.items.filter((item) => item.durum === 'calisiyor').length;
  const sonIsBitis = group.items.length > 0
    ? group.items.reduce((latest, item) => {
        if (!item.planlananBitis) return latest;
        if (!latest) return item.planlananBitis;
        return new Date(item.planlananBitis) > new Date(latest) ? item.planlananBitis : latest;
      }, null as string | null)
    : null;

  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-3 border-b bg-muted/40 px-3 py-2">
        <div>
          <span className="font-mono text-sm font-semibold">{group.makineKod}</span>
          <span className="ml-2 text-sm text-muted-foreground">{group.makineAd}</span>
        </div>
        <div className="ml-auto grid min-w-[300px] gap-2 sm:grid-cols-4">
          <div className="rounded-md border bg-background px-3 py-2">
            <div className="text-[11px] text-muted-foreground">{t('admin.erp.isYukler.summary.machineJobCount')}</div>
            <div className="font-semibold tabular-nums">{group.items.length}</div>
          </div>
          <div className="rounded-md border bg-background px-3 py-2">
            <div className="text-[11px] text-muted-foreground">{t('admin.erp.isYukler.summary.machineActive')}</div>
            <div className="font-semibold tabular-nums text-emerald-600">{calisanSayisi}</div>
          </div>
          <div className="rounded-md border bg-background px-3 py-2">
            <div className="text-[11px] text-muted-foreground">{t('admin.erp.isYukler.summary.machineDuration')}</div>
            <div className="font-semibold tabular-nums">{formatDuration(toplamSure)}</div>
          </div>
          <div className="rounded-md border bg-background px-3 py-2">
            <div className="text-[11px] text-muted-foreground">{t('admin.erp.isYukler.summary.lastJobEnd')}</div>
            {sonIsBitis ? (
              <>
                <div className="font-semibold tabular-nums text-sm">{new Date(sonIsBitis).toLocaleDateString('tr-TR')}</div>
                <div className="text-[11px] tabular-nums text-muted-foreground">{new Date(sonIsBitis).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
              </>
            ) : (
              <div className="font-semibold tabular-nums text-muted-foreground">—</div>
            )}
          </div>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`space-y-1 p-2 transition ${isOver ? 'bg-primary/5' : ''}`}
      >
        <SortableContext items={group.items.map((item) => item.kuyrukId)} strategy={verticalListSortingStrategy}>
          {group.items.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t('admin.erp.isYukler.messages.emptyMachine')}
            </div>
          ) : (
            group.items.map((item) => (
              <KuyrukSatiri key={item.kuyrukId} item={item} onRemove={onRemove} isBusy={isBusy} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────

export default function IsYukleriClient() {
  const { t } = useLocaleContext();
  const [makineId, setMakineId] = useState('hepsi');
  const params = makineId !== 'hepsi' ? { makineId } : undefined;

  const { data, isLoading, isFetching, refetch } = useListIsYukleriAdminQuery(params);
  const { data: makineler } = useListMakinelerAdminQuery({});
  const [updateIsYuku, updateState] = useUpdateIsYukuAdminMutation();
  const [deleteIsYuku, deleteState] = useDeleteIsYukuAdminMutation();

  const [localGroups, setLocalGroups] = useState<MakineGrubu[]>([]);
  const summary = useMemo(() => {
    const groups = localGroups.length;
    const totalJobs = localGroups.reduce((sum, group) => sum + group.items.length, 0);
    const activeJobs = localGroups.reduce(
      (sum, group) => sum + group.items.filter((item) => item.durum === 'calisiyor').length,
      0,
    );
    return { groups, totalJobs, activeJobs };
  }, [localGroups]);

  useEffect(() => {
    const machineList = (makineler?.items ?? [])
      .filter((machine) => makineId === 'hepsi' || machine.id === makineId)
      .map((machine) => ({ makineId: machine.id, makineKod: machine.kod, makineAd: machine.ad }));

    const nextGroups = machineList.map((machine) => ({
      ...machine,
      items: (data?.items ?? []).filter((item) => item.makineId === machine.makineId).sort((a, b) => a.sira - b.sira),
    }));
    // Only show machines that have items (or selected machine)
    setLocalGroups(
      makineId !== 'hepsi'
        ? nextGroups
        : nextGroups.filter((g) => g.items.length > 0),
    );
  }, [data?.items, makineler?.items, makineId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleRemove(item: IsYukuDto) {
    try {
      await deleteIsYuku(item.kuyrukId).unwrap();
      toast.success(t('admin.erp.isYukler.messages.removed'));
    } catch {
      toast.error(t('admin.erp.isYukler.messages.removeError'));
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceGroupId = findGroupId(localGroups, String(active.id));
    if (!sourceGroupId) return;

    const overId = String(over.id);
    const targetGroupId = overId.startsWith('container:')
      ? overId.replace('container:', '')
      : findGroupId(localGroups, overId);
    if (!targetGroupId) return;

    const sourceGroup = localGroups.find((g) => g.makineId === sourceGroupId);
    const targetGroup = localGroups.find((g) => g.makineId === targetGroupId);
    if (!sourceGroup || !targetGroup) return;

    const sourceIndex = sourceGroup.items.findIndex((item) => item.kuyrukId === active.id);
    if (sourceIndex === -1) return;

    const targetIndex = overId.startsWith('container:')
      ? targetGroup.items.length
      : Math.max(targetGroup.items.findIndex((item) => item.kuyrukId === over.id), 0);

    if (sourceGroupId === targetGroupId && sourceIndex === targetIndex) return;

    const movedItem = sourceGroup.items[sourceIndex];
    const nextGroups = localGroups.map((g) => ({ ...g, items: [...g.items] }));
    const nextSource = nextGroups.find((g) => g.makineId === sourceGroupId);
    const nextTarget = nextGroups.find((g) => g.makineId === targetGroupId);
    if (!nextSource || !nextTarget) return;

    if (sourceGroupId === targetGroupId) {
      nextSource.items = arrayMove(nextSource.items, sourceIndex, targetIndex).map((item, index) => ({
        ...item,
        sira: index + 1,
      }));
    } else {
      nextSource.items.splice(sourceIndex, 1);
      nextSource.items = nextSource.items.map((item, index) => ({ ...item, sira: index + 1 }));
      const moved = { ...movedItem, makineId: targetGroupId };
      nextTarget.items.splice(targetIndex, 0, moved);
      nextTarget.items = nextTarget.items.map((item, index) => ({ ...item, sira: index + 1 }));
    }

    setLocalGroups(nextGroups);

    try {
      await updateIsYuku({
        id: movedItem.kuyrukId,
        body: { makineId: targetGroupId, sira: targetIndex + 1 },
      }).unwrap();
      toast.success(
        sourceGroupId === targetGroupId
          ? t('admin.erp.isYukler.messages.reordered')
          : t('admin.erp.isYukler.messages.moved'),
      );
    } catch {
      toast.error(t('admin.erp.isYukler.messages.moveError'));
      const machineList = (makineler?.items ?? [])
        .filter((machine) => makineId === 'hepsi' || machine.id === makineId)
        .map((machine) => ({ makineId: machine.id, makineKod: machine.kod, makineAd: machine.ad }));
      const rollback = machineList.map((machine) => ({
        ...machine,
        items: (data?.items ?? []).filter((item) => item.makineId === machine.makineId).sort((a, b) => a.sira - b.sira),
      }));
      setLocalGroups(makineId !== 'hepsi' ? rollback : rollback.filter((g) => g.items.length > 0));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-lg">{t('admin.erp.isYukler.title')}</h1>
          <p className="text-muted-foreground text-sm">
            {t('admin.erp.common.totalCount', {
              count: String(data?.total ?? 0),
              item: t('admin.erp.isYukler.singular').toLowerCase(),
            })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCcw className={isFetching ? 'size-4 animate-spin' : 'size-4'} />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs">{t('admin.erp.isYukler.summary.machineCount')}</div>
            <div className="mt-1 font-semibold text-2xl tabular-nums">{summary.groups}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs">{t('admin.erp.isYukler.summary.jobCount')}</div>
            <div className="mt-1 font-semibold text-2xl tabular-nums">{summary.totalJobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs">{t('admin.erp.isYukler.summary.activeCount')}</div>
            <div className="mt-1 font-semibold text-2xl tabular-nums text-emerald-600">{summary.activeJobs}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Select value={makineId} onValueChange={setMakineId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder={t('admin.erp.isYukler.searchPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hepsi">{t('admin.erp.isYukler.allMachines')}</SelectItem>
            {(makineler?.items ?? []).map((machine) => (
              <SelectItem key={machine.id} value={machine.id}>
                {machine.kod} — {machine.ad}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : localGroups.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground text-sm">
          {t('admin.erp.isYukler.notFound')}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="space-y-4">
            {localGroups.map((group) => (
              <MakineGrubuPanel
                key={group.makineId}
                group={group}
                onRemove={handleRemove}
                isBusy={updateState.isLoading || deleteState.isLoading}
                t={t}
              />
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
}
