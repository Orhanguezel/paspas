'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BASE_URL } from '@/integrations/apiBase';
import { notificationsApi, useGetUnreadCountQuery } from '@/integrations/endpoints/admin/notifications_admin.endpoints';
import { normalizeNotification } from '@/integrations/shared';
import { useAppDispatch } from '@/stores/hooks';

function buildStreamUrl(): string {
  const base = BASE_URL.replace(/\/+$/, '');
  return `${base}/notifications/stream`;
}

export function AdminNotificationsLive() {
  const t = useAdminT();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const lastToastIds = useRef<Set<string>>(new Set());
  const { data: unread } = useGetUnreadCountQuery();

  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

    const stream = new EventSource(buildStreamUrl(), { withCredentials: true });
    const invalidateNotifications = () => {
      dispatch(
        notificationsApi.util.invalidateTags([
          { type: 'Notifications', id: 'LIST' },
          { type: 'Notifications', id: 'UNREAD_COUNT' },
        ]),
      );
    };

    const handleNotification = (event: MessageEvent<string>) => {
      try {
        const notification = normalizeNotification(JSON.parse(event.data));
        invalidateNotifications();

        if (pathname === '/admin/notifications') return;
        if (lastToastIds.current.has(notification.id)) return;

        lastToastIds.current.add(notification.id);
        if (lastToastIds.current.size > 50) {
          const ids = Array.from(lastToastIds.current);
          lastToastIds.current = new Set(ids.slice(-20));
        }

        toast(notification.title, {
          description: notification.message,
        });
      } catch {
        invalidateNotifications();
      }
    };

    const handleOpen = () => invalidateNotifications();
    const handleError = () => invalidateNotifications();

    stream.addEventListener('notification', handleNotification);
    stream.addEventListener('connected', handleOpen);
    stream.addEventListener('error', handleError as EventListener);

    return () => {
      stream.removeEventListener('notification', handleNotification);
      stream.removeEventListener('connected', handleOpen);
      stream.removeEventListener('error', handleError as EventListener);
      stream.close();
    };
  }, [dispatch, pathname]);

  const unreadCount = unread?.count ?? 0;
  const unreadLabel =
    unreadCount > 0
      ? `${t('notifications.title')} (${unreadCount})`
      : t('notifications.title');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button asChild variant="outline" size="icon-sm" className="relative">
          <Link href="/admin/notifications" aria-label={unreadLabel}>
            <Bell className="size-4" />
            {unreadCount > 0 ? (
              <Badge className="absolute -right-1.5 -top-1.5 min-w-5 px-1.5 text-[10px]">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            ) : null}
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent sideOffset={8}>{unreadLabel}</TooltipContent>
    </Tooltip>
  );
}
