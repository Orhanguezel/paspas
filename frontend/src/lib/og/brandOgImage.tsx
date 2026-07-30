import { ImageResponse } from 'next/og';

import { getPublicAppName } from '@/lib/site-config';
import { DEFAULT_TOKENS } from '@/lib/tokens/defaults';

export const ogSize = {
  width: 1200,
  height: 630,
};

export type BrandOgImageParams = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  metric?: string;
  chips?: string[];
  symbols?: string[];
};

export function createBrandOgImage({
  title,
  subtitle,
  eyebrow = getPublicAppName(),
  metric,
  chips = [],
  symbols = ['☉', '☽', '✦'],
}: BrandOgImageParams) {
  const c = DEFAULT_TOKENS.colors;
  const bg = c.bg_base_dark || c.bg_base;
  const bgDeep = c.bg_deep_dark || c.bg_deep;
  const text = c.text_primary_dark || c.text_primary;
  const textSubtle = c.text_secondary_dark || c.text_secondary;
  const accent = c.brand_secondary;
  const accentSoft = c.brand_secondary_light;
  const accentDeep = c.brand_secondary_dim;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${bg} 0%, ${bgDeep} 100%)`,
          color: text,
          fontFamily: 'Georgia, serif',
          padding: 64,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
          background: `radial-gradient(circle at 16% 18%, color-mix(in srgb, ${accent} 28%, transparent), transparent 24%), radial-gradient(circle at 86% 72%, color-mix(in srgb, ${accentSoft} 30%, transparent), transparent 30%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: -90,
            top: -80,
            width: 420,
            height: 420,
            borderRadius: 420,
            border: `2px solid color-mix(in srgb, ${accent} 28%, transparent)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 72,
            bottom: 52,
            display: 'flex',
            gap: 18,
            color: `color-mix(in srgb, ${accent} 48%, transparent)`,
            fontSize: 42,
          }}
        >
          {symbols.map((symbol) => (
            <span key={symbol}>{symbol}</span>
          ))}
        </div>
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 42,
                background: accent,
                boxShadow: `0 0 36px color-mix(in srgb, ${accent} 42%, transparent)`,
              }}
            />
            <div
              style={{
                fontSize: 26,
                letterSpacing: 4,
                textTransform: 'uppercase',
                color: accentSoft,
              }}
            >
              {eyebrow}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {metric ? (
              <div
                style={{
                  display: 'flex',
                  alignSelf: 'flex-start',
                  border: `1px solid color-mix(in srgb, ${accent} 45%, transparent)`,
                  borderRadius: 999,
                  padding: '12px 24px',
                  fontSize: 30,
                  color: accentSoft,
                  background: `color-mix(in srgb, ${bgDeep} 38%, transparent)`,
                }}
              >
                {metric}
              </div>
            ) : null}
            <div
              style={{
                maxWidth: 920,
                fontSize: 76,
                lineHeight: 0.98,
                fontWeight: 700,
                textWrap: 'balance',
              }}
            >
              {title}
            </div>
            {subtitle ? (
              <div
                style={{
                  maxWidth: 820,
                  fontSize: 31,
                  lineHeight: 1.25,
                  color: textSubtle,
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {chips.map((chip) => (
              <div
                key={chip}
                style={{
                  border: `1px solid color-mix(in srgb, ${text} 18%, transparent)`,
                  borderRadius: 999,
                  padding: '10px 18px',
                  fontSize: 23,
                  color: text,
                  background: `color-mix(in srgb, ${accentDeep} 18%, transparent)`,
                }}
              >
                {chip}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    ogSize,
  );
}

export const topicLabels: Record<string, string> = {};
