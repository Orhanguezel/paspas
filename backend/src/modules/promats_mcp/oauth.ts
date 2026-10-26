// Promats Faz 3: claude.ai (web + mobil) için OAuth 2.1 — yetki kodu + PKCE.
//
// Kalıp ihracatradari assistant-access'ten; fark: onaylanan her bağlantı
// promats_mcp_jeton'da bir satırdır (önek "claude.ai"). Böylece bağlantı panelin
// mevcut jeton listesinde görünür ve aynı "İptal et" ile kapanır; erişim
// anahtarı her istekte o satırı (iptal, süre, aktif kullanıcı) yeniden okur.
//
// İstemciler public'tir: secret yok, PKCE (S256) ZORUNLU. İki yol:
//  - Sabit istemci: PROMATS_MCP_OAUTH_CLIENT_ID (claude.ai connector ekranına elle girilir).
//  - Dinamik kayıt (DCR, RFC 7591): ChatGPT ve claude.ai kendini kaydeder. Kayıt
//    herkese açıktır ama YALNIZ izin listesindeki dönüş adresleri kabul edilir
//    (chatgpt.com, claude.ai/claude.com); yetki kodu başka yere gidemez ve her
//    bağlantı yine panelde kullanıcının onay ekranından geçer.
// Ayar yoksa uçlar hiç açılmaz (fail-closed).
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { z } from 'zod';
import { pool } from '@/db/client';
import { createUserNotification } from '@/modules/notifications/controller';
import { AKTIF_KAPSAMLAR, KAPSAMLAR, SURELER, baglantiSatiriAc, jetonBaglamiById, jetonIptal, type JetonBaglami, type Kapsam } from './jeton';

const SCOPE = 'promats';
const ERISIM_SN = 3600;
const YENILEME_GUN = 30;
const KOD_SN = 120;
const ISTEK_SN = 600;
const TARAYICI_CEREZ = 'pmcp_baglanti';
const CLAUDE_DONUS = ['https://claude.ai/api/mcp/auth_callback', 'https://claude.com/api/mcp/auth_callback'];
/** DCR ile kaydedilebilecek dönüş adresleri (birebir ya da kalıp). */
const DCR_DONUS: RegExp[] = [
  /^https:\/\/claude\.(ai|com)\/api\/mcp\/auth_callback$/,
  /^https:\/\/chatgpt\.com\/connector_platform_oauth_redirect$/,
  /^https:\/\/chatgpt\.com\/connector\/oauth\/[A-Za-z0-9_-]{1,128}$/,
];
const DCR_ISTEMCI = /^pmcpc_[A-Za-z0-9_-]{32}$/;
const ISTEMCI_GUN = 3650;

export function dcrDonusIzinli(uri: string): boolean {
  return DCR_DONUS.some((k) => k.test(uri));
}

/** Dönüş adresinden bağlantının kaynağı (panelde önek ve ad). */
export function kaynakCoz(redirectUri: string): { onek: string; ad: string } {
  return /^https:\/\/chatgpt\.com\//.test(redirectUri) ? { onek: 'chatgpt', ad: 'ChatGPT' } : { onek: 'claude.ai', ad: 'Claude (claude.ai)' };
}

export type OAuthAyar = {
  clientId: string;
  origin: string;
  resource: string;
  redirectUris: string[];
  authorizeUrl: string;
  registerUrl: string;
  tokenUrl: string;
  onayUrl: string;
  metadataUrl: string;
};

export function oauthAyar(): OAuthAyar | null {
  const clientId = process.env.PROMATS_MCP_OAUTH_CLIENT_ID?.trim();
  const mcpUrl = process.env.PROMATS_MCP_URL?.trim().replace(/\/+$/, '');
  if (!clientId || clientId.length < 16 || !mcpUrl) return null;
  let u: URL;
  try { u = new URL(mcpUrl); } catch { return null; }
  const yerel = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  if (u.protocol !== 'https:' && !yerel) return null;
  const origin = u.origin;
  return {
    clientId,
    origin,
    resource: mcpUrl,
    redirectUris: CLAUDE_DONUS,
    authorizeUrl: `${origin}/api/promats-oauth/authorize`,
    registerUrl: `${origin}/api/promats-oauth/register`,
    tokenUrl: `${origin}/api/promats-oauth/token`,
    onayUrl: `${origin}/promats-baglan`,
    metadataUrl: `${origin}/.well-known/oauth-protected-resource${u.pathname}`,
  };
}

