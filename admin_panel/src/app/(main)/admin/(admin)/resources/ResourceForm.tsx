// =============================================================
// FILE: src/components/admin/resources/ResourceForm.tsx
// guezelwebdesign – Admin Resource Create/Edit Form
// FINAL — TR UI + NO external_ref_id (Availability standard)
// =============================================================

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { ResourceRowDto, ResourceType } from '@/integrations/shared/resources.types';

export type ResourceFormMode = 'create' | 'edit';

export type ResourceFormValues = {
  title: string;
  type: ResourceType;
  is_active: boolean;
};

export type ResourceFormProps = {
  mode: ResourceFormMode;
  initialData?: ResourceRowDto | null;
  loading: boolean;
  saving: boolean;
  onSubmit: (values: ResourceFormValues) => void | Promise<void>;
  onCancel?: () => void;
};

const toType = (v: unknown): ResourceType => {
  const s = String(v ?? 'other').trim() as ResourceType;
  const ok: ResourceType[] = ['therapist', 'doctor', 'table', 'room', 'staff', 'other'];
  return (ok.includes(s) ? s : 'other') as ResourceType;
};

const buildInitial = (dto?: ResourceRowDto | null): ResourceFormValues => {
  if (!dto) {
    return {
      title: '',
      type: 'therapist',
      is_active: true,
    };
  }
  return {
    title: String(dto.title ?? ''),
    type: toType(dto.type),
    is_active: Number(dto.is_active ?? 0) === 1 || (dto as any).is_active === true,
  };
};

const TYPE_LABEL: Record<ResourceType, string> = {
  therapist: 'Terapist',
  doctor: 'Doktor',
  table: 'Masa',
  room: 'Oda',
  staff: 'Personel',
  other: 'Diğer',
};

export const ResourceForm: React.FC<ResourceFormProps> = ({
  mode,
  initialData,
  loading,
  saving,
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<ResourceFormValues>(buildInitial(initialData));

  useEffect(() => {
    setValues(buildInitial(initialData));
  }, [initialData]);

  const disabled = loading || saving;

  const titleHelp = useMemo(() => {
    if (values.title.trim().length >= 2) return '';
    return 'Ad en az 2 karakter olmalı.';
  }, [values.title]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disabled) return;

    const title = values.title.trim();
    if (!title || title.length < 2) {
      toast.error('Lütfen geçerli bir ad gir.');
      return;
    }

    void onSubmit({
      title,
      type: values.type,
      is_active: values.is_active,
    });
  };

  return (
    <div className="guezelwebdesign-admin-page">
      <div className="container-fluid px-2 px-lg-3">
        <div className="guezelwebdesign-admin-page__inner">
          <form onSubmit={handleSubmit}>
            <div className="card guezelwebdesign-admin-card">
              <div className="card-header py-2 guezelwebdesign-admin-card__header">
                <div className="d-flex flex-column flex-lg-row align-items-start justify-content-between gap-2">
                  <div style={{ minWidth: 0 }}>
                    <h5 className="mb-1 small fw-semibold text-truncate">
                      {mode === 'create' ? 'Yeni Kaynak' : 'Kaynak Düzenle'}
                    </h5>
                    <div className="text-muted small text-truncate">
                      Kaynak adı, tipi ve aktiflik durumunu yönet.
                    </div>
                  </div>

                  <div className="d-flex flex-wrap align-items-center justify-content-lg-end gap-2">
                    {onCancel ? (
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={onCancel}
                        disabled={disabled}
                      >
                        Geri
                      </button>
                    ) : null}

                    <button type="submit" className="btn btn-primary btn-sm" disabled={disabled}>
                      {saving
                        ? mode === 'create'
                          ? 'Oluşturuluyor...'
                          : 'Kaydediliyor...'
                        : mode === 'create'
                          ? 'Oluştur'
                          : 'Kaydet'}
                    </button>

                    {loading ? (
                      <span className="badge bg-secondary small">Yükleniyor...</span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="card-body guezelwebdesign-admin-card__body">
                <div className="row g-3">
                  <div className="col-12 col-lg-6">
                    <label className="form-label small mb-1">Ad</label>
                    <input
                      className="form-control form-control-sm"
                      value={values.title}
                      onChange={(e) => setValues((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Örn: Anna (Terapist)"
                      disabled={disabled}
                    />
                    {titleHelp ? (
                      <div className="form-text small text-muted">{titleHelp}</div>
                    ) : null}
                  </div>

                  <div className="col-12 col-lg-3">
                    <label className="form-label small mb-1">Tür</label>
                    <select
                      className="form-select form-select-sm"
                      value={values.type}
                      onChange={(e) => setValues((p) => ({ ...p, type: toType(e.target.value) }))}
                      disabled={disabled}
                    >
                      {(Object.keys(TYPE_LABEL) as ResourceType[]).map((k) => (
                        <option key={k} value={k}>
                          {TYPE_LABEL[k]}
                        </option>
                      ))}
                    </select>
                    <div className="form-text small">Filtreleme ve raporlama için.</div>
                  </div>

                  <div className="col-12 col-lg-3">
                    <label className="form-label small mb-1">Durum</label>
                    <div className="form-check form-switch mt-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={values.is_active}
                        onChange={(e) => setValues((p) => ({ ...p, is_active: e.target.checked }))}
                        disabled={disabled}
                        id="resource-is-active"
                      />
                      <label className="form-check-label small" htmlFor="resource-is-active">
                        {values.is_active ? 'Aktif' : 'Pasif'}
                      </label>
                    </div>
                    <div className="form-text small">
                      Pasif kaynak rezervasyonda listelenmez (backend kuralı).
                    </div>
                  </div>
                </div>

                {mode === 'create' ? (
                  <div className="alert alert-info mt-3 mb-0 small">
                    Kaynak oluşturulduktan sonra gerekirse ilgili modüllerde (ör. müsaitlik/slot)
                    planlama yapılabilir.
                  </div>
                ) : null}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
