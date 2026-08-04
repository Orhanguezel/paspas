export type TeklifTalepUrun = {
  urunId?: string;
  slug: string;
  ad: string;
};

export type TeklifTalepPayload = {
  kaynakSayfa: string;
  referrer?: string;
  dil: 'tr' | 'en' | 'de';
  ad: string;
  firma?: string;
  email?: string;
  telefon?: string;
  konu?: string;
  mesaj?: string;
  formDetaylari?: { ulke?: string; websiteUrl?: string; urunIlgisi?: string; miktar?: string };
  seciliUrunler: TeklifTalepUrun[];
  utm?: Record<string, string>;
  kvkkOnay: boolean;
  website: string;
};

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

export function readUtm(search: string): Record<string, string> | undefined {
  const params = new URLSearchParams(search);
  const utm = Object.fromEntries(UTM_KEYS.flatMap((key) => {
    const value = params.get(key)?.trim().slice(0, 255);
    return value ? [[key, value]] : [];
  }));
  return Object.keys(utm).length ? utm : undefined;
}

export function buildTeklifTalepPayload(input: Omit<TeklifTalepPayload, 'utm'> & { search?: string }): TeklifTalepPayload {
  const { search = '', ...payload } = input;
  return { ...payload, utm: readUtm(search) };
}
