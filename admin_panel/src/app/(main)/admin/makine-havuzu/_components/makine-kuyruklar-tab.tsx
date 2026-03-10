'use client';

import { Clock, Flame, GripVertical, Layers, Package, Trash2, User, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
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
  useListKuyrukAdminQuery,
  useKuyrukCikarAdminMutation,
  useKuyrukSiralaAdminMutation,
} from '@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints';
import type { KuyrukItemDto } from '@/integrations/shared/erp/makine_havuzu.types';

interface MakineKuyrukTabProps {
  t: (key: string, params?: Record<string, string>) => string;
}

function formatDk(dk: number): string {
  if (dk < 60) return `${dk} dk`;
  const saat = Math.floor(dk / 60);
  const kalan = dk % 60;
  return kalan > 0 ? `${saat}s ${kalan}dk` : `${saat}s`;
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const tarih = d.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const saat = d.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${tarih} ${saat}`;
}

function KuyrukItem({
  item,
  t,
  onCikar,
  isRemoving,
}: {
  item: KuyrukItemDto;
  t: MakineKuyrukTabProps['t'];
  onCikar: (id: string) => void;
  isRemoving: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const toplamSureDk = item.hazirlikSuresiDk + item.planlananSureDk;
  const isCalisyor = item.durum === 'calisiyor';
  const ilerleme = item.planlananMiktar > 0
    ? Math.round((item.uretilenMiktar / item.planlananMiktar) * 100)
    : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-md border px-3 py-2.5 text-xs transition-colors ${
        isCalisyor ? 'border-primary/40 bg-primary/5' : 'bg-background'
      } ${isDragging ? 'z-50' : ''}`}
    >
      {/* Row 1: Header with drag handle */}
      <div className="flex items-center gap-2 mb-1.5">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          disabled={isCalisyor}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <span className="font-mono text-muted-foreground w-5 text-center shrink-0">
          {item.sira}
        </span>
        <span className="font-mono font-semibold">{item.emirNo}</span>
        {isCalisyor && (
          <Badge variant="default" className="text-[10px] px-1.5 py-0">
            {t('kuyrukYonetimi.kuyruklar.calisiyor')}
          </Badge>
        )}
        {item.montaj && (
          <Badge variant="secondary" className="text-[10px] px-1 py-0">
            <Wrench className="size-2.5 mr-0.5" />
            {t('kuyrukYonetimi.kuyruklar.montaj')}
          </Badge>
        )}
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            disabled={isRemoving || isCalisyor}
            onClick={() => onCikar(item.id)}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>

      {/* Row 2: Product + Operation */}
      <div className="ml-11 space-y-1">
        <div className="flex items-center gap-1.5 text-foreground">
          <Package className="size-3 text-muted-foreground shrink-0" />
          <span className="font-mono text-muted-foreground">{item.urunKod}</span>
          <span className="truncate">{item.urunAd}</span>
          <span className="text-muted-foreground">—</span>
          <span className="truncate">{item.operasyonAdi}</span>
        </div>

        {/* Row 3: Quantities */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground">
          <span>
            {t('kuyrukYonetimi.kuyruklar.miktar')}:{' '}
            <span className="font-mono text-foreground">
              {item.planlananMiktar.toLocaleString('tr-TR')}
            </span>
          </span>
          {item.uretilenMiktar > 0 && (
            <span>
              {t('kuyrukYonetimi.kuyruklar.uretilen')}:{' '}
              <span className="font-mono text-foreground">
                {item.uretilenMiktar.toLocaleString('tr-TR')}
              </span>
              <span className="text-primary ml-0.5">(%{ilerleme})</span>
            </span>
          )}
          {item.fireMiktar > 0 && (
            <span className="flex items-center gap-0.5">
              <Flame className="size-3 text-destructive" />
              <span className="font-mono text-destructive">
                {item.fireMiktar.toLocaleString('tr-TR')}
              </span>
            </span>
          )}
        </div>

        {/* Row 4: Timing info */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Clock className="size-3" />
            {t('kuyrukYonetimi.kuyruklar.planlananSure')}:{' '}
            <span className="font-mono text-foreground">{formatDk(toplamSureDk)}</span>
          </span>
          {item.hazirlikSuresiDk > 0 && (
            <span>
              {t('kuyrukYonetimi.kuyruklar.hazirlikSuresi')}:{' '}
              <span className="font-mono text-foreground">{item.hazirlikSuresiDk} {t('kuyrukYonetimi.kuyruklar.dakika')}</span>
            </span>
          )}
          {item.terminTarihi && (
            <span>
              {t('kuyrukYonetimi.kuyruklar.terminTarihi')}:{' '}
              <span className="font-mono text-foreground">{formatDate(item.terminTarihi)}</span>
            </span>
          )}
        </div>

        {/* Row 5: Planned/Actual dates (when available) */}
        {(item.planlananBaslangic || item.planlananBitis || item.gercekBaslangic || item.gercekBitis) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground">
            {item.planlananBaslangic && (
              <span>
                {t('kuyrukYonetimi.kuyruklar.planlananBaslangic')}:{' '}
                <span className="font-mono text-foreground">{formatDateTime(item.planlananBaslangic)}</span>
              </span>
            )}
            {item.planlananBitis && (
              <span>
                {t('kuyrukYonetimi.kuyruklar.planlananBitis')}:{' '}
                <span className="font-mono text-foreground">{formatDateTime(item.planlananBitis)}</span>
              </span>
            )}
            {item.gercekBaslangic && (
              <span>
                {t('kuyrukYonetimi.kuyruklar.gercekBaslangic')}:{' '}
                <span className="font-mono text-foreground">{formatDateTime(item.gercekBaslangic)}</span>
              </span>
            )}
            {item.gercekBitis && (
              <span>
                {t('kuyrukYonetimi.kuyruklar.gercekBitis')}:{' '}
                <span className="font-mono text-foreground">{formatDateTime(item.gercekBitis)}</span>
              </span>
            )}
          </div>
        )}

        {/* Customer */}
        {item.musteriOzet && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <User className="size-3" />
            <span>{item.musteriOzet}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MakineKuyrukTab({ t }: MakineKuyrukTabProps) {
  const { data: kuyruklar, isLoading } = useListKuyrukAdminQuery();
  const [cikar, cikarState] = useKuyrukCikarAdminMutation();
  const [sirala] = useKuyrukSiralaAdminMutation();

  // Local state for optimistic updates per machine
  const [localKuyruklar, setLocalKuyruklar] = useState<NonNullable<typeof kuyruklar>>([]);

  // Sync backend data to local state
  useEffect(() => {
    if (kuyruklar) {
      setLocalKuyruklar(kuyruklar);
    }
  }, [kuyruklar]);

  const genelOzet = useMemo(() => {
    const makineSayisi = localKuyruklar.length;
    const toplamIs = localKuyruklar.reduce((sum, grup) => sum + grup.kuyruk.length, 0);
    const calisanIs = localKuyruklar.reduce(
      (sum, grup) => sum + grup.kuyruk.filter((item) => item.durum === 'calisiyor').length,
      0,
    );
    return { makineSayisi, toplamIs, calisanIs };
  }, [localKuyruklar]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleCikar(kuyruguId: string) {
    try {
      await cikar(kuyruguId).unwrap();
      toast.success(t('kuyrukYonetimi.kuyruklar.cikarildi'));
    } catch {
      toast.error(t('kuyrukYonetimi.kuyruklar.cikarmaHatasi'));
    }
  }

  async function handleDragEnd(event: DragEndEvent, makineId: string) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Find the group
    const grupIndex = localKuyruklar.findIndex((g) => g.makineId === makineId);
    if (grupIndex === -1) return;

    const grup = localKuyruklar[grupIndex];
    const oldIndex = grup.kuyruk.findIndex((item) => item.id === active.id);
    const newIndex = grup.kuyruk.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic update
    const newKuyruk = arrayMove(grup.kuyruk, oldIndex, newIndex);
    const newGrup = { ...grup, kuyruk: newKuyruk };
    const newGroups = [...localKuyruklar];
    newGroups[grupIndex] = newGrup;
    setLocalKuyruklar(newGroups);

    // Prepare payload with new order (1-indexed)
    const siralar = newKuyruk.map((item, idx) => ({
      kuyruguId: item.id,
      sira: idx + 1,
    }));

    try {
      await sirala({ makineId, siralar }).unwrap();
      toast.success(t('kuyrukYonetimi.kuyruklar.siralamaKaydedildi'));
    } catch {
      toast.error(t('kuyrukYonetimi.kuyruklar.siralamaHatasi'));
      // Revert on error
      if (kuyruklar) {
        setLocalKuyruklar(kuyruklar);
      }
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (!localKuyruklar || localKuyruklar.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Layers className="size-8 mb-2" />
        <p className="text-sm">{t('kuyrukYonetimi.kuyruklar.bos')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs">{t('kuyrukYonetimi.kuyruklar.ozet.makine')}</div>
            <div className="mt-1 font-semibold text-2xl tabular-nums">{genelOzet.makineSayisi}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs">{t('kuyrukYonetimi.kuyruklar.ozet.toplamIs')}</div>
            <div className="mt-1 font-semibold text-2xl tabular-nums">{genelOzet.toplamIs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs">{t('kuyrukYonetimi.kuyruklar.ozet.calisan')}</div>
            <div className="mt-1 font-semibold text-2xl tabular-nums text-emerald-600">{genelOzet.calisanIs}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {localKuyruklar.map((grup) => {
        const toplamSureDk = grup.kuyruk.reduce(
          (sum, item) => sum + item.hazirlikSuresiDk + item.planlananSureDk,
          0,
        );
        const calisanSayisi = grup.kuyruk.filter((item) => item.durum === 'calisiyor').length;
        return (
          <Card key={grup.makineId}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-start gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <span className="font-mono font-semibold">{grup.makineKod}</span>
                    <span className="font-normal text-muted-foreground">{grup.makineAd}</span>
                  </CardTitle>
                </div>
                <div className="ml-auto grid min-w-[220px] gap-2 sm:grid-cols-3">
                  <div className="rounded-md border bg-muted/20 px-3 py-2">
                    <div className="text-[11px] text-muted-foreground">{t('kuyrukYonetimi.kuyruklar.ozet.is')}</div>
                    <div className="font-semibold tabular-nums">{grup.kuyruk.length}</div>
                  </div>
                  <div className="rounded-md border bg-muted/20 px-3 py-2">
                    <div className="text-[11px] text-muted-foreground">{t('kuyrukYonetimi.kuyruklar.ozet.calisan')}</div>
                    <div className="font-semibold tabular-nums">{calisanSayisi}</div>
                  </div>
                  <div className="rounded-md border bg-muted/20 px-3 py-2">
                    <div className="text-[11px] text-muted-foreground">{t('kuyrukYonetimi.kuyruklar.ozet.toplamSure')}</div>
                    <div className="font-semibold tabular-nums">{formatDk(toplamSureDk)}</div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-3 space-y-1.5">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(event, grup.makineId)}
              >
                <SortableContext
                  items={grup.kuyruk.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {grup.kuyruk.map((item) => (
                    <KuyrukItem
                      key={item.id}
                      item={item}
                      t={t}
                      onCikar={handleCikar}
                      isRemoving={cikarState.isLoading}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        );
      })}
      </div>
    </div>
  );
}
