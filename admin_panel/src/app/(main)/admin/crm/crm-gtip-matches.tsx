'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCompanyGtipCandidatesQuery } from '@/integrations/endpoints/admin/erp/crm_company_desk.endpoints';
import { useFirmaDetayQuery } from '@/integrations/endpoints/admin/erp/firma_bulma.endpoints';

type Selected = { name: string; role: 'alici' | 'tedarikci'; country: string | null };

export default function CrmGtipMatches({ id }: { id: string }) {
  const [selected, setSelected] = useState<Selected | null>(null);
  const [showAll, setShowAll] = useState(false);
  const { data, isLoading, isError, refetch } = useCompanyGtipCandidatesQuery(id);
  const detail = useFirmaDetayQuery(
    { buyer: selected?.name ?? '', role: selected?.role ?? 'alici', country: selected?.country },
    { skip: !selected },
  );

  return <Card className="min-w-0">
    <CardHeader className="pb-2"><CardTitle className="text-sm">GTİP / gümrük kayıtları</CardTitle></CardHeader>
    <CardContent className="min-w-0 space-y-3 text-sm">
      <p className="text-muted-foreground">Firma adının ilk dört harfiyle gümrük havuzunda olası eşleşmeler aranır. Ad benzerliği firma kimliğini doğrulamaz.</p>
      {isLoading && <p>GTİP kayıtları aranıyor…</p>}
      {isError && <div className="flex flex-wrap items-center gap-2"><span className="text-destructive">Gümrük havuzuna erişilemedi.</span><Button size="sm" variant="outline" onClick={() => refetch()}>Yeniden dene</Button></div>}
      {data && data.matches.length === 0 && <p>“{data.prefix}” ile başlayan firma kaydı bulunamadı.</p>}
      {data && data.matches.length > 0 && <>
        <p className="text-xs text-muted-foreground">“{data.prefix}” başlangıcı · {data.matches.length}{data.hasMore ? '+' : ''} olası kayıt</p>
        <div className="grid min-w-0 gap-2 sm:grid-cols-2">
          {(showAll ? data.matches : data.matches.slice(0, 8)).map((match, index) => <button
            key={`${match.name}-${match.role}-${index}`} type="button"
            className="min-w-0 rounded-md border p-3 text-left hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            aria-expanded={selected?.name === match.name && selected.role === match.role}
            onClick={() => setSelected({ name: match.name, role: match.role, country: match.country })}
          >
            <strong className="block break-words">{match.name}</strong>
            <span className="block text-xs text-muted-foreground">{match.matchType === 'exact' ? 'Ad eşleşmesi' : match.matchType === 'name_prefix' ? 'Ad başlangıcı eşleşmesi' : 'İlk dört harf eşleşmesi'} · {match.role === 'alici' ? 'Alıcı' : 'Tedarikçi'}{match.country ? ` · ${match.country}` : ''} · {match.recordCount.toLocaleString('tr-TR')} kaynak kaydı</span>
          </button>)}
        </div>
        {data.matches.length > 8 && <Button type="button" size="sm" variant="outline" onClick={() => setShowAll(value => !value)}>{showAll ? 'Daha az göster' : 'Tüm adayları göster'}</Button>}
        {data.hasMore && <p className="text-xs text-muted-foreground">Daha fazla olası eşleşme var. Firma Bulma sayfasında adla arama yapılabilir.</p>}
      </>}
      {selected && <div className="min-w-0 space-y-3 rounded-md border bg-muted/30 p-3">
        <div className="min-w-0"><strong className="block break-words">{selected.name}</strong><span className="text-xs text-muted-foreground">Kaynak gümrük kaydı ayrıntısı</span></div>
        {detail.isFetching && <p>GTİP ayrıntısı yükleniyor…</p>}
        {detail.isError && <p className="text-destructive">GTİP ayrıntısı açılamadı.</p>}
        {detail.currentData && <>
          <p>{detail.currentData.totals.shipments.toLocaleString('tr-TR')} kaynak kaydı · {detail.currentData.totals.products.toLocaleString('tr-TR')} GTİP kodu</p>
          <div className="max-h-48 overflow-y-auto rounded-md border bg-background">
            {detail.currentData.products.length === 0 ? <p className="p-2">GTİP kodu bulunamadı.</p> : detail.currentData.products.map((product, index) => <div key={`${product.hsCode}-${index}`} className="flex min-w-0 flex-wrap justify-between gap-x-3 gap-y-1 border-b p-2 last:border-b-0"><span className="min-w-0 break-words"><strong>{product.hsCode}</strong>{product.description ? ` · ${product.description}` : ''}</span><span className="shrink-0 text-muted-foreground">{product.shipments.toLocaleString('tr-TR')} kayıt</span></div>)}
          </div>
          <p className="text-xs text-muted-foreground">Son kayıtlar: {detail.currentData.shipments.items.slice(0, 3).map(item => `${item.hsCode} (${item.date ? new Date(item.date).toLocaleDateString('tr-TR') : 'tarih yok'})`).join(', ') || 'Yok'}. Kaynak kayıtları firma kimliği veya sevkiyat tekilliği kanıtı değildir.</p>
        </>}
      </div>}
    </CardContent>
  </Card>;
}
