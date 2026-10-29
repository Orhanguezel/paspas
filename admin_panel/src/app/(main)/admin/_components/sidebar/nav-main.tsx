'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ChevronDown, ChevronRight, MailIcon, PlusCircleIcon, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import type { NavGroup, NavMainItem } from '@/navigation/sidebar/sidebar-items';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

interface NavMainProps {
  readonly items: readonly NavGroup[];
  readonly favorites?: readonly string[];
  readonly onToggleFavorite?: (key: string) => void;
  /** Quick create button; set false to hide */
  showQuickCreate?: boolean;
}

const IsComingSoon = ({ text }: { text: string }) => (
  <span className="ml-auto rounded-md bg-muted px-2 py-1 text-muted-foreground text-xs">{text}</span>
);

function isPathActive(currentPath: string, targetUrl: string) {
  const p = String(currentPath || '/');
  const u = String(targetUrl || '/');

  // exact match OR sub-route match
  // /admin/site-settings -> active on /admin/site-settings and /admin/site-settings/xxx
  return p === u || p.startsWith(u + '/');
}

const NavItemExpanded = ({
  item,
  isActive,
  isSubmenuOpen,
  comingSoonText,
  favorite,
  onToggleFavorite,
}: {
  item: NavMainItem;
  isActive: (url: string, subItems?: NavMainItem['subItems']) => boolean;
  isSubmenuOpen: (subItems?: NavMainItem['subItems']) => boolean;
  comingSoonText: string;
  favorite?: boolean;
  onToggleFavorite?: (key: string) => void;
}) => {
  return (
    <Collapsible
      key={item.title}
      asChild
      defaultOpen={isSubmenuOpen(item.subItems)}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          {item.subItems ? (
            <SidebarMenuButton
              disabled={item.comingSoon}
              isActive={isActive(item.url, item.subItems)}
              tooltip={item.title}
            >
              {item.icon && <item.icon />}
              <span>{item.title}</span>
              {item.comingSoon && <IsComingSoon text={comingSoonText} />}
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          ) : (
            <SidebarMenuButton
              asChild
              aria-disabled={item.comingSoon}
              isActive={isActive(item.url)}
              tooltip={item.title}
            >
              <Link prefetch={false} href={item.url} target={undefined}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
                {item.comingSoon && <IsComingSoon text={comingSoonText} />}
              </Link>
            </SidebarMenuButton>
          )}
        </CollapsibleTrigger>

        {onToggleFavorite && <SidebarMenuAction type="button" title={favorite ? 'Favorilerimden çıkar' : 'Favorilerime ekle'}
          aria-label={`${item.title}: ${favorite ? 'favorilerimden çıkar' : 'favorilerime ekle'}`}
          onClick={(event) => { event.preventDefault(); event.stopPropagation(); onToggleFavorite(item.key); }}>
          <Star className={favorite ? 'fill-current text-amber-500' : ''} />
        </SidebarMenuAction>}

        {item.subItems && (
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.subItems.map((subItem) => (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    aria-disabled={subItem.comingSoon}
                    isActive={isActive(subItem.url)}
                    asChild
                  >
                    <Link
                      prefetch={false}
                      href={subItem.url}
                      target={undefined}
                    >
                      {subItem.icon && <subItem.icon />}
                      <span>{subItem.title}</span>
                      {subItem.comingSoon && <IsComingSoon text={comingSoonText} />}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        )}
      </SidebarMenuItem>
    </Collapsible>
  );
};

const NavItemCollapsed = ({
  item,
  isActive,
  comingSoonText,
}: {
  item: NavMainItem;
  isActive: (url: string, subItems?: NavMainItem['subItems']) => boolean;
  comingSoonText: string;
}) => {
  return (
    <SidebarMenuItem key={item.title}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            disabled={item.comingSoon}
            tooltip={item.title}
            isActive={isActive(item.url, item.subItems)}
          >
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            <ChevronRight />
          </SidebarMenuButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-50 space-y-1" side="right" align="start">
          {item.subItems?.map((subItem) => (
            <DropdownMenuItem key={subItem.title} asChild>
              <SidebarMenuSubButton
                asChild
                className="focus-visible:ring-0"
                aria-disabled={subItem.comingSoon}
                isActive={isActive(subItem.url)}
              >
                <Link
                  prefetch={false}
                  href={subItem.url}
                  target={undefined}
                >
                  {subItem.icon && <subItem.icon className="[&>svg]:text-sidebar-foreground" />}
                  <span>{subItem.title}</span>
                  {subItem.comingSoon && <IsComingSoon text={comingSoonText} />}
                </Link>
              </SidebarMenuSubButton>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export function NavMain({ items, favorites = [], onToggleFavorite, showQuickCreate = false }: NavMainProps) {
  const path = usePathname();
  const { state, isMobile } = useSidebar();
  const t = useAdminT();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpenGroups((before) => {
      const next = { ...before };
      for (const group of items) {
        if (next[group.key] === undefined) next[group.key] = group.key !== 'other';
        if (group.items.some((item) => item.url.split('?')[0] === path || item.subItems?.some((sub) => sub.url.split('?')[0] === path))) next[group.key] = true;
      }
      return next;
    });
  }, [items, path]);

  const isItemActive = (url: string, subItems?: NavMainItem['subItems']) => {
    if (subItems?.length) {
      return subItems.some((sub) => isPathActive(path, sub.url));
    }
    return isPathActive(path, url);
  };

  const isSubmenuOpen = (subItems?: NavMainItem['subItems']) => {
    return subItems?.some((sub) => isPathActive(path, sub.url)) ?? false;
  };

  return (
    <>
      {showQuickCreate && (
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-1">
            <SidebarMenu>
              <SidebarMenuItem className="flex items-center gap-2">
                <SidebarMenuButton
                  tooltip={t('admin.sidebar.quickCreate')}
                  className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                >
                  <PlusCircleIcon />
                  <span>{t('admin.sidebar.quickCreate')}</span>
                </SidebarMenuButton>
                <Button
                  size="icon"
                  className="h-9 w-9 shrink-0 group-data-[collapsible=icon]:opacity-0"
                  variant="outline"
                >
                  <MailIcon />
                  <span className="sr-only">{t('admin.sidebar.inbox')}</span>
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {items.map((group) => (
        <Collapsible key={group.id} open={state === 'collapsed' && !isMobile ? true : (openGroups[group.key] ?? group.key !== 'other')}
          onOpenChange={(open) => setOpenGroups((before) => ({ ...before, [group.key]: open }))}>
        <SidebarGroup>
          {group.label && <CollapsibleTrigger asChild>
            <button type="button" className="flex w-full items-center justify-between rounded-md border-l-[3px] border-primary/70 bg-sidebar-accent/60 px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-sidebar-foreground hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden"
              aria-label={`${group.label} bölümünü aç veya kapat`}>
              <span>{group.label}</span><ChevronDown className="size-4 transition-transform [[data-state=closed]>&]:-rotate-90" />
            </button>
          </CollapsibleTrigger>}

          <CollapsibleContent forceMount={state === 'collapsed' && !isMobile ? true : undefined}>
          <SidebarGroupContent className="flex flex-col gap-1">
            <SidebarMenu>
              {group.items.map((item) => {
                if (state === 'collapsed' && !isMobile) {
                  if (!item.subItems) {
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          aria-disabled={item.comingSoon}
                          tooltip={item.title}
                          isActive={isItemActive(item.url)}
                        >
                          <Link
                            prefetch={false}
                            href={item.url}
                            target={undefined}
                          >
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            {item.comingSoon && <IsComingSoon text={t('admin.sidebar.comingSoon')} />}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }

                  return <NavItemCollapsed key={item.title} item={item} isActive={isItemActive} comingSoonText={t('admin.sidebar.comingSoon')} />;
                }

                return (
                  <NavItemExpanded
                    key={item.title}
                    item={item}
                    isActive={isItemActive}
                    isSubmenuOpen={isSubmenuOpen}
                    comingSoonText={t('admin.sidebar.comingSoon')}
                    favorite={favorites.includes(item.key)}
                    onToggleFavorite={onToggleFavorite}
                  />
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
        </Collapsible>
      ))}
    </>
  );
}
