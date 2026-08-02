'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Brush, Edit3, ExternalLink, Eye, EyeOff, FileJson2, FileText, FolderOpen, Globe2, Home,
  ImageIcon, Languages, LayoutList, Menu as MenuIcon, Monitor, Newspaper, Palette,
  Plus, RefreshCcw, Save, Search, ShoppingBag, Trash2, Type,
} from 'lucide-react';
import { toast } from 'sonner';
import { BASE_URL } from '@/integrations/apiBase';
import { tokenStore } from '@/integrations/core/token';
import { useCreateAssetAdminMutation, useListAssetsAdminQuery } from '@/integrations/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminImageUploadField } from '@/components/common/AdminImageUploadField';
import { RichContentEditor } from '@/components/common/RichContentEditor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type TableKey = 'products' | 'pages' | 'page-content' | 'articles' | 'menu' | 'texts' | 'settings' | 'theme' | 'home-sections' | 'files';
type FieldKind = 'text' | 'textarea' | 'richtext' | 'number' | 'date' | 'toggle';
type EditorSection = 'content' | 'media' | 'seo' | 'publishing';
type Field = { key: string; label: string; kind?: FieldKind; section?: EditorSection };
type Row = Record<string, unknown>;

const tabs = [
  { key: 'products', label: 'Ürünler', icon: ShoppingBag, tone: 'text-orange-700 bg-orange-50 border-orange-200' },
  { key: 'pages', label: 'Sayfalar', icon: FileText, tone: 'text-blue-700 bg-blue-50 border-blue-200' },
  { key: 'page-content', label: 'Sayfa İçerikleri', icon: FileJson2, tone: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  { key: 'articles', label: 'Blog', icon: Newspaper, tone: 'text-violet-700 bg-violet-50 border-violet-200' },
  { key: 'menu', label: 'Menü', icon: MenuIcon, tone: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
  { key: 'texts', label: 'Sabit Yazılar', icon: Languages, tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { key: 'theme', label: 'Tema', icon: Palette, tone: 'text-pink-700 bg-pink-50 border-pink-200' },
  { key: 'home-sections', label: 'Ana Sayfa Bölümleri', icon: Home, tone: 'text-amber-700 bg-amber-50 border-amber-200' },
  { key: 'files', label: 'Web Dosyaları', icon: FolderOpen, tone: 'text-slate-700 bg-slate-50 border-slate-200' },
] as const;

// Canlı promats web sitesi — sekmeye göre ilgili sayfa önizlemede gösterilir.
const PROMATS_WEB_BASE = 'https://panel.avrasyaotomotiv.net/promats';
const previewPath: Record<TableKey, string> = {
  products: '/urunler',
  pages: '',
  'page-content': '',
  articles: '/kaynaklar',
  menu: '',
  texts: '',
  settings: '',
  theme: '',
  'home-sections': '',
  files: '',
};

const themeColors = [
  ['primary', 'Ana marka rengi'], ['primaryDark', 'Koyu marka rengi'], ['accent', 'Vurgu rengi'],
  ['background', 'Sayfa zemini'], ['surfaceBase', 'Bölüm zemini'], ['surfaceRaised', 'Kart zemini'],
  ['textStrong', 'Başlık rengi'], ['textBody', 'Metin rengi'], ['textMuted', 'Soluk metin'],
  ['border', 'Kenarlık'], ['navBg', 'Menü zemini'], ['navFg', 'Menü yazısı'],
  ['footerBg', 'Footer zemini'], ['footerFg', 'Footer yazısı'],
];

const fields: Partial<Record<TableKey, Field[]>> = {
  products: [
    { key: 'name', label: 'Ürün adı' },
    { key: 'slug', label: 'URL / Slug', section: 'seo' },
    { key: 's1_1_text', label: 'Kapak başlığı', section: 'content' },
    { key: 's1_2_text', label: 'Kapak alt başlığı', section: 'content' },
    { key: 's1_3_text', label: 'Kapak açıklaması', kind: 'textarea', section: 'content' },
    { key: 's1_4_image', label: 'Kapak görseli', section: 'media' },
    { key: 's2_1_image', label: 'Konsept görseli', section: 'media' },
    { key: 's2_2_text', label: 'Konsept başlığı', section: 'content' },
    { key: 's2_3_text', label: 'Konsept alt başlığı', section: 'content' },
    { key: 's2_4_text', label: 'Konsept etiketi', section: 'content' },
    { key: 's2_5_text', label: 'Konsept açıklaması', kind: 'textarea', section: 'content' },
    { key: 's3_1_image', label: 'Detay görseli', section: 'media' },
    { key: 's3_2_image', label: 'Arka plan görseli', section: 'media' },
    { key: 's4_1_image', label: 'Set görseli', section: 'media' },
    { key: 's5_1_text', label: 'Ölçü 1', section: 'content' },
    { key: 's5_2_text', label: 'Ölçü 2', section: 'content' },
    { key: 's5_3_text', label: 'Ölçü 3', section: 'content' },
    { key: 's5_4_text', label: 'Ölçü 4', section: 'content' },
    { key: 's5_5_text', label: 'Ölçü 5', section: 'content' },
    { key: 'detail_description', label: 'Ürün Açıklaması', kind: 'richtext', section: 'content' },
    { key: 'detail_technical', label: 'Teknik Özellikler', kind: 'richtext', section: 'content' },
    { key: 'detail_usage', label: 'Kullanım Alanları', kind: 'richtext', section: 'content' },
    { key: 'detail_advantages', label: 'Avantajları', kind: 'richtext', section: 'content' },
    { key: 'detail_material', label: 'Malzeme ve Dayanıklılık', kind: 'richtext', section: 'content' },
    { key: 'detail_universal', label: 'Universal Tasarım', kind: 'richtext', section: 'content' },
    { key: 'detail_source_url', label: 'Devamını Oku bağlantısı', section: 'content' },
    { key: 'seo_title', label: 'SEO başlığı', section: 'seo' },
    { key: 'seo_description', label: 'SEO açıklaması', kind: 'textarea', section: 'seo' },
    { key: 'sort_order', label: 'Sıra', kind: 'number', section: 'publishing' },
    { key: 'status', label: 'Yayında', kind: 'toggle', section: 'publishing' },
  ],
  pages: [
    { key: 'title', label: 'Sayfa başlığı' },
    { key: 'slug', label: 'URL / Slug', section: 'seo' },
    { key: 'detail', label: 'Sayfa içeriği', kind: 'richtext', section: 'content' },
    { key: 'image', label: 'Kapak görseli', section: 'media' },
    { key: 'url', label: 'Bağlantı', section: 'seo' },
    { key: 'position', label: 'Sayfa konumu', kind: 'number', section: 'publishing' },
    { key: 'sort_order', label: 'Sıra', kind: 'number', section: 'publishing' },
    { key: 'status', label: 'Yayında', kind: 'toggle', section: 'publishing' },
  ],
  articles: [
    { key: 'title', label: 'Blog başlığı' },
    { key: 'slug', label: 'URL / Slug', section: 'seo' },
    { key: 'excerpt', label: 'Kısa açıklama', kind: 'textarea', section: 'content' },
    { key: 'content', label: 'Blog içeriği', kind: 'richtext', section: 'content' },
    { key: 'image', label: 'Kapak görseli', section: 'media' },
    { key: 'meta_title', label: 'SEO başlığı', section: 'seo' },
    { key: 'meta_description', label: 'SEO açıklaması', kind: 'textarea', section: 'seo' },
    { key: 'published_at', label: 'Yayın tarihi', kind: 'date', section: 'publishing' },
    { key: 'sort_order', label: 'Sıra', kind: 'number', section: 'publishing' },
    { key: 'status', label: 'Yayında', kind: 'toggle', section: 'publishing' },
  ],
  menu: [
    { key: 'title', label: 'Menü adı' },
    { key: 'url', label: 'Bağlantı' },
    { key: 'position', label: 'Menü konumu', kind: 'number' },
    { key: 'sort_order', label: 'Sıra', kind: 'number' },
    { key: 'target', label: 'Yeni sekmede aç', kind: 'toggle' },
    { key: 'status', label: 'Yayında', kind: 'toggle' },
  ],
  texts: [
    { key: 'original_text', label: 'Kaynak metin' },
    { key: 'title', label: 'Gösterilecek metin', kind: 'textarea' },
    { key: 'status', label: 'Aktif', kind: 'toggle' },
  ],
  'home-sections': [
    { key: 'label', label: 'Bölüm adı' },
    { key: 'slug', label: 'Slug' },
    { key: 'component_key', label: 'Bileşen anahtarı' },
    { key: 'order_index', label: 'Sıra', kind: 'number' },
    { key: 'is_active', label: 'Aktif', kind: 'toggle' },
  ],
};

const tabRoutes: Record<TableKey, string> = {
  products: '/admin/web-sayfasi/urunler',
  pages: '/admin/web-sayfasi/sayfalar',
  'page-content': '/admin/web-sayfasi/sayfa-icerikleri',
  articles: '/admin/web-sayfasi/makaleler',
  menu: '/admin/web-sayfasi/menu',
  texts: '/admin/web-sayfasi/sabit-yazilar',
  settings: '/admin/sistem?tab=site-ayarlari',
  theme: '/admin/web-sayfasi/tema',
  'home-sections': '/admin/web-sayfasi/ana-sayfa',
  files: '/admin/web-sayfasi/dosyalar',
};

function label(row: Row): string {
  return String(row.name ?? row.title ?? row.page_key ?? row.original_text ?? row.slug ?? row.key ?? `#${row.id}`);
}

function detail(row: Row): string {
  return String(row.slug ?? row.url ?? row.locale ?? row.original_text ?? row.value ?? '');
}

function plainText(value: unknown): string {
  return String(value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function contentSummary(row: Row): string {
  return plainText(row.excerpt ?? row.s1_3_text ?? row.detail ?? row.content ?? row.title ?? '').slice(0, 150);
}

function mediaValue(row: Row): string {
  return String(row.image ?? row.s1_4_image ?? row.s2_1_image ?? '');
}

function adminMediaUrl(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('/userfiles/') || raw.startsWith('/uploads/')) return raw;
  if (raw.startsWith('/')) return raw;
  if (raw.startsWith('userfiles/')) return `/${raw}`;
  if (raw.startsWith('images/') || raw.startsWith('files/')) return `/userfiles/${raw}`;
  return `/userfiles/${raw.replace(/^\/+/, '')}`;
}

function seoScore(tab: TableKey, row: Row): number {
  if (!['products', 'pages', 'articles'].includes(tab)) return 100;
  const title = String(row.meta_title ?? row.name ?? row.title ?? '').trim();
  const description = plainText(row.meta_description ?? row.excerpt ?? row.s1_3_text ?? row.detail);
  const slug = String(row.slug ?? '').trim();
  const image = mediaValue(row);
  let score = 0;
  if (title) score += 20;
  if (title.length >= 20 && title.length <= 65) score += 15;
  if (description) score += 20;
  if (description.length >= 70 && description.length <= 180) score += 15;
  if (slug) score += 20;
  if (image) score += 10;
  return score;
}

function seoTone(score: number): string {
  if (score >= 80) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (score >= 50) return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-red-200 bg-red-50 text-red-700';
}

function createTemplate(table: Exclude<TableKey, 'settings' | 'theme' | 'files'>, languageId: number): Row {
  if (table === 'home-sections') return {
    slug: '', label: '', component_key: '', order_index: 0, is_active: 1, config: null,
  };
  const common = { language_id: languageId, source_language_id: 0, status: 0 };
  if (table === 'products') return { ...common, sort_order: 0, name: '', slug: '' };
  if (table === 'pages') return { ...common, sort_order: 0, position: 0, title: '', slug: '', detail: '' };
  if (table === 'articles') return {
    ...common, sort_order: 0, title: '', slug: '', excerpt: '', content: '',
    published_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };
  if (table === 'menu') return { ...common, sort_order: 0, position: 0, title: '', url: '', target: 0 };
  return { ...common, original_text: '', title: '' };
}

export default function WebSayfasiClient({ initialTab = 'products' }: { initialTab?: TableKey }) {
  const router = useRouter();
  const [tab, setTab] = useState<TableKey>(initialTab);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [previewNonce, setPreviewNonce] = useState(0);
  const [languageId, setLanguageId] = useState(1);
  const [items, setItems] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editor, setEditor] = useState<{ id?: string | number; body: Row } | null>(null);
  const [editorSection, setEditorSection] = useState<EditorSection>('content');
  const [deleteRow, setDeleteRow] = useState<Row | null>(null);
  const [themeJson, setThemeJson] = useState('{}');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const assets = useListAssetsAdminQuery(
    { bucket: 'web-promats', limit: 100, sort: 'created_at', order: 'desc' },
    { skip: tab !== 'files' },
  );
  const [uploadAsset, uploadState] = useCreateAssetAdminMutation();

  let themeConfig: Row = {};
  try {
    themeConfig = JSON.parse(themeJson) as Row;
  } catch {
    themeConfig = {};
  }

  function updateThemeSection(section: string, key: string, value: string) {
    const currentSection = themeConfig[section];
    const nextSection = currentSection && typeof currentSection === 'object' && !Array.isArray(currentSection)
      ? currentSection as Row
      : {};
    setThemeJson(JSON.stringify({
      ...themeConfig,
      [section]: { ...nextSection, [key]: value },
    }, null, 2));
  }

  function updateThemeRoot(key: string, value: string) {
    setThemeJson(JSON.stringify({ ...themeConfig, [key]: value }, null, 2));
  }

  useEffect(() => setTab(initialTab), [initialTab]);

  const request = useCallback(async (path: string, init?: RequestInit) => {
    const token = tokenStore.get();
    return fetch(`${BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'files') {
        setItems([]);
        return;
      }
      const suffix = ['settings', 'theme', 'home-sections', 'page-content'].includes(tab) ? '' : `?languageId=${languageId}`;
      const response = await request(`/admin/web/promats/${tab}${suffix}`);
      if (!response.ok) throw new Error(String(response.status));
      const payload = await response.json() as Row[] | Row;
      if (tab === 'theme') {
        setThemeJson(JSON.stringify(payload, null, 2));
        setItems([]);
        return;
      }
      const data = payload as Row[];
      setItems(data);
      if (tab === 'settings') {
        setDrafts(Object.fromEntries(data.map((row) => [String(row.key), String(row.value ?? '')])));
      }
    } catch {
      toast.error('Web sayfası verileri alınamadı.');
    } finally {
      setLoading(false);
    }
  }, [languageId, request, tab]);

  useEffect(() => { void load(); }, [load]);

  async function saveSetting(key: string) {
    const response = await request(`/admin/web/promats/settings/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify({ value: drafts[key] ?? '' }),
    });
    if (response.ok) toast.success('Web ayarı kaydedildi.');
    else toast.error('Ayar kaydedilemedi.');
  }

  function openCreate() {
    if (tab === 'settings' || tab === 'theme' || tab === 'files' || tab === 'page-content') return;
    setEditorSection('content');
    setEditor({ body: createTemplate(tab, languageId) });
  }

  async function openEdit(row: Row) {
    if (tab === 'settings' || tab === 'theme' || tab === 'files') return;
    setEditorSection('content');
    if (tab === 'page-content') {
      setEditor({
        id: String(row.id),
        body: {
          page_key: row.page_key,
          locale: row.locale,
          content_json: JSON.stringify(row.content ?? {}, null, 2),
        },
      });
      return;
    }
    if (tab === 'home-sections') {
      const { created_at, updated_at, ...editable } = row;
      void created_at; void updated_at;
      setEditor({ id: String(row.id), body: editable });
      return;
    }
    const response = await request(`/admin/web/promats/${tab}/${row.id}`);
    if (!response.ok) return toast.error('Kayıt detayı alınamadı.');
    const data = await response.json() as Row;
    const { id, created_at, ...editable } = data;
    void created_at;
    setEditor({ id: Number(id), body: editable });
  }

  async function saveEditor() {
    if (!editor || tab === 'settings' || tab === 'theme' || tab === 'files') return;
    if (tab === 'page-content') {
      let content: Row;
      try {
        content = JSON.parse(String(editor.body.content_json ?? '{}')) as Row;
        if (!content || typeof content !== 'object' || Array.isArray(content)) throw new Error('invalid');
      } catch {
        return toast.error('Sayfa içeriği JSON biçimi geçersiz.');
      }
      const pageKey = String(editor.body.page_key ?? '');
      const locale = String(editor.body.locale ?? '');
      const response = await request(
        `/admin/web/promats/page-content/${encodeURIComponent(pageKey)}/${encodeURIComponent(locale)}`,
        { method: 'PUT', body: JSON.stringify(content) },
      );
      if (!response.ok) return toast.error('Sayfa içeriği kaydedilemedi.');
      toast.success('Sayfa içeriği kaydedildi.');
      setEditor(null);
      await load();
      return;
    }
    const body = editor.body;
    const response = await request(
      `/admin/web/promats/${tab}${editor.id ? `/${encodeURIComponent(String(editor.id))}` : ''}`,
      { method: editor.id ? 'PATCH' : 'POST', body: JSON.stringify(body) },
    );
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      return toast.error(payload?.error?.message ?? 'Kayıt kaydedilemedi.');
    }
    toast.success(editor.id ? 'Kayıt güncellendi.' : 'Kayıt oluşturuldu.');
    setEditor(null);
    await load();
  }

  async function confirmDelete() {
    if (!deleteRow || tab === 'settings' || tab === 'theme' || tab === 'files') return;
    const response = await request(`/admin/web/promats/${tab}/${deleteRow.id}`, { method: 'DELETE' });
    if (response.ok) {
      toast.success('Kayıt silindi.');
      setDeleteRow(null);
      await load();
    } else {
      toast.error('Kayıt silinemedi.');
    }
  }

  async function saveTheme() {
    let body: Row;
    try {
      body = JSON.parse(themeJson) as Row;
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid');
    } catch {
      return toast.error('Tema JSON biçimi geçersiz.');
    }
    const response = await request('/admin/web/promats/theme', { method: 'PUT', body: JSON.stringify(body) });
    response.ok ? toast.success('Web teması kaydedildi.') : toast.error('Tema kaydedilemedi.');
  }

  async function uploadWebFile(file: File | undefined) {
    if (!file) return;
    try {
      await uploadAsset({
        file,
        bucket: 'web-promats',
        folder: 'site',
        metadata: { sourceApp: 'promats-web', tenant: 'promats' },
      }).unwrap();
      toast.success('Web dosyası yüklendi.');
      await assets.refetch();
    } catch {
      toast.error('Dosya yüklenemedi.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function uploadEditorImage(file: File): Promise<string> {
    try {
      const asset = await uploadAsset({
        file,
        bucket: 'web-promats',
        folder: 'content',
        metadata: { sourceApp: 'promats-web', tenant: 'promats', usage: 'rich-content' },
      }).unwrap() as { url?: string; path?: string };
      const url = asset.url || (asset.path ? `/uploads/${asset.path.replace(/^\/+/, '')}` : '');
      if (!url) throw new Error('missing-url');
      toast.success('Görsel içeriğe yüklendi.');
      return url;
    } catch {
      toast.error('İçerik görseli yüklenemedi.');
      throw new Error('upload-failed');
    }
  }

  async function copyAssetUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Dosya adresi kopyalandı; editörde ilgili görsel alanına yapıştırabilirsiniz.');
    } catch {
      toast.error('Dosya adresi kopyalanamadı.');
    }
  }

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold"><Globe2 className="size-6" /> Web Sitesi</h1>
          <p className="text-sm text-muted-foreground">Promats sayfalarını, ürünlerini, blogunu, SEO ve yayın durumlarını yönetin.</p>
        </div>
        <div className="flex gap-2">
          {!['settings', 'theme', 'files', 'page-content'].includes(tab) && <Button onClick={openCreate}><Plus className="mr-2 size-4" /> Yeni kayıt</Button>}
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCcw className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`} /> Yenile
          </Button>
        </div>
      </div>

      {/* Bölüm menüsü — mobilde dropdown (dar ekranda 9 kart tüm sayfayı kaplıyordu),
          masaüstünde kompakt kart ızgarası. */}
      <div className="lg:hidden">
        <Label className="mb-1 block text-xs text-muted-foreground">Bölüm</Label>
        <Select value={tab} onValueChange={(value) => { const next = value as TableKey; setTab(next); router.push(tabRoutes[next]); }}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tabs.map((item) => {
              const Icon = item.icon;
              return (
                <SelectItem key={item.key} value={item.key}>
                  <span className="flex items-center gap-2"><Icon className="size-4" /> {item.label}</span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          const next = value as TableKey;
          setTab(next);
          router.push(tabRoutes[next]);
        }}
        className="hidden lg:block"
      >
        <TabsList className="grid h-auto w-full grid-cols-5 gap-2 bg-transparent p-0 xl:grid-cols-9">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <TabsTrigger
                key={item.key}
                value={item.key}
                className={`h-auto min-h-20 flex-col gap-2 rounded-xl border px-3 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md data-[state=active]:ring-2 data-[state=active]:ring-primary/30 data-[state=active]:shadow-md ${item.tone}`}
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-white/80 shadow-sm">
                  <Icon className="size-5" />
                </span>
                <span className="text-center text-xs font-semibold leading-tight">{item.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Canlı önizleme — düzenlenen bölümün ilgili promats sayfası. */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-2 border-b py-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Monitor className="size-4 text-muted-foreground" /> Canlı Önizleme
            <span className="hidden font-normal text-muted-foreground sm:inline">— {PROMATS_WEB_BASE}/{languageId === 2 ? 'en' : 'tr'}{previewPath[tab]}</span>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setPreviewNonce((n) => n + 1)} title="Önizlemeyi yenile">
              <RefreshCcw className="size-4" />
            </Button>
            <Button asChild variant="ghost" size="icon" title="Yeni sekmede aç">
              <a href={`${PROMATS_WEB_BASE}/${languageId === 2 ? 'en' : 'tr'}${previewPath[tab]}`} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /></a>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setPreviewOpen((v) => !v)} title={previewOpen ? 'Önizlemeyi gizle' : 'Önizlemeyi göster'}>
              {previewOpen ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>
        </CardHeader>
        {previewOpen && (
          <CardContent className="p-0">
            <iframe
              key={`${tab}-${languageId}-${previewNonce}`}
              src={`${PROMATS_WEB_BASE}/${languageId === 2 ? 'en' : 'tr'}${previewPath[tab]}`}
              title="Promats web önizleme"
              className="h-105 w-full border-0 bg-white sm:h-140"
              loading="lazy"
            />
          </CardContent>
        )}
      </Card>

      {!['settings', 'theme', 'home-sections', 'files'].includes(tab) && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/20 p-3">
          <div className="space-y-1">
            <Label>Dil</Label>
            <div className="flex gap-2">
              <Button size="sm" variant={languageId === 1 ? 'default' : 'outline'} onClick={() => setLanguageId(1)}>Türkçe</Button>
              <Button size="sm" variant={languageId === 2 ? 'default' : 'outline'} onClick={() => setLanguageId(2)}>English</Button>
            </div>
          </div>
          <div className="min-w-64 flex-1 space-y-1">
            <Label htmlFor="web-content-search">İçerik ara</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input id="web-content-search" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Başlık, slug veya içerik..." />
            </div>
          </div>
        </div>
      )}

      {tab === 'files' ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Promats Web Dosyaları</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Dosyalar ana Paspas storage sisteminde <code>web-promats</code> bucket’ı ve kaynak metadata’sıyla tutulur.
            </p>
            <div className="flex flex-wrap gap-2">
              <input ref={fileInputRef} type="file" className="hidden" onChange={(event) => void uploadWebFile(event.target.files?.[0])} />
              <Button onClick={() => fileInputRef.current?.click()} disabled={uploadState.isLoading}>
                <Plus className="mr-2 size-4" /> {uploadState.isLoading ? 'Yükleniyor…' : 'Web dosyası yükle'}
              </Button>
              <Button asChild variant="outline"><Link href="/admin/storage?bucket=web-promats">Gelişmiş dosya yöneticisi</Link></Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(assets.data?.items ?? []).map((item) => {
                const url = item.url || `/uploads/${item.path.replace(/^\/+/, '')}`;
                return (
                  <button key={item.id} type="button" onClick={() => void copyAssetUrl(url)} className="rounded-lg border p-3 text-left hover:border-primary">
                    <span className="block truncate text-sm font-medium">{item.name}</span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">{url}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : tab === 'theme' ? (
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-gradient-to-r from-pink-50 via-orange-50 to-amber-50">
            <div className="flex items-start gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-white text-pink-600 shadow-sm"><Brush className="size-5" /></span>
              <div>
                <CardTitle className="text-base">Promats Görsel Tema</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Renkleri, yazı tiplerini ve köşe yapısını görsel alanlardan yönetin.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-5">
            <section className="space-y-3">
              <div className="flex items-center gap-2 font-semibold"><Palette className="size-4 text-pink-600" /> Renk paleti</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {themeColors.map(([key, colorLabel]) => {
                  const colors = themeConfig.colors && typeof themeConfig.colors === 'object' ? themeConfig.colors as Row : {};
                  const value = String(colors[key] ?? '#000000');
                  const validColor = /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000';
                  return (
                    <div key={key} className="rounded-xl border bg-card p-3 shadow-sm">
                      <Label htmlFor={`theme-${key}`} className="text-xs">{colorLabel}</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          aria-label={`${colorLabel} renk seçici`}
                          type="color"
                          value={validColor}
                          onChange={(event) => updateThemeSection('colors', key, event.target.value)}
                          className="size-10 cursor-pointer rounded-lg border bg-transparent p-1"
                        />
                        <Input
                          id={`theme-${key}`}
                          value={value}
                          onChange={(event) => updateThemeSection('colors', key, event.target.value)}
                          className="h-10 font-mono text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-4 rounded-xl border bg-muted/20 p-4 md:grid-cols-2">
              <div className="md:col-span-2 flex items-center gap-2 font-semibold"><Type className="size-4 text-blue-600" /> Tipografi</div>
              {[
                ['fontHeading', 'Başlık yazı tipi', 'DM Sans, system-ui, sans-serif'],
                ['fontBody', 'Gövde yazı tipi', 'DM Sans, system-ui, sans-serif'],
              ].map(([key, fontLabel, placeholder]) => {
                const typography = themeConfig.typography && typeof themeConfig.typography === 'object' ? themeConfig.typography as Row : {};
                const value = String(typography[key] ?? '');
                return (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`theme-${key}`}>{fontLabel}</Label>
                    <Input id={`theme-${key}`} value={value} placeholder={placeholder} onChange={(event) => updateThemeSection('typography', key, event.target.value)} />
                    <div className="rounded-lg border bg-background p-3 text-lg" style={{ fontFamily: value || placeholder }}>Promats tema yazısı Aa</div>
                  </div>
                );
              })}
              <div className="space-y-2">
                <Label htmlFor="theme-radius">Köşe yuvarlaklığı</Label>
                <Input id="theme-radius" value={String(themeConfig.radius ?? '')} placeholder="0.5rem" onChange={(event) => updateThemeRoot('radius', event.target.value)} />
              </div>
            </section>

            <section className="rounded-xl border p-4">
              <div className="mb-3 flex items-center gap-2 font-semibold"><LayoutList className="size-4 text-orange-600" /> Canlı önizleme</div>
              <div
                className="overflow-hidden border shadow-sm"
                style={{
                  borderRadius: String(themeConfig.radius ?? '0.5rem'),
                  background: String((themeConfig.colors as Row | undefined)?.background ?? '#fafaf8'),
                  color: String((themeConfig.colors as Row | undefined)?.textBody ?? '#707070'),
                  fontFamily: String((themeConfig.typography as Row | undefined)?.fontBody ?? 'sans-serif'),
                }}
              >
                <div className="flex items-center justify-between px-5 py-3" style={{ background: String((themeConfig.colors as Row | undefined)?.navBg ?? '#000'), color: String((themeConfig.colors as Row | undefined)?.navFg ?? '#fff') }}>
                  <strong>PROMATS</strong><span className="text-xs">Ürünler &nbsp; Kurumsal &nbsp; İletişim</span>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold" style={{ color: String((themeConfig.colors as Row | undefined)?.textStrong ?? '#000'), fontFamily: String((themeConfig.typography as Row | undefined)?.fontHeading ?? 'sans-serif') }}>Araca özel paspas sistemleri</h3>
                  <p className="mt-2 text-sm">Seçtiğiniz renk ve yazı tiplerinin örnek görünümü.</p>
                  <button type="button" className="mt-4 rounded-md px-4 py-2 text-sm font-semibold" style={{ background: String((themeConfig.colors as Row | undefined)?.primary ?? '#ffa001'), color: '#fff' }}>Ürünleri incele</button>
                </div>
              </div>
            </section>

            <details className="rounded-xl border">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Gelişmiş JSON düzenleyici</summary>
              <div className="border-t p-4">
                <Textarea className="min-h-80 font-mono text-xs" value={themeJson} onChange={(event) => setThemeJson(event.target.value)} />
              </div>
            </details>
            <div className="flex justify-end"><Button onClick={() => void saveTheme()}><Save className="mr-2 size-4" /> Temayı kaydet</Button></div>
          </CardContent>
        </Card>
      ) : <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-base">{tabs.find((item) => item.key === tab)?.label} ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-4">
          {items.filter((row) => {
            if (tab === 'page-content' && String(row.locale) !== (languageId === 2 ? 'en' : 'tr')) return false;
            const query = search.trim().toLocaleLowerCase('tr');
            return !query || `${label(row)} ${detail(row)}`.toLocaleLowerCase('tr').includes(query);
          }).map((row) => {
            const key = String(row.key ?? row.id);
            const published = Number(row.status ?? 0) === 0;
            const hasSlug = Boolean(String(row.slug ?? row.url ?? '').trim());
            const score = seoScore(tab, row);
            const indexable = published && hasSlug && score >= 50;
            const summary = contentSummary(row);
            const image = adminMediaUrl(mediaValue(row));
            return (
              <div key={key} className="group rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
                <div className="flex items-start gap-3">
                  {!['settings', 'texts', 'menu'].includes(tab) && (
                    image ? (
                      <img src={image} alt="" className="size-16 shrink-0 rounded-lg border object-cover" />
                    ) : (
                      <div className="flex size-16 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                        <ImageIcon className="size-5" />
                      </div>
                    )
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold" title={label(row)}>{label(row)}</div>
                    {detail(row) && <code className="mt-1 block truncate text-muted-foreground text-xs">/{detail(row).replace(/^\/+/, '')}</code>}
                    {summary && <p className="mt-2 line-clamp-2 text-muted-foreground text-sm">{summary}</p>}
                  </div>
                  {!['settings', 'texts', 'page-content'].includes(tab) && (
                    <div className={`flex size-14 shrink-0 flex-col items-center justify-center rounded-full border-2 ${seoTone(score)}`}>
                      <strong className="text-base leading-none">{score}</strong>
                      <span className="mt-0.5 text-[9px] uppercase">SEO</span>
                    </div>
                  )}
                </div>
                {tab === 'settings' ? (
                  <div className="mt-2 flex gap-2">
                    <Input value={drafts[key] ?? ''} onChange={(event) => setDrafts((old) => ({ ...old, [key]: event.target.value }))} />
                    <Button size="icon" onClick={() => void saveSetting(key)} aria-label="Kaydet"><Save className="size-4" /></Button>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={published ? 'default' : 'secondary'}>{published ? 'Yayında' : 'Taslak'}</Badge>
                      {!['texts', 'menu', 'home-sections', 'page-content'].includes(tab) && (
                        <Badge variant={indexable ? 'outline' : 'destructive'} className={indexable ? 'border-emerald-300 text-emerald-700' : ''}>
                          {indexable ? <Eye className="mr-1 size-3" /> : <EyeOff className="mr-1 size-3" />}
                          {indexable ? 'İndekslenebilir' : 'İndekslenemez'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="icon" variant="outline" onClick={() => void openEdit(row)} aria-label="Düzenle"><Edit3 className="size-4" /></Button>
                      {tab !== 'page-content' && <Button size="icon" variant="destructive" onClick={() => setDeleteRow(row)} aria-label="Sil"><Trash2 className="size-4" /></Button>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {!loading && items.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Kayıt bulunamadı.</p>}
        </CardContent>
      </Card>}

      <Sheet open={Boolean(editor)} onOpenChange={(open) => !open && setEditor(null)}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-3xl">
          {editor && (
            <>
              <SheetHeader className="border-b px-5 py-4">
                <SheetTitle>{editor.id ? `${label(editor.body)} düzenle` : `Yeni ${tabs.find((item) => item.key === tab)?.label} kaydı`}</SheetTitle>
                <SheetDescription>Promats web içeriğini Paspas standart formunda düzenleyin.</SheetDescription>
              </SheetHeader>
              {tab !== 'page-content' && <div className="border-b px-5 py-3">
                <Tabs value={editorSection} onValueChange={(value) => setEditorSection(value as EditorSection)}>
                  <TabsList className="grid h-auto w-full grid-cols-4 gap-2 bg-transparent p-0">
                    <TabsTrigger value="content" className="gap-1.5 border bg-blue-50 text-blue-700 data-[state=active]:border-blue-400 data-[state=active]:bg-blue-100"><FileText className="size-4" /> İçerik</TabsTrigger>
                    <TabsTrigger value="media" className="gap-1.5 border bg-violet-50 text-violet-700 data-[state=active]:border-violet-400 data-[state=active]:bg-violet-100"><ImageIcon className="size-4" /> Medya</TabsTrigger>
                    <TabsTrigger value="seo" className="gap-1.5 border bg-emerald-50 text-emerald-700 data-[state=active]:border-emerald-400 data-[state=active]:bg-emerald-100"><Search className="size-4" /> SEO</TabsTrigger>
                    <TabsTrigger value="publishing" className="gap-1.5 border bg-orange-50 text-orange-700 data-[state=active]:border-orange-400 data-[state=active]:bg-orange-100"><Eye className="size-4" /> Yayın</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>}
              {editorSection === 'seo' && (
                <div className="mx-5 mt-4 flex items-center justify-between rounded-xl border bg-muted/20 p-4">
                  <div>
                    <div className="font-medium">SEO içerik puanı</div>
                    <p className="text-muted-foreground text-xs">Başlık, açıklama, slug ve görsel bütünlüğüne göre hesaplanır.</p>
                  </div>
                  <div className={`flex size-16 flex-col items-center justify-center rounded-full border-2 ${seoTone(seoScore(tab, editor.body))}`}>
                    <strong className="text-xl leading-none">{seoScore(tab, editor.body)}</strong>
                    <span className="text-[9px] uppercase">SEO</span>
                  </div>
                </div>
              )}
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                {tab === 'page-content' ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border bg-indigo-50 p-3 text-sm text-indigo-800">
                      <strong>{String(editor.body.page_key)}</strong> · {String(editor.body.locale).toUpperCase()}
                      <p className="mt-1 text-xs">Bu kayıt sayfanın tüm başlık, metin, SEO, buton ve bölüm içeriklerinin tek kaynağıdır.</p>
                    </div>
                    <Label htmlFor="page-content-json">Sayfa içeriği</Label>
                    <Textarea
                      id="page-content-json"
                      className="min-h-[560px] font-mono text-xs leading-5"
                      value={String(editor.body.content_json ?? '')}
                      onChange={(event) => setEditor({ ...editor, body: { ...editor.body, content_json: event.target.value } })}
                    />
                  </div>
                ) : (
                <div className="grid gap-4 md:grid-cols-2">
                {(fields[tab] ?? []).filter((field) => (field.section ?? 'content') === editorSection).map((field) => {
                  const value = editor.body[field.key];
                  const setValue = (next: unknown) => setEditor({
                    ...editor,
                    body: { ...editor.body, [field.key]: next },
                  });
                  if (field.kind === 'toggle') {
                    return (
                      <div key={field.key} className="flex items-center justify-between rounded-lg border p-3">
                        <Label>{field.label}</Label>
                        <Switch checked={Number(value ?? 0) === (field.key === 'status' ? 0 : 1)} onCheckedChange={(checked) => setValue(field.key === 'status' ? (checked ? 0 : 1) : (checked ? 1 : 0))} />
                      </div>
                    );
                  }
                  const wide = field.kind === 'textarea' || field.kind === 'richtext';
                  return (
                    <div key={field.key} className={`space-y-1.5 ${wide ? 'md:col-span-2' : ''}`}>
                      {field.kind !== 'richtext' && field.section !== 'media' && (
                        <div className="flex items-center justify-between gap-2">
                          <Label htmlFor={`web-field-${field.key}`}>{field.label}</Label>
                          {field.section && <span className="text-xs text-muted-foreground">{field.section === 'seo' ? 'SEO' : field.section === 'publishing' ? 'Yayın' : 'İçerik'}</span>}
                        </div>
                      )}
                      {field.section === 'media' ? (
                        <AdminImageUploadField
                          label={field.label}
                          helperText="Mevcut görseli görüntüleyin; bilgisayardan yükleyin veya Storage kütüphanesinden seçin."
                          value={adminMediaUrl(value)}
                          onChange={setValue}
                          bucket="web-promats"
                          folder={`content/${tab}`}
                          metadata={{
                            sourceApp: 'promats-web',
                            tenant: 'promats',
                            usage: field.key,
                            contentType: tab,
                          }}
                          previewAspect="16x9"
                          previewObjectFit="contain"
                        />
                      ) : field.kind === 'richtext' ? (
                        <RichContentEditor
                          label={field.label}
                          value={String(value ?? '')}
                          onChange={setValue}
                          height="320px"
                          onUploadImage={uploadEditorImage}
                        />
                      ) : field.kind === 'textarea' ? (
                        <Textarea id={`web-field-${field.key}`} className={field.key === 'content' || field.key === 'detail' ? 'min-h-52' : 'min-h-24'} value={String(value ?? '')} onChange={(event) => setValue(event.target.value)} />
                      ) : (
                        <Input id={`web-field-${field.key}`} type={field.kind === 'number' ? 'number' : field.kind === 'date' ? 'datetime-local' : 'text'} value={String(value ?? '')} onChange={(event) => setValue(field.kind === 'number' ? Number(event.target.value) : event.target.value)} />
                      )}
                    </div>
                  );
                })}
                {(fields[tab] ?? []).filter((field) => (field.section ?? 'content') === editorSection).length === 0 && (
                  <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
                    Bu kayıt türünde {editorSection === 'media' ? 'medya' : editorSection === 'seo' ? 'SEO' : editorSection === 'publishing' ? 'yayın' : 'içerik'} alanı bulunmuyor.
                  </div>
                )}
                </div>
                )}
              </div>
              <SheetFooter className="border-t px-5 py-4 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setEditor(null)}>Vazgeç</Button>
                <Button onClick={() => void saveEditor()}><Save className="mr-2 size-4" /> Kaydet</Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={Boolean(deleteRow)} onOpenChange={(open) => !open && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kayıt silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleteRow ? label(deleteRow) : ''}” kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
