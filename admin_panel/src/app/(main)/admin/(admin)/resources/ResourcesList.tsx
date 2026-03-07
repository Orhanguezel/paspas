// =============================================================
// FILE: src/components/admin/resources/ResourcesList.tsx
// guezelwebdesign – Admin Resources List (cards + table)
// FINAL — TR UI + NO ID + NO external_ref_id
// - Responsive: cards default, table on very large screens
// =============================================================

import React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import type { ResourceAdminListItemDto, ResourceType } from '@/integrations/shared/resources.types';
import { useDeleteResourceAdminMutation } from '@/integrations/hooks';

export type ResourcesListProps = {
  items?: ResourceAdminListItemDto[];
  loading: boolean;
};

const VERY_LARGE_BP = 1700;

const safe = (v: unknown) => (v === null || v === undefined ? '' : String(v));

const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return '-';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return safe(value);
  return d.toLocaleString();
};

const typeLabel = (t: ResourceType | string | null | undefined) => {
  const v = String(t ?? '').trim();
  switch (v) {
    case 'therapist':
      return 'Terapist';
    case 'doctor':
      return 'Doktor';
    case 'table':
      return 'Masa';
    case 'room':
      return 'Oda';
    case 'staff':
      return 'Personel';
    case 'other':
      return 'Diğer';
    default:
      return v || '—';
  }
};

const statusBadge = (isActive: unknown) => {
  const active = Number(isActive ?? 0) === 1 || isActive === true;
  return active ? (
    <span className="badge bg-success-subtle text-success border border-success-subtle">Aktif</span>
  ) : (
    <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
      Pasif
    </span>
  );
};

export const ResourcesList: React.FC<ResourcesListProps> = ({ items, loading }) => {
  const rows = items ?? [];
  const hasData = rows.length > 0;

  const [deleteResource, { isLoading: isDeleting }] = useDeleteResourceAdminMutation();
  const busy = loading || isDeleting;

  const renderEmpty = () => {
    if (loading) return <div className="p-3 text-muted small">Yükleniyor...</div>;
    return <div className="p-3 text-muted small">Kayıt bulunamadı.</div>;
  };

  const handleDelete = async (r: ResourceAdminListItemDto) => {
    const ok = window.confirm(
      `Bu kaynağı silmek üzeresin.\n\n` +
        `Ad: ${safe(r.title) || '(ad yok)'}\n` +
        `Tür: ${typeLabel(r.type as any)}\n\n` +
        `Devam etmek istiyor musun?`,
    );
    if (!ok) return;

    try {
      await deleteResource(String(r.id)).unwrap();
      toast.success('Kaynak silindi.');
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || 'Silme işlemi başarısız.');
    }
  };

  const renderCards = () => {
    if (!hasData) return renderEmpty();

    return (
      <div className="p-3">
        <div className="row g-3">
          {rows.map((r) => (
            <div key={r.id} className="col-12 col-xxl-6">
              <div className="border rounded-3 bg-white h-100 p-3">
                <div className="d-flex align-items-start justify-content-between gap-3">
                  <div style={{ minWidth: 0 }}>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {statusBadge((r as any).is_active)}
                      <span className="badge bg-light text-dark border">
                        {typeLabel((r as any).type)}
                      </span>
                    </div>

                    <div className="fw-semibold mt-2 text-truncate" title={safe(r.title)}>
                      {safe(r.title) || <span className="text-muted">(ad yok)</span>}
                    </div>

                    <div className="text-muted small mt-2">
                      Güncelleme: {formatDate((r as any).updated_at)}
                    </div>
                  </div>

                  <div className="d-flex flex-column gap-2" style={{ width: 180 }}>
                    <Link
                      href={`/admin/resources/${encodeURIComponent(String(r.id))}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      Düzenle
                    </Link>
                    <Link
                      href={`/admin/availability/${encodeURIComponent(String(r.id))}`}
                      className="btn btn-outline-secondary btn-sm"
                    >
                      Müsaitlik
                    </Link>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      disabled={busy}
                      onClick={() => handleDelete(r)}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3">
          <span className="text-muted small">
            Varsayılan görünüm karttır. Tablo görünümü çok büyük ekranlarda (≥ {VERY_LARGE_BP}px)
            gösterilir.
          </span>
        </div>
      </div>
    );
  };

  const renderTable = () => {
    if (!hasData) return renderEmpty();

    return (
      <div className="table-responsive">
        <table className="table table-hover table-sm mb-0 align-middle">
          <thead className="table-light">
            <tr>
              <th className="text-muted" style={{ width: 56 }}>
                #
              </th>
              <th>Ad</th>
              <th className="text-nowrap">Tür</th>
              <th className="text-nowrap">Durum</th>
              <th className="text-nowrap">Güncellendi</th>
              <th className="text-end text-nowrap">İşlemler</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id} className="align-middle">
                <td className="text-muted small text-nowrap">{idx + 1}</td>

                <td style={{ minWidth: 240 }}>
                  <div className="fw-semibold text-truncate" title={safe(r.title)}>
                    {safe(r.title) || '—'}
                  </div>
                </td>

                <td className="text-nowrap">
                  <span className="badge bg-light text-dark border">
                    {typeLabel((r as any).type)}
                  </span>
                </td>

                <td className="text-nowrap">{statusBadge((r as any).is_active)}</td>

                <td className="small text-nowrap">{formatDate((r as any).updated_at)}</td>

                <td className="text-end text-nowrap">
                  <div className="btn-group btn-group-sm" role="group">
                    <Link
                      href={`/admin/resources/${encodeURIComponent(String(r.id))}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      Düzenle
                    </Link>
                    <Link
                      href={`/admin/availability/${encodeURIComponent(String(r.id))}`}
                      className="btn btn-outline-secondary btn-sm"
                    >
                      Müsaitlik
                    </Link>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      disabled={busy}
                      onClick={() => handleDelete(r)}
                    >
                      Sil
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>

          <caption className="text-muted small ps-2">
            Tablo görünümü çok büyük ekranlar içindir (≥ {VERY_LARGE_BP}px).
          </caption>
        </table>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header py-2">
        <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
          <span className="small fw-semibold">Kaynak Listesi</span>
          <div className="d-flex align-items-center gap-2">
            {loading ? <span className="badge bg-secondary small">Yükleniyor...</span> : null}
            <span className="text-muted small">
              Toplam: <strong>{rows.length}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="card-body p-0">
        <div className="d-none d-xxl-block">{renderTable()}</div>
        <div className="d-block d-xxl-none">{renderCards()}</div>
      </div>
    </div>
  );
};
