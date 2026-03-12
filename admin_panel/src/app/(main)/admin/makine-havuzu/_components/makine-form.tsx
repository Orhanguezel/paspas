'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AlertTriangle, Calendar, Clock, Factory, Settings, TrendingUp } from 'lucide-react';
import { useLocaleContext } from '@/i18n/LocaleProvider';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import {
  useCreateMakineAdminMutation,
  useGetMakineCapacityAdminQuery,
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

function KapasiteTab({ makine, calisir24Saat }: { makine: MakineDto | null; calisir24Saat: boolean }) {
  const { data: capacityData, isLoading, refetch } = useGetMakineCapacityAdminQuery(
    { id: makine?.id ?? '', params: { days: 30 } },
    { skip: !makine?.id }
  );

  // Dinamik hesaplamalar
  const stats = useMemo(() => {
    if (!capacityData) return null;

    const totalDays = capacityData.gunler.length;
    const workingDays = capacityData.gunler.filter((g) => g.calisiyor);
    const holidays = capacityData.gunler.filter((g) => g.tatilMi);
    const weekendNonWorking = capacityData.gunler.filter((g) => g.haftaSonuMu && !g.calisiyor);
    const weekendWorking = capacityData.gunler.filter((g) => g.haftaSonuMu && g.calisiyor);

    // Randıman hesabı
    const potentialWorkDays = totalDays - holidays.length;
    const dailyHours = capacityData.gunlukCalismaSaati;
    const maxPossibleHours = potentialWorkDays * (calisir24Saat ? 24 : 8);
    const actualHours = capacityData.toplamCalismaSaati;
    const durusHours = capacityData.toplamDurusSaati;
    const netHours = capacityData.netCalismaSaati;

    // Net verimlilik (duruşlar düşüldükten sonra)
    const hourlyEfficiency = maxPossibleHours > 0 ? (netHours / maxPossibleHours) * 100 : 0;

    return {
      totalDays,
      workingDays: workingDays.length,
      holidays: holidays.length,
      weekendNonWorking: weekendNonWorking.length,
      weekendWorking: weekendWorking.length,
      hourlyEfficiency: Math.round(hourlyEfficiency),
      totalHours: actualHours,
      durusHours,
      netHours,
      dailyHours,
      potentialHours: maxPossibleHours,
    };
  }, [capacityData, calisir24Saat]);

  if (!makine) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="mb-3 size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Kapasite bilgisi görmek için önce makineyi kaydedin
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!capacityData || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="mb-3 size-10 text-destructive" />
        <p className="text-sm text-muted-foreground">Kapasite verisi yüklenemedi</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
          Yeniden Dene
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Özet Kartları */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="size-4 text-primary" />
              Çalışma Randımanı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{stats.hourlyEfficiency}%</span>
                <span className="text-xs text-muted-foreground">verimlilik</span>
              </div>
              <Progress value={stats.hourlyEfficiency} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {stats.netHours} saat net / {stats.potentialHours} saat potansiyel
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="size-4 text-primary" />
              Günlük Çalışma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{stats.dailyHours}</span>
                <span className="text-xs text-muted-foreground">saat/gün</span>
              </div>
              <Badge variant={calisir24Saat ? 'default' : 'secondary'}>
                {calisir24Saat ? '24 Saat Çalışma' : 'Normal Mesai (8 saat)'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 30 Günlük Özet */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calendar className="size-4 text-primary" />
            30 Günlük Dönem Özeti
          </CardTitle>
          <CardDescription className="text-xs">
            {capacityData.baslangicTarihi} — {capacityData.bitisTarihi}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Toplam Gün</p>
              <p className="text-lg font-semibold">{stats.totalDays}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Çalışma Günü</p>
              <p className="text-lg font-semibold text-green-600">{stats.workingDays}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Tatil Günü</p>
              <p className="text-lg font-semibold text-red-600">{stats.holidays}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">H.Sonu (Çalışılmayan)</p>
              <p className="text-lg font-semibold text-orange-600">{stats.weekendNonWorking}</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">Toplam Çalışma Saati</p>
              <p className="mt-1 text-xl font-bold text-primary">{stats.totalHours}</p>
            </div>
            <div className="rounded-lg bg-orange-100 dark:bg-orange-950/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">Duruş Saati</p>
              <p className="mt-1 text-xl font-bold text-orange-600">{stats.durusHours}</p>
            </div>
            <div className="rounded-lg bg-green-100 dark:bg-green-950/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">Net Çalışma Saati</p>
              <p className="mt-1 text-xl font-bold text-green-600">{stats.netHours}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">H.Sonu Çalışma</p>
              <p className="mt-1 text-xl font-bold">{stats.weekendWorking} gün</p>
            </div>
          </div>

          {capacityData.saatlikKapasite ? (
            <div className="mt-3 rounded-lg bg-primary/10 p-3 text-center">
              <p className="text-xs text-muted-foreground">Tahmini Net Üretim</p>
              <p className="mt-1 text-xl font-bold text-primary">
                {(stats.netHours * capacityData.saatlikKapasite).toLocaleString('tr-TR')} adet
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Günlük Detay Tablosu */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Günlük Detay</CardTitle>
          <CardDescription className="text-xs">
            Her günün çalışma durumu (tatil ve hafta sonu planlarına göre)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Tarih</TableHead>
                  <TableHead className="text-xs">Gün</TableHead>
                  <TableHead className="text-xs text-center">Durum</TableHead>
                  <TableHead className="text-xs text-right">Çalışma</TableHead>
                  <TableHead className="text-xs text-right">Duruş</TableHead>
                  <TableHead className="text-xs text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {capacityData.gunler.map((gun) => {
                  const net = gun.calisiyor ? Math.max(0, capacityData.gunlukCalismaSaati - gun.durusSaati) : 0;
                  return (
                    <TableRow key={gun.tarih} className={gun.calisiyor ? '' : 'bg-muted/30'}>
                      <TableCell className="text-xs font-mono">{gun.tarih}</TableCell>
                      <TableCell className="text-xs">{gun.gunAdi}</TableCell>
                      <TableCell className="text-center">
                        {gun.tatilMi ? (
                          <Badge variant="destructive" className="text-xs">Tatil</Badge>
                        ) : gun.haftaSonuMu && !gun.calisiyor ? (
                          <Badge variant="secondary" className="text-xs">Hafta Sonu</Badge>
                        ) : gun.haftaSonuMu && gun.calisiyor ? (
                          <Badge variant="default" className="text-xs">H.Sonu Çalışma</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Çalışma Günü</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {gun.calisiyor ? `${capacityData.gunlukCalismaSaati}s` : '—'}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {gun.durusSaati > 0 ? <span className="text-orange-600">{gun.durusSaati}s</span> : '—'}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {gun.calisiyor ? <span className="text-green-600">{net}s</span> : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        * Kapasite hesaplaması tatil tanımları, hafta sonu planları ve operatör duruş kayıtlarına göre dinamik olarak yapılır
      </p>
    </div>
  );
}

export default function MakineForm({ open, onClose, makine }: Props) {
  const { t } = useLocaleContext();
  const isEdit = !!makine;
  const [activeTab, setActiveTab] = useState('genel');
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
      setActiveTab('genel');
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
      <SheetContent side="right" className="w-full p-0 sm:max-w-2xl">
        <SheetHeader className="border-b px-4 py-4 sm:px-6">
          <SheetTitle>{isEdit ? t('admin.erp.makineHavuzu.editItem') : t('admin.erp.makineHavuzu.newItem')}</SheetTitle>
        </SheetHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
          <div className="border-b px-4 sm:px-6">
            <TabsList className="h-10 w-full justify-start gap-4 bg-transparent p-0">
              <TabsTrigger value="genel" className="data-[state=active]:border-primary data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-0 pb-3 pt-2">
                <Settings className="mr-1.5 size-4" />
                Genel Bilgiler
              </TabsTrigger>
              <TabsTrigger value="kapasite" className="data-[state=active]:border-primary data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-0 pb-3 pt-2">
                <TrendingUp className="mr-1.5 size-4" />
                Kapasite
              </TabsTrigger>
            </TabsList>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <TabsContent value="genel" className="m-0 flex-1 overflow-y-auto">
              <div className="space-y-4 px-4 py-4 sm:px-6">
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
                  <div className="space-y-2 max-h-48 overflow-y-auto">
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
            </TabsContent>

            <TabsContent value="kapasite" className="m-0 flex-1 overflow-y-auto">
              <div className="px-4 py-4 sm:px-6">
                <KapasiteTab makine={makine} calisir24Saat={calisir24Saat} />
              </div>
            </TabsContent>

            <SheetFooter className="border-t px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
              <Button type="button" variant="outline" onClick={onClose}>{t('admin.common.cancel')}</Button>
              <Button type="submit" disabled={loading}>
                {loading ? t('admin.erp.common.saving') : t('admin.common.save')}
              </Button>
            </SheetFooter>
          </form>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
