'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/storage/_components/admin-storage-client.tsx
// FINAL — Admin Storage List (App Router + shadcn)
// - Modern UI with shadcn/ui components
// - File management system
// - Image previews
// - Bucket & folder filters
// - Bulk operations
// =============================================================

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Pencil,
  Loader2,
  Image as ImageIcon,
  File,
  Folder,
  Download,
  CheckSquare,
  Square,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

import type { StorageAsset, StorageListQuery } from '@/integrations/shared';
import {
  useListAssetsAdminQuery,
  useDeleteAssetAdminMutation,
  useBulkDeleteAssetsAdminMutation,
  useListFoldersAdminQuery,
} from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

type Filters = {
  search: string;
  bucket: string;
  folder: string;
  mime: string;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function fmtDate(val: string | null | undefined) {
  if (!val) return '-';
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    return d.toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(val);
  }
}

function truncate(text: string | null | undefined, max = 40) {
  const t = text || '';
  if (t.length <= max) return t || '-';
  return t.slice(0, max - 1) + '…';
}

function getMimeIcon(mime: string) {
  if (mime.startsWith('image/')) return ImageIcon;
  return File;
}

function getMimeColor(mime: string): string {
  if (mime.startsWith('image/')) return 'text-blue-600 dark:text-blue-400';
  if (mime.startsWith('video/')) return 'text-purple-600 dark:text-purple-400';
  if (mime.startsWith('audio/')) return 'text-green-600 dark:text-green-400';
  if (mime.includes('pdf')) return 'text-red-600 dark:text-red-400';
  return 'text-muted-foreground';
}

