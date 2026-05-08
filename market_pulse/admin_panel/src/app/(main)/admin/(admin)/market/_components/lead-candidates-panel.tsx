'use client';

import * as React from 'react';
import { Check, ExternalLink, Filter, Mail, RefreshCw, Search, Star, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  useEnrichCandidateMutation,
  useApproveToLeadMutation,
  useGenerateOutreachDraftMutation,
  useListCandidateEnrichmentQuery,
  useListLeadCandidatesQuery,
  useReviewCandidateMutation,
  type AmazonRiskDecision,
  type LeadCandidate,
  type LeadCandidateChannel,
  type LeadCandidateStatus,
} from '@/integrations/hooks';
import { cn } from '@/lib/utils';

const CHANNEL_LABELS: Record<string, string> = {
  amazon: 'Amazon',
  b2b_directory: 'B2B Dizin',
  trade_fair: 'Fuar',
  icp_match: 'ICP',
};

const STATUS_CONFIG: Record<LeadCandidateStatus, { label: string; cls: string }> = {
  pending: { label: 'Bekliyor', cls: 'border-gm-warning/30 bg-gm-warning/10 text-gm-warning' },
  approved: { label: 'Onaylandı', cls: 'border-gm-success/30 bg-gm-success/10 text-gm-success' },
  rejected: { label: 'Reddedildi', cls: 'border-gm-error/30 bg-gm-error/10 text-gm-error' },
  favorite: { label: 'Favori', cls: 'border-gm-gold/30 bg-gm-gold/10 text-gm-gold' },
};

function rawRecord(candidate: LeadCandidate): Record<string, unknown> {
  const data = candidate.raw_data;
  return data && typeof data === 'object' ? data : {};
}

function decisionOf(candidate: LeadCandidate): AmazonRiskDecision {
  const raw = rawRecord(candidate);
  const value = candidate.decision ?? raw.decision;
  if (typeof value === 'string' && ['GUVENLI', 'DIKKATLI_OL', 'GIRME', 'MIXED_SIGNAL', 'INSUFFICIENT_DATA'].includes(value)) {
    return value as AmazonRiskDecision;
  }
  return 'INSUFFICIENT_DATA';
}

function compositeOf(candidate: LeadCandidate): number | null {
  const raw = rawRecord(candidate);
  const decision = decisionOf(candidate);
  if (decision === 'INSUFFICIENT_DATA') return null;

  const value = raw.composite_score ?? candidate.lead_score;
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  if (number === 0 && decision !== 'GUVENLI') return null; // 0 usually means insufficient data unless it's a very low risk score which is unlikely to be exactly 0
  return Number.isFinite(number) ? number : null;
}

function decisionBadgeClass(decision: string): string {
  if (decision === 'GUVENLI') return 'border-gm-success/40 bg-gm-success/10 text-gm-success';
  if (decision === 'DIKKATLI_OL') return 'border-gm-warning/40 bg-gm-warning/10 text-gm-warning';
  if (decision === 'GIRME') return 'border-gm-error/40 bg-gm-error/10 text-gm-error';
  if (decision === 'MIXED_SIGNAL') return 'border-orange-500/30 bg-orange-500/10 text-orange-500';
  return 'border-gm-border-soft bg-gm-surface/20 text-gm-muted/60';
}

function decisionLabel(decision: string): string {
  if (decision === 'GUVENLI') return 'GÜVENLİ';
  if (decision === 'DIKKATLI_OL') return 'DİKKATLİ OL';
  if (decision === 'GIRME') return 'GİRME';
  if (decision === 'MIXED_SIGNAL') return 'KARIŞIK SİNYAL';
  return 'VERİ YETERSİZ';
}

