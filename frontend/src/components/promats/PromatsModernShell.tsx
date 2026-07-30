/**
 * 2026 sayfa kabuğu — üretim ve ürünler sayfalarının paylaştığı bloklar.
 *
 * uretim2026.jpg tasarımının hero / istatistik şeridi / bölüm başlığı / iletişim kartı
 * parçaları iki sayfada da birebir aynı. Kopyalamak yerine tek yerde yaşarlar; stil
 * tarafındaki karşılıkları `src/styles/promats-modern.css` içindeki `.pm-*` sınıflarıdır.
 */

import { DevNote } from '@/components/devnote';

import PromatsContactForm from './PromatsContactForm';
import PromatsImage from './PromatsImage';

export type TitleLines = string[];

export type PmStat = { value: string; label: string };

export type PmContactLabels = {
  title: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  submit: string;
  success: string;
  error: string;
};

/** Çok satırlı başlıkları <br> yerine blok span'lerle kurar (satır kırılımı deterministik). */
export function StackedTitle({ lines }: { lines: TitleLines }): React.JSX.Element {
  return (
    <>
      {lines.map((line, i) => (
        <span key={`${line}-${i}`}>{line}</span>
      ))}
    </>
  );
}

/**
 * Hero'nun sol yarısındaki dekoratif ağ deseni. Tasarımda desen fotoğrafın üstüne basılı
 * geldiği için mockup'tan kesilemezdi (başlık metni de aynı alandaydı); düğüm konumları
 * tasarımdan ölçülerek SVG'ye taşındı.
 */
const NETWORK_NODES: { cx: number; cy: number; r: number }[] = [
  { cx: 562, cy: 158, r: 48 },
  { cx: 812, cy: 137, r: 34 },
  { cx: 151, cy: 304, r: 48 },
  { cx: 935, cy: 442, r: 41 },
  { cx: 686, cy: 597, r: 48 },
  { cx: 165, cy: 716, r: 34 },
];

const NETWORK_EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 3],
  [2, 4],
  [3, 4],
  [4, 5],
  [2, 5],
];

function HeroNetwork(): React.JSX.Element {
  return (
    <svg className="pm-hero__network" viewBox="0 0 1000 800" role="presentation" aria-hidden="true" preserveAspectRatio="xMinYMid slice">
      <g className="pm-hero__edges">
        {NETWORK_EDGES.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={NETWORK_NODES[a]!.cx} y1={NETWORK_NODES[a]!.cy} x2={NETWORK_NODES[b]!.cx} y2={NETWORK_NODES[b]!.cy} />
        ))}
        <line x1={-40} y1={120} x2={562} y2={158} />
        <line x1={562} y1={158} x2={1040} y2={-30} />
        <line x1={935} y1={442} x2={1060} y2={640} />
        <line x1={165} y1={716} x2={-40} y2={840} />
      </g>
      <g className="pm-hero__nodes">
        {NETWORK_NODES.map((n) => (
          <circle key={`${n.cx}-${n.cy}`} cx={n.cx} cy={n.cy} r={n.r} />
        ))}
      </g>
    </svg>
  );
}

export function PmHero({
  image,
  assetBase,
  eyebrow,
  headline,
  text,
  children,
  devNoteSection,
  devNoteTitle,
}: {
  image: string | null | undefined;
  assetBase?: '/assets' | '/userfiles';
  eyebrow: string;
  headline: TitleLines;
  text: string;
  /** Metnin altına eklenen opsiyonel içerik (rozetler, butonlar). */
  children?: React.ReactNode;
  devNoteSection: string;
  devNoteTitle: string;
}): React.JSX.Element {
  return (
    <section className="pm-hero position-relative">
      <DevNote section={devNoteSection} title={devNoteTitle} />
      <div className="pm-hero__bg" aria-hidden="true">
        <PromatsImage src={image} alt="" fill priority sizes="100vw" assetBase={assetBase} />
      </div>
      <HeroNetwork />
      <div className="container pm-hero__inner">
        <div className="pm-hero__copy" data-aos="fade-up">
          <span className="pm-hero__eyebrow">{eyebrow}</span>
          <h1 className="pm-hero__headline">
            <StackedTitle lines={headline} />
          </h1>
          <p className="pm-hero__text">{text}</p>
          {children}
        </div>
      </div>
    </section>
  );
}

/**
 * Şerit sütun sayısı öğe adedinden türer: 4 öğe → 4 sütun; 6 öğe → 3 sütun (iki satır).
 * 4'e bölünüyorsa 4, değilse 3'e düşer; deterministik, öğe adedi değişse de tutarlı.
 */
function statsColumns(count: number): number {
  if (count <= 4) return count;
  return count % 4 === 0 ? 4 : 3;
}

/** Hero'nun alt kenarına binen turuncu istatistik şeridi. */
export function PmStats({ stats }: { stats: PmStat[] }): React.JSX.Element {
  const cols = statsColumns(stats.length);
  return (
    <div className="pm-stats-wrap">
      <div className="container">
        <ul
          className="pm-stats"
          data-aos="fade-up"
          style={{ ['--pm-stats-cols' as string]: String(cols) }}
        >
          {stats.map((stat) => (
            <li className="pm-stats__item" key={stat.label}>
              <strong className="pm-stats__value">{stat.value}</strong>
              <span className="pm-stats__label">{stat.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Ortalanmış iki satırlı turuncu bölüm başlığı + açıklama. */
export function PmSectionHeading({ line1, line2, intro }: { line1: string; line2: string; intro: string }): React.JSX.Element {
  return (
    <>
      <h2 className="pm-caps__title" data-aos="fade-up">
        <span>{line1}</span>
        <span>{line2}</span>
      </h2>
      <p className="pm-caps__intro" data-aos="fade-up" data-aos-delay="50">
        {intro}
      </p>
    </>
  );
}

export function PmContactBlock({
  labels,
  devNoteSection,
  devNoteTitle,
}: {
  labels: PmContactLabels;
  devNoteSection: string;
  devNoteTitle: string;
}): React.JSX.Element {
  return (
    <section className="pm-contact position-relative">
      <DevNote section={devNoteSection} title={devNoteTitle} />
      <div className="container">
        <div className="pm-contact__card" data-aos="fade-up">
          <h2 className="pm-contact__title">{labels.title}</h2>
          <PromatsContactForm formClassName="pm-contact__form" labels={labels} />
        </div>
      </div>
    </section>
  );
}
