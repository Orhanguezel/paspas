# GÜVENLİK AÇIĞI — Şifre sıfırlama ile hesap ele geçirme (KRİTİK, AÇIK)

**Tespit:** 2026-09-28, HepsiHal'de bulundu; aynı kod bu repoda da var. **Durum: düzeltilmedi.**
Düzeltilene kadar bu dosya kökte kalır; düzeltme commit'iyle birlikte silinir.

## Açık

1. `POST /api/v1/auth/password-reset/request` sıfırlama token'ını **HTTP yanıtında döndürüyor**
   (`{ success: true, token }`) ve e-posta göndermiyor.
   → [backend/src/modules/auth/controller.ts:520](backend/src/modules/auth/controller.ts#L520) (token satırı: 565)
2. Bu token, oturum token'ıyla **aynı JWT anahtarıyla** imzalanıyor ve koruma kapıları
   `purpose` alanına bakmıyor:
   - `backend/src/common/middleware/auth.ts` (`req.jwtVerify` + cookie `jwt.verify`)
   - `backend/src/plugins/authPlugin.ts` (`req.jwtVerify`)
3. `password-reset/confirm` (569. satır) token'ı tek kullanımlık yapmıyor: 1 saat boyunca tekrar kullanılabilir.

**Sonuç:** e-posta adresini bilen herkes (admin dahil) iki istekle hesabın şifresini
değiştirebilir, hatta şifreye dokunmadan token'ı `Authorization: Bearer` olarak kullanıp
doğrudan o kullanıcının oturumuyla API'ye erişebilir.

## Canlıda doğrulama (düzeltmeden önce)

```bash
curl -s -X POST https://<canli-api>/api/v1/auth/password-reset/request \
  -H 'content-type: application/json' -d '{"email":"<bilinen-kullanici>"}'
# Yanıtta "token" alanı varsa açık canlıda. Token'ı KULLANMA; sadece varlığına bak.
```

Ardından nginx access loglarında dış IP'lerden `password-reset/request` çağrısı ara (istismar izi).

## Düzeltme (HepsiHal'de uygulanan desen — `hepsihal` commit `c69660f`)

Kaynak dosyalar: `hepsihal/packages/shared-backend/modules/auth/password-reset.ts`,
`hepsihal/packages/shared-backend/core/mail-account.ts`.

1. **Token yanıtta dönmez**, yalnız e-postayla gider. Hesap var/yok her durumda aynı yanıt.
2. Reset token JWT değil: `JWT_SECRET`'tan türetilmiş **ayrı anahtarla HMAC**
   (`sha256(JWT_SECRET + ":password_reset:v1")`), 1 saat geçerli.
3. Token içinde mevcut şifre özetinin parmak izi (`pwv`) → şifre değişince token ölür (tek kullanımlık).
4. Tüm koruma kapıları `purpose` alanı olan JWT'yi reddeder (eski sızmış tokenlar için):
   `@fastify/jwt` kaydına `trusted: (_req, d) => !d.purpose`, cookie yolunda da aynı kontrol.
5. E-posta: bağlantı `${FRONTEND_URL}/sifre-sifirla?token=...` (ERP'de admin panelin sıfırlama sayfası).
   Panelde "Şifremi unuttum" + yeni şifre sayfası yoksa eklenir. Marka site_settings'ten gelir.
6. Onay sonrası tüm refresh token'lar iptal + "şifreniz değiştirildi" e-postası.

## Kabul testi

- request yanıtında `token` yok; olmayan e-posta için yanıt birebir aynı
- e-postadaki bağlantıyla şifre değişiyor; aynı bağlantı ikinci kez 400
- reset token `Bearer` olarak korumalı uçta 401
- eski şifre geçmiyor, yeni şifre geçiyor
- deploy sonrası canlıda yukarıdaki curl ile token dönmediği doğrulanır
