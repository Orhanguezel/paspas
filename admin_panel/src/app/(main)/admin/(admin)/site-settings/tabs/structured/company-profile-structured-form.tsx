// =============================================================
// FILE: src/components/admin/site-settings/structured/CompanyProfileStructuredForm.tsx
// =============================================================

'use client';

import React from 'react';
import { z } from 'zod';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const companyProfileSchema = z
  .object({
    company_name: z.string().trim().optional(),
    legal_name: z.string().trim().optional(),
    slogan: z.string().trim().optional(),
    tax_office: z.string().trim().optional(),
    tax_number: z.string().trim().optional(),
    mersis_number: z.string().trim().optional(),
    trade_registry_number: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    email: z.string().trim().optional(),
    website: z.string().trim().optional(),
    address: z.string().trim().optional(),
    district: z.string().trim().optional(),
    city: z.string().trim().optional(),
    postal_code: z.string().trim().optional(),
    production_address: z.string().trim().optional(),
    shipment_contact_name: z.string().trim().optional(),
    shipment_contact_phone: z.string().trim().optional(),
    finance_contact_name: z.string().trim().optional(),
    finance_contact_email: z.string().trim().optional(),
    about: z.string().trim().optional(),
  })
  .strict();

export type CompanyProfileFormState = z.infer<typeof companyProfileSchema>;

export type CompanyProfileStructuredFormProps = {
  value: any;
  onChange: (next: CompanyProfileFormState) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  seed?: CompanyProfileFormState;
};

const safeObj = (v: any) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);

export function companyObjToForm(v: any, seed: CompanyProfileFormState): CompanyProfileFormState {
  const base = safeObj(v) || seed;
  const parsed = companyProfileSchema.safeParse(base);
  return parsed.success ? parsed.data : seed;
}

export function companyFormToObj(s: CompanyProfileFormState) {
  return companyProfileSchema.parse({
    company_name: s.company_name?.trim() || '',
    legal_name: s.legal_name?.trim() || '',
    slogan: s.slogan?.trim() || '',
    tax_office: s.tax_office?.trim() || '',
    tax_number: s.tax_number?.trim() || '',
    mersis_number: s.mersis_number?.trim() || '',
    trade_registry_number: s.trade_registry_number?.trim() || '',
    phone: s.phone?.trim() || '',
    email: s.email?.trim() || '',
    website: s.website?.trim() || '',
    address: s.address?.trim() || '',
    district: s.district?.trim() || '',
    city: s.city?.trim() || '',
    postal_code: s.postal_code?.trim() || '',
    production_address: s.production_address?.trim() || '',
    shipment_contact_name: s.shipment_contact_name?.trim() || '',
    shipment_contact_phone: s.shipment_contact_phone?.trim() || '',
    finance_contact_name: s.finance_contact_name?.trim() || '',
    finance_contact_email: s.finance_contact_email?.trim() || '',
    about: s.about?.trim() || '',
  });
}