function rawValue(candidate: LeadCandidate, key: string) {
  const data = candidate.raw_data;
  const value = data && typeof data === 'object' ? data[key] : null;
  if (Array.isArray(value)) return value.join(', ');
  if (value && typeof value === 'object') return JSON.stringify(value);
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function CandidateCard({
  candidate,
  onApprove,
  onReject,
  onFavorite,
  selected,
  onSelectedChange,
  isBusy,
}: {
  candidate: LeadCandidate;
  onApprove: (candidate: LeadCandidate) => void;
  onReject: (candidate: LeadCandidate, reason: string) => void;
  onFavorite: (candidate: LeadCandidate) => void;
  selected: boolean;
  onSelectedChange: (checked: boolean) => void;
  isBusy: boolean;
}) {
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const { data: enrichment } = useListCandidateEnrichmentQuery(candidate.id, { pollingInterval: 15000 });
  const [enrichCandidate, enrichState] = useEnrichCandidateMutation();
  const [generateOutreachDraft, outreachState] = useGenerateOutreachDraftMutation();
  const status = STATUS_CONFIG[candidate.status] ?? STATUS_CONFIG.pending;
  const latestEnrichment = enrichment?.[0];
  const decisionMaker = latestEnrichment?.decision_maker && typeof latestEnrichment.decision_maker === 'object'
    ? latestEnrichment.decision_maker
    : null;
  const channelSpecific =
    candidate.channel === 'amazon'
      ? rawValue(candidate, 'problem_score') || rawValue(candidate, 'review_flags')
      : candidate.channel === 'trade_fair'
        ? rawValue(candidate, 'fair_info')
        : rawValue(candidate, 'pain_points') || rawValue(candidate, 'match');

  return (
    <Card className="bg-gm-bg-deep/60 border-gm-border-soft rounded-[28px] overflow-hidden shadow-xl">
      <CardContent className="p-6 space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) => onSelectedChange(checked === true)}
              className="mt-2 border-gm-border-soft data-[state=checked]:border-gm-gold data-[state=checked]:bg-gm-gold data-[state=checked]:text-black"
              aria-label={`${candidate.name} seç`}
            />
            <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full border-gm-border-soft bg-gm-surface/20 text-[9px] font-bold uppercase tracking-widest text-gm-muted">
                {CHANNEL_LABELS[candidate.channel] ?? candidate.channel}
              </Badge>
              <Badge variant="outline" className={cn('rounded-full text-[9px] font-bold uppercase tracking-widest', status.cls)}>
                {status.label}
              </Badge>
              {candidate.channel === 'amazon' && (
                <>
                  <Badge variant="outline" className={cn('rounded-full text-[9px] font-bold uppercase tracking-widest', decisionBadgeClass(decisionOf(candidate)))}>
                    {decisionLabel(decisionOf(candidate))}
                  </Badge>
                  <span className="rounded-full border border-gm-border-soft bg-gm-surface/20 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-gm-text/70">
                    SKOR: {compositeOf(candidate) !== null ? `${compositeOf(candidate)?.toFixed(1)} / 10` : '—'}
                  </span>
                </>
              )}
            </div>
            <div>
              <h2 className="font-serif text-2xl text-gm-text">{candidate.name}</h2>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-gm-muted">
                <span>{candidate.country || 'Ülke yok'}</span>
                <span>{candidate.city || 'Şehir yok'}</span>
                {candidate.phone && <span>{candidate.phone}</span>}
                {candidate.email && <span>{candidate.email}</span>}
              </div>
            </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {candidate.website && (
              <Button asChild variant="outline" size="sm" className="rounded-full border-gm-border-soft bg-gm-surface/20 text-gm-text hover:bg-gm-surface">
                <a href={candidate.website} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 size-4" />
                  Kaynak
                </a>
              </Button>
            )}
            <Button
              size="sm"
              onClick={async () => {
                try {
                  await enrichCandidate(candidate.id).unwrap();
                  toast.success('Aday zenginleştirildi');
                } catch {
                  toast.error('Zenginleştirme başarısız');
                }
              }}
              disabled={isBusy || enrichState.isLoading}
              className="rounded-full bg-gm-primary/20 text-gm-primary-light hover:bg-gm-primary hover:text-black"
            >
              <Search className="mr-2 size-4" />
              Zenginleştir
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                try {
                  await generateOutreachDraft(candidate.id).unwrap();
                  toast.success('E-posta taslağı üretildi');
                } catch {
                  toast.error('Taslak üretilemedi');
                }
              }}
              disabled={isBusy || outreachState.isLoading || !latestEnrichment}
              className="rounded-full bg-gm-gold/20 text-gm-gold hover:bg-gm-gold hover:text-black disabled:opacity-40"
            >
              <Mail className="mr-2 size-4" />
              Taslak Üret
            </Button>
            <Button
              size="sm"
              onClick={() => onFavorite(candidate)}
              disabled={isBusy}
              className="rounded-full bg-gm-surface/40 text-gm-gold hover:bg-gm-gold hover:text-black"
            >
              <Star className="mr-2 size-4" />
              Favori
            </Button>
            <Button
              size="sm"
              onClick={() => onApprove(candidate)}
              disabled={isBusy}
              className="rounded-full bg-gm-success/90 text-black hover:bg-gm-success"
            >
              <Check className="mr-2 size-4" />
              Onayla
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRejectOpen((v) => !v)}
              disabled={isBusy}
              className="rounded-full border-gm-error/30 bg-gm-error/10 text-gm-error hover:bg-gm-error hover:text-black"
            >
              <X className="mr-2 size-4" />
              Reddet
            </Button>
          </div>
        </div>

        {candidate.ai_summary && (
          <p className="rounded-2xl border border-gm-border-soft bg-gm-surface/20 p-4 text-sm leading-6 text-gm-muted">
            {candidate.ai_summary}
          </p>
        )}

        {channelSpecific && (
          <div className="text-xs text-gm-muted">
            <span className="font-bold uppercase tracking-widest text-gm-text/50">Kanal verisi: </span>
            <span className="font-mono">{channelSpecific}</span>
          </div>
        )}

        {latestEnrichment && (
          <div className="grid gap-3 rounded-2xl border border-gm-gold/20 bg-gm-gold/5 p-4 md:grid-cols-4">
            <div>
              <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-gm-muted">Karar Verici</div>
              <div className="text-sm text-gm-text">
                {String(decisionMaker?.name ?? 'Tespit edilemedi')}
              </div>
            </div>
            <div>
              <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-gm-muted">Unvan</div>
              <div className="text-sm text-gm-text">{String(decisionMaker?.title ?? 'Yok')}</div>
            </div>
            <div>
              <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-gm-muted">E-posta</div>
              <div className="text-sm text-gm-text">
                {decisionMaker?.email ? (
                  <a className="text-gm-gold hover:underline" href={`mailto:${String(decisionMaker.email)}`}>
                    {String(decisionMaker.email)}
                  </a>
                ) : 'Yok'}
              </div>
            </div>
            <div>
              <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-gm-muted">LinkedIn</div>
              <div className="text-sm text-gm-text">
                {decisionMaker?.linkedin_url ? (
                  <a className="text-gm-gold hover:underline" href={String(decisionMaker.linkedin_url)} target="_blank" rel="noreferrer">
                    Profil
                  </a>
                ) : latestEnrichment.source_vendor ?? 'Yok'}
              </div>
            </div>
          </div>
        )}

        {rejectOpen && (
          <div className="space-y-3 rounded-2xl border border-gm-error/20 bg-gm-error/5 p-4">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Red nedeni"
              className="min-h-24 rounded-2xl border-gm-border-soft bg-gm-surface/30 text-gm-text placeholder:text-gm-text/30"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={isBusy || !reason.trim()}
                onClick={() => {
                  onReject(candidate, reason.trim());
                  setReason('');
                  setRejectOpen(false);
                }}
                className="rounded-full bg-gm-error text-black hover:bg-gm-error/80"
              >
                Reddi Kaydet
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function LeadCandidatesPanel() {
  const [q, setQ] = React.useState('');
  const [channel, setChannel] = React.useState<LeadCandidateChannel | 'all'>('all');
  const [status, setStatus] = React.useState<LeadCandidateStatus | 'all'>('pending');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => new Set());

  const { data, isLoading, isFetching, refetch } = useListLeadCandidatesQuery({
    channel,
    status,
    limit: 100,
    page: 1,
  });
  const [reviewCandidate, reviewState] = useReviewCandidateMutation();
  const [approveToLead, approveState] = useApproveToLeadMutation();

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter((candidate) => {
      return [
        candidate.name,
        candidate.website,
        candidate.country,
        candidate.city,
        candidate.email,
        candidate.phone,
        candidate.ai_summary,
      ].some((value) => String(value ?? '').toLowerCase().includes(term));
    });
  }, [data, q]);

  const isBusy = reviewState.isLoading || approveState.isLoading;

  React.useEffect(() => {
    setSelectedIds((current) => {
      const visible = new Set(filtered.map((candidate) => candidate.id));
      const next = new Set([...current].filter((id) => visible.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [filtered]);

  const handleApprove = async (candidate: LeadCandidate) => {
    try {
      await approveToLead(candidate.id).unwrap();
      toast.success('Aday lead pipeline’a aktarıldı');
    } catch {
      toast.error('Aday onaylanamadı');
    }
  };

  const handleReject = async (candidate: LeadCandidate, reason: string) => {
    try {
      await reviewCandidate({ id: candidate.id, action: 'reject', reject_reason: reason }).unwrap();
      toast.success('Aday reddedildi');
    } catch {
      toast.error('Red işlemi kaydedilemedi');
    }
  };

  const handleFavorite = async (candidate: LeadCandidate) => {
    try {
      await reviewCandidate({ id: candidate.id, action: 'favorite' }).unwrap();
      toast.success('Aday favorilere alındı');
    } catch {
      toast.error('Favori işlemi kaydedilemedi');
    }
  };

  const handleBulkApprove = async () => {
    const selected = filtered.filter((candidate) => selectedIds.has(candidate.id));
    if (!selected.length) return;
    try {
      await Promise.all(selected.map((candidate) => approveToLead(candidate.id).unwrap()));
      setSelectedIds(new Set());
      toast.success(`${selected.length} aday pipeline’a aktarıldı`);
    } catch {
      toast.error('Seçili adaylardan bazıları onaylanamadı');
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">Lead Machine</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">Lead Adayları</h1>
          <p className="max-w-xl font-serif text-sm italic text-gm-muted">
            Otomatik kanallardan gelen firmaları inceleyin, uygun olanları satış pipeline’ına aktarın.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-12 rounded-full border-gm-border-soft bg-gm-surface/20 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface"
        >
          <RefreshCw className={cn('mr-2 size-4', isFetching && 'animate-spin')} />
          Yenile
        </Button>
      </div>

      <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50 shadow-2xl">
        <CardContent className="grid gap-5 p-6 md:grid-cols-[1fr_220px_220px]">
          <div className="space-y-2">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Arama</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gm-muted/60" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Firma, ülke, e-posta veya özet ara"
                className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 pl-12 text-gm-text placeholder:text-gm-text/25"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Kanal</label>
            <Select value={channel} onValueChange={(v) => setChannel(v as LeadCandidateChannel | 'all')}>
              <SelectTrigger className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-gm-border-soft bg-gm-surface text-gm-text">
                <SelectItem value="all">Tüm Kanallar</SelectItem>
                <SelectItem value="amazon">Amazon</SelectItem>
                <SelectItem value="b2b_directory">B2B Dizin</SelectItem>
                <SelectItem value="trade_fair">Fuar</SelectItem>
                <SelectItem value="icp_match">ICP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Durum</label>
            <Select value={status} onValueChange={(v) => setStatus(v as LeadCandidateStatus | 'all')}>
              <SelectTrigger className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 text-gm-text">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-gm-border-soft bg-gm-surface text-gm-text">
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="pending">Bekliyor</SelectItem>
                <SelectItem value="favorite">Favori</SelectItem>
                <SelectItem value="approved">Onaylandı</SelectItem>
                <SelectItem value="rejected">Reddedildi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-[24px] border border-gm-border-soft bg-gm-surface/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={filtered.length > 0 && selectedIds.size === filtered.length}
              onCheckedChange={(checked) => {
                setSelectedIds(checked === true ? new Set(filtered.map((candidate) => candidate.id)) : new Set());
              }}
              className="border-gm-border-soft data-[state=checked]:border-gm-gold data-[state=checked]:bg-gm-gold data-[state=checked]:text-black"
              aria-label="Tüm adayları seç"
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
              {selectedIds.size ? `${selectedIds.size} aday seçildi` : `${filtered.length} aday listeleniyor`}
            </span>
          </div>
          <Button
            size="sm"
            disabled={!selectedIds.size || isBusy}
            onClick={handleBulkApprove}
            className="rounded-full bg-gm-gold px-6 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-gm-gold-light"
          >
            <Check className="mr-2 size-4" />
            Seçilenleri Onayla
          </Button>
        </div>

        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/60">
              <CardContent className="p-6">
                <Skeleton className="mb-4 h-8 w-80 bg-gm-surface/30" />
                <Skeleton className="h-24 w-full bg-gm-surface/20" />
              </CardContent>
            </Card>
          ))
        ) : filtered.length ? (
          filtered.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onApprove={handleApprove}
              onReject={handleReject}
              onFavorite={handleFavorite}
              selected={selectedIds.has(candidate.id)}
              onSelectedChange={(checked) => {
                setSelectedIds((current) => {
                  const next = new Set(current);
                  if (checked) next.add(candidate.id);
                  else next.delete(candidate.id);
                  return next;
                });
              }}
              isBusy={isBusy}
            />
          ))
        ) : (
          <Card className="rounded-[28px] border-gm-border-soft bg-gm-bg-deep/50">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <Filter className="size-12 text-gm-gold/40" />
              <div className="font-serif text-xl italic text-gm-muted">Bu filtrelerde aday bulunamadı.</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
