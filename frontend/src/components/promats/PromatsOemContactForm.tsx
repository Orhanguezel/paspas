'use client';

import { useState } from 'react';

import { getPublicApiBaseUrl } from '@/lib/site-config';

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

// Zengin OEM alanlarini mevcut /contact kontratina (ad/eposta/telefon/mesaj) sigdirir;
// ekstra alanlar mesaj govdesine paketlenir — backend degismeden lead yakalanir.
function buildMessage(form: FormData, labels: FormLabels): string {
  const lines: string[] = [];
  const country = String(form.get('country') ?? '').trim();
  const website = String(form.get('website') ?? '').trim();
  const interest = String(form.get('productInterest') ?? '').trim();
  const quantity = String(form.get('quantity') ?? '').trim();
  const email = String(form.get('email') ?? '').trim();
  const message = String(form.get('message') ?? '').trim();

  if (country) lines.push(`${labels.country}: ${country}`);
  if (email) lines.push(`${labels.email}: ${email}`);
  if (website) lines.push(`${labels.website}: ${website}`);
  if (interest) lines.push(`${labels.productInterest}: ${interest}`);
  if (quantity) lines.push(`${labels.quantity}: ${quantity}`);
  if (lines.length) lines.push('---');
  if (message) lines.push(message);
  return lines.join('\n');
}

export default function PromatsOemContactForm({ labels, success, error }: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const currentForm = event.currentTarget;
    const form = new FormData(currentForm);
    setStatus('sending');
    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad: String(form.get('company') ?? ''),
          eposta: String(form.get('email') ?? ''),
          telefon: String(form.get('phone') ?? ''),
          mesaj: buildMessage(form, labels),
        }),
      });
      if (!res.ok) throw new Error('contact_failed');
      setStatus('sent');
      currentForm.reset();
    } catch {
      setStatus('error');
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
          <input id="oem-website" className="form-control" name="website" placeholder={labels.website} type="url" />
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

      <div className="form-group">
        <button className="btn btn-yellow px-4 text-white contact_btn" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? labels.sending : labels.submit}
        </button>
      </div>
    </form>
  );
}
