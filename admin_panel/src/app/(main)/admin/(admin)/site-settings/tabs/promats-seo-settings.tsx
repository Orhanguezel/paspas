'use client';

import * as React from 'react';
import { Bot, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useGetSiteSettingAdminByKeyQuery, useUpdateSiteSettingAdminMutation } from '@/integrations/hooks';

const PAGE_KEYS = [
  ['home', '/'],
  ['products', '/urunler'],
  ['product-detail', '/urunler/[slug]'],
  ['production', '/uretim'],
  ['contact', '/iletisim'],
  ['resources', '/kaynaklar'],
  ['resource-detail', '/kaynaklar/[slug]'],
  ['content-page', '/[slug]'],
  ['blog', '/blog'],
  ['blog-post', '/blog/[slug]'],
  ['partner', '/become-a-partner'],
  ['oem', '/oem-manufacturing'],
  ['faqs', '/faqs'],
  ['privacy', '/gizlilik'],
  ['kvkk', '/kvkk'],
  ['terms', '/kullanim-sartlari'],
  ['cookies', '/cerez-politikasi'],
  ['legal-notice', '/legal-notice'],
] as const;

type PageSeo = { title: string; description: string; og_image: string; no_index: boolean };
type GeoSeo = {
  entity_name: string;
  entity_description: string;
  industry: string;
  expertise: string;
  service_areas: string;
  verified_facts: string;
  approved_sources: string;
  llms_enabled: boolean;
  llms_description: string;
  llms_sections: string;
  crawler_allow: string;
  crawler_block: string;
  crawler_disallow: string;
};

const EMPTY_GEO: GeoSeo = {
  entity_name: 'Promats',
  entity_description: '',
  industry: 'Automotive accessories manufacturing',
  expertise: '',
  service_areas: '',
  verified_facts: '',
  approved_sources: '',
  llms_enabled: true,
  llms_description: '',
  llms_sections: '',
  crawler_allow: 'GPTBot\nOAI-SearchBot\nChatGPT-User\nClaudeBot\nPerplexityBot\nGoogle-Extended',
  crawler_block: '',
  crawler_disallow: '/api/\n/admin/\n/_next/\n/me/',
};

function objectValue(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const row = value as Record<string, unknown>;
    return row.value && typeof row.value === 'object' && !Array.isArray(row.value)
      ? row.value as Record<string, unknown>
      : row;
  }
  return {};
}

function pagesValue(value: unknown): Record<string, PageSeo> {
  const source = objectValue(value);
  return Object.fromEntries(PAGE_KEYS.map(([key]) => {
    const row = objectValue(source[key]);
    return [key, {
      title: String(row.title ?? ''),
      description: String(row.description ?? ''),
      og_image: String(row.og_image ?? ''),
      no_index: row.no_index === true,
    }];
  }));
}

function geoValue(value: unknown): GeoSeo {
  const source = objectValue(value);
  return { ...EMPTY_GEO, ...Object.fromEntries(
    Object.keys(EMPTY_GEO).map((key) => [key, source[key] ?? EMPTY_GEO[key as keyof GeoSeo]]),
  ) } as GeoSeo;
}

