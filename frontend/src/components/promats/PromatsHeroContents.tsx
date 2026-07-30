'use client';

/**
 * Hero'nun SABİT metin katmanı (orijinal promats.com.tr owl-hero davranışı).
 *
 * Orijinalde metin her slide'da aynıydı ve slide değişince lettering.js + GSAP ile harf harf
 * aşağıdan yukarı beliriyordu (y:100%→0, stagger, Expo.easeInOut). Bizim portta metin
 * slide'ların İÇİNDEydi; Swiper fade'i metni de geçirdiği için konum/içerik "oynuyordu".
 *
 * Bu bileşen metni slide'ların DIŞINA, slider üstünde tek sabit overlay'e taşır: arkada yalnız
 * görseller geçer, metin sabit kalır ve bir kez orijinal harf-reveal animasyonuyla gelir.
 */

export type HeroParsed = { headings: string[]; subHtml: string };

/** Orijinal owl-hero başlıkları büyük harf caps (PREMIUM / OTO PASPASLAR) — harf harf reveal. */
const LETTER_BASE_DELAY = 0.15;
const LETTER_STEP = 0.035;

/**
 * DB'den gelen (decodeHtml ile çözülmüş) hero HTML'inden başlık satırlarını ve alt-metin
 * bloğunu ayıklar. Başlık: her `<h1 class="hero-heading">` metni. Alt metin: `.sub-text`
 * div'inin iç HTML'i (paragraf + bnr-border görseli + "Explore/İncele" butonu).
 */
export function parseHeroContent(decodedHtml: string): HeroParsed {
  const headings: string[] = [];
  const headingRe = /<h1[^>]*class=["'][^"']*hero-heading[^"']*["'][^>]*>([\s\S]*?)<\/h1>/gi;
  let m: RegExpExecArray | null;
  while ((m = headingRe.exec(decodedHtml)) !== null) {
    const text = m[1]!.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (text) headings.push(text);
  }
  const subMatch = decodedHtml.match(/<div[^>]*class=["'][^"']*sub-text[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  const subHtml = subMatch
    ? subMatch[1]!
        .trim()
        .replace(
          /<img(?![^>]*\bwidth=)([^>]*\bclass=["'][^"']*\bbtn-border\b[^"']*["'][^>]*)>/gi,
          '<img width="40" height="39"$1>',
        )
    : '';
  return { headings, subHtml };
}

export default function PromatsHeroContents({ headings, subHtml }: HeroParsed) {
  // Stagger tüm başlık harfleri boyunca sürekli aksın (orijinalde iki <h1> tek DOM sırasında).
  let letterIndex = 0;

  return (
    <div className="site-hero-contents promats-hero-contents">
      {headings.map((line, lineIdx) => (
        <h1 className="hero-heading" key={`${line}-${lineIdx}`}>
          {line.split(/(\s+)/).map((token, tokenIdx) => {
            if (/^\s+$/.test(token)) {
              letterIndex += 1;
              return (
                <span className="pm-sp" key={`space-${tokenIdx}`}>
                  {' '}
                </span>
              );
            }
            return (
              <span className="pm-word" key={`${token}-${tokenIdx}`}>
                {[...token].map((ch, chIdx) => {
                  const delay = (LETTER_BASE_DELAY + letterIndex * LETTER_STEP).toFixed(3);
                  letterIndex += 1;
                  return (
                    <span className="pm-ltr" key={chIdx}>
                      <i style={{ animationDelay: `${delay}s` }}>{ch}</i>
                    </span>
                  );
                })}
              </span>
            );
          })}
        </h1>
      ))}
      {subHtml ? (
        <div className="sub-text" dangerouslySetInnerHTML={{ __html: subHtml }} />
      ) : null}
    </div>
  );
}
