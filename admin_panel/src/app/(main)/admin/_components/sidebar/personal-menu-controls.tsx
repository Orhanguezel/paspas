'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowDown, ArrowUp, Eye, EyeOff, RotateCcw, Settings2, Star } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useGetMenuPreferenceQuery, usePutMenuPreferenceMutation } from '@/integrations/endpoints/admin/menu_preference.endpoints';
import type { NavGroup, NavMainItem } from '@/navigation/sidebar/sidebar-items';
import { emptyPersonalMenu, moveKey, normalizePersonalMenu, personalMenuView, sortByKeys, type PersonalMenu } from '@/navigation/sidebar/personal-menu';

import { NavMain } from './nav-main';

export function PersonalMenuControls({ groups, userId }: { groups: readonly NavGroup[]; userId: string }) {
  const path = usePathname();
  const query = useGetMenuPreferenceQuery(userId, { refetchOnFocus: true });
  const [putPreference] = usePutMenuPreferenceMutation();
  const [local, setLocal] = useState<PersonalMenu | null>(null);
  const [open, setOpen] = useState(false);
  const groupsRef = useRef(groups);
  const localRef = useRef(local);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  groupsRef.current = groups;
  localRef.current = local;

  useEffect(() => { setLocal(null); }, [userId]);
  useEffect(() => {
    if (!local) return;
    const value = normalizePersonalMenu(groupsRef.current, local);
    const saved = JSON.stringify(local);
    const timer = window.setTimeout(() => {
      const job = saveQueueRef.current.then(() => putPreference(value).unwrap());
      saveQueueRef.current = job.then(() => undefined, () => undefined);
      void job.then(async () => {
        if (localRef.current && JSON.stringify(localRef.current) === saved) {
          await query.refetch();
          if (localRef.current && JSON.stringify(localRef.current) === saved) setLocal(null);
        }
      }).catch(() => toast.error('Menü tercihi kaydedilemedi.'));
    }, 450);
    return () => window.clearTimeout(timer);
  }, [local, putPreference, query.refetch]);

  const current = normalizePersonalMenu(groups, local ?? query.data?.value);
  const view = useMemo(() => personalMenuView(groups, current, path), [groups, current, path]);
  const update = (change: (before: PersonalMenu) => PersonalMenu) =>
    setLocal((before) => normalizePersonalMenu(groups, change(before ?? current)));
  const toggleFavorite = (key: string) => update((before) => ({
    ...before, favorites: before.favorites.includes(key) ? before.favorites.filter((item) => item !== key) : [...before.favorites, key],
  }));
  const toggleHidden = (key: string) => update((before) => ({
    ...before, hidden: before.hidden.includes(key) ? before.hidden.filter((item) => item !== key) : [...before.hidden, key],
  }));
  const orderedGroups = sortByKeys(groups, current.groupOrder, (group) => group.key);
  const groupKeys = orderedGroups.map((group) => group.key);
  const reorderGroups = (key: NavGroup['key'], delta: number) => {
    const index = groupKeys.indexOf(key);
    const target = groupKeys[index + delta];
    if (target) update((before) => ({ ...before, groupOrder: moveKey(groupKeys, key, target) }));
  };
  const reorderItems = (group: NavGroup, key: NavMainItem['key'], delta: number) => {
    const keys = sortByKeys(group.items, current.itemOrder[group.key] ?? [], (item) => item.key).map((item) => item.key);
    const target = keys[keys.indexOf(key) + delta];
    if (target) update((before) => ({ ...before, itemOrder: { ...before.itemOrder, [group.key]: moveKey(keys, key, target) } }));
  };

  return <>
    <NavMain items={view.favorites.length ? [{ id: 0, key: 'favorites' as NavGroup['key'], label: 'Favorilerim', items: view.favorites }, ...view.groups] : view.groups}
      favorites={current.favorites} onToggleFavorite={toggleFavorite} showQuickCreate={false} />
    <button type="button" className="mx-2 mb-2 flex h-9 items-center gap-2 rounded-md px-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden"
      onClick={() => setOpen(true)}><Settings2 className="size-4" />Menüyü düzenle</button>
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader><SheetTitle>Kişisel menüm</SheetTitle>
          <SheetDescription>Favorilerinizi, bölüm ve sayfa sırasını düzenleyin. Gizleme erişim yetkinizi değiştirmez.</SheetDescription>
        </SheetHeader>
        <div className="space-y-5 p-4">
          {query.isError && <p role="alert" className="text-sm text-destructive">Menü tercihi okunamadı. Kaydetmeden önce bağlantıyı yenileyin.</p>}
          <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">Bölüm sırası</h3>
            <Button type="button" size="sm" variant="outline" onClick={() => update(() => emptyPersonalMenu())}><RotateCcw className="mr-1 size-4" />Varsayılana sıfırla</Button>
          </div>
          <div className="space-y-1.5">{orderedGroups.map((group, index) =>
            <div key={group.key} className="flex items-center rounded-md border bg-background px-2 py-1.5">
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{group.label}</span>
              <Button type="button" size="icon" variant="ghost" className="size-7" disabled={index === 0} aria-label={`${group.label} yukarı taşı`} onClick={() => reorderGroups(group.key, -1)}><ArrowUp className="size-4" /></Button>
              <Button type="button" size="icon" variant="ghost" className="size-7" disabled={index === orderedGroups.length - 1} aria-label={`${group.label} aşağı taşı`} onClick={() => reorderGroups(group.key, 1)}><ArrowDown className="size-4" /></Button>
            </div>)}</div>
          {orderedGroups.map((group) => {
            const items = sortByKeys(group.items, current.itemOrder[group.key] ?? [], (item) => item.key);
            return <section key={group.key} className="space-y-2"><h3 className="border-b pb-1 text-sm font-semibold">{group.label}</h3>
              <div className="space-y-1.5">{items.map((item, index) => {
                const favorite = current.favorites.includes(item.key);
                const hidden = current.hidden.includes(item.key);
                return <div key={item.key} className="flex items-center rounded-md border bg-background px-2 py-1.5">
                  <span className={`min-w-0 flex-1 truncate text-sm ${hidden ? 'text-muted-foreground' : ''}`}>{item.title}</span>
                  <Button type="button" size="icon" variant="ghost" className="size-7" aria-label={`${item.title}: ${favorite ? 'favorilerden çıkar' : 'favorilere ekle'}`} onClick={() => toggleFavorite(item.key)}><Star className={`size-4 ${favorite ? 'fill-current text-amber-500' : ''}`} /></Button>
                  <Button type="button" size="icon" variant="ghost" className="size-7" aria-label={`${item.title}: ${hidden ? 'göster' : 'gizle'}`} onClick={() => toggleHidden(item.key)}>{hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button>
                  <Button type="button" size="icon" variant="ghost" className="size-7" disabled={index === 0} aria-label={`${item.title} yukarı taşı`} onClick={() => reorderItems(group, item.key, -1)}><ArrowUp className="size-4" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="size-7" disabled={index === items.length - 1} aria-label={`${item.title} aşağı taşı`} onClick={() => reorderItems(group, item.key, 1)}><ArrowDown className="size-4" /></Button>
                </div>;
              })}</div>
            </section>;
          })}
          <p className="text-xs text-muted-foreground">Değişiklikler hesabınıza otomatik kaydedilir.</p>
        </div>
      </SheetContent>
    </Sheet>
  </>;
}