export function PromatsSeoSettings({ locale }: { locale: string }) {
  const seoKey = `web.promats.frontend.seo_pages.locale.${locale}`;
  const geoKey = `web.promats.frontend.geo_seo.locale.${locale}`;
  const seoQuery = useGetSiteSettingAdminByKeyQuery({ key: seoKey }, { refetchOnMountOrArgChange: true });
  const geoQuery = useGetSiteSettingAdminByKeyQuery({ key: geoKey }, { refetchOnMountOrArgChange: true });
  const [save, saveState] = useUpdateSiteSettingAdminMutation();
  const serverPages = React.useMemo(() => pagesValue(seoQuery.data), [seoQuery.data]);
  const serverGeo = React.useMemo(() => geoValue(geoQuery.data), [geoQuery.data]);
  const [pages, setPages] = React.useState(serverPages);
  const [geo, setGeo] = React.useState(serverGeo);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set(['home']));

  React.useEffect(() => setPages(serverPages), [serverPages]);
  React.useEffect(() => setGeo(serverGeo), [serverGeo]);

  const updatePage = (key: string, patch: Partial<PageSeo>) =>
    setPages((old) => ({ ...old, [key]: { ...old[key], ...patch } }));

  const handleSave = async () => {
    try {
      await Promise.all([
        save({ key: seoKey, value: pages }).unwrap(),
        save({ key: geoKey, value: geo }).unwrap(),
      ]);
      toast.success(`Promats ${locale.toUpperCase()} SEO ve LLM ayarları kaydedildi.`);
      await Promise.all([seoQuery.refetch(), geoQuery.refetch()]);
    } catch {
      toast.error('SEO ve LLM ayarları kaydedilemedi.');
    }
  };

  const busy = seoQuery.isFetching || geoQuery.isFetching || saveState.isLoading;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Promats Sayfa SEO Ayarları</CardTitle>
              <CardDescription>Tüm statik ve dinamik sayfa tipleri için metadata ve indeksleme ayarları.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{locale.toUpperCase()}</Badge>
              <Button variant="outline" size="sm" onClick={() => setExpanded(new Set(PAGE_KEYS.map(([key]) => key)))}>
                <ChevronDown className="mr-1 size-4" /> Tümünü aç
              </Button>
              <Button variant="outline" size="sm" onClick={() => setExpanded(new Set())}>
                <ChevronUp className="mr-1 size-4" /> Kapat
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {PAGE_KEYS.map(([key, path]) => {
            const page = pages[key];
            const open = expanded.has(key);
            return (
              <div key={key}>
                <button type="button" className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/40"
                  onClick={() => setExpanded((old) => {
                    const next = new Set(old);
                    next.has(key) ? next.delete(key) : next.add(key);
                    return next;
                  })}>
                  <span><strong className="block text-sm">{key}</strong><code className="text-muted-foreground text-xs">{path}</code></span>
                  <span className="flex gap-2">
                    <Badge variant={page?.no_index ? 'destructive' : 'outline'}>{page?.no_index ? 'noindex' : 'index'}</Badge>
                    {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </span>
                </button>
                {open && (
                  <div className="grid gap-4 bg-muted/10 px-5 py-5 md:grid-cols-2">
                    <div className="space-y-2"><Label>SEO başlığı</Label><Input value={page?.title ?? ''} onChange={(e) => updatePage(key, { title: e.target.value })} /></div>
                    <div className="space-y-2"><Label>OG görseli</Label><Input value={page?.og_image ?? ''} onChange={(e) => updatePage(key, { og_image: e.target.value })} /></div>
                    <div className="space-y-2 md:col-span-2"><Label>Meta açıklaması</Label><Textarea value={page?.description ?? ''} onChange={(e) => updatePage(key, { description: e.target.value })} /></div>
                    <div className="flex items-center justify-between rounded-lg border p-3 md:col-span-2">
                      <div><Label>Arama motorlarından gizle</Label><p className="text-muted-foreground text-xs">Etkinleştirildiğinde noindex, nofollow uygulanır.</p></div>
                      <Switch checked={page?.no_index ?? false} onCheckedChange={(value) => updatePage(key, { no_index: value })} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2"><Bot className="size-5" /> LLM & GEO İçeriği</CardTitle>
          <CardDescription>AI arama motorları, llms.txt ve doğrulanmış kurum varlığı için dinamik içerik.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 pt-5 md:grid-cols-2">
          <div className="space-y-2"><Label>Kurum adı</Label><Input value={geo.entity_name} onChange={(e) => setGeo({ ...geo, entity_name: e.target.value })} /></div>
          <div className="space-y-2"><Label>Sektör</Label><Input value={geo.industry} onChange={(e) => setGeo({ ...geo, industry: e.target.value })} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Kurum açıklaması</Label><Textarea value={geo.entity_description} onChange={(e) => setGeo({ ...geo, entity_description: e.target.value })} /></div>
          {([
            ['expertise', 'Uzmanlıklar'], ['service_areas', 'Hizmet bölgeleri'],
            ['verified_facts', 'Doğrulanmış bilgiler'], ['approved_sources', 'Onaylı kaynak URL’leri'],
            ['llms_sections', 'llms.txt ek bölümleri'], ['crawler_allow', 'İzin verilen AI crawler’ları'],
            ['crawler_block', 'Engellenen crawler’lar'], ['crawler_disallow', 'Taranmayacak yollar'],
          ] as const).map(([key, label]) => (
            <div key={key} className="space-y-2"><Label>{label}</Label><Textarea rows={4} value={String(geo[key])} onChange={(e) => setGeo({ ...geo, [key]: e.target.value })} /></div>
          ))}
          <div className="flex items-center justify-between rounded-lg border p-3 md:col-span-2">
            <div><Label>Dinamik llms.txt yayınla</Label><p className="text-muted-foreground text-xs">Kök dizinde veritabanı içeriğinden AI-okunabilir dosya üretir.</p></div>
            <Switch checked={geo.llms_enabled} onCheckedChange={(value) => setGeo({ ...geo, llms_enabled: value })} />
          </div>
          <div className="space-y-2 md:col-span-2"><Label>llms.txt kısa açıklaması</Label><Textarea value={geo.llms_description} onChange={(e) => setGeo({ ...geo, llms_description: e.target.value })} /></div>
          <div className="flex justify-end md:col-span-2"><Button onClick={() => void handleSave()} disabled={busy}><Save className="mr-2 size-4" /> SEO ve LLM ayarlarını kaydet</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}
