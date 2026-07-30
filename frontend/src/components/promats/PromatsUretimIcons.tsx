/**
 * Üretim sayfası çizgi ikonları.
 *
 * Tasarımdaki (uretim2026.jpg) dört yetkinlik ikonu, koyu gövde + turuncu kesik daire
 * çerçeve kombinasyonundan oluşuyor. Raster olarak kesmek yerine inline SVG: her ölçekte
 * net, tema renklerini (--pm-brand) miras alır, ek istek üretmez.
 */

const STROKE = { fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Paspas silueti — üç ikonda ortak, tekrar yazılmasın diye tek yerde. */
function MatOutline({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <path
      {...STROKE}
      d={`M${x + w * 0.18} ${y} h${w * 0.64} a${w * 0.18} ${w * 0.18} 0 0 1 ${w * 0.18} ${w * 0.18} v${h - w * 0.36} a${w * 0.18} ${w * 0.18} 0 0 1 -${w * 0.18} ${w * 0.18} h-${w * 0.64} a${w * 0.18} ${w * 0.18} 0 0 1 -${w * 0.18} -${w * 0.18} v-${h - w * 0.36} a${w * 0.18} ${w * 0.18} 0 0 1 ${w * 0.18} -${w * 0.18} z`}
    />
  );
}

function IconProduct() {
  return (
    <g>
      <MatOutline x={44} y={26} w={56} h={68} />
      <circle {...STROKE} cx={58} cy={80} r={4} />
      <circle {...STROKE} cx={86} cy={80} r={4} />
      <path {...STROKE} d="M40 96 L18 40" strokeDasharray="7 7" />
      <path {...STROKE} d="M22 26 L36 20 L44 38 L30 44 Z" />
      <path {...STROKE} d="M30 44 L28 56 L38 50 Z" />
      <path {...STROKE} d="M104 60 h16" strokeDasharray="6 7" />
    </g>
  );
}

function IconMaterial() {
  return (
    <g>
      <path {...STROKE} d="M20 78 L58 60 L96 78 L58 96 Z" />
      <path {...STROKE} d="M20 62 L58 44 L96 62" />
      <path {...STROKE} d="M20 46 L58 28 L96 46" />
      <circle {...STROKE} cx={94} cy={36} r={22} />
      <circle {...STROKE} cx={94} cy={28} r={4} />
      <circle {...STROKE} cx={86} cy={44} r={4} />
      <circle {...STROKE} cx={102} cy={44} r={4} />
      <path {...STROKE} d="M94 32 L88 41 M94 32 L100 41 M89 45 L99 45" />
    </g>
  );
}

function IconInjection() {
  return (
    <g>
      <rect {...STROKE} x={16} y={44} width={38} height={44} rx={3} />
      <rect {...STROKE} x={24} y={52} width={22} height={28} rx={2} />
      <path {...STROKE} d="M54 60 h14 M54 72 h14" />
      <rect {...STROKE} x={68} y={54} width={10} height={24} rx={2} />
      <rect {...STROKE} x={78} y={48} width={30} height={36} rx={3} />
      <path {...STROKE} d="M84 48 L88 26 h20 l4 22" />
      <path {...STROKE} d="M12 88 h104 v8 H12 z" />
    </g>
  );
}

function IconQuality() {
  return (
    <g>
      <MatOutline x={30} y={22} w={54} h={66} />
      <circle {...STROKE} cx={92} cy={84} r={22} />
      <path {...STROKE} d="M82 84 L89 91 L103 77" />
    </g>
  );
}

const GLYPHS: Record<string, () => React.JSX.Element> = {
  product: IconProduct,
  material: IconMaterial,
  injection: IconInjection,
  quality: IconQuality,
};

/**
 * Turuncu kesik daire çerçeve + koyu çizgi glif. `name` bilinmiyorsa hiçbir şey çizilmez
 * (JSON'a yeni yetkinlik eklenirse sessizce boş kalır, sayfa patlamaz).
 */
export function PromatsUretimIcon({ name }: { name: string }): React.JSX.Element | null {
  const Glyph = GLYPHS[name];
  if (!Glyph) return null;
  return (
    <svg className="pm-cap__icon" viewBox="0 0 128 128" role="presentation" aria-hidden="true">
      <circle
        className="pm-cap__ring"
        cx={64}
        cy={64}
        r={58}
        fill="none"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray="150 40"
        strokeDashoffset={40}
      />
      <g className="pm-cap__glyph">
        <Glyph />
      </g>
    </svg>
  );
}

/** Kalite kontrol bandındaki daire-tik işareti. */
export function PromatsCheckCircle(): React.JSX.Element {
  return (
    <svg className="pm-check" viewBox="0 0 40 40" role="presentation" aria-hidden="true">
      <path
        d="M36 20a16 16 0 1 1-6.5-12.9"
        fill="none"
        stroke="currentColor"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <path d="M12 20.5 L18 27 L37 7" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