const ozet = (v: string) => createHash('sha256').update(v).digest('hex');
const rastgele = () => randomBytes(32).toString('base64url');
function hata(kod: string, durum = 400): Error & { statusCode: number } {
  return Object.assign(new Error(kod), { statusCode: durum });
}

/** PKCE S256: base64url(sha256(verifier)) === challenge. */
export function pkceDogru(verifier: string, challenge: string): boolean {
  if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) return false;
  return createHash('sha256').update(verifier).digest('base64url') === challenge;
}

// ── Kimlik bilgisi deposu ────────────────────────────────────────────────
type Tur = 'istek' | 'kod' | 'erisim' | 'yenileme' | 'istemci';

async function kaydet(ham: string, tur: Tur, jetonId: string | null, payload: object | null, sn: number) {
  await pool.query(
    'INSERT INTO promats_mcp_oauth (ozet, tur, jeton_id, payload, son_gecerlilik) VALUES (?, ?, ?, ?, DATE_ADD(NOW(3), INTERVAL ? SECOND))',
    [ozet(ham), tur, jetonId, payload ? JSON.stringify(payload) : null, sn],
  );
}

type Satir<T> = { jetonId: string | null; payload: T; kullanildi: boolean };

async function oku<T>(ham: string, tur: Tur): Promise<Satir<T> | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT jeton_id, payload, kullanildi_at FROM promats_mcp_oauth WHERE ozet = ? AND tur = ? AND son_gecerlilik > NOW(3)',
    [ozet(ham), tur],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    jetonId: r.jeton_id ?? null,
    payload: (typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload) as T,
    kullanildi: Boolean(r.kullanildi_at),
  };
}

/** Tek kullanım atomiktir: koşul UPDATE'in içinde. */
async function tuket(ham: string, tur: Tur): Promise<boolean> {
  const [r] = await pool.query<ResultSetHeader>(
    'UPDATE promats_mcp_oauth SET kullanildi_at = NOW(3) WHERE ozet = ? AND tur = ? AND kullanildi_at IS NULL AND son_gecerlilik > NOW(3)',
    [ozet(ham), tur],
  );
  return r.affectedRows === 1;
}

async function anahtarCiftiVer(jetonId: string, clientId: string) {
  const erisim = `pmcpo_${rastgele()}`;
  const yenileme = `pmcpr_${rastgele()}`;
  await kaydet(erisim, 'erisim', jetonId, null, ERISIM_SN);
  // Yenileme anahtarı onu alan istemciye bağlıdır.
  await kaydet(yenileme, 'yenileme', jetonId, { clientId }, YENILEME_GUN * 86400);
  return { access_token: erisim, token_type: 'Bearer', expires_in: ERISIM_SN, refresh_token: yenileme, scope: SCOPE };
}

/** MCP ucu için: OAuth erişim anahtarı → jeton bağlamı (iptal/süre her istekte). */
export async function oauthErisimDogrula(ham: string, ip: string | null): Promise<JetonBaglami | null> {
  if (!/^pmcpo_[A-Za-z0-9_-]{43}$/.test(ham)) return null;
  const s = await oku<null>(ham, 'erisim');
  if (!s || s.kullanildi || !s.jetonId) return null;
  return jetonBaglamiById(s.jetonId, ip);
}

// ── Keşif belgeleri (kökte, kimlik gerektirmez) ───────────────────────────
export async function registerPromatsOAuthMetadata(app: FastifyInstance) {
  const ayar = oauthAyar();
  if (!ayar) return;
  const yol = new URL(ayar.resource).pathname;
  const kaynak = {
    resource: ayar.resource,
    authorization_servers: [ayar.origin],
    scopes_supported: [SCOPE],
    bearer_methods_supported: ['header'],
    resource_documentation: `${ayar.origin}/admin/promats-mcp`,
  };
  const sunucu = {
    issuer: ayar.origin,
    authorization_endpoint: ayar.authorizeUrl,
    token_endpoint: ayar.tokenUrl,
    scopes_supported: [SCOPE],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    // S256 tek seçenek; `plain` PKCE'nin korumasını ortadan kaldırır.
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    authorization_response_iss_parameter_supported: true,
    // ChatGPT ve claude.ai kendini kaydeder (izin listesindeki dönüş adresleriyle).
    registration_endpoint: ayar.registerUrl,
    client_id_metadata_document_supported: false,
  };
  const gonder = (veri: unknown) => async (_req: FastifyRequest, reply: FastifyReply) =>
    reply.header('Cache-Control', 'public, max-age=300').send(veri);
  app.get('/.well-known/oauth-protected-resource', gonder(kaynak));
  app.get(`/.well-known/oauth-protected-resource${yol}`, gonder(kaynak));
  app.get('/.well-known/oauth-authorization-server', gonder(sunucu));
  app.get(`/.well-known/oauth-authorization-server${yol}`, gonder(sunucu));
}

