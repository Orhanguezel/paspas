'use client';

import { useRef, useState } from 'react';

import { getPublicApiBaseUrl } from '@/lib/site-config';
import { buildTeklifTalepPayload } from '@/lib/promats/teklif-talebi';

type FormLabels = {
  company: string;
  companyPh: string;
  country: string;
  countryPh: string;
  phone: string;
  phonePh: string;
  website: string;
  websitePh: string;
  productInterest: string;
  productInterestPh: string;
  quantity: string;
  quantityPh: string;
  email: string;
  emailPh: string;
  message: string;
  messagePh: string;
  submit: string;
  sending: string;
  note: string;
  interestOptions: string[];
};

type Props = {
  labels: FormLabels;
  success: string;
  error: string;
};

const API_BASE = getPublicApiBaseUrl().replace(/\/+$/, '');

export default function PromatsOemContactForm({ labels, success, error }: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const submittingRef = useRef(false);
  const idempotencyKeyRef = useRef<string>();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    idempotencyKeyRef.current ??= crypto.randomUUID();
    const currentForm = event.currentTarget;
    const form = new FormData(currentForm);
    setStatus('sending');
    try {
      const interest = String(form.get('productInterest') ?? '').trim();
      const payload = buildTeklifTalepPayload({
        kaynakSayfa: '/en/oem-manufacturing', dil: 'en',
        referrer: typeof document !== 'undefined' ? document.referrer.slice(0, 1000) : undefined,
        ad: String(form.get('company') ?? '').trim(), firma: String(form.get('company') ?? '').trim(),
        email: String(form.get('email') ?? '').trim(), telefon: String(form.get('phone') ?? '').trim(),
        konu: 'OEM & Private Label', mesaj: String(form.get('message') ?? '').trim(),
        formDetaylari: { ulke: String(form.get('country') ?? '').trim(), websiteUrl: String(form.get('websiteUrl') ?? '').trim(), urunIlgisi: interest, miktar: String(form.get('quantity') ?? '').trim() },
        seciliUrunler: interest ? [{ slug: interest.toLocaleLowerCase('en').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), ad: interest }] : [],
        kvkkOnay: form.get('kvkk') === 'on', website: String(form.get('website') ?? ''),
        search: typeof window !== 'undefined' ? window.location.search : '',
      });
      const res = await fetch(`${API_BASE}/teklif-talebi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': idempotencyKeyRef.current },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('contact_failed');
      setStatus('sent');
      idempotencyKeyRef.current = undefined;
      currentForm.reset();
    } catch {
      setStatus('error');
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <form onSubmit={onSubmit} className="oem-inquiry-form">
      {status === 'sent' ? <div className="alert alert-success">{success}</div> : null}
      {status === 'error' ? <div className="alert alert-danger">{error}</div> : null}

      <div className="row">
        <div className="col-md-6 form-group">
          <label className="sr-only" htmlFor="oem-company">{labels.company}</label>
          <input id="oem-company" className="form-control" name="company" placeholder={`${labels.company} *`} required type="text" />
        </div>
        <div className="col-md-6 form-group">
          <label className="sr-only" htmlFor="oem-country">{labels.country}</label>
          <input id="oem-country" className="form-control" name="country" placeholder={`${labels.country} *`} required type="text" />
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 form-group">
          <label className="sr-only" htmlFor="oem-email">{labels.email}</label>
          <input id="oem-email" className="form-control" name="email" placeholder={`${labels.email} *`} required type="email" />
        </div>
        <div className="col-md-6 form-group">
          <label className="sr-only" htmlFor="oem-phone">{labels.phone}</label>
          <input id="oem-phone" className="form-control" name="phone" placeholder={`${labels.phone} *`} required type="text" />
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 form-group">
          <label className="sr-only" htmlFor="oem-website">{labels.website}</label>
          <input id="oem-website" className="form-control" name="websiteUrl" placeholder={labels.website} type="url" />
        </div>
        <div className="col-md-6 form-group">
          <label className="sr-only" htmlFor="oem-quantity">{labels.quantity}</label>
          <input id="oem-quantity" className="form-control" name="quantity" placeholder={labels.quantity} type="text" />
        </div>
      </div>

      <div className="form-group">
        <label className="sr-only" htmlFor="oem-interest">{labels.productInterest}</label>
        <select id="oem-interest" className="form-control" name="productInterest" defaultValue="">
          <option value="" disabled>{labels.productInterestPh}</option>
          {labels.interestOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="sr-only" htmlFor="oem-message">{labels.message}</label>
        <textarea id="oem-message" className="form-control" cols={30} name="message" placeholder={`${labels.message} *`} required rows={6} />
      </div>

      <p className="oem-form-note text-muted small">{labels.note}</p>

      <div className="d-none" aria-hidden="true"><input name="website" type="text" tabIndex={-1} autoComplete="off" /></div>
      <div className="form-group form-check">
        <input id="oem-kvkk" className="form-check-input" name="kvkk" type="checkbox" required />
        <label className="form-check-label small" htmlFor="oem-kvkk">I have read and accept the privacy notice.</label>
      </div>

      <div className="form-group">
        <button className="btn btn-yellow px-4 text-white contact_btn" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? labels.sending : labels.submit}
        </button>
      </div>
    </form>
  );
}
