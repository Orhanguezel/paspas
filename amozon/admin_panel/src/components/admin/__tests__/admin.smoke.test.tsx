import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { DocumentationPanel } from '../DocumentationPanel';
import { DeveloperNotesPanel } from '../DeveloperNotesPanel';
import { KeywordsPanel } from '../KeywordsPanel';
import { ProductsPanel } from '../ProductsPanel';
import { ScansPanel } from '../ScansPanel';
import { SettingsPanel } from '../SettingsPanel';
import { ThesesPanel } from '../ThesesPanel';
import { operatorAction } from '../types';

describe('admin panel smoke', () => {
  test('renders core modules without crashing', () => {
    expect(renderToStaticMarkup(<KeywordsPanel />)).toContain('Anahtar Kelime Modülü');
    expect(renderToStaticMarkup(<ScansPanel />)).toContain('Yeni Amazon Araştırması');
    expect(renderToStaticMarkup(<ProductsPanel />)).toContain('Ürün ve Pazar Analizi');
    expect(renderToStaticMarkup(<SettingsPanel />)).toContain('Site Ayarları');
    expect(renderToStaticMarkup(<DocumentationPanel />)).toContain('Sayfa Rehberi');
    expect(renderToStaticMarkup(<DeveloperNotesPanel />)).toContain('Yazılımcı Notu');
    expect(renderToStaticMarkup(<ThesesPanel />)).toContain('Tezler');
  });

  test('maps decisions to operator actions', () => {
    expect(operatorAction('GUVENLI')).toBe('Al');
    expect(operatorAction('DIKKATLI_OL')).toBe('Takip Et');
    expect(operatorAction('INSUFFICIENT_DATA')).toBe('Takip Et');
    expect(operatorAction('GIRME')).toBe('Uzak Dur');
  });
});
