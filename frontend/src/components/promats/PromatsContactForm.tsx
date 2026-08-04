'use client';

import { useEffect, useRef, useState } from 'react';

import { getPublicApiBaseUrl } from '@/lib/site-config';
import { buildTeklifTalepPayload } from '@/lib/promats/teklif-talebi';

type Props = {
  labels: {
    name: string;
    email: string;
    phone: string;
    message: string;
    submit: string;
    success: string;
    error: string;
    products?: string;
    subject?: string;
  };
  products?: { id?: string; slug: string; name: string }[];
  defaultProduct?: string;
  defaultSubject?: string;
  subjectOptions?: string[];
  quoteSubjectValues?: string[];
  locale?: string;
  sourcePage?: string;
  /**
   * Yerleşim varyantı. DOM aynı kalır; iki sütunlu düzen (üretim sayfası) CSS grid ile
   * kurulur, böylece ikinci bir form bileşeni çoğaltmak gerekmez.
   */
  formClassName?: string;
};

const API_BASE = getPublicApiBaseUrl().replace(/\/+$/, '');

export default function PromatsContactForm({ labels, formClassName, products = [], defaultProduct, defaultSubject, subjectOptions = [], quoteSubjectValues = [], locale = 'tr', sourcePage = '/iletisim' }: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [referenceId, setReferenceId] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>();
  const submittingRef = useRef(false);
  // İlgilenilen ürün grubu: çoklu seçim, kapalı kutu + checkbox (müşteri notu a1bf78c3).
  // Native <select multiple> yerine dışarı tıklayınca kapanan checkbox paneli.
  const [productsOpen, setProductsOpen] = useState(false);
  const [selectedProductSlugs, setSelectedProductSlugs] = useState<string[]>(
    defaultProduct ? [defaultProduct] : [],
  );
  const productsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!productsOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (productsRef.current && !productsRef.current.contains(e.target as Node)) {
        setProductsOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProductsOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [productsOpen]);

  function toggleProduct(slug: string, checked: boolean): void {
    setSelectedProductSlugs((prev) => (checked ? [...prev, slug] : prev.filter((item) => item !== slug)));
  }

  function trackQuoteEvent(event: 'quote_request_submit' | 'quote_request_success' | 'quote_request_error', details: Record<string, string | number> = {}): void {
    if (typeof window === 'undefined' || window.__analyticsConsentGranted !== true) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, source_page: sourcePage, language: locale, ...details });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (submittingRef.current) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const subject = String(form.get('subject') ?? '').trim();
    const selectedProducts = products.filter((product) => selectedProductSlugs.includes(product.slug));
    const isQuote = quoteSubjectValues.includes(subject);
    const required = locale === 'en' ? 'This field is required.' : 'Bu alan zorunludur.';
    const errors: Record<string, string> = {};
    if (!String(form.get('name') ?? '').trim()) errors.name = required;
    if (subjectOptions.length && !subject) errors.subject = required;
    if (!String(form.get('phone') ?? '').trim()) errors.phone = required;
    const email = String(form.get('email') ?? '').trim();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.email = locale === 'en' ? 'Enter a valid email address.' : 'Geçerli bir e-posta adresi giriniz.';
    if (form.get('kvkk') !== 'on') errors.kvkk = required;
    setFieldErrors(errors);
    setSubmitError(undefined);
    setReferenceId(undefined);
    if (Object.keys(errors).length) return;
    submittingRef.current = true;
    setStatus('sending');
    if (isQuote) trackQuoteEvent('quote_request_submit', { product_count: selectedProducts.length, request_type: subject });
    try {
      const body = isQuote ? buildTeklifTalepPayload({
        kaynakSayfa: sourcePage,
        referrer: typeof document !== 'undefined' ? document.referrer.slice(0, 1000) : undefined,
        dil: (['tr', 'en', 'de'].includes(locale) ? locale : 'tr') as 'tr' | 'en' | 'de',
        ad: String(form.get('name') ?? '').trim(),
        email: String(form.get('email') ?? '').trim() || undefined,
        telefon: String(form.get('phone') ?? '').trim() || undefined,
        konu: subject || undefined,
        mesaj: String(form.get('message') ?? '').trim() || undefined,
        seciliUrunler: selectedProducts.map((product) => ({ urunId: product.id, slug: product.slug, ad: product.name })),
        kvkkOnay: form.get('kvkk') === 'on',
        website: String(form.get('website') ?? ''),
        search: typeof window !== 'undefined' ? window.location.search : '',
      }) : {
        ad: String(form.get('name') ?? ''),
        eposta: String(form.get('email') ?? ''),
        telefon: String(form.get('phone') ?? ''),
        mesaj: String(form.get('message') ?? ''),
      };
      const res = await fetch(`${API_BASE}${isQuote ? '/teklif-talebi' : '/contact'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const response = await res.json().catch(() => ({})) as { id?: string; error?: { message?: string } };
      if (!res.ok) throw new Error(response.error?.message || `http_${res.status}`);
      setStatus('sent');
      setReferenceId(response.id);
      if (isQuote) trackQuoteEvent('quote_request_success', { product_count: selectedProducts.length, request_type: subject });
      formElement.reset();
      setSelectedProductSlugs([]);
    } catch (error) {
      setStatus('error');
      const code = error instanceof Error ? error.message : 'contact_failed';
      setSubmitError(code === 'cok_fazla_istek'
        ? (locale === 'en' ? 'Too many requests. Please wait a minute and try again.' : 'Çok fazla istek gönderildi. Lütfen bir dakika bekleyip yeniden deneyin.')
        : labels.error);
      if (isQuote) trackQuoteEvent('quote_request_error', { product_count: selectedProducts.length, request_type: subject, error_code: code });
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <form onSubmit={onSubmit} className={formClassName} noValidate>
      {status === 'sent' ? <div className="alert alert-success" role="status">{labels.success}{referenceId ? ` ${locale === 'en' ? 'Reference' : 'Referans'}: ${referenceId}` : ''}</div> : null}
      {status === 'error' ? <div className="alert alert-danger" role="alert">{submitError ?? labels.error}</div> : null}
      <div className="form-group">
        <label className="sr-only" htmlFor="promats-contact-name">{labels.name}</label>
        <input id="promats-contact-name" className="form-control" name="name" placeholder={labels.name} required type="text" />
        {fieldErrors.name ? <small className="text-danger">{fieldErrors.name}</small> : null}
      </div>
      {subjectOptions.length ? (
        <div className="form-group">
          <label htmlFor="promats-contact-subject">{labels.subject}</label>
          <select id="promats-contact-subject" className="form-control" name="subject" required defaultValue={defaultSubject ?? ''}>
            <option value="" disabled>{labels.subject}</option>
            {subjectOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          {fieldErrors.subject ? <small className="text-danger">{fieldErrors.subject}</small> : null}
        </div>
      ) : null}
      {products.length ? (
        <div className="form-group">
          <label htmlFor="promats-products-toggle">{labels.products}</label>
          <div className="promats-multiselect" ref={productsRef}>
            <button
              type="button"
              id="promats-products-toggle"
              className={`form-control promats-multiselect-toggle ${selectedProductSlugs.length ? '' : 'is-placeholder'}`}
              onClick={() => setProductsOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={productsOpen}
            >
              <span className="promats-multiselect-value">
                {selectedProductSlugs.length
                  ? `${selectedProductSlugs.length} ${labels.products?.toLocaleLowerCase('tr-TR') ?? ''} seçildi`
                  : labels.products}
              </span>
              <span className="promats-multiselect-caret" aria-hidden="true" />
            </button>
            {productsOpen ? (
              <div className="promats-multiselect-panel" role="listbox">
                {products.map((product) => (
                  <label key={product.slug} className="promats-multiselect-option">
                    <input
                      type="checkbox"
                      value={product.name}
                      checked={selectedProductSlugs.includes(product.slug)}
                      onChange={(e) => toggleProduct(product.slug, e.target.checked)}
                    />
                    <span>{product.name}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
          {selectedProductSlugs.length ? (
            <div className="promats-multiselect-tags">
              {selectedProductSlugs.map((slug) => (
                <button
                  key={slug}
                  type="button"
                  className="promats-multiselect-tag"
                  onClick={() => toggleProduct(slug, false)}
                  aria-label={`${products.find((product) => product.slug === slug)?.name ?? slug} kaldır`}
                >
                  {products.find((product) => product.slug === slug)?.name ?? slug}<span aria-hidden="true"> ×</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="form-group">
        <label className="sr-only" htmlFor="promats-contact-email">{labels.email}</label>
        <input id="promats-contact-email" className="form-control" name="email" placeholder={labels.email} type="email" />
        {fieldErrors.email ? <small className="text-danger">{fieldErrors.email}</small> : null}
      </div>
      <div className="form-group">
        <label className="sr-only" htmlFor="promats-contact-phone">{labels.phone}</label>
        <input id="promats-contact-phone" className="form-control" name="phone" placeholder={labels.phone} required type="text" />
        {fieldErrors.phone ? <small className="text-danger">{fieldErrors.phone}</small> : null}
      </div>
      <div className="form-group">
        <label className="sr-only" htmlFor="promats-contact-message">{labels.message}</label>
        <textarea id="promats-contact-message" className="form-control" cols={30} name="message" placeholder={labels.message} rows={10} />
      </div>
      <div className="d-none" aria-hidden="true">
        <label htmlFor="promats-contact-website">Website</label>
        <input id="promats-contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="form-group form-check">
        <input id="promats-contact-kvkk" className="form-check-input" name="kvkk" type="checkbox" required />
        <label className="form-check-label small" htmlFor="promats-contact-kvkk">
          {locale === 'en' ? 'I have read and accept the privacy notice.' : 'KVKK aydınlatma metnini okudum ve kabul ediyorum.'}
        </label>
        {fieldErrors.kvkk ? <small className="text-danger d-block">{fieldErrors.kvkk}</small> : null}
      </div>
      <div className="form-group float-right">
        <button className="btn btn-yellow px-4 contact_btn" type="submit" disabled={status === 'sending'}>
          {labels.submit}
        </button>
      </div>
    </form>
  );
}
