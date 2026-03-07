'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useLocaleContext } from '@/i18n/LocaleProvider';

import {
  Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import {
  useCreateMakineAdminMutation,
  useUpdateMakineAdminMutation,
} from '@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints';
import { useListKaliplarAdminQuery } from '@/integrations/endpoints/admin/erp/tanimlar_admin.endpoints';
import type { MakineDto } from '@/integrations/shared/erp/makine_havuzu.types';

const schema = z.object({
  kod:             z.string().min(1, 'Zorunlu'),
  ad:              z.string().min(1, 'Zorunlu'),
  tonaj:           z.coerce.number().positive().optional().or(z.literal('')),
  saatlikKapasite: z.coerce.number().positive().optional().or(z.literal('')),
  calisir24Saat:   z.boolean().default(false),
  kalipIds:        z.array(z.string()).default([]),
  durum:           z.enum(['aktif', 'pasif', 'bakimda']).default('aktif'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  makine: MakineDto | null;
}

export default function MakineForm({ open, onClose, makine }: Props) {
  const { t } = useLocaleContext();
  const isEdit = !!makine;
  const { data: kalipData } = useListKaliplarAdminQuery({});
  const kaliplar = kalipData?.items ?? [];
  const [create, createState] = useCreateMakineAdminMutation();
  const [update, updateState] = useUpdateMakineAdminMutation();
  const loading = createState.isLoading || updateState.isLoading;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { durum: 'aktif', calisir24Saat: false, kalipIds: [] },
  });

  useEffect(() => {
    if (open) {
      if (makine) {
        reset({
          kod:             makine.kod,
          ad:              makine.ad,
          tonaj:           makine.tonaj ?? '',
          saatlikKapasite: makine.saatlikKapasite ?? '',
          calisir24Saat:   makine.calisir24Saat,
          kalipIds:        makine.kalipIds,
          durum:           makine.durum,
        });
      } else {
        reset({ durum: 'aktif', calisir24Saat: false, kalipIds: [] });
      }
    }
  }, [open, makine, reset]);

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      tonaj:           values.tonaj !== '' ? Number(values.tonaj) : undefined,
      saatlikKapasite: values.saatlikKapasite !== '' ? Number(values.saatlikKapasite) : undefined,
    };
    try {
      if (isEdit) {
        await update({ id: makine.id, body: payload }).unwrap();
        toast.success(t('admin.erp.common.updated', { item: t('admin.erp.makineHavuzu.singular') }));
      } else {
        await create(payload as any).unwrap();
        toast.success(t('admin.erp.common.created', { item: t('admin.erp.makineHavuzu.singular') }));
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.error?.message ?? t('admin.erp.common.operationFailed2'));
    }
  }

  const durumVal = watch('durum');
  const calisir24Saat = watch('calisir24Saat');
  const kalipIds = watch('kalipIds');

  function toggleKalip(kalipId: string, checked: boolean) {
    const next = checked
      ? [...kalipIds, kalipId]
      : kalipIds.filter((id) => id !== kalipId);
    setValue('kalipIds', next, { shouldDirty: true });
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-4 py-4 sm:px-6">
          <SheetTitle>{isEdit ? t('admin.erp.makineHavuzu.editItem') : t('admin.erp.makineHavuzu.newItem')}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('admin.erp.makineHavuzu.form.kod')} *</Label>
              <Input {...register('kod')} placeholder={t('admin.erp.makineHavuzu.form.kodPlaceholder')} />
              {errors.kod && <p className="text-xs text-destructive">{errors.kod.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>{t('admin.erp.makineHavuzu.form.durum')}</Label>
              <Select value={durumVal} onValueChange={(v) => setValue('durum', v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['aktif', 'pasif', 'bakimda'] as const).map((d) => (
                    <SelectItem key={d} value={d}>{t(`admin.erp.makineHavuzu.statuses.${d}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>{t('admin.erp.makineHavuzu.form.ad')} *</Label>
            <Input {...register('ad')} placeholder={t('admin.erp.makineHavuzu.form.adPlaceholder')} />
            {errors.ad && <p className="text-xs text-destructive">{errors.ad.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('admin.erp.makineHavuzu.form.tonaj')}</Label>
              <Input type="number" step="0.01" {...register('tonaj')} />
            </div>
            <div className="space-y-1">
              <Label>{t('admin.erp.makineHavuzu.form.saatlikKapasite')}</Label>
              <Input type="number" step="0.01" {...register('saatlikKapasite')} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border px-3 py-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">{t('admin.erp.makineHavuzu.form.calisir24Saat')}</p>
              <p className="text-xs text-muted-foreground">{t('admin.erp.makineHavuzu.form.calisir24SaatHelp')}</p>
            </div>
            <Switch checked={calisir24Saat} onCheckedChange={(v) => setValue('calisir24Saat', v, { shouldDirty: true })} />
          </div>
          <div className="space-y-2 rounded-md border px-3 py-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">{t('admin.erp.makineHavuzu.form.uyumluKaliplar')}</p>
              <p className="text-xs text-muted-foreground">{t('admin.erp.makineHavuzu.form.uyumluKaliplarHelp')}</p>
            </div>
            <div className="space-y-2">
              {kaliplar.map((kalip) => (
                <label key={kalip.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={kalipIds.includes(kalip.id)}
                    onCheckedChange={(checked) => toggleKalip(kalip.id, checked === true)}
                  />
                  <span>{kalip.kod} - {kalip.ad}</span>
                </label>
              ))}
              {!kaliplar.length && (
                <p className="text-xs text-muted-foreground">{t('admin.erp.makineHavuzu.form.kalipYok')}</p>
              )}
            </div>
          </div>
          </div>
          <SheetFooter className="border-t px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button type="button" variant="outline" onClick={onClose}>{t('admin.common.cancel')}</Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('admin.erp.common.saving') : isEdit ? t('admin.common.save') : t('admin.common.save')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
