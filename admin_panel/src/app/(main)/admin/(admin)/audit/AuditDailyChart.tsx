// =============================================================
// FILE: src/components/admin/audit/AuditDailyChart.tsx
// FIX:
//  - date can be "YYYY-MM-DD" OR ISO datetime -> normalize to "YYYY-MM-DD"
//  - tolerate alternate keys: day, dt, ts, created_at
// =============================================================

'use client';

import React, { useMemo, useState } from 'react';

import type { AuditMetricsDailyRowDto } from '@/integrations/shared';

type Props = {
  rows: AuditMetricsDailyRowDto[];
  loading?: boolean;
  height?: number; // default 220
};

function n(v: unknown, fallback = 0) {
  const x = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(x) ? x : fallback;
}

function toYmd(input: unknown): string {
  const s = String(input ?? '').trim();
  if (!s) return '';
  // already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // ISO datetime -> take first 10 chars
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);
  // fallback: try Date parse
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return s; // last resort (won't crash)
}

function fmtDayLabel(isoOrDate: string) {
  const ymd = toYmd(isoOrDate);
  const m = String(ymd).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(isoOrDate || '');
  return `${m[3]}.${m[2]}`;
}

function fmtIsoNice(isoOrDate: string) {
  const ymd = toYmd(isoOrDate);
  const m = String(ymd).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(isoOrDate || '');
  return `${m[3]}.${m[2]}.${m[1]}`;
}

