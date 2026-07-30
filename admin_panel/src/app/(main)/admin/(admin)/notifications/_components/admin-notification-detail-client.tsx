'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Bell,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Save,
  Trash2,
  User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { CreateNotificationBody } from '@/integrations/shared';
import {
  useGetNotificationByIdQuery,
  useCreateNotificationMutation,
  useUpdateNotificationMutation,
  useDeleteNotificationMutation,
  useListUsersAdminQuery,
} from '@/integrations/hooks';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

function getErrMsg(e: unknown, t: (k: string) => string): string {
  const anyErr = e as any;
  return (
    anyErr?.data?.error?.message ||
    anyErr?.data?.message ||
    anyErr?.message ||
    t('notifications.messages.operationFailed')
  );
}

const localeMapping: Record<string, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  de: 'de-DE',
};

const NOTIFICATION_TYPES = [
  'order_created',
  'order_paid',
  'order_failed',
  'system',
  'custom',
  'page_feedback',
] as const;

type FormData = {
  user_id: string;
  title: string;
  message: string;
  type: string;
};

/** Parses "page_feedback" message format: "{page_path}: {subject}" */
function parsePageFeedbackMessage(message: string): { pagePath: string; subject: string } | null {
  const colonIdx = message.indexOf(': ');
  if (colonIdx === -1) return null;
  const pagePath = message.slice(0, colonIdx).trim();
  const subject = message.slice(colonIdx + 2).trim();
  if (!pagePath || !subject) return null;
  return { pagePath, subject };
}

export default function AdminNotificationDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const t = useAdminT();
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const isNew = id === 'new';

  const { data: item, isLoading: isLoadingItem } = useGetNotificationByIdQuery(id, {
    skip: isNew,
  });
  const usersQ = useListUsersAdminQuery({ limit: 200 }, { skip: isNew });
  const recipient = usersQ.data?.find((user) => user.id === item?.user_id);

  const [createNotification, { isLoading: isCreating }] = useCreateNotificationMutation();
  const [updateNotification, { isLoading: isUpdating }] = useUpdateNotificationMutation();
  const [deleteNotification, { isLoading: isDeleting }] = useDeleteNotificationMutation();
  const readMarked = React.useRef(false);

  const [formData, setFormData] = React.useState<FormData>({
    user_id: '',
    title: '',
    message: '',
    type: 'system',
  });

  React.useEffect(() => {
    if (!isNew && item) {
      setFormData({
        user_id: item.user_id || '',
        title: item.title,
        message: item.message,
        type: item.type,
      });
    }
  }, [isNew, item]);

  React.useEffect(() => {
    if (isNew || !item || item.is_read || readMarked.current) return;

    readMarked.current = true;
    void updateNotification({ id: item.id, body: { is_read: true } }).unwrap().catch(() => {
      readMarked.current = false;
    });
  }, [isNew, item, updateNotification]);

  const busy = isCreating || isUpdating || isDeleting;

  const handleBack = () => {
    router.push('/admin/notifications');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error(t('notifications.messages.titleRequired'));
      return;
    }
    if (!formData.message.trim()) {
      toast.error(t('notifications.messages.messageRequired'));
      return;
    }

    try {
      if (isNew) {
        const body: CreateNotificationBody = {
          user_id: formData.user_id.trim() || undefined,
          title: formData.title.trim(),
          message: formData.message.trim(),
          type: formData.type as any,
        };
        await createNotification(body).unwrap();
        toast.success(t('notifications.messages.createSuccess'));
        router.push('/admin/notifications');
      } else {
        toast.warning(t('notifications.messages.editNotSupported'));
      }
    } catch (err) {
      toast.error(getErrMsg(err, t));
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        t('notifications.messages.deleteConfirm').replace('{title}', item?.title || '')
      )
    )
      return;

    try {
      await deleteNotification({ id }).unwrap();
      toast.success(t('notifications.messages.deleteSuccess'));
      router.push('/admin/notifications');
    } catch (err) {
      toast.error(getErrMsg(err, t));
    }
  };

  const feedbackLink =
    !isNew && item?.type === 'page_feedback'
      ? parsePageFeedbackMessage(item.message)
      : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">
                {isNew
                  ? t('notifications.form.createTitle')
                  : 'Bildirim'}
              </CardTitle>
              <CardDescription>
                {isNew
                  ? t('notifications.form.createDescription')
                  : 'Bildirim içeriğini okuyun ve ilgili kayda kolayca ulaşın.'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleBack} variant="outline" size="sm">
                <ArrowLeft className="mr-2 size-4" />
                {t('notifications.actions.back')}
              </Button>
              {!isNew && (
                <Button
                  onClick={handleDelete}
                  disabled={busy}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="mr-2 size-4" />
                  {t('notifications.actions.delete')}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Loading state for existing item */}
      {!isNew && isLoadingItem && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Yükleniyor...
          </CardContent>
        </Card>
      )}

      {/* Human-friendly read-only view for existing notifications */}
      {!isNew && !isLoadingItem && item && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Bell className="size-6" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-xl">{item.title}</CardTitle>
                <CardDescription className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                  <span className="inline-flex items-center gap-1.5">
                    <User className="size-4" />
                    {recipient?.full_name?.trim() || 'Kullanıcı'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="size-4" />
                    {new Date(item.created_at).toLocaleString(localeMapping[adminLocale] || 'tr-TR')}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" />
                    Okundu
                  </span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <div className="whitespace-pre-wrap rounded-2xl border bg-background p-5 text-base leading-7 text-foreground">
              {feedbackLink?.subject || item.message}
            </div>
            {feedbackLink && (
              <div className="mt-4 flex justify-end">
                <Button onClick={() => router.push(feedbackLink.pagePath)}>
                  <ExternalLink className="mr-2 size-4" />
                  İlgili sayfaya git
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create form for new notifications */}
      {isNew && (
        <Card>
          <CardHeader>
            <CardTitle>{t('notifications.form.infoTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              {/* User ID (optional) */}
              <div className="space-y-2">
                <Label htmlFor="user_id">
                  {t('notifications.form.userId')}{' '}
                  <span className="text-muted-foreground">{t('notifications.form.optional')}</span>
                </Label>
                <Input
                  id="user_id"
                  value={formData.user_id}
                  onChange={(e) => setFormData((p) => ({ ...p, user_id: e.target.value }))}
                  placeholder={t('notifications.form.userIdPlaceholder')}
                  disabled={busy}
                />
                <p className="text-xs text-muted-foreground">
                  {t('notifications.form.userIdHelp')}
                </p>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  {t('notifications.form.title')}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  placeholder={t('notifications.form.titlePlaceholder')}
                  required
                  disabled={busy}
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">
                  {t('notifications.form.message')}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                  placeholder={t('notifications.form.messagePlaceholder')}
                  rows={4}
                  required
                  disabled={busy}
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">
                  {t('notifications.form.type')}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.type || 'system'}
                  onValueChange={(v) => setFormData((p) => ({ ...p, type: v }))}
                  disabled={busy}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_TYPES.map((tVal) => (
                      <SelectItem key={tVal} value={tVal}>
                        {t(`notifications.types.${tVal}`, {}, tVal)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" onClick={handleBack} variant="outline" disabled={busy}>
                  {t('notifications.actions.cancel')}
                </Button>
                <Button type="submit" disabled={busy}>
                  <Save className="mr-2 size-4" />
                  {busy ? t('notifications.actions.saving') : t('notifications.actions.save')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