// ── Yetkilendirme ve token (genel, /api/v1/promats-oauth) ─────────────────
type Istek = { redirectUri: string; state: string; challenge: string; tarayici: string; clientId: string };
type Kod = { redirectUri: string; challenge: string; userId: string; kapsamlar: Kapsam[]; gun: number; clientId: string };
type KayitliIstemci = { redirectUris: string[]; clientName: string | null };

/** client_id → izinli dönüş adresleri. Sabit Claude istemcisi ya da DCR kaydı. */
async function istemciCoz(ayar: OAuthAyar, clientId: unknown): Promise<string[] | null> {
  if (typeof clientId !== 'string') return null;
  if (clientId === ayar.clientId) return ayar.redirectUris;
  if (!DCR_ISTEMCI.test(clientId)) return null;
  const s = await oku<KayitliIstemci>(clientId, 'istemci');
  return s ? s.payload.redirectUris.filter(dcrDonusIzinli) : null;
}

const authorizeSema = z.object({
  response_type: z.literal('code'),
  client_id: z.string(),
  redirect_uri: z.string(),
  state: z.string().min(1).max(1024),
  code_challenge: z.string().regex(/^[A-Za-z0-9_-]{43,128}$/),
  code_challenge_method: z.literal('S256'),
  scope: z.string().max(200).optional(),
  resource: z.string().max(500).optional(),
});

function oauthHatasi(reply: FastifyReply, durum: number, kod: string) {
  if (durum === 401) reply.header('WWW-Authenticate', 'Bearer');
  return reply.code(durum).header('Cache-Control', 'no-store').send({ error: kod });
}

