// =============================================================
// FILE: src/components/admin/db/shared/InlineHelp.tsx
// =============================================================
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

export type InlineHelpProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export const InlineHelp: React.FC<InlineHelpProps> = ({
  title = 'Açıklama',
  children,
  className,
}) => {
  const t = useAdminT();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement | null>(null);

  const close = () => setOpen(false);
  const toggle = () => setOpen((v) => !v);

  useEffect(() => {
    if (!open) return;

    const onDocMouseDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      const root = rootRef.current;
      if (root && root.contains(t)) return;
      close();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('mousedown', onDocMouseDown, true);
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('mousedown', onDocMouseDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open]);

  return (
    <span ref={rootRef} className={'d-inline-block ' + (className ?? '')}>
      <button
        type="button"
        className="btn btn-link p-0 ms-1 text-decoration-none"
        title={title}
        onClick={toggle}
      >
        <span
          className="d-inline-flex align-items-center justify-content-center border rounded-circle"
          style={{ width: 18, height: 18, fontSize: 12, userSelect: 'none' }}
        >
          ?
        </span>
      </button>

      {open ? (
        <div className="mt-2">
          <div className="alert alert-light border py-2 mb-0">
            <div className="d-flex align-items-start justify-content-between gap-2">
              <div className="fw-semibold small">{title}</div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={close}
                aria-label={t('admin.db.help.closeButton')}
                title={t('admin.db.help.closeButton')}
                style={{ padding: '0px 6px', lineHeight: 1.2 }}
              >
                ×
              </button>
            </div>

            <div className="small text-muted mt-1">{children}</div>

            <div className="mt-2 text-muted" style={{ fontSize: 11 }}>
              {t('admin.db.help.closeHint')}
            </div>
          </div>
        </div>
      ) : null}
    </span>
  );
};
