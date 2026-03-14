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
import {
  AlertTriangle,
  Clock3,
  GripVertical,
  LayoutList,
  LayoutGrid,
  RefreshCcw,
  Trash2,
  Wrench,
  User,
} from 'lucide-react';
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

type ViewMode = 'list' | 'grid';

function fmtDate(value: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function fmtOnlyDate(value: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
}

function fmtDuration(totalDk: number) {
  if (totalDk < 60) return `${totalDk}dk`;
  const s = Math.floor(totalDk / 60);
  const d = totalDk % 60;
  return d ? `${s}s ${d}dk` : `${s}s`;
}

function findGroupId(groups: MakineGrubu[], itemId: string) {
  return groups.find((g) => g.items.some((item) => item.kuyrukId === itemId))?.makineId ?? null;
}

// ─── Liste satiri (kompakt) ─────────────────────────────────

function ListRow({
  item,
  onRemove,
  isBusy,
}: {
  item: IsYukuDto;
  onRemove: (item: IsYukuDto) => void;
  isBusy: boolean;
}) {
  const isRunning = item.durum === 'calisiyor';
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.kuyrukId,
    disabled: isRunning,
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
      className={`flex items-center gap-1.5 rounded border px-1.5 py-1 text-[11px] leading-tight transition ${
        isDragging ? 'opacity-60' : ''
      } ${isRunning ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950' : 'bg-background'}`}
    >
      <button
        type="button"
        className={`shrink-0 ${isRunning ? 'text-muted-foreground/30 cursor-not-allowed' : 'text-muted-foreground hover:text-foreground'}`}
        {...attributes}
        {...(isRunning ? {} : listeners)}
      >
        <GripVertical className="size-3" />
      </button>

      <span className="w-4 shrink-0 text-center font-mono text-muted-foreground">{item.sira}</span>

      <Link
        href={`/admin/uretim-emirleri/${item.uretimEmriId}`}
        className="w-18 shrink-0 truncate font-mono font-semibold text-[11px] hover:underline"
      >
        {item.emirNo}
      </Link>

      <span className="w-14 shrink-0 truncate font-mono text-muted-foreground">{item.urunKod}</span>
      <span className="min-w-0 flex-1 truncate">{item.urunAd}</span>

      <span className="w-12 shrink-0 text-right font-mono tabular-nums">{item.planlananMiktar?.toLocaleString('tr-TR')}</span>

      <span className="w-10 shrink-0 text-right text-muted-foreground tabular-nums">
        <Clock3 className="mr-0.5 inline size-2.5" />
        {fmtDuration(item.hazirlikSuresiDk + item.planlananSureDk)}
      </span>

      <span className={`w-12 shrink-0 text-right tabular-nums ${terminRiski ? 'font-medium text-destructive' : 'text-muted-foreground'}`}>
        {fmtOnlyDate(item.terminTarihi)}
        {terminRiski && <AlertTriangle className="ml-0.5 inline size-2.5" />}
      </span>

      <span className="w-14 shrink-0 text-right text-muted-foreground tabular-nums">
        {fmtDate(item.planlananBaslangic)}
      </span>

      <div className="flex w-14 shrink-0 items-center justify-end gap-0.5">
        {item.montaj && (
          <Badge variant="secondary" className="px-1 py-0 text-[9px] gap-0.5">
            <Wrench className="size-2.5" />
            M
          </Badge>
        )}
        <Badge variant={IS_YUKU_DURUM_BADGE[item.durum] ?? 'outline'} className="px-1 py-0 text-[9px]">
          {IS_YUKU_DURUM_LABELS[item.durum] ?? item.durum}
        </Badge>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="size-5 shrink-0 text-destructive hover:text-destructive"
        onClick={() => onRemove(item)}
        disabled={isBusy || isRunning}
      >
        <Trash2 className="size-2.5" />
      </Button>
    </div>
  );
}

// ─── Grid kart satiri ───────────────────────────────────────

