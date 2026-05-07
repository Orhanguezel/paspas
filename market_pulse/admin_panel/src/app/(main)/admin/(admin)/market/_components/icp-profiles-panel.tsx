'use client';

import * as React from 'react';
import { Pencil, Plus, RefreshCw, Save, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  useCreateIcpProfileMutation,
  useDeleteIcpProfileMutation,
  useListIcpProfilesQuery,
  useUpdateIcpProfileMutation,
  type IcpDefinition,
  type IcpProfile,
} from '@/integrations/hooks';
import { cn } from '@/lib/utils';

type IcpFormState = {
  name: string;
  isActive: boolean;
  definition: Required<Pick<IcpDefinition,
    'sectors' |
    'sub_sectors' |
    'firm_types' |
    'geographies' |
    'sales_types' |
    'sales_channels' |
    'exclude_countries' |
    'exclude_patterns'
  >> & {
    price_segment: string;
    min_employees: number | null;
    max_employees: number | null;
  };
};

const EMPTY_FORM: IcpFormState = {
  name: '',
  isActive: true,
  definition: {
    sectors: [],
    sub_sectors: [],
    firm_types: [],
    geographies: [],
    sales_types: [],
    sales_channels: [],
    price_segment: 'mid',
    min_employees: null,
    max_employees: null,
    exclude_countries: [],
    exclude_patterns: [],
  },
};

const FIELD_LABELS: Array<{ key: keyof IcpFormState['definition']; label: string; placeholder: string }> = [
  { key: 'sectors', label: 'Sektörler', placeholder: 'automotive accessories, car care' },
  { key: 'sub_sectors', label: 'Alt Sektörler', placeholder: 'floor mats, cargo liner' },
  { key: 'firm_types', label: 'Firma Tipleri', placeholder: 'distributor, importer, wholesaler' },
  { key: 'geographies', label: 'Ülkeler', placeholder: 'DE, AT, NL, PL' },
  { key: 'sales_types', label: 'Satış Tipleri', placeholder: 'B2B, B2C' },
  { key: 'sales_channels', label: 'Kanallar', placeholder: 'own website, amazon, ebay' },
  { key: 'exclude_countries', label: 'Hariç Ülkeler', placeholder: 'CN, US' },
  { key: 'exclude_patterns', label: 'Hariç Pattern', placeholder: 'rental, used parts' },
];

function toArrayText(value: unknown) {
  return Array.isArray(value) ? value.join(', ') : '';
}

