'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Factory } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useListMakinelerAdminQuery } from '@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints';
import { useGetVardiyaAnaliziAdminQuery, type UretimKaydiOzet } from '@/integrations/endpoints/admin/erp/vardiya_analizi_admin.endpoints';
import VardiyaAnaliziClient from '../../vardiya-analizi/_components/vardiya-analizi-client';

type Period = '3' | '7';
type Shift = 'gunduz' | 'gece';
type Selection = { day: string; shift?: Shift; machineId?: string };

const SHIFTS: Array<{ key: Shift; label: string }> = [{ key: 'gunduz', label: 'Gündüz' }, { key: 'gece', label: 'Gece' }];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dayLabel(day: string) {
  return new Date(`${day}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', weekday: 'short' });
}

function recordDay(record: UretimKaydiOzet) {
  const source = record.vardiyaBaslangic ?? record.baslangic;
  return new Date(source).toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });
}

function statusStyle(status: string) {
  if (status === 'Bitti') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'Sürüyor') return 'border-blue-200 bg-blue-50 text-blue-800';
  if (status === 'Başlamadı') return 'border-slate-200 bg-slate-50 text-slate-700';
  if (status === 'Kayıt girilmedi') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-slate-200 bg-white text-slate-500';
}

export default function UretimOzetiClient({ initialTab }: { initialTab: 'uretim' | 'vardiya' }) {
  const [tab, setTab] = useState(initialTab);
  const [period, setPeriod] = useState<Period>('7');
  const [selection, setSelection] = useState<Selection | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem('uretim-ozeti-period');
    if (saved === '3' || saved === '7') setPeriod(saved);
  }, []);

  const days = useMemo(() => {
    const end = new Date();
    return Array.from({ length: Number(period) }, (_, index) => {
      const value = new Date(end);
      value.setDate(end.getDate() - (Number(period) - 1 - index));
      return dateKey(value);
    });
  }, [period]);

  const { data, isLoading } = useGetVardiyaAnaliziAdminQuery({ baslangicTarih: days[0], bitisTarih: days.at(-1) });
  const { data: machineData } = useListMakinelerAdminQuery({});
  const machines = (machineData?.items ?? []).filter((machine) => machine.isYuklerindeGoster);

  const recordsFor = (day: string, shift?: Shift, machineId?: string) => (data?.uretimKayitlari ?? []).filter((record) =>
    recordDay(record) === day && (!shift || record.vardiyaTipi === shift) && (!machineId || record.makineId === machineId));

  const shiftExists = (day: string, shift: Shift) => data?.vardiyaTakvimi?.find((item) => item.gun === day)?.vardiyaTipleri.includes(shift) ?? false;
  const cellStatus = (day: string, shift: Shift, machineId: string, records: UretimKaydiOzet[]) => {
    if (!shiftExists(day, shift)) return 'Vardiya yok';
    const real = data?.vardiyalar.find((item) => item.makineId === machineId && item.vardiyaTipi === shift && new Date(item.baslangic).toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' }) === day);
    if (real?.aktif) return 'Sürüyor';
    if (records.length || real) return 'Bitti';
    return day < dateKey(new Date()) ? 'Kayıt girilmedi' : 'Başlamadı';
  };

  const selectedRecords = selection ? recordsFor(selection.day, selection.shift, selection.machineId) : [];
  const selectedTitle = selection
    ? `${selection.machineId ? machines.find((m) => m.id === selection.machineId)?.ad : 'Tüm makineler'} · ${new Date(`${selection.day}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} · ${selection.shift ? SHIFTS.find((s) => s.key === selection.shift)?.label : 'Tüm vardiyalar'}`
    : 'Detay görmek için bir hücreye, gün veya vardiya başlığına dokunun';

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Üretim Özeti</h1><p className="text-sm text-muted-foreground">Gerçekleşen üretimi vardiya ve makine bazında okuyun.</p></div>
      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
        <TabsList><TabsTrigger value="uretim">Gerçekleşen Üretim</TabsTrigger><TabsTrigger value="vardiya">Vardiya Analizi</TabsTrigger></TabsList>
        <TabsContent value="uretim" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(['3', '7'] as const).map((value) => <Button key={value} size="sm" variant={period === value ? 'default' : 'outline'} onClick={() => { setPeriod(value); window.localStorage.setItem('uretim-ozeti-period', value); }}>{value === '3' ? 'Son 3 gün' : 'Son 7 gün'}</Button>)}
            <span className="ml-auto text-sm text-muted-foreground">{dayLabel(days[0])} – {dayLabel(days.at(-1)!)}</span>
          </div>
          <Card className="overflow-hidden"><CardContent className="p-0"><div className="overflow-x-auto">
            <table className="min-w-[980px] w-full border-collapse text-sm">
              <thead><tr><th rowSpan={2} className="sticky left-0 z-20 min-w-48 border bg-background p-3 text-left">Makine</th>{days.map((day) => <th key={day} colSpan={2} className="border p-0"><button className="w-full p-2 hover:bg-muted" onClick={() => setSelection({ day })}>{dayLabel(day)}</button></th>)}</tr>
              <tr>{days.flatMap((day) => SHIFTS.map((shift) => <th key={`${day}-${shift.key}`} className="border p-0"><button className="w-full p-2 text-xs hover:bg-muted" onClick={() => setSelection({ day, shift: shift.key })}>{shift.label}</button></th>))}</tr></thead>
              <tbody>{machines.map((machine) => <tr key={machine.id}><th className="sticky left-0 z-10 border bg-background p-3 text-left font-medium">{machine.ad}<span className="block text-xs font-normal text-muted-foreground">{machine.kod}</span></th>
                {days.flatMap((day) => SHIFTS.map((shift) => { const records = recordsFor(day, shift.key, machine.id); const status = cellStatus(day, shift.key, machine.id, records); const totals = new Map<string, number>(); records.forEach((record) => totals.set(record.urunBirim, (totals.get(record.urunBirim) ?? 0) + record.netMiktar)); const products = new Set(records.map((record) => `${record.urunKod}-${record.urunAd}`)).size; return <td key={`${day}-${shift.key}`} className="border p-1 align-top"><button className={`min-h-24 w-full rounded-md border p-2 text-left transition hover:ring-2 hover:ring-primary/30 ${statusStyle(status)}`} onClick={() => setSelection({ day, shift: shift.key, machineId: machine.id })}>{totals.size ? [...totals].map(([unit, total]) => <span key={unit} className="block text-lg font-semibold tabular-nums">{total.toLocaleString('tr-TR')} {unit}</span>) : <span className="block text-lg">—</span>}<span className="mt-1 block text-xs">{products ? `${products} ürün · ` : ''}{status}</span></button></td>; }))}
              </tr>)}</tbody>
            </table>
          </div>{isLoading && <p className="p-4 text-sm text-muted-foreground">Üretim kayıtları yükleniyor…</p>}</CardContent></Card>

          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="size-4" />{selectedTitle}</CardTitle></CardHeader><CardContent>
            {!selection ? <p className="text-sm text-muted-foreground">Seçim yaptığınızda ürün ve kayıt ayrıntıları burada sabit kalır.</p> : selectedRecords.length === 0 ? <p className="text-sm text-muted-foreground">Bu kapsamda üretim kaydı yok.</p> : <div className="space-y-4">{[...new Set(selectedRecords.map((record) => record.makineId))].map((machineId) => <div key={machineId}><h3 className="mb-2 flex items-center gap-2 font-medium"><Factory className="size-4" />{selectedRecords.find((record) => record.makineId === machineId)?.makineAd}</h3><div className="grid gap-2 sm:grid-cols-2">{selectedRecords.filter((record) => record.makineId === machineId).map((record) => <details key={record.id} className="rounded-lg border p-3"><summary className="cursor-pointer list-none"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{record.urunAd}</p><p className="text-xs text-muted-foreground">{record.urunKod ?? 'Kod yok'} · {record.vardiyaTipi === 'gece' ? 'Gece' : 'Gündüz'}</p></div><Badge variant="secondary">{record.netMiktar.toLocaleString('tr-TR')} {record.urunBirim}</Badge></div></summary><div className="mt-3 border-t pt-2 text-xs text-muted-foreground">Kayıt: {new Date(record.baslangic).toLocaleString('tr-TR')} · Fire: {record.fireMiktar.toLocaleString('tr-TR')} · {record.operatorAd ?? 'Operatör yok'}</div></details>)}</div></div>)}</div>}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="vardiya"><VardiyaAnaliziClient /></TabsContent>
      </Tabs>
    </div>
  );
}
