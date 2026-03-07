'use client';

// =============================================================
// FILE: src/app/(main)/admin/urunler/_components/urunler-client.tsx
// Paspas ERP — Ürünler liste sayfası
// =============================================================

import { useState } from 'react';
import Link from 'next/link';
import { Plus, RefreshCcw, Pencil, Trash2, Search, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useLocaleContext } from '@/i18n/LocaleProvider';
import { resolveMediaUrl } from '@/lib/media-url';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

import {
  useListUrunlerAdminQuery,
  useDeleteUrunAdminMutation,
  useGetUrunAdminQuery,
  useGetUrunReceteAdminQuery,
} from '@/integrations/endpoints/admin/erp/urunler_admin.endpoints';
import type { UrunDto, UrunKategori, TedarikTipi } from '@/integrations/shared/erp/urunler.types';
import UrunForm from './urun-form';

const KATEGORI_OPTIONS: UrunKategori[] = ['urun', 'yarimamul', 'hammadde'];
const TEDARIK_OPTIONS: TedarikTipi[] = ['uretim', 'satin_alma', 'fason'];

export default function UrunlerClient() {
  const { t } = useLocaleContext();
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [tedarikFilter, setTedarikFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UrunDto | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UrunDto | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const queryParams: Record<string, string | number> = {};
  if (search) queryParams.search = search;
  if (kategoriFilter) queryParams.kategori = kategoriFilter;
  if (tedarikFilter) queryParams.tedarikTipi = tedarikFilter;

  const { data, isLoading, isFetching, refetch } = useListUrunlerAdminQuery(
    Object.keys(queryParams).length > 0 ? queryParams as any : undefined,
  );

  // Fetch full product with operasyonlar when editing
  const { data: fullUrun } = useGetUrunAdminQuery(editingId!, { skip: !editingId });

  const [deleteUrun, deleteState] = useDeleteUrunAdminMutation();

  const items = data?.items ?? [];

  function openCreate() {
    setEditing(null);
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(u: UrunDto) {
    setEditingId(u.id);
    setEditing(u);
    setFormOpen(true);
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditing(null);
    setEditingId(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteUrun(deleteTarget.id).unwrap();
      toast.success(t('admin.erp.common.deleted', { item: t('admin.erp.urunler.singular') }));
    } catch (err: any) {
      toast.error(err?.data?.error?.message ?? t('admin.erp.common.deleteFailed'));
    } finally {
      setDeleteTarget(null);
    }
  }

  const tKategori = (k: string) => t(`admin.erp.urunler.kategoriLabel.${k}`);
  const tTedarik = (k: string) => t(`admin.erp.urunler.tedarikTipiLabel.${k}`);

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{t('admin.erp.urunler.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('admin.erp.common.totalCount', { count: String(data?.total ?? 0), item: t('admin.erp.urunler.singular').toLowerCase() })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/db?module=categories">Kategori Yonetimi</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={`size-4${isFetching ? ' animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1 size-4" /> {t('admin.erp.urunler.newItem')}
          </Button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('admin.erp.urunler.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={kategoriFilter || 'all'}
          onValueChange={(v) => setKategoriFilter(v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.erp.urunler.allCategories')}</SelectItem>
            {KATEGORI_OPTIONS.map((k) => (
              <SelectItem key={k} value={k}>{tKategori(k)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={tedarikFilter || 'all'}
          onValueChange={(v) => setTedarikFilter(v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.erp.urunler.allTedarikTipi')}</SelectItem>
            {TEDARIK_OPTIONS.map((k) => (
              <SelectItem key={k} value={k}>{tTedarik(k)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tablo */}
      <div className="rounded-lg border bg-background overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>{t('admin.erp.urunler.columns.kod')}</TableHead>
              <TableHead>{t('admin.erp.urunler.columns.gorsel')}</TableHead>
              <TableHead>{t('admin.erp.urunler.columns.ad')}</TableHead>
              <TableHead>{t('admin.erp.urunler.columns.kategori')}</TableHead>
              <TableHead>{t('admin.erp.urunler.columns.tedarikTipi')}</TableHead>
              <TableHead>{t('admin.erp.urunler.columns.birim')}</TableHead>
              <TableHead className="text-right">{t('admin.erp.urunler.columns.stok')}</TableHead>
              <TableHead className="text-right">{t('admin.erp.urunler.columns.kritikStok')}</TableHead>
              <TableHead className="text-right">{t('admin.erp.urunler.columns.birimFiyat')}</TableHead>
              <TableHead>{t('admin.erp.urunler.columns.durum')}</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 12 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            )}

            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={12} className="py-10 text-center text-sm text-muted-foreground">
                  {t('admin.erp.urunler.notFound')}
                </TableCell>
              </TableRow>
            )}

            {!isLoading && items.map((u) => {
              const isExpanded = expandedId === u.id;
              return (
                <ExpandableProductRow
                  key={u.id}
                  urun={u}
                  isExpanded={isExpanded}
                  onToggle={() => setExpandedId(isExpanded ? null : u.id)}
                  onEdit={() => openEdit(u)}
                  onDelete={() => setDeleteTarget(u)}
                  tKategori={tKategori}
                  tTedarik={tTedarik}
                  t={t}
                  allProducts={items}
                />
              );
            })}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Form Sheet — use full product data when editing */}
      <UrunForm
        open={formOpen}
        onClose={handleFormClose}
        urun={editingId && fullUrun ? fullUrun : editing}
      />

      {/* Silme onayı */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.erp.urunler.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.erp.common.deleteDescriptionIrreversible', { name: deleteTarget?.ad ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteState.isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteState.isLoading ? t('admin.erp.common.deleting') : t('admin.common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── ExpandableProductRow ─────────────────────────────────────
interface ExpandableProductRowProps {
  urun: UrunDto;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  tKategori: (k: string) => string;
  tTedarik: (k: string) => string;
  t: (key: string, params?: Record<string, string>) => string;
  allProducts: UrunDto[];
}

function ExpandableProductRow({
  urun: u,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  tKategori,
  tTedarik,
  t,
  allProducts,
}: ExpandableProductRowProps) {
  const { data: receteData, isLoading: receteLoading } = useGetUrunReceteAdminQuery(u.id, {
    skip: !isExpanded,
  });

  const receteItems = receteData?.items ?? [];

  return (
    <>
      <TableRow className="hover:bg-muted/40">
        <TableCell className="w-8 px-1">
          <Button variant="ghost" size="icon" className="size-6" onClick={onToggle}>
            <ChevronRight
              className={`size-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </Button>
        </TableCell>
        <TableCell className="font-mono text-xs whitespace-nowrap">{u.kod}</TableCell>
        <TableCell>
          {u.imageUrl ? (
            <img
              src={resolveMediaUrl(u.imageUrl)}
              alt={u.imageAlt || u.ad}
              className="h-10 w-10 rounded object-cover border"
              loading="lazy"
            />
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="font-medium">{u.ad}</TableCell>
        <TableCell>
          <Badge variant="outline">{tKategori(u.kategori)}</Badge>
        </TableCell>
        <TableCell>
          <Badge variant={u.tedarikTipi === 'uretim' ? 'default' : 'secondary'}>
            {tTedarik(u.tedarikTipi)}
          </Badge>
        </TableCell>
        <TableCell className="whitespace-nowrap">{u.birim}</TableCell>
        <TableCell className="text-right tabular-nums">
          {u.stok.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {u.kritikStok.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {u.birimFiyat != null
            ? u.birimFiyat.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
            : '—'}
        </TableCell>
        <TableCell>
          <Badge variant={u.isActive ? 'default' : 'secondary'}>
            {u.isActive ? t('admin.erp.common.active') : t('admin.erp.common.inactive')}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="bg-muted/20 hover:bg-muted/30">
          <TableCell colSpan={12} className="p-0">
            <div className="px-6 py-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                {t('admin.erp.urunler.form.receteTitle')}
              </p>
              {receteLoading && (
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              )}
              {!receteLoading && receteItems.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {t('admin.erp.urunler.form.receteYok')}
                </p>
              )}
              {!receteLoading && receteItems.length > 0 && (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground border-b">
                      <th className="text-left py-1 pr-4">{t('admin.erp.urunler.form.receteMalzeme')}</th>
                      <th className="text-right py-1 pr-4">{t('admin.erp.urunler.form.receteMiktar')}</th>
                      <th className="text-right py-1 pr-4">{t('admin.erp.urunler.form.receteBirim')}</th>
                      <th className="text-right py-1 pr-4">{t('admin.erp.urunler.form.receteFire')}</th>
                      <th className="text-right py-1 pr-4">{t('admin.erp.urunler.form.receteSonAlis')}</th>
                      <th className="text-right py-1">{t('admin.erp.urunler.form.receteSatirMaliyet')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receteItems.map((item) => {
                      const malzeme = allProducts.find((p) => p.id === item.urunId);
                      const birimFiyat = malzeme?.birimFiyat ?? 0;
                      const satirMaliyet = item.miktar * (1 + item.fireOrani / 100) * birimFiyat;
                      return (
                        <tr key={item.id} className="border-b border-muted/50">
                          <td className="py-1.5 pr-4">
                            {malzeme ? `${malzeme.kod} — ${malzeme.ad}` : item.urunId}
                          </td>
                          <td className="text-right py-1.5 pr-4 tabular-nums">
                            {item.miktar.toLocaleString('tr-TR', { maximumFractionDigits: 4 })}
                          </td>
                          <td className="text-right py-1.5 pr-4">{malzeme?.birim ?? '—'}</td>
                          <td className="text-right py-1.5 pr-4 tabular-nums">
                            %{item.fireOrani.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="text-right py-1.5 pr-4 tabular-nums">
                            {birimFiyat
                              ? birimFiyat.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
                              : '—'}
                          </td>
                          <td className="text-right py-1.5 tabular-nums font-medium">
                            {satirMaliyet.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5} className="text-right py-1.5 pr-4 font-medium">
                        {t('admin.erp.urunler.form.receteToplamMaliyet')}:
                      </td>
                      <td className="text-right py-1.5 tabular-nums font-semibold">
                        {receteItems
                          .reduce((sum, item) => {
                            const m = allProducts.find((p) => p.id === item.urunId);
                            return sum + item.miktar * (1 + item.fireOrani / 100) * (m?.birimFiyat ?? 0);
                          }, 0)
                          .toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