export const CompanyProfileStructuredForm: React.FC<CompanyProfileStructuredFormProps> = ({
  value,
  onChange,
  errors,
  disabled,
  seed,
}) => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const s = (seed || {
    company_name: 'Paspas',
    legal_name: '',
    slogan: '',
    tax_office: '',
    tax_number: '',
    mersis_number: '',
    trade_registry_number: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    district: '',
    city: '',
    postal_code: '',
    production_address: '',
    shipment_contact_name: '',
    shipment_contact_phone: '',
    finance_contact_name: '',
    finance_contact_email: '',
    about: '',
  }) as CompanyProfileFormState;
  const form = companyObjToForm(value, s);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="company-name" className="text-sm">{t('admin.siteSettings.structured.companyProfile.labels.companyName')}</Label>
        <Input
          id="company-name"
          className="h-8"
          value={form.company_name || ''}
          onChange={(e) => onChange({ ...form, company_name: e.target.value })}
          disabled={disabled}
        />
        {errors?.company_name && <p className="text-xs text-destructive">{errors.company_name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-legal-name" className="text-sm">{t('admin.siteSettings.structured.companyProfile.labels.legalName')}</Label>
        <Input
          id="company-legal-name"
          className="h-8"
          value={form.legal_name || ''}
          onChange={(e) => onChange({ ...form, legal_name: e.target.value })}
          disabled={disabled}
        />
        {errors?.legal_name && <p className="text-xs text-destructive">{errors.legal_name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-slogan" className="text-sm">{t('admin.siteSettings.structured.companyProfile.labels.slogan')}</Label>
        <Input
          id="company-slogan"
          className="h-8"
          value={form.slogan || ''}
          onChange={(e) => onChange({ ...form, slogan: e.target.value })}
          disabled={disabled}
        />
        {errors?.slogan && <p className="text-xs text-destructive">{errors.slogan}</p>}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="company-address" className="text-sm">{t('admin.siteSettings.structured.companyProfile.labels.address')}</Label>
        <Textarea
          id="company-address"
          rows={3}
          value={form.address || ''}
          onChange={(e) => onChange({ ...form, address: e.target.value })}
          disabled={disabled}
          className="text-sm"
        />
        {errors?.address && <p className="text-xs text-destructive">{errors.address}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-district" className="text-sm">{t('admin.siteSettings.structured.companyProfile.labels.district')}</Label>
        <Input
          id="company-district"
          className="h-8"
          value={form.district || ''}
          onChange={(e) => onChange({ ...form, district: e.target.value })}
          disabled={disabled}
        />
        {errors?.district && <p className="text-xs text-destructive">{errors.district}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-city" className="text-sm">{t('admin.siteSettings.structured.companyProfile.labels.city')}</Label>
        <Input
          id="company-city"
          className="h-8"
          value={form.city || ''}
          onChange={(e) => onChange({ ...form, city: e.target.value })}
          disabled={disabled}
        />
        {errors?.city && <p className="text-xs text-destructive">{errors.city}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-postal-code" className="text-sm">{t('admin.siteSettings.structured.companyProfile.labels.postalCode')}</Label>
        <Input
          id="company-postal-code"
          className="h-8"
          value={form.postal_code || ''}
          onChange={(e) => onChange({ ...form, postal_code: e.target.value })}
          disabled={disabled}
        />
        {errors?.postal_code && <p className="text-xs text-destructive">{errors.postal_code}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-phone" className="text-sm">{t('admin.siteSettings.structured.companyProfile.labels.phone')}</Label>
        <Input
          id="company-phone"
          className="h-8"
          value={form.phone || ''}
          onChange={(e) => onChange({ ...form, phone: e.target.value })}
          disabled={disabled}
        />
        {errors?.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-email" className="text-sm">{t('admin.siteSettings.structured.companyProfile.labels.email')}</Label>
        <Input
          id="company-email"
          className="h-8"
          value={form.email || ''}
          onChange={(e) => onChange({ ...form, email: e.target.value })}
          disabled={disabled}
        />
        {errors?.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-website" className="text-sm">{t('admin.siteSettings.structured.companyProfile.labels.website')}</Label>
        <Input
          id="company-website"
          className="h-8"
          value={form.website || ''}
          onChange={(e) => onChange({ ...form, website: e.target.value })}
          disabled={disabled}
        />
        {errors?.website && <p className="text-xs text-destructive">{errors.website}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-tax-office" className="text-sm">{t('admin.siteSettings.structured.companyProfile.labels.taxOffice')}</Label>
        <Input
          id="company-tax-office"
          className="h-8"
          value={form.tax_office || ''}
          onChange={(e) => onChange({ ...form, tax_office: e.target.value })}
          disabled={disabled}
        />
        {errors?.tax_office && <p className="text-xs text-destructive">{errors.tax_office}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-tax-number" className="text-sm">{t('admin.siteSettings.structured.companyProfile.labels.taxNumber')}</Label>
        <Input
          id="company-tax-number"
          className="h-8"
          value={form.tax_number || ''}
          onChange={(e) => onChange({ ...form, tax_number: e.target.value })}
          disabled={disabled}
        />
        {errors?.tax_number && <p className="text-xs text-destructive">{errors.tax_number}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-mersis-number" className="text-sm">{t('admin.siteSettings.structured.companyProfile.labels.mersisNumber')}</Label>
        <Input
          id="company-mersis-number"
          className="h-8"
          value={form.mersis_number || ''}
          onChange={(e) => onChange({ ...form, mersis_number: e.target.value })}
          disabled={disabled}
        />
        {errors?.mersis_number && <p className="text-xs text-destructive">{errors.mersis_number}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-trade-registry-number" className="text-sm">{t('admin.siteSettings.structured.companyProfile.labels.tradeRegistryNumber')}</Label>
        <Input
          id="company-trade-registry-number"
          className="h-8"
          value={form.trade_registry_number || ''}
          onChange={(e) => onChange({ ...form, trade_registry_number: e.target.value })}
          disabled={disabled}
        />
        {errors?.trade_registry_number && <p className="text-xs text-destructive">{errors.trade_registry_number}</p>}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="company-production-address" className="text-sm">{t('admin.siteSettings.structured.companyProfile.labels.productionAddress')}</Label>
        <Textarea
          id="company-production-address"
          rows={3}
          value={form.production_address || ''}
          onChange={(e) => onChange({ ...form, production_address: e.target.value })}
          disabled={disabled}
          className="text-sm"
        />
        {errors?.production_address && <p className="text-xs text-destructive">{errors.production_address}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-shipment-contact-name" className="text-sm">{t('admin.siteSettings.structured.companyProfile.labels.shipmentContactName')}</Label>
        <Input
          id="company-shipment-contact-name"
          className="h-8"
          value={form.shipment_contact_name || ''}
          onChange={(e) => onChange({ ...form, shipment_contact_name: e.target.value })}
          disabled={disabled}
        />
        {errors?.shipment_contact_name && <p className="text-xs text-destructive">{errors.shipment_contact_name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-shipment-contact-phone" className="text-sm">{t('admin.siteSettings.structured.companyProfile.labels.shipmentContactPhone')}</Label>
        <Input
          id="company-shipment-contact-phone"
          className="h-8"
          value={form.shipment_contact_phone || ''}
          onChange={(e) => onChange({ ...form, shipment_contact_phone: e.target.value })}
          disabled={disabled}
        />
        {errors?.shipment_contact_phone && <p className="text-xs text-destructive">{errors.shipment_contact_phone}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-finance-contact-name" className="text-sm">{t('admin.siteSettings.structured.companyProfile.labels.financeContactName')}</Label>
        <Input
          id="company-finance-contact-name"
          className="h-8"
          value={form.finance_contact_name || ''}
          onChange={(e) => onChange({ ...form, finance_contact_name: e.target.value })}
          disabled={disabled}
        />
        {errors?.finance_contact_name && <p className="text-xs text-destructive">{errors.finance_contact_name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-finance-contact-email" className="text-sm">{t('admin.siteSettings.structured.companyProfile.labels.financeContactEmail')}</Label>
        <Input
          id="company-finance-contact-email"
          className="h-8"
          value={form.finance_contact_email || ''}
          onChange={(e) => onChange({ ...form, finance_contact_email: e.target.value })}
          disabled={disabled}
        />
        {errors?.finance_contact_email && <p className="text-xs text-destructive">{errors.finance_contact_email}</p>}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="company-about" className="text-sm">{t('admin.siteSettings.structured.companyProfile.labels.about')}</Label>
        <Textarea
          id="company-about"
          rows={6}
          value={form.about || ''}
          onChange={(e) => onChange({ ...form, about: e.target.value })}
          disabled={disabled}
          className="text-sm"
        />
        {errors?.about && <p className="text-xs text-destructive">{errors.about}</p>}
      </div>
    </div>
  );
};

CompanyProfileStructuredForm.displayName = 'CompanyProfileStructuredForm';
