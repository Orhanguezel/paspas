import { describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { dcrDonusIzinli, pkceDogru } from './oauth';
import { maskSensitive } from './mcp';

describe('Promats MCP bağlantı sınırları', () => {
  test('OAuth yalnız izinli istemci dönüş adreslerine yönlenir', () => {
    expect(dcrDonusIzinli('https://claude.ai/api/mcp/auth_callback')).toBe(true);
    expect(dcrDonusIzinli('https://chatgpt.com/connector_platform_oauth_redirect')).toBe(true);
    expect(dcrDonusIzinli('https://example.com/callback')).toBe(false);
    expect(dcrDonusIzinli('https://chatgpt.com.evil.test/connector_platform_oauth_redirect')).toBe(false);
  });

  test('PKCE yalnız doğru S256 doğrulayıcısını kabul eder', () => {
    const verifier = 'a'.repeat(43);
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    expect(pkceDogru(verifier, challenge)).toBe(true);
    expect(pkceDogru('b'.repeat(43), challenge)).toBe(false);
    expect(pkceDogru('short', challenge)).toBe(false);
  });

  test('ERP yanıtındaki kişisel alan ve serbest metin maskelenir', () => {
    expect(maskSensitive({ musteriEmail: 'a@b.com', telefonNo: '05551234567', aciklama: 'a@b.com ve TR120006200119000006672315' })).toEqual({
      musteriEmail: '[maskeli]', telefonNo: '[maskeli]', aciklama: '[e-posta maskeli] ve [IBAN maskeli]',
    });
  });
});
