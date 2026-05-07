'use client';

import * as React from 'react';
import { Archive, Clipboard, Mail, RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  useListOutreachDraftsQuery,
  useUpdateOutreachDraftMutation,
  type OutreachDraft,
} from '@/integrations/hooks';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Taslak', cls: 'border-gm-gold/30 bg-gm-gold/10 text-gm-gold' },
  sent: { label: 'Gönderildi', cls: 'border-gm-success/30 bg-gm-success/10 text-gm-success' },
  archived: { label: 'Arşiv', cls: 'border-gm-muted/30 bg-gm-surface/20 text-gm-muted' },
};

function DraftEditor({ draft }: { draft: OutreachDraft }) {
  const [subject, setSubject] = React.useState(draft.subject);
  const [body, setBody] = React.useState(draft.body);
  const [updateDraft, updateState] = useUpdateOutreachDraftMutation();

  React.useEffect(() => {
    setSubject(draft.subject);
    setBody(draft.body);
  }, [draft.body, draft.subject]);

  const status = STATUS_CONFIG[draft.status] ?? STATUS_CONFIG.draft;

  const handleSave = async (statusOverride?: OutreachDraft['status']) => {
    try {
      await updateDraft({ id: draft.id, body: { subject, body, status: statusOverride ?? draft.status } }).unwrap();
      toast.success('Taslak güncellendi');
    } catch {
      toast.error('Taslak güncellenemedi');
    }
  };

  const handleCopy = async () => {
    const text = `Subject: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Taslak panoya kopyalandı');
    } catch {
      toast.error('Kopyalanamadı');
    }
  };

  return (
    <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/60 shadow-xl">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn('rounded-full text-[9px] font-bold uppercase tracking-widest', status.cls)}>
                {status.label}
              </Badge>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                {new Date(draft.created_at).toLocaleString('tr-TR')}
              </span>
            </div>
            <div className="font-serif text-2xl text-white">E-posta Taslağı</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-full border-gm-border-soft bg-gm-surface/20 text-white hover:bg-gm-surface">
              <Clipboard className="mr-2 size-4" />
              Kopyala
            </Button>
            <Button variant="outline" size="sm" disabled={updateState.isLoading} onClick={() => handleSave('archived')} className="rounded-full border-gm-border-soft bg-gm-surface/20 text-white hover:bg-gm-surface">
              <Archive className="mr-2 size-4" />
              Arşivle
            </Button>
            <Button size="sm" disabled={updateState.isLoading} onClick={() => handleSave()} className="rounded-full bg-gm-gold px-5 text-black hover:bg-gm-gold-light">
              <Save className="mr-2 size-4" />
              Kaydet
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/30 font-serif text-lg text-white"
          />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-48 rounded-2xl border-gm-border-soft bg-gm-surface/30 text-sm leading-6 text-white"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function OutreachDraftsPanel() {
  const { data, isLoading, isFetching, refetch } = useListOutreachDraftsQuery();

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">Lead Machine</span>
          </div>
          <h1 className="font-serif text-4xl text-white">Outreach Taslakları</h1>
          <p className="max-w-xl font-serif text-sm italic text-gm-muted">
            Adaylardan üretilen kişiselleştirilmiş e-posta taslaklarını düzenleyin ve kopyalayın.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-12 rounded-full border-gm-border-soft bg-gm-surface/20 px-8 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-gm-surface"
        >
          <RefreshCw className={cn('mr-2 size-4', isFetching && 'animate-spin')} />
          Yenile
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/60">
              <CardContent className="p-6">
                <Skeleton className="mb-4 h-8 w-80 bg-gm-surface/30" />
                <Skeleton className="h-40 w-full bg-gm-surface/20" />
              </CardContent>
            </Card>
          ))
        ) : data?.length ? (
          data.map((draft) => <DraftEditor key={draft.id} draft={draft} />)
        ) : (
          <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <Mail className="size-12 text-gm-gold/40" />
              <div className="font-serif text-xl italic text-gm-muted">Henüz outreach taslağı yok.</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
