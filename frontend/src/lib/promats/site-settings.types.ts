/** site_settings JSON value shapes used in Header/Footer */

export type CompanyBrandSetting = {
  name?: string;
  website?: string;
  phone?: string;
  email?: string;
  socials?: Record<string, string>;
};

export type ContactInfoSetting = {
  companyName?: string;
  website?: string;
  email?: string;
  whatsappNumber?: string;
  phones?: string[];
};

export function parseCompanyBrand(value: unknown): CompanyBrandSetting {
  if (typeof value !== 'object' || value === null) return {};
  const v = value as Record<string, unknown>;
  return {
    name: typeof v.name === 'string' ? v.name : undefined,
    website: typeof v.website === 'string' ? v.website : undefined,
    phone: typeof v.phone === 'string' ? v.phone : undefined,
    email: typeof v.email === 'string' ? v.email : undefined,
    socials:
      typeof v.socials === 'object' && v.socials !== null
        ? (v.socials as Record<string, string>)
        : undefined,
  };
}

export function parseContactInfo(value: unknown): ContactInfoSetting {
  if (typeof value !== 'object' || value === null) return {};
  const v = value as Record<string, unknown>;
  return {
    companyName: typeof v.companyName === 'string' ? v.companyName : undefined,
    website: typeof v.website === 'string' ? v.website : undefined,
    email: typeof v.email === 'string' ? v.email : undefined,
    whatsappNumber: typeof v.whatsappNumber === 'string' ? v.whatsappNumber : undefined,
    phones: Array.isArray(v.phones) ? v.phones.filter((p): p is string => typeof p === 'string') : undefined,
  };
}