export const AuditDailyChart: React.FC<Props> = ({ rows, loading, height = 220 }) => {
  const [showUnique, setShowUnique] = useState(true);
  const [showErrors, setShowErrors] = useState(true);

  const data = useMemo(() => {
    const a = Array.isArray(rows) ? rows : [];
    return [...a]
      .map((r) => {
        const rawDate =
          (r as any).date ??
          (r as any).day ??
          (r as any).dt ??
          (r as any).ts ??
          (r as any).created_at ??
          '';
        const date = toYmd(rawDate);

        return {
          date,
          label: fmtDayLabel(date),
          requests: n((r as any).requests ?? (r as any).count ?? (r as any).total_requests),
          unique_ips: n((r as any).unique_ips ?? (r as any).unique ?? (r as any).uniq_ips),
          errors: n((r as any).errors ?? (r as any).error_count ?? (r as any).fails),
        };
      })
      .filter((x) => !!x.date && /^\d{4}-\d{2}-\d{2}/.test(x.date))
      .sort((x, y) => String(x.date).localeCompare(String(y.date)));
  }, [rows]);

  const hasAny = data.length > 0;

  // ---- SVG layout ----
  const W = 980;
  const H = Math.max(140, Math.min(360, height));
  const padL = 42;
  const padR = 14;
  const padT = 12;
  const padB = 30;

  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const maxRequests = useMemo(() => {
    const m = data.reduce((acc, r) => Math.max(acc, r.requests), 0);
    return Math.max(1, m);
  }, [data]);

  const yTicks = 4;
  const tickVals = Array.from({ length: yTicks + 1 }).map((_, i) =>
    Math.round((maxRequests * (yTicks - i)) / yTicks),
  );

  const barGap = 6;
  const barCount = Math.max(1, data.length);
  const barW = Math.max(8, Math.floor((chartW - barGap * (barCount - 1)) / barCount));

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <div className="text-sm text-muted-foreground">
          Son {data.length || 0} gün: <strong>requests</strong> bar
          {showUnique ? ', unique' : ''} {showErrors ? ', errors' : ''}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <label className="mb-0 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showUnique}
              onChange={(e) => setShowUnique(e.target.checked)}
            />
            Unique IP
          </label>

          <label className="mb-0 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showErrors}
              onChange={(e) => setShowErrors(e.target.checked)}
            />
            Errors
          </label>

          {loading && <span className="text-sm text-muted-foreground">Yükleniyor...</span>}
        </div>
      </div>

      {!hasAny && !loading && (
        <div className="rounded-md border border-muted bg-muted/40 px-3 py-2 text-sm">
          Grafik verisi boş. (Backend response shape / date format uyumsuz olabilir.)
        </div>
      )}

      <div className="overflow-hidden rounded border bg-card">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={H}
          role="img"
          aria-label="Audit günlük metrik grafiği"
        >
          <rect x="0" y="0" width={W} height={H} fill="white" />

          {tickVals.map((tv, i) => {
            const y = padT + (chartH * i) / yTicks;
            return (
              <g key={`t-${i}`}>
                <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e9ecef" strokeWidth="1" />
                <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#6c757d">
                  {tv}
                </text>
              </g>
            );
          })}

          {data.map((r, idx) => {
            const x = padL + idx * (barW + barGap);
            const h = Math.round((r.requests / maxRequests) * chartH);
            const y = padT + (chartH - h);
            const isHover = hoverIdx === idx;

            return (
              <g
                key={`${r.date}-${idx}`}
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => setHoverIdx(null)}
              >
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx="3"
                  fill={isHover ? '#0b5ed7' : '#0d6efd'}
                  opacity={r.requests === 0 ? 0.25 : 0.9}
                />
                {(data.length <= 14 || idx % 2 === 0) && (
                  <text
                    x={x + barW / 2}
                    y={H - 10}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#6c757d"
                  >
                    {r.label}
                  </text>
                )}
              </g>
            );
          })}

          {hoverIdx !== null &&
            data[hoverIdx] &&
            (() => {
              const r = data[hoverIdx];
              const xBar = padL + hoverIdx * (barW + barGap);
              const boxW = 220;
              const boxH = showUnique || showErrors ? 76 : 56;

              const px = xBar + barW + 10 + boxW <= W - padR ? xBar + barW + 10 : xBar - boxW - 10;
              const py = padT + 10;

              return (
                <g>
                  <rect
                    x={px}
                    y={py}
                    width={boxW}
                    height={boxH}
                    rx="8"
                    fill="white"
                    stroke="#dee2e6"
                  />
                  <text x={px + 12} y={py + 20} fontSize="12" fill="#212529">
                    <tspan fontWeight="600">{fmtIsoNice(r.date)}</tspan>
                  </text>
                  <text x={px + 12} y={py + 40} fontSize="12" fill="#212529">
                    requests: <tspan fontWeight="600">{r.requests}</tspan>
                  </text>
                  {(showUnique || showErrors) && (
                    <text x={px + 12} y={py + 58} fontSize="12" fill="#212529">
                      {showUnique ? (
                        <>
                          unique: <tspan fontWeight="600">{r.unique_ips}</tspan>
                        </>
                      ) : null}
                      {showUnique && showErrors ? <tspan> · </tspan> : null}
                      {showErrors ? (
                        <>
                          errors: <tspan fontWeight="600">{r.errors}</tspan>
                        </>
                      ) : null}
                    </text>
                  )}
                </g>
              );
            })()}

          <line
            x1={padL}
            y1={padT + chartH}
            x2={W - padR}
            y2={padT + chartH}
            stroke="#dee2e6"
            strokeWidth="1"
          />
        </svg>

        {hasAny && (
          <div className="flex items-center justify-between border-t px-3 py-2 text-sm text-muted-foreground">
            <div>{data[data.length - 1]?.date ? fmtIsoNice(data[data.length - 1].date) : '-'}</div>
            <div className="flex gap-3">
              <span>
                requests:{' '}
                <strong className="text-foreground">{data[data.length - 1]?.requests ?? 0}</strong>
              </span>
              {showUnique && (
                <span>
                  unique:{' '}
                  <strong className="text-foreground">
                    {data[data.length - 1]?.unique_ips ?? 0}
                  </strong>
                </span>
              )}
              {showErrors && (
                <span>
                  errors:{' '}
                  <strong className="text-foreground">{data[data.length - 1]?.errors ?? 0}</strong>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