export default function AdminStorageClient() {
  const router = useRouter();
  const t = useAdminT('admin.storage');

  function getErrMsg(e: unknown): string {
    const anyErr = e as any;
    return (
      anyErr?.data?.error?.message ||
      anyErr?.data?.message ||
      anyErr?.message ||
      t('errorFallback')
    );
  }

  const [filters, setFilters] = React.useState<Filters>({
    search: '',
    bucket: 'all',
    folder: 'all',
    mime: 'all',
  });

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Build query params
  const queryParams = React.useMemo((): StorageListQuery => {
    return {
      q: filters.search || undefined,
      bucket: filters.bucket !== 'all' ? filters.bucket : undefined,
      folder: filters.folder !== 'all' ? filters.folder : undefined,
      mime: filters.mime !== 'all' ? filters.mime : undefined,
      sort: 'created_at',
      order: 'desc',
      limit: 100,
    };
  }, [filters]);

  // RTK Query
  const {
    data: result,
    isLoading,
    isFetching,
    refetch,
  } = useListAssetsAdminQuery(queryParams);

  const { data: folders = [] } = useListFoldersAdminQuery();

  const [deleteAsset] = useDeleteAssetAdminMutation();
  const [bulkDeleteAssets] = useBulkDeleteAssetsAdminMutation();

  const items = result?.items || [];
  const total = result?.total || 0;

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<StorageAsset | null>(null);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleBucketChange = (value: string) => {
    setFilters((prev) => ({ ...prev, bucket: value }));
  };

  const handleFolderChange = (value: string) => {
    setFilters((prev) => ({ ...prev, folder: value }));
  };

  const handleMimeChange = (value: string) => {
    setFilters((prev) => ({ ...prev, mime: value }));
  };

  const handleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error(t('list.selectFileError'));
      return;
    }

    try {
      await bulkDeleteAssets({ ids: Array.from(selectedIds) }).unwrap();
      toast.success(t('list.filesDeleted', { count: selectedIds.size }));
      setSelectedIds(new Set());
      refetch();
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  const handleEdit = (item: StorageAsset) => {
    router.push(`/admin/storage/${item.id}`);
  };

  const handleDeleteClick = (item: StorageAsset) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      await deleteAsset({ id: itemToDelete.id }).unwrap();
      toast.success(t('list.fileDeleted'));
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      refetch();
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  const busy = isLoading;
  const hasSelection = selectedIds.size > 0;

  // Unique buckets from items
  const buckets = React.useMemo(() => {
    const set = new Set(items.map((item) => item.bucket).filter(Boolean));
    return Array.from(set);
  }, [items]);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle>{t('list.title')}</CardTitle>
                <CardDescription>
                  {t('list.description')}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {hasSelection && (
                  <Button
                    variant="destructive"
                    onClick={handleBulkDelete}
                    disabled={busy}
                    className="gap-2"
                  >
                    <Trash2 className="size-4" />
                    {t('list.deleteSelected', { count: selectedIds.size })}
                  </Button>
                )}
                <Button
                  onClick={() => router.push('/admin/storage/new')}
                  disabled={busy}
                  className="gap-2"
                >
                  <Plus className="size-4" />
                  {t('list.uploadButton')}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="search" className="text-sm">
                  {t('list.searchLabel')}
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder={t('list.searchPlaceholder')}
                    value={filters.search}
                    onChange={(e) => handleSearch(e.target.value)}
                    disabled={busy}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Bucket */}
              <div className="space-y-2">
                <Label htmlFor="bucket" className="text-sm">
                  {t('list.bucketLabel')}
                </Label>
                <Select
                  value={filters.bucket}
                  onValueChange={handleBucketChange}
                  disabled={busy}
                >
                  <SelectTrigger id="bucket">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('list.allOption')}</SelectItem>
                    {buckets.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Folder */}
              <div className="space-y-2">
                <Label htmlFor="folder" className="text-sm">
                  <div className="flex items-center gap-1.5">
                    <Folder className="size-3.5" />
                    {t('list.folderLabel')}
                  </div>
                </Label>
                <Select
                  value={filters.folder}
                  onValueChange={handleFolderChange}
                  disabled={busy}
                >
                  <SelectTrigger id="folder">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f || t('list.rootFolder')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* MIME Filter */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="mime" className="text-sm">
                  {t('list.fileTypeLabel')}
                </Label>
                <Select
                  value={filters.mime}
                  onValueChange={handleMimeChange}
                  disabled={busy}
                >
                  <SelectTrigger id="mime">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('list.allOption')}</SelectItem>
                    <SelectItem value="image/">{t('list.imageType')}</SelectItem>
                    <SelectItem value="video/">{t('list.videoType')}</SelectItem>
                    <SelectItem value="audio/">{t('list.audioType')}</SelectItem>
                    <SelectItem value="application/pdf">{t('list.pdfType')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end lg:col-span-3">
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={busy}
                  className="gap-2"
                >
                  <RefreshCcw
                    className={cn('size-4', isFetching && 'animate-spin')}
                  />
                  {t('list.refreshButton')}
                </Button>
              </div>
            </div>

            {/* Info */}
            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>
                {t('list.totalFiles', { total })}
                {hasSelection && ` • ${t('list.selectedCount', { count: selectedIds.size })}`}
              </span>
              {isFetching && (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t('list.loading')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table (Desktop) */}
        <Card className="hidden xl:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleSelectAll}
                      disabled={busy}
                    >
                      {selectedIds.size === items.length && items.length > 0 ? (
                        <CheckSquare className="size-4" />
                      ) : (
                        <Square className="size-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="w-16">{t('list.previewColumn')}</TableHead>
                  <TableHead>{t('list.fileColumn')}</TableHead>
                  <TableHead className="w-32">{t('list.bucketColumn')}</TableHead>
                  <TableHead className="w-32">{t('list.folderColumn')}</TableHead>
                  <TableHead className="w-32">{t('list.typeColumn')}</TableHead>
                  <TableHead className="w-24 text-right">{t('list.sizeColumn')}</TableHead>
                  <TableHead className="w-44">{t('list.dateColumn')}</TableHead>
                  <TableHead className="w-40 text-right">{t('list.actionsColumn')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="size-5 animate-spin" />
                        <span>{t('list.loading')}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      {t('list.noFiles')}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => {
                    const Icon = getMimeIcon(item.mime);
                    const colorClass = getMimeColor(item.mime);
                    const isSelected = selectedIds.has(item.id);

                    return (
                      <TableRow key={item.id} className={cn(isSelected && 'bg-muted/50')}>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleSelectItem(item.id)}
                            disabled={busy}
                          >
                            {isSelected ? (
                              <CheckSquare className="size-4" />
                            ) : (
                              <Square className="size-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          {item.url && item.mime.startsWith('image/') ? (
                            <img
                              src={item.url}
                              alt={item.name}
                              className="size-10 rounded object-cover"
                            />
                          ) : (
                            <div className="flex size-10 items-center justify-center rounded bg-muted">
                              <Icon className={cn('size-5', colorClass)} />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{truncate(item.name, 30)}</div>
                            {item.path && (
                              <div className="text-xs text-muted-foreground">
                                {truncate(item.path, 40)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.bucket}</Badge>
                        </TableCell>
                        <TableCell>
                          {item.folder ? (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Folder className="size-3" />
                              {item.folder}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {item.mime.split('/')[1] || item.mime}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatBytes(item.size)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div>{fmtDate(item.created_at)}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {item.url && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                asChild
                                title={t('list.downloadTitle')}
                              >
                                <a href={item.url} download target="_blank" rel="noopener noreferrer">
                                  <Download className="size-3.5" />
                                </a>
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              disabled={busy}
                              className="gap-2"
                            >
                              <Pencil className="size-3.5" />
                              {t('list.editButton')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(item)}
                              disabled={busy}
                              className="gap-2"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Cards (Mobile) */}
        <div className="space-y-4 xl:hidden">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  <Loader2 className="size-5 animate-spin" />
                  <span>{t('admin.storage.list.loading')}</span>
                </div>
              </CardContent>
            </Card>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {t('list.noFiles')}
              </CardContent>
            </Card>
          ) : (
            items.map((item) => {
              const Icon = getMimeIcon(item.mime);
              const colorClass = getMimeColor(item.mime);
              const isSelected = selectedIds.has(item.id);

              return (
                <Card key={item.id} className={cn(isSelected && 'ring-2 ring-primary')}>
                  <CardContent className="space-y-4 pt-6">
                    {/* Preview & Selection */}
                    <div className="flex items-start gap-4">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleSelectItem(item.id)}
                        disabled={busy}
                      >
                        {isSelected ? (
                          <CheckSquare className="size-4" />
                        ) : (
                          <Square className="size-4" />
                        )}
                      </Button>

                      {item.url && item.mime.startsWith('image/') ? (
                        <img
                          src={item.url}
                          alt={item.name}
                          className="size-20 rounded object-cover"
                        />
                      ) : (
                        <div className="flex size-20 items-center justify-center rounded bg-muted">
                          <Icon className={cn('size-8', colorClass)} />
                        </div>
                      )}

                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{item.bucket}</Badge>
                          {item.folder && (
                            <Badge variant="secondary">
                              <Folder className="size-3" />
                              {item.folder}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.mime.split('/')[1]} • {formatBytes(item.size)}
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="text-xs text-muted-foreground">
                      {fmtDate(item.created_at)}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {item.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="flex-1 gap-2"
                        >
                          <a href={item.url} download target="_blank" rel="noopener noreferrer">
                            <Download className="size-3.5" />
                            {t('list.downloadTitle')}
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        disabled={busy}
                        className="flex-1 gap-2"
                      >
                        <Pencil className="size-3.5" />
                        {t('list.editButton')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(item)}
                        disabled={busy}
                        className="gap-2"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('list.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('list.deleteConfirmDescription', { name: itemToDelete?.name || t('list.defaultFileName') })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('list.cancelButton')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>{t('list.deleteButton')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
