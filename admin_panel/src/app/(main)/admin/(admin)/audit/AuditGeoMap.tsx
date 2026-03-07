'use client';

import React, { useMemo, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';

import type { AuditGeoStatsRowDto } from '@/integrations/shared';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

/* ISO 3166-1 numeric → alpha-2 mapping (for world-atlas topojson) */
const NUM_TO_A2: Record<string, string> = {
  '004': 'AF', '008': 'AL', '012': 'DZ', '020': 'AD', '024': 'AO',
  '028': 'AG', '032': 'AR', '036': 'AU', '040': 'AT', '044': 'BS',
  '048': 'BH', '050': 'BD', '051': 'AM', '052': 'BB', '056': 'BE',
  '064': 'BT', '068': 'BO', '070': 'BA', '072': 'BW', '076': 'BR',
  '084': 'BZ', '090': 'SB', '096': 'BN', '100': 'BG', '104': 'MM',
  '108': 'BI', '112': 'BY', '116': 'KH', '120': 'CM', '124': 'CA',
  '132': 'CV', '140': 'CF', '144': 'LK', '148': 'TD', '152': 'CL',
  '156': 'CN', '158': 'TW', '170': 'CO', '174': 'KM', '178': 'CG',
  '180': 'CD', '188': 'CR', '191': 'HR', '192': 'CU', '196': 'CY',
  '203': 'CZ', '204': 'BJ', '208': 'DK', '212': 'DM', '214': 'DO',
  '218': 'EC', '222': 'SV', '226': 'GQ', '231': 'ET', '232': 'ER',
  '233': 'EE', '242': 'FJ', '246': 'FI', '250': 'FR', '262': 'DJ',
  '266': 'GA', '268': 'GE', '270': 'GM', '276': 'DE', '288': 'GH',
  '296': 'KI', '300': 'GR', '308': 'GD', '320': 'GT', '324': 'GN',
  '328': 'GY', '332': 'HT', '340': 'HN', '348': 'HU', '352': 'IS',
  '356': 'IN', '360': 'ID', '364': 'IR', '368': 'IQ', '372': 'IE',
  '376': 'IL', '380': 'IT', '384': 'CI', '388': 'JM', '392': 'JP',
  '398': 'KZ', '400': 'JO', '404': 'KE', '408': 'KP', '410': 'KR',
  '414': 'KW', '417': 'KG', '418': 'LA', '422': 'LB', '426': 'LS',
  '428': 'LV', '430': 'LR', '434': 'LY', '438': 'LI', '440': 'LT',
  '442': 'LU', '450': 'MG', '454': 'MW', '458': 'MY', '462': 'MV',
  '466': 'ML', '470': 'MT', '478': 'MR', '480': 'MU', '484': 'MX',
  '492': 'MC', '496': 'MN', '498': 'MD', '499': 'ME', '504': 'MA',
  '508': 'MZ', '512': 'OM', '516': 'NA', '520': 'NR', '524': 'NP',
  '528': 'NL', '540': 'NC', '548': 'VU', '554': 'NZ', '558': 'NI',
  '562': 'NE', '566': 'NG', '578': 'NO', '583': 'FM', '586': 'PK',
  '591': 'PA', '598': 'PG', '600': 'PY', '604': 'PE', '608': 'PH',
  '616': 'PL', '620': 'PT', '624': 'GW', '626': 'TL', '630': 'PR',
  '634': 'QA', '642': 'RO', '643': 'RU', '646': 'RW', '659': 'KN',
  '662': 'LC', '670': 'VC', '674': 'SM', '678': 'ST', '682': 'SA',
  '686': 'SN', '688': 'RS', '690': 'SC', '694': 'SL', '702': 'SG',
  '703': 'SK', '704': 'VN', '705': 'SI', '706': 'SO', '710': 'ZA',
  '716': 'ZW', '724': 'ES', '728': 'SS', '729': 'SD', '740': 'SR',
  '748': 'SZ', '752': 'SE', '756': 'CH', '760': 'SY', '762': 'TJ',
  '764': 'TH', '768': 'TG', '776': 'TO', '780': 'TT', '784': 'AE',
  '788': 'TN', '792': 'TR', '795': 'TM', '798': 'TV', '800': 'UG',
  '804': 'UA', '807': 'MK', '818': 'EG', '826': 'GB', '834': 'TZ',
  '840': 'US', '854': 'BF', '858': 'UY', '860': 'UZ', '862': 'VE',
  '882': 'WS', '887': 'YE', '894': 'ZM',
  '-99': 'XK', // Kosovo
};

/* Country name labels for tooltip */
const COUNTRY_NAMES: Record<string, string> = {
  TR: 'Türkiye', DE: 'Almanya', US: 'ABD', GB: 'Birleşik Krallık',
  FR: 'Fransa', NL: 'Hollanda', IT: 'İtalya', ES: 'İspanya',
  AT: 'Avusturya', CH: 'İsviçre', BE: 'Belçika', PL: 'Polonya',
  SE: 'İsveç', NO: 'Norveç', DK: 'Danimarka', FI: 'Finlandiya',
  RU: 'Rusya', UA: 'Ukrayna', CN: 'Çin', JP: 'Japonya',
  KR: 'Güney Kore', IN: 'Hindistan', BR: 'Brezilya', CA: 'Kanada',
  AU: 'Avustralya', MX: 'Meksika', SA: 'Suudi Arabistan', AE: 'BAE',
  EG: 'Mısır', ZA: 'Güney Afrika', IR: 'İran', IQ: 'Irak',
  SY: 'Suriye', GR: 'Yunanistan', PT: 'Portekiz', IE: 'İrlanda',
  CZ: 'Çekya', RO: 'Romanya', HU: 'Macaristan', BG: 'Bulgaristan',
  RS: 'Sırbistan', HR: 'Hırvatistan', SK: 'Slovakya', SI: 'Slovenya',
  BA: 'Bosna', AL: 'Arnavutluk', MK: 'K. Makedonya', XK: 'Kosova',
  ME: 'Karadağ', GE: 'Gürcistan', AZ: 'Azerbaycan', AM: 'Ermenistan',
  KZ: 'Kazakistan', UZ: 'Özbekistan', TM: 'Türkmenistan',
  KG: 'Kırgızistan', TJ: 'Tacikistan', PK: 'Pakistan', BD: 'Bangladeş',
  ID: 'Endonezya', MY: 'Malezya', TH: 'Tayland', VN: 'Vietnam',
  PH: 'Filipinler', SG: 'Singapur', NZ: 'Yeni Zelanda',
  AR: 'Arjantin', CL: 'Şili', CO: 'Kolombiya', PE: 'Peru',
  LOCAL: 'Localhost',
};

function getCountryName(code: string): string {
  return COUNTRY_NAMES[code] || code;
}

/* Color scale: 0 → #e2e8f0, max → #1e40af */
function getColor(count: number, max: number): string {
  if (count === 0 || max === 0) return '#e2e8f0';
  const ratio = Math.min(count / max, 1);
  // interpolate between light blue and dark blue
  const colors = ['#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a8a'];
  const idx = Math.min(Math.floor(ratio * (colors.length - 1)), colors.length - 2);
  const t = ratio * (colors.length - 1) - idx;
  // simple step
  return colors[Math.round(ratio * (colors.length - 1))];
}

type Props = {
  items: AuditGeoStatsRowDto[];
  loading?: boolean;
};

export const AuditGeoMap: React.FC<Props> = ({ items, loading }) => {
  const [tooltip, setTooltip] = useState<{
    name: string;
    code: string;
    count: number;
    unique_ips: number;
    x: number;
    y: number;
  } | null>(null);

  const countByCode = useMemo(() => {
    const map = new Map<string, { count: number; unique_ips: number }>();
    for (const r of items) {
      const c = r.country?.toUpperCase();
      if (!c) continue;
      const prev = map.get(c) ?? { count: 0, unique_ips: 0 };
      map.set(c, {
        count: prev.count + r.count,
        unique_ips: prev.unique_ips + r.unique_ips,
      });
    }
    return map;
  }, [items]);

  const maxCount = useMemo(() => {
    let m = 0;
    for (const v of countByCode.values()) m = Math.max(m, v.count);
    return Math.max(1, m);
  }, [countByCode]);

  const totalRequests = useMemo(
    () => items.reduce((s, r) => s + r.count, 0),
    [items],
  );

  const topCountries = useMemo(() => {
    return [...countByCode.entries()]
      .map(([code, v]) => ({ code, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [countByCode]);

  return (
    <div className="space-y-4">
      <div
        className="relative rounded-lg border bg-card overflow-hidden min-h-[400px]"
        onMouseLeave={() => setTooltip(null)}
      >
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
            <span className="text-sm text-muted-foreground animate-pulse">Harita yükleniyor...</span>
          </div>
        )}

        <ComposableMap
          projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}
          width={800}
          height={400}
          style={{ width: '100%', height: 'auto' }}
        >
          <ZoomableGroup center={[10, 20]} zoom={1}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const numId = geo.id ?? geo.properties?.['ISO_N3'] ?? '';
                  const a2 =
                    geo.properties?.['ISO_A2'] ??
                    NUM_TO_A2[String(numId)] ??
                    '';
                  const data = countByCode.get(a2);
                  const count = data?.count ?? 0;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getColor(count, maxCount)}
                      stroke="#cbd5e1"
                      strokeWidth={0.4}
                      onMouseEnter={(evt) => {
                        const name = getCountryName(a2);
                        setTooltip({
                          name,
                          code: a2,
                          count,
                          unique_ips: data?.unique_ips ?? 0,
                          x: evt.clientX,
                          y: evt.clientY,
                        });
                      }}
                      onMouseMove={(evt) => {
                        setTooltip((prev) =>
                          prev ? { ...prev, x: evt.clientX, y: evt.clientY } : null,
                        );
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        default: { outline: 'none' },
                        hover: { fill: count > 0 ? '#f59e0b' : '#f1f5f9', outline: 'none' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {tooltip && (
          <div
            className="pointer-events-none fixed z-50 rounded-md border bg-popover px-3 py-2 text-sm shadow-md"
            style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
          >
            <div className="font-medium">
              {tooltip.name} ({tooltip.code})
            </div>
            {tooltip.count > 0 ? (
              <div className="text-muted-foreground">
                {tooltip.count} istek · {tooltip.unique_ips} benzersiz IP
              </div>
            ) : (
              <div className="text-muted-foreground">Veri yok</div>
            )}
          </div>
        )}
      </div>

      {/* Legend + Top Countries */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Color Legend */}
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-2 text-sm font-medium">Renk Skalası</div>
          <div className="flex items-center gap-1">
            {['#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a8a'].map((c, i) => (
              <div
                key={c}
                className="h-4 flex-1 first:rounded-l last:rounded-r"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>{maxCount}</span>
          </div>
        </div>

        {/* Top Countries Table */}
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-2 text-sm font-medium">
            Top Ülkeler ({totalRequests} toplam istek)
          </div>
          {topCountries.length === 0 ? (
            <div className="text-sm text-muted-foreground">Konum verisi yok.</div>
          ) : (
            <div className="space-y-1">
              {topCountries.map((c, i) => {
                const pct = totalRequests > 0 ? ((c.count / totalRequests) * 100).toFixed(1) : '0';
                return (
                  <div key={c.code} className="flex items-center gap-2 text-sm">
                    <span className="w-5 text-right text-muted-foreground">{i + 1}.</span>
                    <span className="w-8 font-mono text-xs">{c.code}</span>
                    <span className="flex-1 truncate">{getCountryName(c.code)}</span>
                    <span className="font-medium tabular-nums">{c.count}</span>
                    <span className="w-12 text-right text-xs text-muted-foreground">{pct}%</span>
                    <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${Math.min(100, (c.count / maxCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