export async function registerPromatsOAuthPublic(app: FastifyInstance) {
  const ayar = oauthAyar();
  if (!ayar) return;

  await app.register(async (o) => {
    o.addHook('onRequest', async (_req, reply) => {
      reply.header('Cache-Control', 'no-store');
      reply.header('Pragma', 'no-cache');
    });

    // RFC 7591 dinamik istemci kaydı. Yalnız public istemci (none) ve izin
    // listesindeki dönüş adresleri; başka her şey reddedilir.
    o.post('/register', { config: { rateLimit: { max: 20, timeWindow: '1 hour' } } }, async (req, reply) => {
      const b = z.object({
        redirect_uris: z.array(z.string().max(300)).min(1).max(5),
        client_name: z.string().max(120).optional(),
        token_endpoint_auth_method: z.string().optional(),
        grant_types: z.array(z.string()).optional(),
        response_types: z.array(z.string()).optional(),
      }).passthrough().safeParse(req.body ?? {});
      if (!b.success) return reply.code(400).header('Cache-Control', 'no-store').send({ error: 'invalid_client_metadata' });
      const d = b.data;
      if (!d.redirect_uris.every(dcrDonusIzinli)) return reply.code(400).header('Cache-Control', 'no-store').send({ error: 'invalid_redirect_uri' });
      if (d.token_endpoint_auth_method && d.token_endpoint_auth_method !== 'none') {
        return reply.code(400).header('Cache-Control', 'no-store').send({ error: 'invalid_client_metadata', error_description: 'only public clients (none) with PKCE' });
      }
      const clientId = `pmcpc_${randomBytes(24).toString('base64url')}`;
      const clientName = d.client_name?.trim() || null;
      await kaydet(clientId, 'istemci', null, { redirectUris: d.redirect_uris, clientName } satisfies KayitliIstemci, ISTEMCI_GUN * 86400);
      req.log.info({ event: 'promats_mcp_oauth_istemci_kaydi', istemci: clientName, donus: d.redirect_uris.map((u) => new URL(u).host) }, 'promats_mcp_oauth_istemci_kaydi');
      return reply.code(201).header('Cache-Control', 'no-store').send({
        client_id: clientId,
        client_id_issued_at: Math.floor(Date.now() / 1000),
        client_name: clientName ?? undefined,
        redirect_uris: d.redirect_uris,
        token_endpoint_auth_method: 'none',
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
      });
    });

    o.get('/authorize', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (req, reply) => {
      const q = authorizeSema.safeParse(req.query ?? {});
      // client_id / redirect_uri doğrulanmadan hiçbir yere yönlendirilmez.
      if (!q.success) return oauthHatasi(reply, 400, 'invalid_request');
      const izinli = await istemciCoz(ayar, q.data.client_id);
      if (!izinli) return oauthHatasi(reply, 401, 'invalid_client');
      if (!izinli.includes(q.data.redirect_uri)) return oauthHatasi(reply, 400, 'invalid_redirect_uri');
      if (q.data.resource && q.data.resource.replace(/\/+$/, '') !== ayar.resource) return oauthHatasi(reply, 400, 'invalid_target');

      const istek = rastgele();
      const tarayici = rastgele();
      await kaydet(istek, 'istek', null, {
        redirectUri: q.data.redirect_uri, state: q.data.state, challenge: q.data.code_challenge, tarayici: ozet(tarayici),
        clientId: q.data.client_id,
      } satisfies Istek, ISTEK_SN);
      // İzin isteği onu başlatan tarayıcıya bağlanır: başkasının başlattığı
      // istek kurbanın oturumunda onaylatılamaz.
      reply.setCookie(TARAYICI_CEREZ, tarayici, {
        httpOnly: true, secure: ayar.origin.startsWith('https:'), sameSite: 'lax', path: '/api', maxAge: ISTEK_SN,
      });
      req.log.info({ event: 'promats_mcp_oauth_istek' }, 'promats_mcp_oauth_istek');
      return reply.redirect(`${ayar.onayUrl}?istek=${istek}`);
    });

    o.post('/token', { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, async (req, reply) => {
      const b = z.record(z.string().max(4096)).safeParse(req.body ?? {});
      if (!b.success) return oauthHatasi(reply, 400, 'invalid_request');
      const g = b.data;
      if (req.headers.authorization || g.client_secret) return oauthHatasi(reply, 401, 'invalid_client');
      if (!(await istemciCoz(ayar, g.client_id))) return oauthHatasi(reply, 401, 'invalid_client');

      if (g.grant_type === 'authorization_code') {
        if (!g.code || !g.redirect_uri || !g.code_verifier) return oauthHatasi(reply, 400, 'invalid_request');
        const s = await oku<Kod>(g.code, 'kod');
        // Kod her durumda yakılır: tekrar denemeyle tahmin yapılamaz.
        if (!s || !(await tuket(g.code, 'kod'))) return oauthHatasi(reply, 400, 'invalid_grant');
        // Kod onu isteyen istemciye bağlıdır.
        if (s.payload.clientId !== g.client_id || s.payload.redirectUri !== g.redirect_uri || !pkceDogru(g.code_verifier, s.payload.challenge)) {
          return oauthHatasi(reply, 400, 'invalid_grant');
        }
        // Bağlantı satırı ancak kod başarıyla değişince açılır: yarım kalan
        // akış panelde "aktif" görünen boş bir bağlantı bırakmaz.
        const p = s.payload;
        const kaynak = kaynakCoz(p.redirectUri);
        const item = await baglantiSatiriAc({ userId: p.userId, ad: `${kaynak.ad} bağlantısı`, onek: kaynak.onek, kapsamlar: p.kapsamlar, gun: p.gun });
        if (!(await jetonBaglamiById(item.id, null))) return oauthHatasi(reply, 400, 'invalid_grant');
        req.log.info({ event: 'promats_mcp_jeton_olusturuldu', jetonId: item.id, onek: item.onek, kapsamlar: p.kapsamlar, kaynak: 'oauth' }, 'promats_mcp_jeton_olusturuldu');
        await bagliBildir(req, p.userId, item.id, p.kapsamlar, kaynak.ad);
        return reply.send(await anahtarCiftiVer(item.id, g.client_id));
      }

      if (g.grant_type === 'refresh_token') {
        if (!g.refresh_token) return oauthHatasi(reply, 400, 'invalid_request');
        const s = await oku<{ clientId?: string } | null>(g.refresh_token, 'yenileme');
        if (!s || !s.jetonId) return oauthHatasi(reply, 400, 'invalid_grant');
        if (s.payload?.clientId && s.payload.clientId !== g.client_id) return oauthHatasi(reply, 400, 'invalid_grant');
        if (s.kullanildi) {
          // Yeniden kullanım = sızıntı belirtisi: bağlantının tamamı kapanır.
          await jetonIptal(s.jetonId, (await jetonSahibi(s.jetonId)) ?? s.jetonId);
          req.log.warn({ event: 'promats_mcp_oauth_yenileme_tekrar', jetonId: s.jetonId }, 'promats_mcp_oauth_yenileme_tekrar');
          return oauthHatasi(reply, 400, 'invalid_grant');
        }
        if (!(await tuket(g.refresh_token, 'yenileme'))) return oauthHatasi(reply, 400, 'invalid_grant');
        if (!(await jetonBaglamiById(s.jetonId, null))) return oauthHatasi(reply, 400, 'invalid_grant');
        return reply.send(await anahtarCiftiVer(s.jetonId, g.client_id));
      }

      return oauthHatasi(reply, 400, 'unsupported_grant_type');
    });
  }, { prefix: '/promats-oauth' });
}

async function bagliBildir(req: FastifyRequest, userId: string, jetonId: string, kapsamlar: Kapsam[], istemci: string) {
  const mesaj = `${istemci} hesabına Promats bağlantısı verildi (${kapsamlar.join(', ')}). Sen yapmadıysan Promats Bağlantıları ya da Bağlantı Durumum sayfasından hemen kaldır.`;
  await createUserNotification({ userId, title: `Promats: ${istemci} bağlandı`, message: mesaj, type: 'system' })
    .catch((err) => req.log.warn({ err, event: 'promats_bildirim_failed' }, 'promats_bildirim_failed'));
}

async function jetonSahibi(jetonId: string): Promise<string | null> {
  const [r] = await pool.query<RowDataPacket[]>('SELECT user_id FROM promats_mcp_jeton WHERE id = ?', [jetonId]);
  return r[0]?.user_id ?? null;
}

// ── Onay ekranı uçları (panel oturumuyla, /api/v1/admin altında) ───────────
function tarayiciKontrol(req: FastifyRequest, beklenen: string) {
  const cerez = req.cookies?.[TARAYICI_CEREZ] ?? '';
  const x = Buffer.from(ozet(cerez));
  const y = Buffer.from(beklenen);
  if (!cerez || x.length !== y.length || !timingSafeEqual(x, y)) throw hata('baglanti_istegi_bu_tarayicida_baslatilmadi', 403);
}

const onaySema = z.object({
  istek: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  onay: z.boolean(),
  kapsamlar: z.array(z.enum(AKTIF_KAPSAMLAR as [string, ...string[]])).max(AKTIF_KAPSAMLAR.length).default([]),
  gun: z.coerce.number().refine((g) => (SURELER as readonly number[]).includes(g), 'gecersiz_sure').default(90),
}).strict();

export async function registerPromatsOAuthOnay(
  app: FastifyInstance,
  opts: { userId: (req: FastifyRequest) => string },
) {
  const ayar = oauthAyar();
  if (!ayar) return;

  app.get('/promats/oauth/istek', async (req) => {
    const q = z.object({ istek: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }).parse(req.query);
    const s = await oku<Istek>(q.istek, 'istek');
    if (!s || s.kullanildi) throw hata('baglanti_istegi_suresi_doldu', 410);
    tarayiciKontrol(req, s.payload.tarayici);
    return { gecerli: true, istemci: kaynakCoz(s.payload.redirectUri).ad, kapsamSecenekleri: KAPSAMLAR, sureler: SURELER };
  });

  app.post('/promats/oauth/onay', async (req) => {
    if (req.headers.origin && req.headers.origin !== ayar.origin) throw hata('csrf_origin_reddedildi', 403);
    const b = onaySema.parse(req.body);
    const s = await oku<Istek>(b.istek, 'istek');
    if (!s || s.kullanildi) throw hata('baglanti_istegi_suresi_doldu', 410);
    tarayiciKontrol(req, s.payload.tarayici);
    // İstek tek kullanımlık: onay da ret de onu tüketir.
    if (!(await tuket(b.istek, 'istek'))) throw hata('baglanti_istegi_suresi_doldu', 410);

    const donus = new URL(s.payload.redirectUri);
    donus.searchParams.set('state', s.payload.state);
    donus.searchParams.set('iss', ayar.origin);
    if (!b.onay) {
      donus.searchParams.set('error', 'access_denied');
      return { yonlendir: donus.toString() };
    }
    if (!b.kapsamlar.length) throw hata('en_az_bir_kapsam_secin');

    const kapsamlar = [...new Set(b.kapsamlar)] as Kapsam[];
    const kod = rastgele();
    await kaydet(kod, 'kod', null, {
      redirectUri: s.payload.redirectUri, challenge: s.payload.challenge, userId: opts.userId(req), kapsamlar, gun: b.gun,
      clientId: s.payload.clientId,
    } satisfies Kod, KOD_SN);
    req.log.info({ event: 'promats_mcp_oauth_onay', kapsamlar }, 'promats_mcp_oauth_onay');
    donus.searchParams.set('code', kod);
    return { yonlendir: donus.toString() };
  });
}