function GridRow({
  item,
  onRemove,
  isBusy,
}: {
  item: IsYukuDto;
  onRemove: (item: IsYukuDto) => void;
  isBusy: boolean;
}) {
  const isRunning = item.durum === 'calisiyor';
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.kuyrukId,
    disabled: isRunning,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-md border px-2.5 py-2 text-xs transition ${
        isDragging ? 'opacity-50' : ''
      } ${isRunning ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950' : 'bg-background'}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <button
          type="button"
          className={`shrink-0 ${isRunning ? 'text-muted-foreground/30 cursor-not-allowed' : 'text-muted-foreground hover:text-foreground'}`}
          {...attributes}
          {...(isRunning ? {} : listeners)}
        >
          <GripVertical className="size-3.5" />
        </button>
        <span className="font-mono text-muted-foreground text-[10px]">{item.sira}</span>
        <Link href={`/admin/uretim-emirleri/${item.uretimEmriId}`} className="font-mono font-semibold hover:underline">
          {item.emirNo}
        </Link>
        {item.montaj && (
          <Badge variant="secondary" className="px-1 py-0 text-[9px] gap-0.5">
            <Wrench className="size-2.5" />
            Montaj
          </Badge>
        )}
        <Badge variant={IS_YUKU_DURUM_BADGE[item.durum] ?? 'outline'} className="ml-auto px-1.5 py-0 text-[9px]">
          {IS_YUKU_DURUM_LABELS[item.durum] ?? item.durum}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="size-5 shrink-0 text-destructive hover:text-destructive"
          onClick={() => onRemove(item)}
          disabled={isBusy || isRunning}
        >
          <Trash2 className="size-2.5" />
        </Button>
      </div>
      <div className="ml-6 space-y-0.5 text-[11px]">
        <div className="flex items-center gap-1">
          <span className="font-mono text-muted-foreground">{item.urunKod}</span>
          <span className="truncate">{item.urunAd}</span>
          {item.operasyonAdi && <span className="text-muted-foreground">— {item.operasyonAdi}</span>}
        </div>
        <div className="flex flex-wrap gap-x-3 text-muted-foreground">
          <span>Miktar: <span className="font-mono text-foreground">{item.planlananMiktar?.toLocaleString('tr-TR')}</span></span>
          <span><Clock3 className="inline size-2.5 mr-0.5" />{fmtDuration(item.hazirlikSuresiDk + item.planlananSureDk)}</span>
          {item.terminTarihi && <span>Termin: <span className="font-mono text-foreground">{fmtOnlyDate(item.terminTarihi)}</span></span>}
          {item.musteriAd && <span><User className="inline size-2.5 mr-0.5" />{item.musteriAd}</span>}
        </div>
        {(item.planlananBaslangic || item.planlananBitis) && (
          <div className="flex gap-x-3 text-muted-foreground">
            {item.planlananBaslangic && <span>Başlangıç: <span className="font-mono text-foreground">{fmtDate(item.planlananBaslangic)}</span></span>}
            {item.planlananBitis && <span>Bitiş: <span className="font-mono text-foreground">{fmtDate(item.planlananBitis)}</span></span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Makine grubu ───────────────────────────────────────────

function MakineGrubuPanel({
  group,
  onRemove,
  isBusy,
  viewMode,
}: {
  group: MakineGrubu;
  onRemove: (item: IsYukuDto) => void;
  isBusy: boolean;
  viewMode: ViewMode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `container:${group.makineId}` });
  const toplamSure = group.items.reduce((sum, item) => sum + item.hazirlikSuresiDk + item.planlananSureDk, 0);
  const calisanSayisi = group.items.filter((item) => item.durum === 'calisiyor').length;
  const sonIsBitis = group.items.reduce((latest, item) => {
    if (!item.planlananBitis) return latest;
    if (!latest) return item.planlananBitis;
    return new Date(item.planlananBitis) > new Date(latest) ? item.planlananBitis : latest;
  }, null as string | null);

  const RowComp = viewMode === 'grid' ? GridRow : ListRow;

  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-1.5">
        <span className="font-mono text-sm font-semibold">{group.makineKod}</span>
        <span className="text-xs text-muted-foreground">{group.makineAd}</span>
        <div className="ml-auto flex items-center gap-3 text-[11px]">
          <div className="text-center">
            <div className="text-muted-foreground">İş</div>
            <div className="font-semibold tabular-nums">{group.items.length}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Aktif</div>
            <div className="font-semibold tabular-nums text-emerald-600">{calisanSayisi}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Süre</div>
            <div className="font-semibold tabular-nums">{fmtDuration(toplamSure)}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Son Bitiş</div>
            {sonIsBitis ? (
              <div className="font-semibold tabular-nums">{fmtDate(sonIsBitis)}</div>
            ) : (
              <div className="text-muted-foreground">—</div>
            )}
          </div>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`p-1.5 transition ${viewMode === 'grid' ? 'space-y-1.5' : 'space-y-0.5'} ${isOver ? 'bg-primary/5' : ''}`}
      >
        <SortableContext items={group.items.map((item) => item.kuyrukId)} strategy={verticalListSortingStrategy}>
          {group.items.length === 0 ? (
            <div className="py-4 text-center text-xs text-muted-foreground">Kuyruk boş</div>
          ) : (
            group.items.map((item) => (
              <RowComp key={item.kuyrukId} item={item} onRemove={onRemove} isBusy={isBusy} />
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
  const [viewMode, setViewMode] = useState<ViewMode>('list');
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
    setLocalGroups(makineId !== 'hepsi' ? nextGroups : nextGroups.filter((g) => g.items.length > 0));
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

    if (movedItem.durum === 'calisiyor') {
      toast.warning('Çalışan iş sırası değiştirilemez. Önce durdurun veya bitirin.');
      return;
    }

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
    <div className="space-y-3">
      {/* Header: özet + filtre + görünüm toggle tek satır */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-semibold text-lg">{t('admin.erp.isYukler.title')}</h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{summary.groups} makine</span>
          <span>·</span>
          <span>{summary.totalJobs} iş</span>
          <span>·</span>
          <span className="text-emerald-600">{summary.activeJobs} aktif</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Select value={makineId} onValueChange={setMakineId}>
            <SelectTrigger className="h-8 w-48 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hepsi">Tüm Makineler</SelectItem>
              {(makineler?.items ?? []).map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.kod} — {m.ad}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex rounded-md border">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="size-8 rounded-r-none"
              onClick={() => setViewMode('list')}
            >
              <LayoutList className="size-3.5" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="size-8 rounded-l-none"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="size-3.5" />
            </Button>
          </div>

          <Button variant="outline" size="icon" className="size-8" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={isFetching ? 'size-3.5 animate-spin' : 'size-3.5'} />
          </Button>
        </div>
      </div>

      {/* İçerik */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : localGroups.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground text-sm">
          {t('admin.erp.isYukler.notFound')}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="space-y-3">
            {localGroups.map((group) => (
              <MakineGrubuPanel
                key={group.makineId}
                group={group}
                onRemove={handleRemove}
                isBusy={updateState.isLoading || deleteState.isLoading}
                viewMode={viewMode}
              />
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
}
