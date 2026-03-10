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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import {
  useCreateHaftaSonuPlanAdminMutation,
  useUpdateHaftaSonuPlanAdminMutation,
} from '@/integrations/endpoints/admin/erp/tanimlar_admin.endpoints';
import { useListMakinelerAdminQuery } from '@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints';
import type { HaftaSonuPlanDto } from '@/integrations/shared/erp/tanimlar.types';

// Haftanın pazartesi gününü hesapla
function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

// Bir tarihin pazartesi olup olmadığını kontrol et
function isMonday(dateStr: string): boolean {
  const d = new Date(dateStr);
  return d.getDay() === 1;
}

const schema = z.object({
  haftaBaslangic: z.string().min(1, 'Zorunlu').refine(isMonday, 'Pazartesi günü seçiniz'),
  makineId: z.string().nullable(),
  cumartesiCalisir: z.boolean(),
  pazarCalisir: z.boolean(),
  aciklama: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  plan: HaftaSonuPlanDto | null;
}

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return getMonday(new Date());
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
      haftaBaslangic: getMonday(new Date()),
      makineId: null,
      cumartesiCalisir: false,
      pazarCalisir: false,
      aciklama: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        plan
          ? {
              haftaBaslangic: toDateInputValue(plan.haftaBaslangic),
              makineId: plan.makineId,
              cumartesiCalisir: plan.cumartesiCalisir,
              pazarCalisir: plan.pazarCalisir,
              aciklama: plan.aciklama ?? '',
            }
          : {
              haftaBaslangic: getMonday(new Date()),
              makineId: null,
              cumartesiCalisir: false,
              pazarCalisir: false,
              aciklama: '',
            }
      );
    }
  }, [open, plan, reset]);

  async function onSubmit(values: FormValues) {
    const payload = {
      haftaBaslangic: values.haftaBaslangic,
      makineId: values.makineId || null,
      cumartesiCalisir: values.cumartesiCalisir,
      pazarCalisir: values.pazarCalisir,
      aciklama: values.aciklama || null,
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
            {/* Hafta Başlangıç (Pazartesi) */}
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
              <Label>{t('admin.erp.tanimlar.haftaSonuPlanlari.form.makine')}</Label>
              <Controller
                name="makineId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? '__all__'}
                    onValueChange={(v) => field.onChange(v === '__all__' ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin.erp.tanimlar.haftaSonuPlanlari.form.makineAll')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">
                        {t('admin.erp.tanimlar.haftaSonuPlanlari.form.makineAll')}
                      </SelectItem>
                      {makineler.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.kod} — {m.ad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">
                {t('admin.erp.tanimlar.haftaSonuPlanlari.form.makineHelp')}
              </p>
            </div>

            {/* Cumartesi Çalışır */}
            <div className="flex items-center space-x-2">
              <Controller
                name="cumartesiCalisir"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="cumartesiCalisir"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="cumartesiCalisir" className="cursor-pointer">
                {t('admin.erp.tanimlar.haftaSonuPlanlari.form.cumartesiCalisir')}
              </Label>
            </div>

            {/* Pazar Çalışır */}
            <div className="flex items-center space-x-2">
              <Controller
                name="pazarCalisir"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="pazarCalisir"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="pazarCalisir" className="cursor-pointer">
                {t('admin.erp.tanimlar.haftaSonuPlanlari.form.pazarCalisir')}
              </Label>
            </div>

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
