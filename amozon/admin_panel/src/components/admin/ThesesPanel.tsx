'use client';

import { Archive, RefreshCw, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '@/integrations/admin-api';

type ThesisSignal = {
  key: string;
  label: string;
  score: number;
  current_score?: number | null;
  delta?: number | null;
  confidence: string;
  reason: string;
};

type Thesis = {
  id: string;
  job_id: string;
  keyword: string;
  marketplace: string;
  decision: string;
  status: 'active' | 'weakened' | 'broken' | 'closed';
  key_signals: ThesisSignal[];
  original_composite_score: number | null;
  current_composite_score: number | null;
  weakness_note: string | null;
  operator_notes: string | null;
  created_at: string;
  last_evaluated_at: string | null;
};

const tabs = [
  { status: 'active', label: 'Aktif' },
  { status: 'weakened', label: 'Zayıfladı' },
  { status: 'broken', label: 'Bozuldu' },
  { status: 'closed', label: 'Kapalı Arşiv' },
] as const;

function statusLabel(status: Thesis['status']) {
  switch (status) {
    case 'active': return 'Aktif';
    case 'weakened': return 'Zayıfladı';
    case 'broken': return 'Bozuldu';
    case 'closed': return 'Kapalı';
  }
}

export function ThesesPanel() {
  const [status, setStatus] = useState<Thesis['status']>('active');
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load(nextStatus = status) {
    setLoading(true);
    setMessage(null);
    try {
      const result = await apiGet<{ theses: Thesis[] }>(`/api/theses?status=${nextStatus}`);
      setTheses(result.theses);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Tezler alınamadı');
    } finally {
      setLoading(false);
    }
  }

  async function evaluate(id: string) {
    setMessage(null);
    await apiPost(`/api/theses/${id}/evaluate`, {});
    await load();
  }

  async function close(id: string) {
    setMessage(null);
    await apiPost(`/api/theses/${id}/close`, {});
    await load();
  }

  useEffect(() => {
    load(status).catch(() => undefined);
  }, [status]);

  const countText = useMemo(() => `${theses.length} tez`, [theses.length]);

  return (
    <div className="content">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Tezler</h2>
            <p className="muted">AL ve TAKİP ET kararlarının zaman içinde zayıflayıp zayıflamadığını izle.</p>
          </div>
          <button className="button" disabled={loading} onClick={() => load()} type="button"><RefreshCw size={16} />Yenile</button>
        </div>
        <div className="panel-body">
          <div className="segmented theses-tabs">
            {tabs.map((tab) => (
              <button className={status === tab.status ? 'active' : ''} key={tab.status} onClick={() => setStatus(tab.status)} type="button">
                {tab.label}
              </button>
            ))}
          </div>
          {message ? <p className="error">{message}</p> : null}
          <p className="muted">{countText}</p>
        </div>
      </section>

      <div className="thesis-grid">
        {theses.map((thesis) => (
          <article className={`panel thesis-card thesis-${thesis.status}`} key={thesis.id}>
            <div className="panel-header">
              <div>
                <h2 className="panel-title">{thesis.keyword}</h2>
                <p className="muted">amazon.{thesis.marketplace} · {new Date(thesis.created_at).toLocaleDateString('tr-TR')}</p>
              </div>
              <span className={`badge thesis-status-${thesis.status}`}>{statusLabel(thesis.status)}</span>
            </div>
            <div className="panel-body">
              <div className="thesis-score-row">
                <span>Karar <b>{thesis.decision}</b></span>
                <span>İlk skor <b>{thesis.original_composite_score ?? '-'}</b></span>
                <span>Güncel <b>{thesis.current_composite_score ?? '-'}</b></span>
              </div>
              {thesis.weakness_note ? <p className="thesis-warning">{thesis.weakness_note}</p> : null}
              <div className="signal-diff-list">
                {thesis.key_signals.map((signal) => (
                  <div className="signal-diff" key={signal.key}>
                    <strong>{signal.label}</strong>
                    <span>{signal.score} → {signal.current_score ?? '-'}</span>
                    <p>{signal.reason}</p>
                  </div>
                ))}
              </div>
              {thesis.operator_notes ? <p className="muted">Not: {thesis.operator_notes}</p> : null}
              <div className="thesis-actions">
                {thesis.status !== 'closed' ? (
                  <>
                    <button className="button" onClick={() => evaluate(thesis.id)} type="button"><RefreshCw size={15} />Şimdi Değerlendir</button>
                    <button className="button button-secondary" onClick={() => close(thesis.id)} type="button"><XCircle size={15} />Kapat</button>
                  </>
                ) : (
                  <span className="muted"><Archive size={15} /> Arşivde</span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
