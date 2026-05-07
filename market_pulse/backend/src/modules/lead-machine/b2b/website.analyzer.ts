import { askBestAvailable } from '../_shared/ai.client';
import { scrape, type LeadPageData } from '../_shared/scraper.client';

export interface WebsiteAnalysis {
  sells:         string[];
  is_b2b:        boolean;
  sells_china:   boolean | null;
  private_label: boolean | null;
  firm_type:     string | null;
  pain_points:   string[];
  summary:       string;
}

export async function analyzeCompanyWebsite(url: string): Promise<WebsiteAnalysis> {
  const page = await scrape(url, { profile: 'lead-page', return_text: true, mode: 'stealthy' });
  const data = page.data as unknown as LeadPageData;
  const text = String(page.text ?? '').slice(0, 12000) || data.text_content?.slice(0, 12000) || '';

  let summary = '';
  if (text) {
    try {
      summary = await askBestAvailable(
        `Analyze this company website for B2B lead qualification. Return concise Turkish summary with products, B2B/B2C, importer/distributor signals, private label and likely pain points.\n\n${text}`,
      );
    } catch {
      summary = [data.title, data.description].filter(Boolean).join(' — ') || text.slice(0, 500);
    }
  }

  return {
    sells:         data.product_keywords?.slice(0, 10) ?? [],
    is_b2b:        data.has_b2b_signals ?? false,
    sells_china:   data.has_china_signals ? true : null,
    private_label: data.has_private_label ? true : null,
    firm_type:     data.firm_type_hints?.[0] ?? null,
    pain_points:   [],
    summary,
  };
}
