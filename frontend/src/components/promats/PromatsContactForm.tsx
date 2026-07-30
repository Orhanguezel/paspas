'use client';

import { useState } from 'react';

import { getPublicApiBaseUrl } from '@/lib/site-config';

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
  products?: { slug: string; name: string }[];
  defaultProduct?: string;
  subjectOptions?: string[];
  /**
   * Yerleşim varyantı. DOM aynı kalır; iki sütunlu düzen (üretim sayfası) CSS grid ile
   * kurulur, böylece ikinci bir form bileşeni çoğaltmak gerekmez.
   */
  formClassName?: string;
};

const API_BASE = getPublicApiBaseUrl().replace(/\/+$/, '');

export default function PromatsContactForm({ labels, formClassName, products = [], defaultProduct, subjectOptions = [] }: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const selectedProducts = form.getAll('products').map(String).filter(Boolean);
    setStatus('sending');
    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad: String(form.get('name') ?? ''),
          eposta: String(form.get('email') ?? ''),
          telefon: String(form.get('phone') ?? ''),
          mesaj: [
            form.get('subject') ? `${labels.subject}: ${String(form.get('subject'))}` : '',
            selectedProducts.length ? `${labels.products}: ${selectedProducts.join(', ')}` : '',
            String(form.get('message') ?? ''),
          ].filter(Boolean).join('\n'),
        }),
      });
      if (!res.ok) throw new Error('contact_failed');
      setStatus('sent');
      event.currentTarget.reset();
    } catch {
      setStatus('error');
    }
  }

  return (
    <form onSubmit={onSubmit} className={formClassName}>
      {status === 'sent' ? <div className="alert alert-success">{labels.success}</div> : null}
      {status === 'error' ? <div className="alert alert-danger">{labels.error}</div> : null}
      <div className="form-group">
        <label className="sr-only" htmlFor="promats-contact-name">{labels.name}</label>
        <input id="promats-contact-name" className="form-control" name="name" placeholder={labels.name} required type="text" />
      </div>
      {subjectOptions.length ? (
        <div className="form-group">
          <label htmlFor="promats-contact-subject">{labels.subject}</label>
          <select id="promats-contact-subject" className="form-control" name="subject" required defaultValue="">
            <option value="" disabled>{labels.subject}</option>
            {subjectOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
      ) : null}
      {products.length ? (
        <div className="form-group">
          <label htmlFor="promats-contact-products">{labels.products}</label>
          <select id="promats-contact-products" className="form-control promats-contact-products" name="products" multiple defaultValue={defaultProduct ? [defaultProduct] : []}>
            {products.map((product) => <option key={product.slug} value={product.name}>{product.name}</option>)}
          </select>
        </div>
      ) : null}
      <div className="form-group">
        <label className="sr-only" htmlFor="promats-contact-email">{labels.email}</label>
        <input id="promats-contact-email" className="form-control" name="email" placeholder={labels.email} type="email" />
      </div>
      <div className="form-group">
        <label className="sr-only" htmlFor="promats-contact-phone">{labels.phone}</label>
        <input id="promats-contact-phone" className="form-control" name="phone" placeholder={labels.phone} required type="text" />
      </div>
      <div className="form-group">
        <label className="sr-only" htmlFor="promats-contact-message">{labels.message}</label>
        <textarea id="promats-contact-message" className="form-control" cols={30} name="message" placeholder={labels.message} rows={10} />
      </div>
      <div className="form-group float-right">
        <button className="btn btn-yellow px-4 contact_btn" type="submit" disabled={status === 'sending'}>
          {labels.submit}
        </button>
      </div>
    </form>
  );
}