function parseTags(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formFromProfile(profile?: IcpProfile | null): IcpFormState {
  if (!profile) return structuredClone(EMPTY_FORM);
  const definition = profile.definition ?? {};
  return {
    name: profile.name,
    isActive: profile.is_active === 1,
    definition: {
      sectors: definition.sectors ?? [],
      sub_sectors: definition.sub_sectors ?? [],
      firm_types: definition.firm_types ?? [],
      geographies: definition.geographies ?? [],
      sales_types: definition.sales_types ?? [],
      sales_channels: definition.sales_channels ?? [],
      price_segment: definition.price_segment ?? 'mid',
      min_employees: definition.min_employees ?? null,
      max_employees: definition.max_employees ?? null,
      exclude_countries: definition.exclude_countries ?? [],
      exclude_patterns: definition.exclude_patterns ?? [],
    },
  };
}

function IcpDialog({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: IcpProfile | null;
}) {
  const [form, setForm] = React.useState<IcpFormState>(() => formFromProfile(profile));
  const [createProfile, createState] = useCreateIcpProfileMutation();
  const [updateProfile, updateState] = useUpdateIcpProfileMutation();

  React.useEffect(() => {
    if (open) setForm(formFromProfile(profile));
  }, [open, profile]);

  const isBusy = createState.isLoading || updateState.isLoading;

  const setDefinition = <K extends keyof IcpFormState['definition']>(key: K, value: IcpFormState['definition'][K]) => {
    setForm((current) => ({
      ...current,
      definition: { ...current.definition, [key]: value },
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('ICP adı gerekli');
      return;
    }
    try {
      const body = {
        name: form.name.trim(),
        is_active: form.isActive,
        definition: form.definition,
      };
      if (profile) await updateProfile({ id: profile.id, body }).unwrap();
      else await createProfile(body).unwrap();
      toast.success(profile ? 'ICP güncellendi' : 'ICP oluşturuldu');
      onOpenChange(false);
    } catch {
      toast.error('ICP kaydedilemedi');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[28px] border-gm-border-soft bg-gm-bg-deep text-gm-text sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-gm-text">{profile ? 'ICP Düzenle' : 'Yeni ICP'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Profil Adı</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                placeholder="Oto Aksesuar Distribütörü - Avrupa"
                className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/30 text-gm-text"
              />
            </div>
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-gm-border-soft bg-gm-surface/20 px-4">
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))}
                className="data-[state=checked]:bg-gm-gold"
              />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Aktif</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {FIELD_LABELS.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">{field.label}</Label>
                <Input
                  value={toArrayText(form.definition[field.key])}
                  onChange={(e) => setDefinition(field.key, parseTags(e.target.value) as never)}
                  placeholder={field.placeholder}
                  className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/30 text-gm-text placeholder:text-gm-muted/70"
                />
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Fiyat Segmenti</Label>
              <Select value={form.definition.price_segment} onValueChange={(value) => setDefinition('price_segment', value)}>
                <SelectTrigger className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/30 text-gm-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-gm-border-soft bg-gm-bg-deep text-gm-text">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="mid">Mid</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Min Çalışan</Label>
              <Input
                type="number"
                min={0}
                value={form.definition.min_employees ?? ''}
                onChange={(e) => setDefinition('min_employees', e.target.value ? Number(e.target.value) : null)}
                className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/30 text-gm-text"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Max Çalışan</Label>
              <Input
                type="number"
                min={0}
                value={form.definition.max_employees ?? ''}
                onChange={(e) => setDefinition('max_employees', e.target.value ? Number(e.target.value) : null)}
                className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/30 text-gm-text"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full border-gm-border-soft bg-gm-surface/20 text-gm-text hover:bg-gm-surface">
              <X className="mr-2 size-4" />
              Vazgeç
            </Button>
            <Button onClick={handleSave} disabled={isBusy} className="rounded-full bg-gm-gold px-6 text-black hover:bg-gm-gold-light">
              <Save className="mr-2 size-4" />
              Kaydet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function IcpProfilesPanel() {
  const { data, isLoading, isFetching, refetch } = useListIcpProfilesQuery();
  const [deleteProfile, deleteState] = useDeleteIcpProfileMutation();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editProfile, setEditProfile] = React.useState<IcpProfile | null>(null);

  const handleDelete = async (profile: IcpProfile) => {
    if (!confirm(`"${profile.name}" silinsin mi?`)) return;
    try {
      await deleteProfile(profile.id).unwrap();
      toast.success('ICP silindi');
    } catch {
      toast.error('ICP silinemedi; aktif job bağlantısı olabilir');
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">Lead Machine</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">ICP Profilleri</h1>
          <p className="max-w-xl font-serif text-sm italic text-gm-muted">
            B2B aramalarında kullanılacak ideal müşteri profillerini yönetin.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-12 rounded-full border-gm-border-soft bg-gm-surface/20 px-6 text-[10px] font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface"
          >
            <RefreshCw className={cn('mr-2 size-4', isFetching && 'animate-spin')} />
            Yenile
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditProfile(null);
              setDialogOpen(true);
            }}
            className="h-12 rounded-full bg-gm-gold px-6 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-gm-gold-light"
          >
            <Plus className="mr-2 size-4" />
            Yeni ICP
          </Button>
        </div>
      </div>

      <div className="grid gap-5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/60">
              <CardContent className="p-6">
                <Skeleton className="mb-4 h-8 w-80 bg-gm-surface/30" />
                <Skeleton className="h-20 w-full bg-gm-surface/20" />
              </CardContent>
            </Card>
          ))
        ) : data?.length ? (
          data.map((profile) => {
            const definition = profile.definition ?? {};
            return (
              <Card key={profile.id} className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/60 shadow-xl">
                <CardContent className="space-y-5 p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cn(
                          'rounded-full text-[9px] font-bold uppercase tracking-widest',
                          profile.is_active === 1
                            ? 'border-gm-success/30 bg-gm-success/10 text-gm-success'
                            : 'border-gm-muted/30 bg-gm-surface/20 text-gm-muted',
                        )}>
                          {profile.is_active === 1 ? 'Aktif' : 'Pasif'}
                        </Badge>
                        {profile.name.includes('Paspas') && (
                          <Badge variant="outline" className="rounded-full border-gm-gold/30 bg-gm-gold/10 text-[9px] font-bold uppercase tracking-widest text-gm-gold">
                            Varsayılan Paspas ICP
                          </Badge>
                        )}
                      </div>
                      <h2 className="font-serif text-2xl text-gm-text">{profile.name}</h2>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditProfile(profile);
                          setDialogOpen(true);
                        }}
                        className="rounded-full border-gm-border-soft bg-gm-surface/20 text-gm-text hover:bg-gm-surface"
                      >
                        <Pencil className="mr-2 size-4" />
                        Düzenle
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deleteState.isLoading}
                        onClick={() => handleDelete(profile)}
                        className="rounded-full border-gm-error/30 bg-gm-error/10 text-gm-error hover:bg-gm-error hover:text-black"
                      >
                        <Trash2 className="mr-2 size-4" />
                        Sil
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {[
                      ['Sektör', definition.sectors],
                      ['Firma Tipi', definition.firm_types],
                      ['Ülke', definition.geographies],
                      ['Kanal', definition.sales_channels],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-4">
                        <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-gm-muted">{String(label)}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {(Array.isArray(value) ? value : []).slice(0, 5).map((item) => (
                            <span key={item} className="rounded-full bg-gm-bg-deep/70 px-2 py-1 text-[10px] text-gm-muted">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <SlidersHorizontal className="size-12 text-gm-gold/40" />
              <div className="font-serif text-xl italic text-gm-muted">Henüz ICP profili yok.</div>
            </CardContent>
          </Card>
        )}
      </div>

      <IcpDialog open={dialogOpen} onOpenChange={setDialogOpen} profile={editProfile} />
    </div>
  );
}
