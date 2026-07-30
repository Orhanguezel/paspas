'use client';

import { getPublicAppName } from '@/lib/site-config';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const appName = getPublicAppName();
  return (
    <html lang="tr">
      <body>
        <main
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '2rem',
            fontFamily: 'var(--gm-font-sans)',
            background: 'var(--gm-bg)',
            color: 'var(--gm-text)',
          }}
        >
          <div style={{ maxWidth: 640, textAlign: 'center' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
              Beklenmeyen bir hata oluştu.
            </h1>
            <p style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Lütfen sayfayı yeniden yükleyin. Sorun devam ederse daha sonra tekrar deneyin
              veya {appName} destek ekibi ile iletişime geçin.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: '0.875rem 1.25rem',
                borderRadius: 9999,
                border: 'none',
                background: 'var(--gm-primary)',
                color: 'var(--gm-surface)',
                cursor: 'pointer',
              }}
            >
              Sayfayı yenile
            </button>
            {process.env.NODE_ENV === 'development' ? (
              <pre
                style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  overflowX: 'auto',
                  textAlign: 'left',
                  background: 'var(--gm-surface-high)',
                  color: 'var(--gm-text)',
                  borderRadius: 12,
                }}
              >
                {error.message}
                {error.digest ? `\nDigest: ${error.digest}` : ''}
              </pre>
            ) : null}
          </div>
        </main>
      </body>
    </html>
  );
}
