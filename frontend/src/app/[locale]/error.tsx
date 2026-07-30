'use client';

import Link from 'next/link';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="untree_co--site-section section2_bg">
      <div className="container text-center py-5">
        <h1>Bir hata oluştu</h1>
        <p>Lütfen tekrar deneyin.</p>
        <div className="d-flex justify-content-center gap-3 mt-4">
          <button type="button" className="btn btn-yellow" onClick={() => reset()}>
            Tekrar dene
          </button>
          <Link href="/tr" className="btn btn-black">
            Anasayfa
          </Link>
        </div>
      </div>
    </section>
  );
}
