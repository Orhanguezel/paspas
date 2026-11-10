// Banner ve "Neden Promats" ozel sayfalarinin `detail` HTML'i icin ayristirma/uretme.
//
// Site bu HTML'i REGEX ile okur (frontend PromatsHeroContents.parseHeroContent ve
// PromatsHome neden_promat yapisi). Panel serbest HTML duzenletmek yerine alanlari
// ayri ayri duzenletir ve HTML'i her kayitta BU sablonlardan yeniden uretir —
// boylece sozlesme (class adlari, etiket yapisi) hicbir duzenlemede bozulamaz.

export type HeroFields = {
  line1: string;
  line2: string;
  text: string;
  buttonLabel: string;
  buttonUrl: string;
};

export type NedenBadge = { image: string; label: string };

export type NedenFields = {
  title: string;
  /** Paragraflar; ciftte bir bos satirla ayrilmis duz metin (textarea gosterimi). */
  paragraphs: string;
  badges: NedenBadge[];
};

const BTN_BORDER_IMG = '<img alt="" class="btn-border" src="/assets/images/bnr-border.png">';

/** Eski CMS kayitlari HTML'i entity olarak saklar (&lt;h1&gt;...). Once cozulur. */
export function decodeDetailHtml(raw: string | null | undefined): string {
  const value = String(raw ?? '');
  if (!/&lt;|&gt;|&quot;|&#39;|&amp;/.test(value)) return value;
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;');
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Banner detail'i alanlara ayirir; hero yapisi bulunamazsa null (form yerine HTML editor acilir). */
export function parseHeroDetail(raw: string | null | undefined): HeroFields | null {
  const html = decodeDetailHtml(raw);
  const headings: string[] = [];
  const headingRe = /<h1[^>]*class=["'][^"']*hero-heading[^"']*["'][^>]*>([\s\S]*?)<\/h1>/gi;
  let m: RegExpExecArray | null;
  while ((m = headingRe.exec(html)) !== null) {
    const text = stripTags(m[1] ?? '');
    if (text) headings.push(text);
  }
  if (!headings.length) return null;
  const sub = html.match(/<div[^>]*class=["'][^"']*sub-text[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? '';
  const text = stripTags(sub.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? '');
  const button = sub.match(/<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/i);
  return {
    line1: headings[0] ?? '',
    line2: headings[1] ?? '',
    text,
    buttonUrl: button?.[1] ?? '',
    buttonLabel: stripTags(button?.[2] ?? ''),
  };
}

/** Alanlardan frontend sozlesmesine birebir uyan banner HTML'i uretir. */
export function buildHeroDetail(fields: HeroFields): string {
  const headings = [fields.line1, fields.line2]
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<h1 class="hero-heading">${escapeText(line)}</h1>`)
    .join('');
  const button = fields.buttonLabel.trim()
    ? `<a class="btn btn-yellow" href="${escapeAttr(fields.buttonUrl.trim() || '#')}">${escapeText(fields.buttonLabel.trim())}</a>`
    : '';
  const sub = `<div class="sub-text"><p>${escapeText(fields.text.trim())}</p>${BTN_BORDER_IMG}${button}</div>`;
  return `${headings}${sub}`;
}

/** "Neden Promats" detail'ini alanlara ayirir; yapi bulunamazsa null. */
export function parseNedenDetail(raw: string | null | undefined): NedenFields | null {
  const html = decodeDetailHtml(raw);
  const copy = html.match(/<div[^>]*class=["'][^"']*neden_promat[^"'_]*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1];
  if (!copy) return null;
  const title = stripTags(copy.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? '');
  const span = copy.match(/<span[^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? '';
  const paragraphs = span
    .split(/<br\s*\/?>\s*<br\s*\/?>/i)
    .map((part) => stripTags(part))
    .filter(Boolean)
    .join('\n\n');
  const badges: NedenBadge[] = [];
  const iconRe = /<div[^>]*class=["']icon["'][^>]*>([\s\S]*?)<\/div>/gi;
  let icon: RegExpExecArray | null;
  while ((icon = iconRe.exec(html)) !== null) {
    const body = icon[1] ?? '';
    badges.push({
      image: body.match(/<img[^>]*src=["']([^"']*)["']/i)?.[1] ?? '',
      label: stripTags(body.match(/<span[^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? ''),
    });
  }
  return { title, paragraphs, badges };
}

/** Alanlardan "Neden Promats" HTML'i uretir (frontend .neden_promat sozlesmesi). */
export function buildNedenDetail(fields: NedenFields): string {
  const paragraphs = fields.paragraphs
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => escapeText(part.replace(/\s*\n\s*/g, ' ')))
    .join('<br><br>');
  const copy = `<div class="neden_promat"><h2>${escapeText(fields.title.trim())}</h2><span>${paragraphs}</span></div>`;
  const icons = fields.badges
    .filter((badge) => badge.label.trim() || badge.image.trim())
    .map((badge) =>
      `<div class="icon"><img alt="" src="${escapeAttr(badge.image.trim())}"><span>${escapeText(badge.label.trim())}</span></div>`)
    .join('');
  const iconBar = icons ? `<div class="neden_promat_iconbg">${icons}</div>` : '';
  return `${copy}${iconBar}`;
}
