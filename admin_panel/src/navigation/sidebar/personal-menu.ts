import type { NavGroup, NavMainItem } from './sidebar-items';

export type PersonalMenu = {
  favorites: string[];
  hidden: string[];
  groupOrder: string[];
  itemOrder: Record<string, string[]>;
};

export const emptyPersonalMenu = (): PersonalMenu => ({ favorites: [], hidden: [], groupOrder: [], itemOrder: {} });

const uniqueAllowed = (value: unknown, allowed: Set<string>): string[] =>
  Array.isArray(value) ? [...new Set(value.filter((key): key is string => typeof key === 'string' && allowed.has(key)))] : [];

export function normalizePersonalMenu(groups: readonly NavGroup[], input: unknown): PersonalMenu {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return emptyPersonalMenu();
  const raw = input as Partial<PersonalMenu>;
  const groupKeys = new Set(groups.map((group) => group.key));
  const itemKeys = new Set(groups.flatMap((group) => group.items.map((item) => item.key)));
  const itemOrder: Record<string, string[]> = {};
  for (const group of groups) {
    const allowed = new Set(group.items.map((item) => item.key));
    itemOrder[group.key] = uniqueAllowed(raw.itemOrder?.[group.key], allowed);
  }
  return {
    favorites: uniqueAllowed(raw.favorites, itemKeys),
    hidden: uniqueAllowed(raw.hidden, itemKeys),
    groupOrder: uniqueAllowed(raw.groupOrder, groupKeys),
    itemOrder,
  };
}

export function sortByKeys<T>(values: readonly T[], order: readonly string[], getKey: (value: T) => string): T[] {
  const rank = new Map(order.map((key, index) => [key, index]));
  return [...values].sort((a, b) => (rank.get(getKey(a)) ?? 9999) - (rank.get(getKey(b)) ?? 9999));
}

export function moveKey(keys: readonly string[], active: string, over: string): string[] {
  const from = keys.indexOf(active);
  const to = keys.indexOf(over);
  if (from < 0 || to < 0 || from === to) return [...keys];
  const next = [...keys];
  next.splice(from, 1);
  next.splice(to, 0, active);
  return next;
}

export function personalMenuView(groups: readonly NavGroup[], preference: PersonalMenu, path: string) {
  const menu = normalizePersonalMenu(groups, preference);
  const hidden = new Set(menu.hidden);
  const allItems = new Map<string, NavMainItem>(groups.flatMap((group) => group.items.map((item) => [item.key, item])));
  const favorites = menu.favorites.map((key) => allItems.get(key)).filter((item): item is NavMainItem => item !== undefined && !hidden.has(item.key));
  const isCurrent = (item: NavMainItem) => path === item.url.split('?')[0] ||
    item.subItems?.some((sub) => path === sub.url.split('?')[0]);
  return {
    favorites,
    groups: sortByKeys(groups, menu.groupOrder, (group) => group.key).map((group) => ({
      ...group,
      items: sortByKeys(group.items, menu.itemOrder[group.key] ?? [], (item) => item.key)
        .filter((item) => !hidden.has(item.key) || isCurrent(item)),
    })).filter((group) => group.items.length > 0),
  };
}
