'use client';

// =============================================================
// FILE: src/app/(main)/admin/tanimlar/_components/hafta-sonu-plan-form.tsx
// Paspas ERP — Hafta Sonu Çalışma Planı formu
// =============================================================

import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useLocaleContext } from '@/i18n/LocaleProvider';

import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

import {
  useCreateHaftaSonuPlanAdminMutation,
  useUpdateHaftaSonuPlanAdminMutation,
} from '@/integrations/endpoints/admin/erp/tanimlar_admin.endpoints';
import { useListMakinelerAdminQuery } from '@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints';
import type { HaftaSonuPlanDto } from '@/integrations/shared/erp/tanimlar.types';

function toDateOnly(date: Date): string {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayOfMonth}`;
}

function getNextWeekendDate(day: 0 | 6): string {
  const base = new Date();
  base.setHours(12, 0, 0, 0);
  const current = base.getDay();
  let diff = day - current;
  if (diff < 0) diff += 7;
  base.setDate(base.getDate() + diff);
  return toDateOnly(base);
}

function isWeekend(dateStr: string): boolean {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return false;
  const weekDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekDay === 0 || weekDay === 6;
}

const schema = z.object({
  haftaBaslangic: z.string().min(1, 'Zorunlu').refine(isWeekend, 'Cumartesi veya Pazar günü seçiniz'),
  makineIds: z.array(z.string()).min(1, 'En az bir makine seçiniz'),
  aciklama: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  plan: HaftaSonuPlanDto | null;
}

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return getNextWeekendDate(6);
  return String(value).slice(0, 10);
}

export default function HaftaSonuPlanForm({ open, onClose, plan }: Props) {
  const { t } = useLocaleContext();
  const isEdit = !!plan;
  const [create, createState] = useCreateHaftaSonuPlanAdminMutation();
  const [update, updateState] = useUpdateHaftaSonuPlanAdminMutation();
  const loading = createState.isLoading || updateState.isLoading;

  const { data: makineData } = useListMakinelerAdminQuery({});
  const makineler = useMemo(
    () => (makineData?.items ?? []).filter((m) => m.isActive),
    [makineData?.items]
  );

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      haftaBaslangic: getNextWeekendDate(6),
      makineIds: [],
      aciklama: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        plan
          ? {
              haftaBaslangic: toDateInputValue(plan.haftaBaslangic),
              makineIds: plan.makineIds,
              aciklama: plan.aciklama ?? '',
            }
          : {
              haftaBaslangic: getNextWeekendDate(6),
              makineIds: [],
              aciklama: '',
            }
      );
    }
  }, [open, plan, reset]);

  async function onSubmit(values: FormValues) {
    const payload = {
      haftaBaslangic: values.haftaBaslangic,
      makineIds: values.makineIds,
      aciklama: values.aciklama || undefined,
    };

    try {
      if (isEdit) {
        await update({ id: plan.id, body: payload }).unwrap();
        toast.success(t('admin.erp.common.updated', { item: t('admin.erp.tanimlar.haftaSonuPlanlari.singular') }));
      } else {
        await create(payload).unwrap();
        toast.success(t('admin.erp.common.created', { item: t('admin.erp.tanimlar.haftaSonuPlanlari.singular') }));
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.error?.message ?? t('admin.erp.common.operationFailed2'));
    }
  }

  const selectedMakineIds = watch('makineIds');

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-4 py-4 sm:px-6">
          <SheetTitle>
            {isEdit
              ? t('admin.erp.tanimlar.haftaSonuPlanlari.editItem')
              : t('admin.erp.tanimlar.haftaSonuPlanlari.newItem')}
          </SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
            {/* Hafta Sonu Tarihi */}
            <div className="space-y-1">
              <Label>{t('admin.erp.tanimlar.haftaSonuPlanlari.form.haftaBaslangic')} *</Label>
              <input
                type="date"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                {...register('haftaBaslangic')}
              />
              {errors.haftaBaslangic && (
                <p className="text-xs text-destructive">{errors.haftaBaslangic.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {t('admin.erp.tanimlar.haftaSonuPlanlari.form.haftaBaslangicHelp')}
              </p>
            </div>

            {/* Makine Seçimi */}
            <div className="space-y-1">
              <Label>{t('admin.erp.tanimlar.haftaSonuPlanlari.form.makineler')} *</Label>
              <Controller
                name="makineIds"
                control={control}
                render={({ field }) => (
                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
                    {makineler.map((m) => {
                      const checked = field.value.includes(m.id);
                      return (
                        <label key={m.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(nextChecked) => {
                              if (nextChecked) {
                                field.onChange([...field.value, m.id]);
                                return;
                              }
                              field.onChange(field.value.filter((value) => value !== m.id));
                            }}
                          />
                          <span>{m.kod} — {m.ad}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              />
              {errors.makineIds && (
                <p className="text-xs text-destructive">{errors.makineIds.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {t('admin.erp.tanimlar.haftaSonuPlanlari.form.makinelerHelp')}
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              {selectedMakineIds.length} {t('admin.erp.tanimlar.haftaSonuPlanlari.form.seciliMakine')}
            </p>

            {/* Açıklama */}
            <div className="space-y-1">
              <Label>{t('admin.erp.tanimlar.haftaSonuPlanlari.form.aciklama')}</Label>
              <Textarea {...register('aciklama')} rows={2} />
            </div>
          </div>
          <SheetFooter className="border-t px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('admin.common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('admin.erp.common.saving') : t('admin.common.save')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
