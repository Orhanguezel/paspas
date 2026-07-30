import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="untree_co--site-section section2_bg">
      <div className="container text-center py-5">
        <h1>404</h1>
        <p>Sayfa bulunamadı veya artık mevcut değil.</p>
        <Link href="/tr" className="btn btn-yellow mt-4">
          Anasayfaya dön
        </Link>
      </div>
    </section>
  );
}
