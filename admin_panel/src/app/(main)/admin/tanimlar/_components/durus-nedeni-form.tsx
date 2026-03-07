'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  useCreateDurusNedeniAdminMutation,
  useUpdateDurusNedeniAdminMutation,
} from '@/integrations/endpoints/admin/erp/tanimlar_admin.endpoints';
import {
  DURUS_KATEGORILER,
  DURUS_KATEGORI_LABELS,
} from '@/integrations/shared/erp/tanimlar.types';
import type { DurusNedeniDto, DurusKategori } from '@/integrations/shared/erp/tanimlar.types';

const schema = z.object({
  kod:      z.string().trim().min(1, 'Zorunlu').max(20),
  ad:       z.string().trim().min(1, 'Zorunlu').max(100),
  kategori: z.enum(['makine', 'malzeme', 'personel', 'planlama', 'diger']),
  aciklama: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

interface Props { open: boolean; onClose: () => void; durusNedeni: DurusNedeniDto | null; }

export default function DurusNedeniForm({ open, onClose, durusNedeni }: Props) {
  const isEdit = !!durusNedeni;
  const [create, createState] = useCreateDurusNedeniAdminMutation();
  const [update, updateState] = useUpdateDurusNedeniAdminMutation();
  const loading = createState.isLoading || updateState.isLoading;

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { kategori: 'diger', isActive: true },
  });

  const isActive  = watch('isActive');
  const kategori  = watch('kategori');

  useEffect(() => {
    if (open) {
      reset(durusNedeni
        ? {
            kod:      durusNedeni.kod,
            ad:       durusNedeni.ad,
            kategori: durusNedeni.kategori,
            aciklama: durusNedeni.aciklama ?? '',
            isActive: durusNedeni.isActive,
          }
        : {
            kod:      '',
            ad:       '',
            kategori: 'diger',
            aciklama: '',
            isActive: true,
          });
    }
  }, [open, durusNedeni, reset]);

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      kod:      values.kod.toUpperCase(),
      aciklama: values.aciklama || undefined,
    };
    try {
      if (isEdit) {
        await update({ id: durusNedeni.id, body: payload }).unwrap();
        toast.success('Duruş nedeni güncellendi');
      } else {
        await create(payload).unwrap();
        toast.success('Duruş nedeni eklendi');
      }
      onClose();
    } catch (err: any) {
      const status = (err as any)?.status;
      if (status === 409) {
        toast.error('Bu kod zaten kullanımda');
      } else {
        toast.error(err?.data?.error?.message ?? 'İşlem başarısız');
      }
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-4 py-4 sm:px-6">
          <SheetTitle>{isEdit ? 'Duruş Nedenini Düzenle' : 'Yeni Duruş Nedeni'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Kod *</Label>
                <Input
                  {...register('kod')}
                  placeholder="örn. ARIZ"
                  className="uppercase"
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                    register('kod').onChange(e);
                  }}
                />
                {errors.kod && <p className="text-xs text-destructive">{errors.kod.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Kategori *</Label>
                <Select
                  value={kategori}
                  onValueChange={(v) => setValue('kategori', v as DurusKategori, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURUS_KATEGORILER.map((k) => (
                      <SelectItem key={k} value={k}>
                        {DURUS_KATEGORI_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.kategori && <p className="text-xs text-destructive">{errors.kategori.message}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Ad *</Label>
              <Input {...register('ad')} placeholder="örn. Makine Arızası" />
              {errors.ad && <p className="text-xs text-destructive">{errors.ad.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Açıklama</Label>
              <Textarea {...register('aciklama')} rows={2} placeholder="İsteğe bağlı açıklama" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={isActive}
                onCheckedChange={(v) => setValue('isActive', v === true)}
              />
              <span className="text-sm">Aktif</span>
            </label>
          </div>
          <SheetFooter className="border-t px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor…' : 'Kaydet'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
