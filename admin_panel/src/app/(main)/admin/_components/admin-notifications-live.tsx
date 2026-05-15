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

    // SSE bağlantısı başarısız olduğunda (401/proxy) EventSource sonsuz
    // yeniden bağlanır. Eskiden her `error` cache invalidate edip
    // useGetUnreadCountQuery refetch → 401 → token/refresh → re-render
    // fırtınası yaratıyordu. Artık: error'da invalidate YOK; bağlantı
    // kapatılıp sınırlı sayıda, artan gecikmeli yeniden deneme yapılır.
    const MAX_RETRIES = 5;
    const BASE_DELAY_MS = 3000;

    let stream: EventSource | null = null;
    let retryCount = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

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

    // Bağlantı (yeniden) kurulduğunda backoff sıfırlanır ve sayımlar
    // bir kez tazelenir — bu meşru tek invalidate noktasıdır.
    const handleOpen = () => {
      retryCount = 0;
      invalidateNotifications();
    };

    const closeStream = () => {
      if (!stream) return;
      stream.removeEventListener('notification', handleNotification as EventListener);
      stream.removeEventListener('connected', handleOpen);
      stream.removeEventListener('error', handleError as EventListener);
      stream.close();
      stream = null;
    };

    function handleError() {
      // Error'da ASLA invalidate etme (doomed refetch → reauth döngüsü).
      if (disposed) return;
      closeStream();
      if (retryCount >= MAX_RETRIES) return; // Kalıcı arıza: dener gibi yapma.
      const delay = BASE_DELAY_MS * 2 ** retryCount;
      retryCount += 1;
      reconnectTimer = setTimeout(connect, delay);
    }

    function connect() {
      if (disposed) return;
      stream = new EventSource(buildStreamUrl(), { withCredentials: true });
      stream.addEventListener('notification', handleNotification as EventListener);
      stream.addEventListener('connected', handleOpen);
      stream.addEventListener('error', handleError as EventListener);
    }

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      closeStream();
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
